// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The CFF table itself: the header, the top dictionary, the charstring index
// and, for a CID-keyed font, the font-dictionary array and the selector that
// maps a glyph to one of them. Everything a caller needs is resolved once here
// so an outline request is a charstring run and nothing more.

///|
/// A PostScript-outline font. Opaque: a caller asks for an outline or a glyph
/// count, not for the table's internals.
pub struct Font {
  data : BytesView
  is_cff2 : Bool
  top : Dict
  char_strings : Index
  gsubrs : Index
  /// One local subroutine index per font dictionary, empty when the font has
  /// none. A non-CID font has exactly one.
  locals : Array[Index]
  /// The font-dictionary index of every glyph; empty means all use the first.
  fds : Array[Int32]
  matrix_scale : Int32
  var_store : @variations.Store?
  /// The variation-store index a charstring starts from.
  default_vsindex : Int32
}

///|
pub fn Font::glyph_count(self : Font) -> Int32 {
  self.char_strings.count()
}

///|
/// Whether the font has a variation store, which only CFF 2 does.
pub fn Font::is_variable(self : Font) -> Bool {
  match self.var_store {
    Some(_) => true
    None => false
  }
}

///|
fn empty_index(data : BytesView) -> Index {
  { data, starts: [], }
}

///|
pub fn Font::parse(
  cursor : @wire.Cursor,
  is_cff2 : Bool,
  units_per_em : Int32,
  limits : @model.Limits,
) -> Font raise @model.Refused {
  let data = cursor.all()
  cursor.seek(0)
  let major = cursor.u8()
  let minor = cursor.u8()
  if major != 1 && major != 2 {
    raise @model.Unknown(at=0, got="a CFF version \{major}.\{minor}")
  }
  if major == 2 && !is_cff2 {
    raise @model.Unexpected(at=0, got="CFF 2 in a CFF table", want="CFF 1")
  }
  if major == 1 && is_cff2 {
    raise @model.Unexpected(at=0, got="CFF 1 in a CFF 2 table", want="CFF 2")
  }
  let header_size = cursor.u8()
  let mut top_view : BytesView = data.clamped_view(start=0, end=0)
  let mut gsubr_at = 0
  if major == 2 {
    let top_length = cursor.u16()
    if header_size < 5 {
      raise @model.Malformed(at=2, got="a CFF 2 header of \{header_size} bytes")
    }
    cursor.seek(header_size)
    if header_size + top_length > data.length() {
      raise @model.Truncated(at=header_size, want=top_length)
    }
    top_view = data.clamped_view(
      start=header_size,
      end=header_size + top_length,
    )
    gsubr_at = header_size + top_length
  } else {
    cursor.seek(header_size)
    let _names = Index::parse(cursor, false, limits)
    let tops = Index::parse(cursor, false, limits)
    let _strings = Index::parse(cursor, false, limits)
    gsubr_at = cursor.position()
    if tops.count() < 1 {
      raise @model.Malformed(at=header_size, got="a CFF with no top dictionary")
    }
    top_view = tops.item(0)
  }
  let top = parse_dict(top_view, 0, top_view.length(), units_per_em)
  if top.charstring_type != 2 {
    raise @model.Unsupported(at=0, got="charstring type \{top.charstring_type}")
  }
  if top.char_strings <= 0 {
    raise @model.MissingTable(tag="CharStrings")
  }
  let gsubrs = Index::parse(@wire.Cursor::at(data, gsubr_at), is_cff2, limits)
  let char_strings = Index::parse(
    @wire.Cursor::at(data, top.char_strings),
    is_cff2,
    limits,
  )
  // A CFF 2 variation store is an item variation store behind a 16-bit length;
  // 0xFFFF means the store runs to the end of the table.
  let var_store = if top.vstore > 0 && top.vstore + 2 <= data.length() {
    let declared = (data[top.vstore].to_int() << 8) |
      data[top.vstore + 1].to_int()
    let start = top.vstore + 2
    let length = if declared == 0xFFFF {
      data.length() - start
    } else {
      declared
    }
    if length <= 0 || start + length > data.length() {
      raise @model.Truncated(at=start, want=length)
    }
    Some(
      @variations.Store::parse(
        @wire.Cursor::new(data).window(start, length),
        limits,
      ),
    )
  } else if top.vstore > 0 {
    raise @model.Truncated(at=top.vstore, want=2)
  } else {
    None
  }
  let locals : Array[Index] = []
  let fds : Array[Int32] = []
  if top.fd_array > 0 {
    let array = Index::parse(
      @wire.Cursor::at(data, top.fd_array),
      is_cff2,
      limits,
    )
    for i in 0..<array.count() {
      let fd = parse_dict(
        array.item(i),
        0,
        array.item(i).length(),
        units_per_em,
      )
      locals.push(local_subrs(data, fd, fd.private_offset, is_cff2, limits))
    }
    if top.fd_select > 0 {
      let glyphs = char_strings.count()
      let selected = read_fd_select(
        @wire.Cursor::at(data, top.fd_select),
        glyphs,
        limits,
      )
      for value in selected {
        fds.push(value)
      }
    }
  } else {
    let fd = parse_dict(
      data.clamped_view(
        start=top.private_offset,
        end=top.private_offset + top.private_size,
      ),
      0,
      top.private_size,
      units_per_em,
    )
    locals.push(local_subrs(data, fd, top.private_offset, is_cff2, limits))
  }
  let default_vsindex = if top.vsindex > 0 {
    top.vsindex
  } else if top.private_size > 0 {
    parse_dict(
      data.clamped_view(
        start=top.private_offset,
        end=top.private_offset + top.private_size,
      ),
      0,
      top.private_size,
      units_per_em,
    ).vsindex
  } else {
    0
  }
  {
    data,
    is_cff2,
    top,
    char_strings,
    gsubrs,
    locals,
    fds,
    matrix_scale: top.matrix_scale,
    var_store,
    default_vsindex,
  }
}

///|
/// The local subroutine index behind one font dictionary. A dictionary without
/// a `Subrs` offset yields an empty index, which a charstring may still call
/// once: the call itself is refused when it resolves to nothing.
fn local_subrs(
  data : BytesView,
  dict : Dict,
  base : Int32,
  is_cff2 : Bool,
  limits : @model.Limits,
) -> Index raise @model.Refused {
  if dict.subrs <= 0 || base <= 0 {
    return empty_index(data)
  }
  let at = base + dict.subrs
  if at < 0 || at >= data.length() {
    return empty_index(data)
  }
  Index::parse(@wire.Cursor::at(data, at), is_cff2, limits)
}

///|
/// FDSelect: which font dictionary each glyph uses. Format 0 is one byte per
/// glyph; formats 3 and 4 are runs, one of them with 32-bit glyph indices.
fn read_fd_select(
  cursor : @wire.Cursor,
  glyph_count : Int32,
  limits : @model.Limits,
) -> Array[Int32] raise @model.Refused {
  let format = cursor.u8()
  let out : Array[Int32] = []
  if format == 0 {
    limits.check_glyphs(glyph_count)
    for _ in 0..<glyph_count {
      out.push(cursor.u8())
    }
  } else if format == 3 {
    let count = cursor.u16()
    if count <= 0 {
      raise @model.Malformed(
        at=cursor.position() - 2,
        got="an FDSelect with no ranges",
      )
    }
    limits.check_glyphs(count)
    let starts : Array[Int32] = []
    let picks : Array[Int32] = []
    for _ in 0..<count {
      starts.push(cursor.u16())
      picks.push(cursor.u8())
    }
    let sentinel = cursor.u16()
    for i in 0..<glyph_count {
      let mut found = 0
      for k in 0..<count {
        if i >= starts[k] {
          found = picks[k]
        }
      }
      out.push(found)
    }
    if sentinel != glyph_count {
      raise @model.Malformed(
        at=cursor.position() - 2,
        got="an FDSelect sentinel of \{sentinel}",
      )
    }
  } else if format == 4 {
    let count = cursor.u32()
    if count <= 0 {
      raise @model.Malformed(
        at=cursor.position() - 4,
        got="an FDSelect with no ranges",
      )
    }
    limits.check_glyphs(count)
    let starts : Array[Int32] = []
    let picks : Array[Int32] = []
    for _ in 0..<count {
      starts.push(cursor.u32())
      picks.push(cursor.u16())
    }
    let sentinel = cursor.u32()
    for i in 0..<glyph_count {
      let mut found = 0
      for k in 0..<count {
        if i >= starts[k] {
          found = picks[k]
        }
      }
      out.push(found)
    }
    if sentinel != glyph_count {
      raise @model.Malformed(
        at=cursor.position() - 4,
        got="an FDSelect sentinel of \{sentinel}",
      )
    }
  } else {
    raise @model.Unsupported(at=0, got="FDSelect format \{format}")
  }
  out
}

///|
fn Font::fd(self : Font, glyph : Int32) -> Int32 {
  if glyph < 0 || glyph >= self.fds.length() {
    0
  } else {
    self.fds[glyph]
  }
}

///|
/// The outline of one glyph, with the variation coordinates applied when the
/// font has a store. Coordinates are in font units.
pub fn Font::outline(
  self : Font,
  glyph : Int32,
  coords : Array[Int32],
) -> @model.Outline raise @model.Refused {
  let fd = self.fd(glyph)
  let lsubrs = if fd >= 0 && fd < self.locals.length() {
    self.locals[fd]
  } else {
    empty_index(self.data)
  }
  let interp = Interp::new(
    self,
    self.gsubrs,
    lsubrs,
    coords,
    self.is_cff2,
    self.default_vsindex,
  )
  interp.run(self.char_strings.item(glyph), 0)
  interp.close()
  let commands = interp.out
  let mut x_min = 0
  let mut y_min = 0
  let mut x_max = 0
  let mut y_max = 0
  let mut seen = false
  for command in commands {
    for point in points_of(command) {
      if !seen {
        x_min = point.x
        x_max = point.x
        y_min = point.y
        y_max = point.y
        seen = true
      } else {
        if point.x < x_min {
          x_min = point.x
        }
        if point.x > x_max {
          x_max = point.x
        }
        if point.y < y_min {
          y_min = point.y
        }
        if point.y > y_max {
          y_max = point.y
        }
      }
    }
  }
  @model.Outline::of(commands, { x_min, y_min, x_max, y_max, })
}

///|
/// Every point a command touches, control points included: a PostScript outline
/// has no declared box, so the box is the control hull of the drawn path.
fn points_of(command : @model.PathCommand) -> Array[@model.Point] {
  match command {
    MoveTo(p) | LineTo(p) => [p]
    QuadTo(a, b) => [a, b]
    CubicTo(a, b, c) => [a, b, c]
    Close => []
  }
}
