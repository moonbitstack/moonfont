// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// WOFF 1.0: an SFNT whose tables are individually deflated. Unpacking is the
// inverse of a writer that was told to compress what it could, so the directory
// keeps the original checksums and only the bytes change.

///|
/// One table of a WOFF file, as the directory declares it.
priv struct Entry {
  tag : Int32
  checksum : Int32
  offset : Int32
  comp_length : Int32
  orig_length : Int32
}

///|
pub fn unpack_woff1(
  input : BytesView,
  limits : @model.Limits,
) -> BytesView raise @model.Refused {
  let flavor = word_at(input, 4)
  if flavor == 0x74746366 {
    raise @model.Unsupported(at=4, got="a WOFF collection")
  }
  let count = short_at(input, 12)
  if count <= 0 {
    raise @model.Malformed(at=12, got="a WOFF with no tables")
  }
  limits.check_glyphs(count)
  if 44 + count * 20 > input.length() {
    raise @model.Truncated(at=44, want=count * 20)
  }
  let entries : Array[Entry] = []
  for i in 0..<count {
    let at = 44 + i * 20
    let tag = word_at(input, at)
    let offset = word_at(input, at + 4)
    let comp_length = word_at(input, at + 8)
    let orig_length = word_at(input, at + 12)
    let checksum = word_at(input, at + 16)
    if offset < 0 || comp_length < 0 || orig_length < 0 {
      raise @model.Malformed(at~, got="a WOFF table with a negative length")
    }
    if offset + comp_length > input.length() {
      raise @model.Truncated(at=offset, want=comp_length)
    }
    if comp_length > orig_length {
      raise @model.Malformed(
        at=at + 8,
        got="a WOFF table compressed past its uncompressed length",
      )
    }
    limits.check_table(orig_length)
    entries.push({ tag, checksum, offset, comp_length, orig_length, })
  }
  sort_by_tag(entries)
  let writer = Writer::new()
  writer.u32(flavor)
  writer.u16(count)
  let (search_range, entry_selector, range_shift) = search_fields(count)
  writer.u16(search_range)
  writer.u16(entry_selector)
  writer.u16(range_shift)
  let mut data_at = 12 + count * 16
  let starts : Array[Int32] = []
  for entry in entries {
    writer.tag(entry.tag)
    writer.u32(entry.checksum)
    writer.u32(data_at)
    writer.u32(entry.orig_length)
    starts.push(data_at)
    data_at += (entry.orig_length + 3) / 4 * 4
  }
  for i in 0..<entries.length() {
    let entry = entries[i]
    writer.align(4)
    let from = entry.offset
    let view = input.clamped_view(start=from, end=from + entry.comp_length)
    if entry.comp_length == entry.orig_length {
      writer.bytes(view)
    } else {
      let plain = inflate(view, entry.orig_length)
      writer.bytes(plain)
    }
    writer.align(4)
    if writer.length() != starts[i] + (entry.orig_length + 3) / 4 * 4 {
      raise @model.Malformed(
        at=entry.offset,
        got="a WOFF table that unpacked to the wrong length",
      )
    }
  }
  writer.to_bytes()
}

///|
/// Inflate one table, refusing anything that does not come out at the length
/// the directory declared. The decompressor's own refusals become this
/// library's so a caller has one error type to handle.
fn inflate(view : BytesView, expected : Int32) -> Bytes raise @model.Refused {
  let outcome : Result[Bytes, Error] = Ok(@zlib.unzlib(view, limit=expected)) catch {
    error => Err(error)
  }
  match outcome {
    Ok(plain) => {
      if plain.length() != expected {
        raise @model.Malformed(
          at=0,
          got="a deflated table of \{plain.length()} bytes",
        )
      }
      plain
    }
    Err(_) =>
      raise @model.Malformed(at=0, got="a deflated table that will not inflate")
  }
}

///|
/// The three search fields an SFNT header carries. They are derived, never
/// read: a reader that trusts them is reading a number it can compute.
fn search_fields(count : Int32) -> (Int32, Int32, Int32) {
  let mut power = 1
  let mut selector = 0
  while power * 2 <= count {
    power *= 2
    selector += 1
  }
  let search_range = power * 16
  (search_range, selector, count * 16 - search_range)
}

///|
/// Ascending by tag, which the format requires of a table directory.
fn sort_by_tag(entries : Array[Entry]) -> Unit {
  for i in 1..<entries.length() {
    let key = entries[i]
    let mut j = i - 1
    while j >= 0 && entries[j].tag > key.tag {
      entries[j + 1] = entries[j]
      j -= 1
    }
    entries[j + 1] = key
  }
}
