// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The two compressed containers a web font arrives in, as `Container`
// implementations. A WOFF file is an SFNT with each table deflated; a WOFF2
// file is one Brotli stream whose tables may also be re-encoded. Both hand back
// `TableSet`s, so exactly one reader understands table directories and nothing
// above this layer knows a font arrived compressed.

///|
/// The WOFF signature.
let woff1_magic : Int32 = 0x774F4646

///|
/// The WOFF 2 signature.
let woff2_magic : Int32 = 0x774F4632

///|
/// The flavor a font collection declares.
let collection_flavor : Int32 = 0x74746366

///|
/// WOFF 1.0.
pub struct Woff1 {}

///|
pub fn Woff1::new() -> Woff1 {
  Woff1::{ }
}

///|
pub impl @sfnt.Container for Woff1 with fn name(self) {
  let _ = self
  "WOFF"
}

///|
pub impl @sfnt.Container for Woff1 with fn claims(self, magic) {
  let _ = self
  magic == woff1_magic
}

///|
pub impl @sfnt.Container for Woff1 with fn open(self, bytes, limits) {
  let _ = self
  open_woff1(bytes, limits)
}

///|
/// WOFF 2.0, including the collections the format added.
pub struct Woff2 {}

///|
pub fn Woff2::new() -> Woff2 {
  Woff2::{ }
}

///|
pub impl @sfnt.Container for Woff2 with fn name(self) {
  let _ = self
  "WOFF2"
}

///|
pub impl @sfnt.Container for Woff2 with fn claims(self, magic) {
  let _ = self
  magic == woff2_magic
}

///|
pub impl @sfnt.Container for Woff2 with fn open(self, bytes, limits) {
  let _ = self
  open_woff2(bytes, limits)
}

///|
/// Read a big-endian word at an offset, refusing a short file rather than
/// reading past it.
pub fn word_at(data : BytesView, at : Int32) -> Int32 raise @model.Refused {
  if at < 0 || at + 4 > data.length() {
    raise @model.Truncated(at~, want=4)
  }
  (data[at].to_int() << 24) |
  (data[at + 1].to_int() << 16) |
  (data[at + 2].to_int() << 8) |
  data[at + 3].to_int()
}

///|
pub fn short_at(data : BytesView, at : Int32) -> Int32 raise @model.Refused {
  if at < 0 || at + 2 > data.length() {
    raise @model.Truncated(at~, want=2)
  }
  (data[at].to_int() << 8) | data[at + 1].to_int()
}
