// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// Building a font in memory needs a byte sink. Nothing clever: append, pad to
// four bytes, and hand back an immutable `Bytes` at the end.

///|
/// An append-only byte buffer.
pub struct Writer {
  data : Array[Byte]
}

///|
pub fn Writer::new() -> Writer {
  { data: [], }
}

///|
pub fn Writer::length(self : Writer) -> Int32 {
  self.data.length()
}

///|
pub fn Writer::byte(self : Writer, value : Int32) -> Unit {
  self.data.push((value & 0xFF).to_byte())
}

///|
pub fn Writer::u16(self : Writer, value : Int32) -> Unit {
  self.byte(value >> 8)
  self.byte(value)
}

///|
pub fn Writer::i16(self : Writer, value : Int32) -> Unit {
  self.u16(value & 0xFFFF)
}

///|
pub fn Writer::u32(self : Writer, value : Int32) -> Unit {
  self.u16(value >> 16)
  self.u16(value & 0xFFFF)
}

///|
pub fn Writer::tag(self : Writer, value : Int32) -> Unit {
  self.u32(value)
}

///|
pub fn Writer::bytes(self : Writer, value : BytesView) -> Unit {
  for i in 0..<value.length() {
    self.data.push(value[i])
  }
}

///|
pub fn Writer::zeros(self : Writer, count : Int32) -> Unit {
  for _ in 0..<count {
    self.data.push(b'\x00')
  }
}

///|
/// Pad with zeroes to a multiple of `unit`. Tables in an SFNT start on a
/// four-byte boundary and the padding is part of the file.
pub fn Writer::align(self : Writer, unit : Int32) -> Unit {
  if unit > 0 {
    let remainder = self.data.length() % unit
    if remainder != 0 {
      self.zeros(unit - remainder)
    }
  }
}

///|
pub fn Writer::to_bytes(self : Writer) -> Bytes {
  Bytes::from_array(self.data)
}

///|
/// Divide rounding to nearest, halves away from zero.
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
/// The SFNT checksum of a table: the sum of its big-endian 32-bit words, with
/// the last word zero-padded.
pub fn checksum(value : BytesView) -> Int32 {
  let mut total = 0
  let mut at = 0
  while at < value.length() {
    let mut word = 0
    for k in 0..<4 {
      word = (word << 8) |
        (if at + k < value.length() { value[at + k].to_int() } else { 0 })
    }
    total = total + word
    at += 4
  }
  total
}
