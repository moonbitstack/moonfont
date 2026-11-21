// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// Three coordinate spaces meet in a variable font: 16.16 user units from
// `fvar`, F2Dot14 normalised units inside every table, and whole font units in
// the glyph data. Integers keep all three exact: a normalised coordinate is
// what the file says, not what a float happened to round to.

///|
/// Divide rounding to nearest, halves away from zero. A denominator of zero is
/// a caller's bug rather than bad input, so it yields zero instead of trapping;
/// every caller has already checked the axis range.
pub fn div_round(numerator : Int64, denominator : Int64) -> Int32 {
  if denominator == 0 {
    return 0
  }
  let negative = (numerator < 0) != (denominator < 0)
  let magnitude = if numerator < 0 { -numerator } else { numerator }
  let unit = if denominator < 0 { -denominator } else { denominator }
  let quotient = (magnitude * 2 + unit) / (unit * 2)
  (if negative { -quotient } else { quotient }).to_int()
}

///|
/// Multiply by an F2Dot14 factor, rounding to nearest. Used for the scalar of
/// one variation tuple applied to one delta.
pub fn scale_f2dot14(value : Int32, factor : Int32) -> Int32 {
  div_round(value.to_int64() * factor.to_int64(), 16384)
}

///|
/// Multiply by a 16.16 factor, rounding to nearest.
pub fn scale_fixed(value : Int32, factor : Int32) -> Int32 {
  div_round(value.to_int64() * factor.to_int64(), 65536)
}

///|
/// A four-character tag as a word, so a lookup compares integers.
pub fn tag_of(text : String) -> Int32 {
  let mut value = 0
  let mut count = 0
  for character in text {
    if count < 4 {
      value = (value << 8) | (character.to_int() & 0xFF)
      count += 1
    }
  }
  while count < 4 {
    value = value << 8
    count += 1
  }
  value
}

///|
/// The four characters of a tag. Bytes outside printable ASCII become `?` so a
/// hostile tag cannot break a caller's layout.
pub fn tag_name(tag : Int32) -> String {
  let characters : Array[Char] = []
  for shift in [24, 16, 8, 0] {
    let value = (tag >> shift) & 0xFF
    let character = if value >= 0x20 && value < 0x7F {
      value.to_int().to_char().unwrap_or('?')
    } else {
      '?'
    }
    characters.push(character)
  }
  String::from_array(characters)
}
