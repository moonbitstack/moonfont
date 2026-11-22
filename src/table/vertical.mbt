// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The vertical pair: `vhea` describes the column a glyph sits in and `vmtx`
// gives each glyph's height and top side bearing. A font that sets text
// vertically — Chinese and Japanese do, and so do Japanese fonts' Latin
// glyphs — declares both, and the advances in them are what one line of a
// column is worth.
//
// The `vmtx` table is the same table as `hmtx` and is read by `Metrics`; only
// the header differs, and only in what its measurements mean.

///|
/// `vhea`: the vertical header. Same offsets as `hhea` for the four fields this
/// library reads, which is why the two readers look alike.
pub(all) struct Vhea {
  ascender : Int32
  descender : Int32
  line_gap : Int32
  advance_height_max : Int32
  caret_slope_rise : Int32
  caret_slope_run : Int32
  caret_offset : Int32
  /// How many glyphs the `vmtx` table stores a full pair for.
  number_of_long_metrics : Int32
}

///|
pub fn Vhea::parse(cursor : @wire.Cursor) -> Vhea raise @model.Refused {
  cursor.seek(4)
  let ascender = cursor.i16()
  let descender = cursor.i16()
  let line_gap = cursor.i16()
  let advance_height_max = cursor.u16()
  cursor.seek(18)
  let caret_slope_rise = cursor.i16()
  let caret_slope_run = cursor.i16()
  let caret_offset = cursor.i16()
  cursor.seek(34)
  let number_of_long_metrics = cursor.u16()
  {
    ascender,
    descender,
    line_gap,
    advance_height_max,
    caret_slope_rise,
    caret_slope_run,
    caret_offset,
    number_of_long_metrics,
  }
}

///|
/// `cvt `: the control values a hinting program snaps distances to. They are
/// plain integers here, and `cvar` says how they move at a location.
pub(all) struct Cvt {
  values : Array[Int32]
}

///|
pub fn Cvt::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> Cvt raise @model.Refused {
  let size = cursor.all().length()
  limits.check_table(size)
  let values : Array[Int32] = []
  let count = size / 2
  for _ in 0..<count {
    values.push(cursor.i16())
  }
  { values, }
}
