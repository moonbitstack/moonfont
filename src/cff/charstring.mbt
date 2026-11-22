// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The Type 2 charstring language: a stack machine whose operators draw one
// glyph. Every coordinate is held in 16.16 so a `blend` operand that lands
// between two font units stays between them until the command is emitted; the
// emitted command stream is in whole font units, the same as TrueType.
//
// Hint operators are consumed and dropped: this library rasterises unhinted, so
// a stem count matters only for the size of the mask that follows `hintmask`.

///|
/// How deep a charstring may call subroutines. The Type 2 specification's own
/// ceiling is ten; a deeper chain is a damaged file.
pub let call_depth : Int32 = 10

///|
/// The most operators one glyph may run. A charstring's bytes bound its own
/// work, but a subroutine chain can revisit them, so the ceiling is explicit
/// rather than implied by the table size.
pub let ops_per_glyph : Int32 = 65_536

///|
priv struct Interp {
  font : Font
  gsubrs : Index
  lsubrs : Index
  mut stack : Array[Int32]
  /// The current point, in 16.16.
  mut x : Int32
  mut y : Int32
  /// Whether a contour is open and must be closed before a new one starts.
  mut open : Bool
  mut stems : Int32
  mut width_seen : Bool
  is_cff2 : Bool
  /// The axis values, in the font's own axis order.
  coords : Array[Int32]
  mut vsindex : Int32
  mut steps : Int32
  out : Array[@model.PathCommand]
}

///|
fn Interp::new(
  font : Font,
  gsubrs : Index,
  lsubrs : Index,
  coords : Array[Int32],
  is_cff2 : Bool,
  vsindex : Int32,
) -> Interp {
  {
    font,
    gsubrs,
    lsubrs,
    stack: [],
    x: 0,
    y: 0,
    open: false,
    stems: 0,
    width_seen: false,
    is_cff2,
    coords,
    vsindex,
    steps: 0,
    out: [],
  }
}

///|
fn Interp::push(self : Interp, value : Int32) -> Unit {
  self.stack.push(value)
}

///|
fn Interp::pop(self : Interp) -> Int32 raise @model.Refused {
  if self.stack.length() == 0 {
    raise @model.Malformed(at=0, got="an operator with an empty operand stack")
  }
  let value = self.stack[self.stack.length() - 1]
  self.stack = take_range(self.stack, 0, self.stack.length() - 1)
  value
}

///|
fn Interp::clear(self : Interp) -> Unit {
  self.stack = []
}

///|
fn Interp::take(
  self : Interp,
  count : Int32,
) -> Array[Int32] raise @model.Refused {
  if count < 0 || count > self.stack.length() {
    raise @model.Malformed(
      at=0,
      got="an operator wanting \{count} operands and finding \{self.stack.length()}",
    )
  }
  let start = self.stack.length() - count
  let values = take_range(self.stack, start, self.stack.length())
  self.stack = take_range(self.stack, 0, start)
  values
}

///|
/// Drop the leading operand when the operator's count says it is a glyph width
/// rather than a coordinate. Only the first stack-clearing operator of a
/// CFF 1 charstring may carry one.
fn Interp::strip_width(self : Interp, expected : Int32) -> Unit {
  if !self.is_cff2 && !self.width_seen && self.stack.length() == expected + 1 {
    self.stack = take_range(self.stack, 1, self.stack.length())
  }
  self.width_seen = true
}

///|
/// The same, for a stem operator, whose operand count is unbounded: a width is
/// present exactly when the count is odd.
fn Interp::strip_stem_width(self : Interp) -> Unit {
  if !self.is_cff2 && !self.width_seen && self.stack.length() % 2 == 1 {
    self.stack = take_range(self.stack, 1, self.stack.length())
  }
  self.width_seen = true
}

///|
fn Interp::emit(self : Interp, command : @model.PathCommand) -> Unit {
  self.out.push(command)
}

///|
/// Close the contour in progress, if any. Type 2 has no explicit closepath: a
/// contour ends at the next moveto or at the end of the charstring.
fn Interp::close(self : Interp) -> Unit {
  if self.open {
    self.emit(@model.Close)
    self.open = false
  }
}

///|
fn Interp::moveto(self : Interp, dx : Int32, dy : Int32) -> Unit {
  self.close()
  self.x += dx
  self.y += dy
  self.emit(@model.MoveTo(self.point()))
  self.open = true
}

///|
fn Interp::lineto(self : Interp, dx : Int32, dy : Int32) -> Unit {
  if !self.open {
    self.moveto(0, 0)
  }
  self.x += dx
  self.y += dy
  self.emit(@model.LineTo(self.point()))
}

///|
fn Interp::curveto(
  self : Interp,
  c1x : Int32,
  c1y : Int32,
  c2x : Int32,
  c2y : Int32,
  dx : Int32,
  dy : Int32,
) -> Unit {
  if !self.open {
    self.moveto(0, 0)
  }
  let c1 = @model.Point::of(self.scale(self.x + c1x), self.scale(self.y + c1y))
  let c2 = @model.Point::of(
    self.scale(self.x + c1x + c2x),
    self.scale(self.y + c1y + c2y),
  )
  self.x += c1x + c2x + dx
  self.y += c1y + c2y + dy
  self.emit(@model.CubicTo(c1, c2, self.point()))
}

///|
fn Interp::point(self : Interp) -> @model.Point {
  @model.Point::of(self.scale(self.x), self.scale(self.y))
}

///|
/// 16.16 glyph space to whole font units, through the font matrix. A font
/// whose matrix maps its own units to an em needs no scaling, and that is the
/// only case where this is the identity.
fn Interp::scale(self : Interp, value : Int32) -> Int32 {
  let matrix = self.font.matrix_scale
  if matrix == 65536 {
    @wire.div_round(value.to_int64(), 65536)
  } else {
    @wire.div_round(value.to_int64() * matrix.to_int64(), 65536 * 65536)
  }
}

///|
/// A copy of `[start, end)` of an operand array. The stacks here are at most a
/// few dozen operands, so a copy is cheaper than an index dance and cannot
/// leave a stale operand behind.
fn take_range(
  values : Array[Int32],
  start : Int32,
  end : Int32,
) -> Array[Int32] {
  let out : Array[Int32] = []
  for i in start..<end {
    out.push(values[i])
  }
  out
}

///|
fn bias(count : Int32) -> Int32 {
  if count < 1240 {
    107
  } else if count < 33900 {
    1131
  } else {
    32768
  }
}

///|
/// Run one charstring, drawing into the interpreter's command list.
fn Interp::run(
  self : Interp,
  code : BytesView,
  depth : Int32,
) -> Unit raise @model.Refused {
  if depth > call_depth {
    raise @model.Recursion(depth~)
  }
  let length = code.length()
  let mut at = 0
  while at < length {
    self.steps += 1
    if self.steps > ops_per_glyph {
      raise @model.OverLimit(limit=ops_per_glyph, got=self.steps)
    }
    let b0 = code[at].to_int()
    if b0 >= 32 || b0 == 28 {
      if b0 == 28 {
        if at + 3 > length {
          raise @model.Truncated(at~, want=3)
        }
        let value = (code[at + 1].to_int() << 8) | code[at + 2].to_int()
        self.push((if value >= 0x8000 { value - 0x10000 } else { value }) << 16)
        at += 3
      } else if b0 <= 246 {
        self.push((b0 - 139) << 16)
        at += 1
      } else if b0 <= 250 {
        if at + 2 > length {
          raise @model.Truncated(at~, want=2)
        }
        self.push(((b0 - 247) * 256 + code[at + 1].to_int() + 108) << 16)
        at += 2
      } else {
        if at + 2 > length {
          raise @model.Truncated(at~, want=2)
        }
        self.push((-(b0 - 251) * 256 - code[at + 1].to_int() - 108) << 16)
        at += 2
      }
    } else {
      at += 1
      match b0 {
        1 | 18 => {
          self.strip_stem_width()
          self.stems += self.stack.length() / 2
          self.clear()
        }
        3 | 23 => {
          self.strip_stem_width()
          self.stems += self.stack.length() / 2
          self.clear()
        }
        19 | 20 => {
          self.strip_stem_width()
          self.stems += self.stack.length() / 2
          self.clear()
          let mask = (self.stems + 7) / 8
          if at + mask > length {
            raise @model.Truncated(at~, want=mask)
          }
          at += mask
        }
        21 => {
          self.strip_width(2)
          let args = self.take(2)
          self.moveto(args[0], args[1])
        }
        22 => {
          self.strip_width(1)
          let args = self.take(1)
          self.moveto(args[0], 0)
        }
        4 => {
          self.strip_width(1)
          let args = self.take(1)
          self.moveto(0, args[0])
        }
        5 => {
          let args = self.take(self.stack.length())
          let mut i = 0
          while i + 1 < args.length() {
            self.lineto(args[i], args[i + 1])
            i += 2
          }
        }
        6 | 7 => {
          let vertical = b0 == 7
          let args = self.take(self.stack.length())
          for i in 0..<args.length() {
            let horizontal = if vertical { i % 2 == 1 } else { i % 2 == 0 }
            if horizontal {
              self.lineto(args[i], 0)
            } else {
              self.lineto(0, args[i])
            }
          }
        }
        8 => {
          let args = self.take(self.stack.length())
          let mut i = 0
          while i + 5 < args.length() {
            self.curveto(
              args[i],
              args[i + 1],
              args[i + 2],
              args[i + 3],
              args[i + 4],
              args[i + 5],
            )
            i += 6
          }
        }
        24 => {
          let args = self.take(self.stack.length())
          let mut i = 0
          while i + 5 < args.length() - 2 {
            self.curveto(
              args[i],
              args[i + 1],
              args[i + 2],
              args[i + 3],
              args[i + 4],
              args[i + 5],
            )
            i += 6
          }
          if i + 1 < args.length() {
            self.lineto(args[i], args[i + 1])
          }
        }
        25 => {
          let args = self.take(self.stack.length())
          let lines = if args.length() >= 6 {
            (args.length() - 6) / 2
          } else {
            0
          }
          for k in 0..<lines {
            self.lineto(args[k * 2], args[k * 2 + 1])
          }
          let start = lines * 2
          if start + 5 < args.length() {
            self.curveto(
              args[start],
              args[start + 1],
              args[start + 2],
              args[start + 3],
              args[start + 4],
              args[start + 5],
            )
          }
        }
        26 => {
          let args = self.take(self.stack.length())
          let mut i = 0
          let mut lead = 0
          if args.length() % 4 == 1 {
            lead = args[0]
            i = 1
          }
          while i + 3 < args.length() {
            self.curveto(
              lead,
              args[i],
              args[i + 1],
              args[i + 2],
              0,
              args[i + 3],
            )
            lead = 0
            i += 4
          }
        }
        27 => {
          let args = self.take(self.stack.length())
          let mut i = 0
          let mut lead = 0
          if args.length() % 4 == 1 {
            lead = args[0]
            i = 1
          }
          while i + 3 < args.length() {
            self.curveto(
              args[i],
              lead,
              args[i + 1],
              args[i + 2],
              args[i + 3],
              0,
            )
            lead = 0
            i += 4
          }
        }
        30 | 31 => {
          let args = self.take(self.stack.length())
          let mut i = 0
          let mut horizontal = b0 == 31
          while i + 3 < args.length() {
            let last = i + 4 == args.length() - 1
            if horizontal {
              let dx3 = if last { args[i + 4] } else { 0 }
              self.curveto(
                args[i],
                0,
                args[i + 1],
                args[i + 2],
                dx3,
                args[i + 3],
              )
            } else {
              let dy3 = if last { args[i + 4] } else { 0 }
              self.curveto(
                0,
                args[i],
                args[i + 1],
                args[i + 2],
                args[i + 3],
                dy3,
              )
            }
            i += if last { 5 } else { 4 }
            horizontal = !horizontal
          }
        }
        10 | 29 => {
          let raw = self.pop()
          let index = @wire.div_round(raw.to_int64(), 65536)
          let target = if b0 == 10 { self.lsubrs } else { self.gsubrs }
          let count = target.count()
          if count <= 0 {
            raise @model.Malformed(
              at~,
              got="a subroutine call with no subroutines",
            )
          }
          let resolved = index + bias(count)
          if resolved < 0 || resolved >= count {
            raise @model.Malformed(at~, got="a subroutine index past the index")
          }
          self.run(target.item(resolved), depth + 1)
        }
        11 => return
        14 => {
          if self.stack.length() >= 4 {
            raise @model.Unsupported(
              at~,
              got="a seac accent composition in endchar",
            )
          }
          self.strip_width(0)
          self.clear()
          self.close()
          return
        }
        15 => {
          if !self.is_cff2 {
            raise @model.Unsupported(at~, got="a vsindex operator in CFF 1")
          }
          let raw = self.pop()
          self.vsindex = @wire.div_round(raw.to_int64(), 65536)
          self.clear()
        }
        16 => {
          if !self.is_cff2 {
            raise @model.Unsupported(at~, got="a blend operator in CFF 1")
          }
          self.blend(at)
        }
        12 => {
          if at >= length {
            raise @model.Truncated(at~, want=1)
          }
          let op = code[at].to_int()
          at += 1
          self.escape(op, at)
        }
        _ =>
          raise @model.Unsupported(at=at - 1, got="charstring operator \{b0}")
      }
    }
  }
}

///|
/// The operators behind the 12 prefix: the flex family, and the arithmetic that
/// a handful of very old fonts use to compute a point.
fn Interp::escape(
  self : Interp,
  op : Int32,
  at : Int32,
) -> Unit raise @model.Refused {
  match op {
    34 => {
      let args = self.take(7)
      self.flex(args[0], 0, args[1], args[2], args[3], 0)
      self.flex(args[4], 0, args[5], -args[2], args[6], 0)
    }
    35 => {
      let args = self.take(13)
      self.flex(args[0], args[1], args[2], args[3], args[4], args[5])
      self.flex(args[6], args[7], args[8], args[9], args[10], args[11])
    }
    36 => {
      let args = self.take(9)
      self.flex(args[0], args[1], args[2], args[3], args[4], 0)
      self.flex(
        args[5],
        0,
        args[6],
        args[7],
        args[8],
        -(args[1] + args[3] + args[7]),
      )
    }
    37 => {
      let args = self.take(11)
      let dx = args[0] + args[2] + args[4] + args[6] + args[8]
      let dy = args[1] + args[3] + args[5] + args[7] + args[9]
      if (if dx < 0 { -dx } else { dx }) > (if dy < 0 { -dy } else { dy }) {
        self.flex(args[0], args[1], args[2], args[3], args[4], args[5])
        self.flex(args[6], args[7], args[8], args[9], args[10], -dy)
      } else {
        self.flex(args[0], args[1], args[2], args[3], args[4], args[5])
        self.flex(args[6], args[7], args[8], args[9], -dx, args[10])
      }
    }
    9 => {
      let a = self.pop()
      self.push(if a < 0 { -a } else { a })
    }
    10 => {
      let b = self.pop()
      let a = self.pop()
      self.push(a + b)
    }
    11 => {
      let b = self.pop()
      let a = self.pop()
      self.push(a - b)
    }
    12 => {
      let b = self.pop()
      let a = self.pop()
      if b == 0 {
        raise @model.Malformed(at~, got="a division by zero in a charstring")
      }
      self.push(@wire.div_round(a.to_int64() * 65536, b.to_int64()))
    }
    14 => {
      let a = self.pop()
      self.push(-a)
    }
    24 => {
      let b = self.pop()
      let a = self.pop()
      self.push(@wire.div_round(a.to_int64() * b.to_int64(), 65536))
    }
    18 => {
      let _ = self.pop()
    }
    27 => {
      let a = self.pop()
      self.push(a)
      self.push(a)
    }
    28 => {
      let b = self.pop()
      let a = self.pop()
      self.push(b)
      self.push(a)
    }
    0 => ()
    _ =>
      raise @model.Unsupported(
        at=at - 2,
        got="charstring escape operator \{op}",
      )
  }
}

///|
/// Two curves that share a start and an end tangent: a 13- or 9-operand flex
/// is expanded into two ordinary cubic segments.
fn Interp::flex(
  self : Interp,
  ax : Int32,
  ay : Int32,
  bx : Int32,
  by : Int32,
  cx : Int32,
  cy : Int32,
) -> Unit {
  self.curveto(ax, ay, bx, by, cx, cy)
}

///|
/// `blend` replaces a run of default operands with their value at the current
/// location. The operands arrive as `n` defaults, then for each default one
/// delta per region of the store, then `n` itself.
fn Interp::blend(self : Interp, at : Int32) -> Unit raise @model.Refused {
  let raw = self.pop()
  let count = @wire.div_round(raw.to_int64(), 65536)
  let store = match self.font.var_store {
    Some(store) => store
    None => raise @model.Malformed(at~, got="a blend with no variation store")
  }
  let regions = store.region_count(self.vsindex)
  if count <= 0 || count > 513 {
    raise @model.Malformed(at~, got="a blend of \{count} values")
  }
  let needed = count * (regions + 1)
  if self.stack.length() < needed {
    raise @model.Malformed(at~, got="a blend with a short operand stack")
  }
  let start = self.stack.length() - needed
  let defaults = take_range(self.stack, start, start + count)
  let blended : Array[Int32] = []
  for i in 0..<count {
    let mut value = defaults[i]
    if regions > 0 {
      let deltas = take_range(
        self.stack,
        start + count + i * regions,
        start + count + (i + 1) * regions,
      )
      // The whole operand stack is 16.16, deltas included, so the scaled
      // delta is already in the same space as the default it moves.
      value += self.delta(deltas)
    }
    blended.push(value)
  }
  self.stack = take_range(self.stack, 0, start)
  for value in blended {
    self.push(value)
  }
}

///|
/// The scaled sum of one operand's per-region deltas, in font units.
fn Interp::delta(self : Interp, deltas : Array[Int32]) -> Int32 {
  let store = match self.font.var_store {
    Some(store) => store
    None => return 0
  }
  store.blend(self.vsindex, deltas, self.coords)
}
