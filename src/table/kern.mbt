// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The legacy `kern` table. Modern fonts carry kerning in GPOS, which is a
// shaping concern and therefore out of scope; this reader deliberately keeps
// the old pairs as DATA, so a caller can decide whether to apply them without
// the library pretending to be a layout engine.

///|
pub(all) struct Kern {
  /// (left glyph, right glyph, adjustment in font units).
  pairs : Array[(Int32, Int32, Int32)]
}

///|
pub fn Kern::empty() -> Kern {
  { pairs: [], }
}

///|
pub fn Kern::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> Kern raise @model.Refused {
  let pairs : Array[(Int32, Int32, Int32)] = []
  if cursor.length() < 4 {
    return { pairs, }
  }
  let version = cursor.u16()
  let subtables = cursor.u16()
  if version != 0 || subtables == 0 {
    return { pairs, }
  }
  // Format 0, horizontal, first subtable. A font with several subtables keeps
  // the first one; the rest are variations the library does not apply itself.
  cursor.skip(2)
  let length = cursor.u16()
  let coverage = cursor.u16()
  let format = coverage >> 8
  if format == 0 && length >= 14 {
    let count = cursor.u16()
    cursor.skip(6)
    limits.check_outline(count, 0)
    for _ in 0..<count {
      let left = cursor.u16()
      let right = cursor.u16()
      let value = cursor.i16()
      pairs.push((left, right, value))
    }
  }
  { pairs, }
}

///|
/// The adjustment between two glyphs, in font units. Zero when there is none.
pub fn Kern::between(self : Kern, left : Int32, right : Int32) -> Int32 {
  for i in 0..<self.pairs.length() {
    let (l, r, value) = self.pairs[i]
    if l == left && r == right {
      return value
    }
  }
  0
}

///|
pub fn Kern::count(self : Kern) -> Int32 {
  self.pairs.length()
}
