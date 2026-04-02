// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The character map is kept lazily. A font can carry a dozen cmaps for a dozen
// platforms; decoding all of them at load time would allocate for a caller that
// only ever asks for a handful of codepoints. What is chosen once is the best
// subtable by a fixed preference order, and every lookup is a bounded read of
// the bytes already in memory.

///|
/// Bounded reads for lookups. A corrupt range offset must yield "no glyph",
/// never a trap: a text renderer would rather show a missing glyph than crash
/// on one malformed cmap entry.
fn byte_at(data : BytesView, at : Int32) -> Int32 {
  if at < 0 || at >= data.length() {
    0
  } else {
    data[at].to_int()
  }
}

///|
fn u16_at(data : BytesView, at : Int32) -> Int32 {
  (byte_at(data, at) << 8) | byte_at(data, at + 1)
}

///|
fn u32_at(data : BytesView, at : Int32) -> Int32 {
  (u16_at(data, at) << 16) | u16_at(data, at + 2)
}

///|
pub(all) struct Cmap {
  data : BytesView
  chosen : Int32
  format : Int32
}

///|
/// A fixed preference, so that two runs over the same bytes choose the same
/// subtable: full Unicode first, then the Windows BMP map, then the historic
/// platform maps, then anything else that is readable.
fn rank(platform : Int32, encoding : Int32, format : Int32) -> Int32 {
  if platform == 3 && encoding == 10 && format == 12 {
    100
  } else if platform == 0 && format == 12 {
    95
  } else if platform == 3 && encoding == 10 && format == 4 {
    90
  } else if platform == 3 && encoding == 1 && format == 4 {
    80
  } else if platform == 0 && format == 4 {
    70
  } else if platform == 3 && encoding == 0 && format == 4 {
    65
  } else if format == 12 {
    50
  } else if platform == 1 && encoding == 0 && format == 0 {
    40
  } else if format == 4 {
    30
  } else if format == 6 {
    20
  } else if format == 0 {
    10
  } else {
    0
  }
}

///|
pub fn Cmap::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> Cmap raise @model.Refused {
  let data = cursor.all()
  let count = cursor.u16_at(2)
  if count <= 0 || count > 4096 {
    raise @model.Malformed(at=2, got="cmap numTables of \{count}")
  }
  let mut best = 0
  let mut chosen = -1
  let mut format = 0
  for i in 0..<count {
    let at = 4 + i * 8
    let platform = u16_at(data, at)
    let encoding = u16_at(data, at + 2)
    let offset = u32_at(data, at + 4)
    if offset >= 0 && offset + 2 <= data.length() {
      let sub_format = u16_at(data, offset)
      let score = rank(platform, encoding, sub_format)
      if score > best {
        best = score
        chosen = offset
        format = sub_format
      }
    }
  }
  if chosen < 0 {
    raise @model.Unsupported(at=0, got="a cmap with no readable subtable")
  }
  // Both formats put a loop count in the file. Check it once here rather than
  // trusting it on every lookup.
  if format == 4 {
    limits.check_outline(u16_at(data, chosen + 6) / 2, 0)
  }
  if format == 12 {
    let groups = u32_at(data, chosen + 12)
    if groups < 0 || groups > 1_048_576 {
      raise @model.OverLimit(limit=1_048_576, got=groups)
    }
  }
  { data, chosen, format, }
}

///|
pub fn Cmap::format(self : Cmap) -> Int32 {
  self.format
}

///|
fn Cmap::format0(self : Cmap, codepoint : Int32) -> @model.GlyphId? {
  if codepoint >= 256 {
    None
  } else {
    let glyph = byte_at(self.data, self.chosen + 6 + codepoint)
    if glyph == 0 {
      None
    } else {
      Some(@model.GlyphId::of(glyph))
    }
  }
}

///|
fn Cmap::format4(self : Cmap, codepoint : Int32) -> @model.GlyphId? {
  let seg_count_x2 = u16_at(self.data, self.chosen + 6)
  let segments = seg_count_x2 / 2
  if segments <= 0 || codepoint > 0xFFFF {
    return None
  }
  let end_base = self.chosen + 14
  let start_base = end_base + seg_count_x2 + 2
  let delta_base = start_base + seg_count_x2
  let range_base = delta_base + seg_count_x2
  for i in 0..<segments {
    let last = u16_at(self.data, end_base + i * 2)
    if codepoint <= last {
      let first = u16_at(self.data, start_base + i * 2)
      if codepoint < first {
        return None
      }
      let delta = u16_at(self.data, delta_base + i * 2)
      let range_offset = u16_at(self.data, range_base + i * 2)
      if range_offset == 0 {
        let glyph = (codepoint + delta) & 0xFFFF
        return if glyph == 0 { None } else { Some(@model.GlyphId::of(glyph)) }
      }
      let at = range_base + i * 2 + range_offset + 2 * (codepoint - first)
      let glyph = u16_at(self.data, at)
      if glyph == 0 {
        return None
      }
      return Some(@model.GlyphId::of((glyph + delta) & 0xFFFF))
    }
  }
  None
}

///|
fn Cmap::format6(self : Cmap, codepoint : Int32) -> @model.GlyphId? {
  let first = u16_at(self.data, self.chosen + 6)
  let count = u16_at(self.data, self.chosen + 8)
  if codepoint < first || codepoint >= first + count {
    return None
  }
  let glyph = u16_at(self.data, self.chosen + 10 + 2 * (codepoint - first))
  if glyph == 0 {
    None
  } else {
    Some(@model.GlyphId::of(glyph))
  }
}

///|
fn Cmap::format12(self : Cmap, codepoint : Int32) -> @model.GlyphId? {
  let groups = u32_at(self.data, self.chosen + 12)
  for i in 0..<groups {
    let at = self.chosen + 16 + i * 12
    let first = u32_at(self.data, at)
    let last = u32_at(self.data, at + 4)
    if codepoint >= first && codepoint <= last {
      let start_glyph = u32_at(self.data, at + 8)
      return Some(@model.GlyphId::of(start_glyph + codepoint - first))
    }
  }
  None
}

///|
/// Translate a Unicode codepoint to a glyph id, or `None` when the font has no
/// glyph for it. `.notdef` is deliberately NOT returned: a caller decides
/// whether to show a missing-glyph box.
pub fn Cmap::glyph_index(self : Cmap, codepoint : Int32) -> @model.GlyphId? {
  if codepoint < 0 || codepoint > 0x10FFFF {
    return None
  }
  match self.format {
    0 => self.format0(codepoint)
    4 => self.format4(codepoint)
    6 => self.format6(codepoint)
    12 => self.format12(codepoint)
    _ => None
  }
}
