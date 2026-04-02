// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// OS/2 is the source of the optical heights that `head` and `hhea` do not
// carry. Older versions of the table simply do not have them, so the reader
// reports zero rather than inventing a cap height from an ascender.

///|
pub(all) struct Os2 {
  weight_class : Int32
  width_class : Int32
  x_height : Int32
  cap_height : Int32
  typo_ascender : Int32
  typo_descender : Int32
  typo_line_gap : Int32
}

///|
pub fn Os2::empty() -> Os2 {
  {
    weight_class: 400,
    width_class: 5,
    x_height: 0,
    cap_height: 0,
    typo_ascender: 0,
    typo_descender: 0,
    typo_line_gap: 0,
  }
}

///|
pub fn Os2::parse(cursor : @wire.Cursor) -> Os2 raise @model.Refused {
  if cursor.length() < 78 {
    return Os2::empty()
  }
  let version = cursor.u16()
  let weight_class = cursor.u16_at(4)
  let width_class = cursor.u16_at(6)
  let typo_ascender = cursor.i16_at(68)
  let typo_descender = cursor.i16_at(70)
  let typo_line_gap = cursor.i16_at(72)
  let mut x_height = 0
  let mut cap_height = 0
  if version >= 2 && cursor.length() >= 90 {
    x_height = cursor.i16_at(86)
    cap_height = cursor.i16_at(88)
  }
  {
    weight_class,
    width_class,
    x_height,
    cap_height,
    typo_ascender,
    typo_descender,
    typo_line_gap,
  }
}
