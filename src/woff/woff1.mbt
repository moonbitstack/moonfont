// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// WOFF 1.0: an SFNT whose tables are individually deflated. Unpacking gives the
// face a set of table ranges over one buffer, which is the same thing a plain
// file gives, so nothing above this layer knows the font arrived compressed.

///|
/// One table of a WOFF file, as the directory declares it.
priv struct Entry {
  tag : Int32
  offset : Int32
  comp_length : Int32
  orig_length : Int32
}

///|
/// Every face a WOFF file holds. WOFF 1.0 carries a single font, so this is one
/// set or a refusal.
pub fn open_woff1(
  input : BytesView,
  limits : @model.Limits,
) -> Array[@sfnt.TableSet] raise @model.Refused {
  let flavor = word_at(input, 4)
  if flavor == collection_flavor {
    raise @model.Unsupported(
      at=4,
      got="a WOFF 1.0 collection; the format defines no collection directory",
    )
  }
  let count = short_at(input, 12)
  if count <= 0 {
    raise @model.Malformed(at=12, got="a WOFF with no tables")
  }
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
    entries.push({ tag, offset, comp_length, orig_length, })
  }
  let tables : Array[(Int32, BytesView)] = []
  for entry in entries {
    let view = input.clamped_view(
      start=entry.offset,
      end=entry.offset + entry.comp_length,
    )
    let data : BytesView = if entry.comp_length == entry.orig_length {
      view
    } else {
      inflate(view, entry.orig_length)[:]
    }
    tables.push((entry.tag, data))
  }
  [@sfnt.assemble(flavor, tables, limits)]
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
