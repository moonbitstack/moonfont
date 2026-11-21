// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// One container entry point. Every format this library reads arrives as bytes
// from somewhere else: a plain SFNT, a TrueType collection, a WOFF file or a
// WOFF2 file. The first three are already the layout the table reader wants,
// so only the compressed two are unpacked, and only when their signature says
// so.

///|
let woff1_magic : Int32 = 0x774F4646

///|
let woff2_magic : Int32 = 0x774F4632

///|
/// The plain SFNT a container holds. A file that is not a WOFF container is
/// returned as it came, so a caller never has to branch on the format.
pub fn unpack(
  input : BytesView,
  limits : @model.Limits,
) -> BytesView raise @model.Refused {
  limits.check_file(input.length())
  if input.length() < 4 {
    raise @model.Truncated(at=0, want=4)
  }
  let magic = (input[0].to_int() << 24) |
    (input[1].to_int() << 16) |
    (input[2].to_int() << 8) |
    input[3].to_int()
  if magic == woff1_magic {
    unpack_woff1(input, limits)
  } else if magic == woff2_magic {
    unpack_woff2(input, limits)
  } else {
    input
  }
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
