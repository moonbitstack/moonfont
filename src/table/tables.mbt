// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The small tables. All of them are fixed-layout runs of big-endian integers;
// the only interesting decisions are where a declared count is checked, and
// what a missing optional field means for a caller.

///|
/// `head`: the font-wide scale and the shape of the `loca` table.
pub(all) struct Head {
  units_per_em : Int32
  index_to_loc_format : Int32
  mac_style : Int32
  lowest_rec_ppem : Int32
  bounding_box : @model.Bounds
}

///|
pub fn Head::parse(cursor : @wire.Cursor) -> Head raise @model.Refused {
  cursor.seek(18)
  let units_per_em = cursor.u16()
  if units_per_em < 16 || units_per_em > 16384 {
    raise @model.Malformed(at=18, got="unitsPerEm of \{units_per_em}")
  }
  cursor.seek(36)
  let x_min = cursor.i16()
  let y_min = cursor.i16()
  let x_max = cursor.i16()
  let y_max = cursor.i16()
  let mac_style = cursor.u16()
  let lowest_rec_ppem = cursor.u16()
  cursor.seek(50)
  let index_to_loc_format = cursor.i16()
  if index_to_loc_format != 0 && index_to_loc_format != 1 {
    raise @model.Malformed(
      at=50,
      got="indexToLocFormat of \{index_to_loc_format}",
    )
  }
  {
    units_per_em,
    index_to_loc_format,
    mac_style,
    lowest_rec_ppem,
    bounding_box: { x_min, y_min, x_max, y_max, },
  }
}

///|
/// `hhea`: the vertical rhythm and the width of one `hmtx` long metric.
pub(all) struct Hhea {
  ascender : Int32
  descender : Int32
  line_gap : Int32
  number_of_h_metrics : Int32
}

///|
pub fn Hhea::parse(cursor : @wire.Cursor) -> Hhea raise @model.Refused {
  cursor.seek(4)
  let ascender = cursor.i16()
  let descender = cursor.i16()
  let line_gap = cursor.i16()
  cursor.seek(34)
  let number_of_h_metrics = cursor.u16()
  if number_of_h_metrics <= 0 {
    raise @model.Malformed(at=34, got="zero horizontal metrics")
  }
  { ascender, descender, line_gap, number_of_h_metrics, }
}

///|
/// `maxp`: how many glyphs the file claims to have.
pub(all) struct Maxp {
  num_glyphs : Int32
  max_points : Int32
  max_contours : Int32
  max_composite_points : Int32
  max_composite_contours : Int32
}

///|
pub fn Maxp::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> Maxp raise @model.Refused {
  cursor.seek(0)
  let version = cursor.u32()
  let num_glyphs = cursor.u16()
  limits.check_glyphs(num_glyphs)
  if version == 0x00005000 {
    return {
      num_glyphs,
      max_points: 0,
      max_contours: 0,
      max_composite_points: 0,
      max_composite_contours: 0,
    }
  }
  if version != 0x00010000 {
    raise @model.Unsupported(at=0, got="maxp version \{version}")
  }
  let max_points = cursor.u16()
  let max_contours = cursor.u16()
  let max_composite_points = cursor.u16()
  let max_composite_contours = cursor.u16()
  {
    num_glyphs,
    max_points,
    max_contours,
    max_composite_points,
    max_composite_contours,
  }
}

///|
/// `hmtx`: advances and left side bearings. The tail of the table holds only
/// bearings for glyphs whose advance is the last long metric's, which is why a
/// glyph's metrics are a lookup rather than a fixed stride.
pub(all) struct Hmtx {
  advances : Array[Int32]
  bearings : Array[Int32]
}

///|
pub fn Hmtx::parse(
  cursor : @wire.Cursor,
  num_glyphs : Int32,
  number_of_h_metrics : Int32,
  limits : @model.Limits,
) -> Hmtx raise @model.Refused {
  limits.check_glyphs(num_glyphs)
  let count = if number_of_h_metrics > num_glyphs {
    num_glyphs
  } else {
    number_of_h_metrics
  }
  let advances : Array[Int32] = []
  let bearings : Array[Int32] = []
  for _ in 0..<count {
    advances.push(cursor.u16())
    bearings.push(cursor.i16())
  }
  for _ in count..<num_glyphs {
    advances.push(advances[count - 1])
    bearings.push(cursor.i16())
  }
  { advances, bearings, }
}

///|
pub fn Hmtx::metrics(self : Hmtx, glyph : Int32) -> (Int32, Int32) {
  if glyph < 0 || glyph >= self.advances.length() {
    (0, 0)
  } else {
    (self.advances[glyph], self.bearings[glyph])
  }
}

///|
/// `loca`: one offset per glyph boundary, in either short or long form.
pub(all) struct Loca {
  offsets : Array[Int32]
}

///|
pub fn Loca::parse(
  cursor : @wire.Cursor,
  num_glyphs : Int32,
  index_to_loc_format : Int32,
  limits : @model.Limits,
) -> Loca raise @model.Refused {
  limits.check_glyphs(num_glyphs)
  let offsets : Array[Int32] = []
  for _ in 0..<(num_glyphs + 1) {
    let value = if index_to_loc_format == 0 {
      cursor.u16() * 2
    } else {
      cursor.u32()
    }
    if value < 0 ||
      (offsets.length() > 0 && value < offsets[offsets.length() - 1]) {
      raise @model.Malformed(
        at=cursor.position(),
        got="a loca offset going backwards",
      )
    }
    offsets.push(value)
  }
  { offsets, }
}

///|
/// The half-open byte range of one glyph inside `glyf`. An empty range is a
/// space, a combining mark built entirely from components, or an empty glyph.
pub fn Loca::range(self : Loca, glyph : Int32) -> (Int32, Int32)? {
  if glyph < 0 || glyph + 1 >= self.offsets.length() {
    None
  } else {
    Some((self.offsets[glyph], self.offsets[glyph + 1]))
  }
}

///|
pub fn Loca::count(self : Loca) -> Int32 {
  self.offsets.length() - 1
}
