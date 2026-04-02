// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// A cursor moves through bytes that already exist. Every read is checked before
// it happens, so a table decoder never has to ask whether an offset is inside
// the file: a truncated font raises Truncated at the first byte that is not
// there, and a decoder can carry on reading as if the file were whole.

///|
/// A position in a run of bytes. Opaque: a caller that could set `pos` could
/// make it disagree with the data it points into.
pub struct Cursor {
  data : BytesView
  mut pos : Int32
}

///|
pub fn Cursor::new(data : BytesView) -> Cursor {
  { data, pos: 0, }
}

///|
/// A cursor at `at` inside `data`. Used for a table slice, so that offsets
/// inside that table stay relative to the table rather than to the file.
pub fn Cursor::at(
  data : BytesView,
  offset : Int32,
) -> Cursor raise @model.Refused {
  if offset < 0 || offset > data.length() {
    raise @model.Truncated(at=offset, want=0)
  }
  { data, pos: offset, }
}

///|
pub fn Cursor::position(self : Cursor) -> Int32 {
  self.pos
}

///|
pub fn Cursor::length(self : Cursor) -> Int32 {
  self.data.length()
}

///|
pub fn Cursor::left(self : Cursor) -> Int32 {
  self.data.length() - self.pos
}

///|
pub fn Cursor::rest(self : Cursor) -> BytesView {
  self.data.clamped_view(start=self.pos, end=self.data.length())
}

///|
/// The whole window this cursor was bounded to, from its start rather than
/// from its current position. A table that needs random access keeps this
/// instead of seeking back and forth.
pub fn Cursor::all(self : Cursor) -> BytesView {
  self.data
}

///|
pub fn Cursor::seek(self : Cursor, at : Int32) -> Unit raise @model.Refused {
  if at < 0 || at > self.data.length() {
    raise @model.Truncated(at~, want=0)
  }
  self.pos = at
}

///|
pub fn Cursor::skip(self : Cursor, count : Int32) -> Unit raise @model.Refused {
  self.seek(self.pos + count)
}

///|
/// A bounded window into the same bytes. Lengths in a font are declared by the
/// font, so this is the one place that decides whether a declaration is honest.
pub fn Cursor::window(
  self : Cursor,
  at : Int32,
  length : Int32,
) -> Cursor raise @model.Refused {
  if at < 0 || length < 0 || at > self.length() || length > self.length() - at {
    raise @model.Truncated(at~, want=length)
  }
  Cursor::new(self.data.clamped_view(start=at, end=at + length))
}

///|
pub fn Cursor::u8(self : Cursor) -> Int32 raise @model.Refused {
  if self.pos >= self.data.length() {
    raise @model.Truncated(at=self.pos, want=1)
  }
  let value = self.data[self.pos].to_int()
  self.pos += 1
  value
}

///|
pub fn Cursor::i8(self : Cursor) -> Int32 raise @model.Refused {
  let value = self.u8()
  if value >= 0x80 {
    value - 0x100
  } else {
    value
  }
}

///|
pub fn Cursor::u16(self : Cursor) -> Int32 raise @model.Refused {
  let hi = self.u8()
  let lo = self.u8()
  (hi << 8) | lo
}

///|
pub fn Cursor::i16(self : Cursor) -> Int32 raise @model.Refused {
  let value = self.u16()
  if value >= 0x8000 {
    value - 0x10000
  } else {
    value
  }
}

///|
pub fn Cursor::u24(self : Cursor) -> Int32 raise @model.Refused {
  let a = self.u8()
  let b = self.u8()
  let c = self.u8()
  (a << 16) | (b << 8) | c
}

///|
/// A 32-bit big-endian word. Font files are bounded by Limits.file_bytes well
/// below 2 GiB, so a value with the high bit set is either corrupt or hostile;
/// it arrives as a negative number and every caller's range check refuses it.
pub fn Cursor::u32(self : Cursor) -> Int32 raise @model.Refused {
  let hi = self.u16()
  let lo = self.u16()
  (hi << 16) | lo
}

///|
/// Four ASCII bytes as a table tag, held as a word so that a table lookup is a
/// comparison of integers rather than of strings.
pub fn Cursor::tag(self : Cursor) -> Int32 raise @model.Refused {
  self.u32()
}

///|
pub fn Cursor::bytes(
  self : Cursor,
  length : Int32,
) -> BytesView raise @model.Refused {
  let start = self.pos
  if length < 0 || start > self.length() || length > self.length() - start {
    raise @model.Truncated(at=start, want=length)
  }
  self.pos = start + length
  self.data.clamped_view(start~, end=self.pos)
}

///|
/// Read a value at an absolute offset without moving the cursor. Table
/// directories are full of offsets into their own table, and a reader that
/// sought there would lose its place in the directory.
pub fn Cursor::u16_at(self : Cursor, at : Int32) -> Int32 raise @model.Refused {
  let other = self.window(at, 2)
  other.u16()
}

///|
pub fn Cursor::i16_at(self : Cursor, at : Int32) -> Int32 raise @model.Refused {
  let other = self.window(at, 2)
  other.i16()
}

///|
pub fn Cursor::u32_at(self : Cursor, at : Int32) -> Int32 raise @model.Refused {
  let other = self.window(at, 4)
  other.u32()
}

///|
pub fn Cursor::tag_at(self : Cursor, at : Int32) -> Int32 raise @model.Refused {
  self.u32_at(at)
}
