// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// A CFF file is a stack of INDEXes: a count, a run of offsets, then the data.
// Each INDEX holds either dictionaries (operand-and-operator programs) or
// charstrings. This file reads both, and nothing else: an INDEX never knows
// what its items mean, and a dictionary never knows where its offsets point.

///|
/// One INDEX, resolved to absolute offsets into the table it came from. An
/// empty INDEX has no offsets at all, which is legal and common for local
/// subroutines.
#derive(Debug)
pub(all) struct Index {
  data : BytesView
  /// `count + 1` absolute offsets; item `i` spans `[starts[i], starts[i + 1])`.
  starts : Array[Int32]
}

///|
pub fn Index::parse(
  cursor : @wire.Cursor,
  wide : Bool,
  limits : @model.Limits,
) -> Index raise @model.Refused {
  let data = cursor.all()
  let base = cursor.position()
  let count = if wide { cursor.u32() } else { cursor.u16() }
  if count < 0 {
    raise @model.Malformed(at=base, got="a negative INDEX count")
  }
  limits.check_glyphs(count)
  if count == 0 {
    return { data, starts: [], }
  }
  let off_size = cursor.u8()
  if off_size < 1 || off_size > 4 {
    raise @model.Malformed(
      at=cursor.position() - 1,
      got="INDEX offSize \{off_size}",
    )
  }
  let offsets_at = cursor.position()
  let data_at = offsets_at + (count + 1) * off_size
  let starts : Array[Int32] = []
  for i in 0..<(count + 1) {
    let at = offsets_at + i * off_size
    let mut value = 0
    for k in 0..<off_size {
      if at + k >= data.length() {
        raise @model.Truncated(at=at + k, want=1)
      }
      value = (value << 8) | data[at + k].to_int()
    }
    if value < 1 {
      raise @model.Malformed(at~, got="an INDEX offset of zero")
    }
    let absolute = data_at + value - 1
    if absolute > data.length() {
      raise @model.Truncated(at=absolute, want=0)
    }
    if starts.length() > 0 && absolute < starts[starts.length() - 1] {
      raise @model.Malformed(at~, got="an INDEX offset going backwards")
    }
    starts.push(absolute)
  }
  // Leave the caller after the last item, not after the offset array: the
  // next INDEX in the file starts there.
  cursor.seek(starts[starts.length() - 1])
  { data, starts, }
}

///|
pub fn Index::count(self : Index) -> Int32 {
  if self.starts.length() == 0 {
    0
  } else {
    self.starts.length() - 1
  }
}

///|
/// One item, or an empty view past the end. A caller that asks for a glyph the
/// INDEX does not have gets an empty charstring rather than a trap, and the
/// outline layer renders it as a blank glyph.
pub fn Index::item(self : Index, index : Int32) -> BytesView {
  if index < 0 || index + 1 >= self.starts.length() {
    self.data.clamped_view(start=0, end=0)
  } else {
    let from = self.starts[index]
    let to = self.starts[index + 1]
    self.data.clamped_view(start=from, end=to)
  }
}

///|
/// The dictionaries this reader needs, flattened. Every operand that does not
/// appear keeps the value a PostScript reader would assume.
pub struct Dict {
  mut char_strings : Int32
  mut charstring_type : Int32
  mut private_size : Int32
  mut private_offset : Int32
  mut subrs : Int32
  mut fd_array : Int32
  mut fd_select : Int32
  mut vstore : Int32
  mut vsindex : Int32
  /// The `a` of FontMatrix in 16.16, already multiplied by units per em.
  mut matrix_scale : Int32
  mut matrix_set : Bool
  mut is_cid : Bool
}

///|
fn empty_dict() -> Dict {
  {
    char_strings: 0,
    charstring_type: 2,
    private_size: 0,
    private_offset: 0,
    subrs: 0,
    fd_array: 0,
    fd_select: 0,
    vstore: 0,
    vsindex: 0,
    matrix_scale: 65536,
    matrix_set: false,
    is_cid: false,
  }
}

///|
/// The operand stack of one dictionary. Numbers are kept in 16.16 so that a
/// real operand and an integer operand can share one array.
priv struct Operands {
  mut values : Array[Int32]
  mut reals : Array[Bool]
}

///|
fn Operands::new() -> Operands {
  { values: [], reals: [], }
}

///|
fn Operands::push(self : Operands, value : Int32, real : Bool) -> Unit {
  self.values.push(value)
  self.reals.push(real)
}

///|
fn Operands::clear(self : Operands) -> Unit {
  self.values = []
  self.reals = []
}

///|
/// Read one dict at `from`, with `length` bytes, and fill the fields this
/// library uses. An unknown operator is skipped with its operands, which is
/// what a reader that does not implement every hint must do.
fn parse_dict(
  data : BytesView,
  from : Int32,
  length : Int32,
  units_per_em : Int32,
) -> Dict raise @model.Refused {
  let dict = empty_dict()
  if from < 0 || length < 0 || from + length > data.length() {
    raise @model.Truncated(at=from, want=length)
  }
  let end = from + length
  let stack = Operands::new()
  let mut at = from
  while at < end {
    let b0 = data[at].to_int()
    if b0 == 28 {
      if at + 3 > end {
        raise @model.Truncated(at~, want=3)
      }
      let value = (data[at + 1].to_int() << 8) | data[at + 2].to_int()
      stack.push(if value >= 0x8000 { value - 0x10000 } else { value }, false)
      at += 3
    } else if b0 == 29 {
      if at + 5 > end {
        raise @model.Truncated(at~, want=5)
      }
      let value = (data[at + 1].to_int() << 24) |
        (data[at + 2].to_int() << 16) |
        (data[at + 3].to_int() << 8) |
        data[at + 4].to_int()
      stack.push(value, false)
      at += 5
    } else if b0 == 30 {
      let (value, next) = read_real(data, at + 1, end)
      stack.push(value, true)
      at = next
    } else if b0 >= 32 && b0 <= 246 {
      stack.push(b0 - 139, false)
      at += 1
    } else if b0 >= 247 && b0 <= 250 {
      if at + 2 > end {
        raise @model.Truncated(at~, want=2)
      }
      stack.push((b0 - 247) * 256 + data[at + 1].to_int() + 108, false)
      at += 2
    } else if b0 >= 251 && b0 <= 254 {
      if at + 2 > end {
        raise @model.Truncated(at~, want=2)
      }
      stack.push(-(b0 - 251) * 256 - data[at + 1].to_int() - 108, false)
      at += 2
    } else if b0 == 12 {
      if at + 1 >= end {
        raise @model.Truncated(at~, want=1)
      }
      let op = data[at + 1].to_int()
      at += 2
      match op {
        6 => dict.charstring_type = stack.last()
        7 => {
          // FontMatrix maps glyph space to a thousandth of an em; a font
          // declares it relative to its own units per em.
          let a = if stack.values.length() >= 6 {
            stack.values[stack.values.length() - 6]
          } else {
            0
          }
          let scaled = @wire.div_round(
            a.to_int64() * units_per_em.to_int64(),
            65536,
          )
          dict.matrix_scale = scaled
          dict.matrix_set = scaled != 65536
        }
        30 => dict.is_cid = true
        36 => dict.fd_array = stack.last()
        37 => dict.fd_select = stack.last()
        _ => ()
      }
      stack.clear()
    } else {
      at += 1
      match b0 {
        // The two operators CFF 2 added outside the escaped range: a top
        // dictionary names its variation store with 24, a private one its
        // default variation-store index with 22.
        24 => dict.vstore = stack.last()
        22 => dict.vsindex = stack.last()
        17 => dict.char_strings = stack.last()
        18 =>
          if stack.values.length() >= 2 {
            dict.private_size = stack.values[stack.values.length() - 2]
            dict.private_offset = stack.values[stack.values.length() - 1]
          }
        19 => dict.subrs = stack.last()
        _ => ()
      }
      stack.clear()
    }
  }
  dict
}

///|
/// The last operand, or zero. A dictionary that ends with an operator and no
/// operands is malformed but harmless here.
fn Operands::last(self : Operands) -> Int32 {
  if self.values.length() == 0 {
    0
  } else {
    self.values[self.values.length() - 1]
  }
}

///|
/// A PostScript real, nibbles of one digit each, as 16.16 fixed point. Returns
/// the value and the position after the terminating nibble.
fn read_real(
  data : BytesView,
  from : Int32,
  end : Int32,
) -> (Int32, Int32) raise @model.Refused {
  let mut value : Int64 = 0
  let mut scale : Int64 = 1
  let mut fraction = false
  let mut negative = false
  let mut exponent = 0
  let mut exponent_negative = false
  let mut reading_exponent = false
  let mut at = from
  while at < end {
    let byte = data[at].to_int()
    at += 1
    for half in [byte >> 4, byte & 0x0F] {
      let nibble : Int64 = half.to_int64()
      if nibble <= 9 {
        if reading_exponent {
          exponent = exponent * 10 + half
        } else if fraction {
          if scale < 65536 {
            scale *= 10
            value = value * 10 + nibble
          }
        } else {
          value = value * 10 + nibble
        }
      } else if half == 0x0A {
        fraction = true
      } else if half == 0x0B {
        reading_exponent = true
        exponent_negative = false
      } else if half == 0x0C {
        reading_exponent = true
        exponent_negative = true
      } else if half == 0x0E {
        negative = true
      } else if half == 0x0F {
        let mut result = value * 65536 / scale
        if exponent != 0 {
          for _ in 0..<exponent {
            result = if exponent_negative { result / 10 } else { result * 10 }
          }
        }
        return ((if negative { -result } else { result }).to_int(), at)
      }
    }
  }
  raise @model.Malformed(at=end, got="a dict real with no terminator")
}
