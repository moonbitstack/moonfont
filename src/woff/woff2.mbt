// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// WOFF 2.0: one Brotli stream holding every table, with `glyf`, `loca` and
// `hmtx` optionally re-encoded to strip what the rest of the file already says.
// Unpacking rebuilds the plain SFNT, including a `loca` derived from the glyph
// data and an `hmtx` whose side bearings come back from the glyph boxes.
//
// The three transforms are undone here rather than in the table readers: a
// reader that saw a transformed `glyf` would have to know it was reading a web
// font, and the whole point of this layer is that it does not.

///|
let tag_glyf : Int32 = 0x676C7966

///|
let tag_loca : Int32 = 0x6C6F6361

///|
let tag_hmtx : Int32 = 0x686D7478

///|
let tag_hhea : Int32 = 0x68686561

///|

///|
/// The slack a decompressor's own ceiling keeps above the bytes it produces:
/// its back-reference ring is charged against the same allowance. The exact
/// length is checked after the fact, so this only bounds the work.
let decompress_slack : Int32 = 64

///|
/// The 63 tags a WOFF2 directory may name by index.
fn known_tag(index : Int32) -> Int32 {
  let tags : Array[Int32] = [
    0x636D6170, 0x68656164, 0x68686561, 0x686D7478, 0x6D617870, 0x6E616D65, 0x4F532F32,
    0x706F7374, 0x63767420, 0x6670676D, 0x676C7966, 0x6C6F6361, 0x70726570, 0x43464620,
    0x564F5247, 0x45424454, 0x45424C43, 0x67617370, 0x68646D78, 0x6B65726E, 0x4C545348,
    0x50434C54, 0x56444D58, 0x76686561, 0x766D7478, 0x42415345, 0x47444546, 0x47504F53,
    0x47535542, 0x45425343, 0x4A535446, 0x4D415448, 0x43424454, 0x43424C43, 0x434F4C52,
    0x4350414C, 0x53564720, 0x73626978, 0x61636E74, 0x61766172, 0x62646174, 0x626C6F63,
    0x62736C6E, 0x63766172, 0x66647363, 0x66656174, 0x666D7478, 0x66766172, 0x67766172,
    0x68737479, 0x6A757374, 0x6C636172, 0x6D6F7274, 0x6D6F7278, 0x6F706264, 0x70726F70,
    0x7472616B, 0x5A617066, 0x53696C66, 0x476C6174, 0x476C6F63, 0x46656174, 0x53696C6C,
  ]
  if index < 0 || index >= tags.length() {
    0
  } else {
    tags[index]
  }
}

///|
/// One table of a WOFF2 file, before it is put back.
priv struct Piece {
  tag : Int32
  orig_length : Int32
  stored_length : Int32
  transformed : Bool
  /// The bytes as they appear in the decompressed stream.
  data : BytesView
}

///|
/// A cursor over one stream of the decompressed font.
priv struct Stream {
  data : BytesView
  mut pos : Int32
}

///|
fn Stream::new(data : BytesView) -> Stream {
  { data, pos: 0, }
}

///|
fn Stream::u8(self : Stream) -> Int32 raise @model.Refused {
  if self.pos < 0 || self.pos >= self.data.length() {
    raise @model.Truncated(at=self.pos, want=1)
  }
  let value = self.data[self.pos].to_int()
  self.pos += 1
  value
}

///|
fn Stream::i8(self : Stream) -> Int32 raise @model.Refused {
  let value = self.u8()
  if value >= 0x80 {
    value - 0x100
  } else {
    value
  }
}

///|
fn Stream::u16(self : Stream) -> Int32 raise @model.Refused {
  let high = self.u8()
  let low = self.u8()
  (high << 8) | low
}

///|
fn Stream::i16(self : Stream) -> Int32 raise @model.Refused {
  let value = self.u16()
  if value >= 0x8000 {
    value - 0x10000
  } else {
    value
  }
}

///|
fn Stream::u32(self : Stream) -> Int32 raise @model.Refused {
  let a = self.u16()
  let b = self.u16()
  (a << 16) | b
}

///|
fn Stream::take(self : Stream, count : Int32) -> BytesView raise @model.Refused {
  if count < 0 || count > self.data.length() - self.pos {
    raise @model.Truncated(at=self.pos, want=count)
  }
  let view = self.data.clamped_view(start=self.pos, end=self.pos + count)
  self.pos += count
  view
}

///|
/// WOFF2's variable-length unsigned integer: seven bits per byte, high bit
/// continues, at most five bytes and no redundant leading zero.
fn read_base128(stream : Stream) -> Int32 raise @model.Refused {
  let mut value : Int64 = 0
  for i in 0..<5 {
    let byte = stream.u8()
    if i == 0 && byte == 0x80 {
      raise @model.Malformed(
        at=stream.pos - 1,
        got="a UIntBase128 with a leading zero",
      )
    }
    if (value & 0xFE000000) != 0 {
      raise @model.OverLimit(limit=0x7FFFFFFF, got=0)
    }
    value = (value << 7) | (byte & 0x7F).to_int64()
    if (byte & 0x80) == 0 {
      return value.to_int()
    }
  }
  raise @model.Malformed(
    at=stream.pos,
    got="a UIntBase128 longer than five bytes",
  )
}

///|
/// WOFF2's 255UInt16: one byte for the common range, two or three for the rest.
fn read_255(stream : Stream) -> Int32 raise @model.Refused {
  let first = stream.u8()
  if first == 253 {
    stream.u8()
  } else if first == 254 {
    506 + stream.u8()
  } else if first == 255 {
    253 + stream.u16()
  } else {
    first
  }
}

///|
/// One face of a collection, as the collection directory describes it: the
/// flavor it reports and the table-directory entries it is built from.
priv struct FaceEntry {
  flavor : Int32
  indexes : Array[Int32]
}

///|
/// The tables of one transformed `glyf`, rebuilt together with the `loca` and
/// the left edge of every glyph that the other transforms are derived from.
priv struct GlyphRebuild {
  glyf : Bytes
  loca : Bytes
  x_mins : Array[Int32]
}

///|
/// Every face a WOFF2 file holds: one for a single font, one per font for a
/// collection.
pub fn open_woff2(
  input : BytesView,
  limits : @model.Limits,
) -> Array[@sfnt.TableSet] raise @model.Refused {
  let flavor = word_at(input, 4)
  let is_collection = flavor == collection_flavor
  let count = short_at(input, 12)
  if count <= 0 {
    raise @model.Malformed(at=12, got="a WOFF 2 file with no tables")
  }
  limits.check_glyphs(count)
  let compressed_length = word_at(input, 20)
  if compressed_length < 0 {
    raise @model.Malformed(at=20, got="a negative compressed length")
  }
  let directory = Stream::new(input)
  directory.pos = 48
  let pieces : Array[Piece] = []
  for _ in 0..<count {
    let flags = directory.u8()
    let index = flags & 0x3F
    let version = (flags >> 6) & 0x03
    let tag = if index == 63 { directory.u32() } else { known_tag(index) }
    let orig_length = read_base128(directory)
    let transformed = if tag == tag_glyf || tag == tag_loca {
      version == 0
    } else {
      version != 0
    }
    if tag != tag_glyf && tag != tag_loca && tag != tag_hmtx && transformed {
      raise @model.Unsupported(at=directory.pos, got="a transformed table")
    }
    limits.check_table(orig_length)
    let stored_length = if transformed {
      let length = read_base128(directory)
      limits.check_table(length)
      length
    } else {
      orig_length
    }
    pieces.push({
      tag,
      orig_length,
      stored_length,
      transformed,
      data: input.clamped_view(start=0, end=0),
    })
  }
  // A collection names the tables each of its fonts is built from; a single
  // font is a collection of one whose directory is implicit.
  let faces : Array[FaceEntry] = []
  if is_collection {
    let version = directory.u32()
    if version != 0x00010000 && version != 0x00020000 {
      raise @model.Unsupported(
        at=directory.pos - 4,
        got="TTC version \{version}",
      )
    }
    let num_fonts = read_255(directory)
    if num_fonts <= 0 {
      raise @model.Malformed(at=directory.pos, got="an empty collection")
    }
    limits.check_glyphs(num_fonts)
    for _ in 0..<num_fonts {
      let num_tables = read_255(directory)
      let face_flavor = directory.u32()
      let indexes : Array[Int32] = []
      for _ in 0..<num_tables {
        let index = read_255(directory)
        if index < 0 || index >= pieces.length() {
          raise @model.Malformed(
            at=directory.pos,
            got="a collection entry naming table \{index}",
          )
        }
        indexes.push(index)
      }
      faces.push({ flavor: face_flavor, indexes, })
    }
  } else {
    let indexes : Array[Int32] = []
    for i in 0..<pieces.length() {
      indexes.push(i)
    }
    faces.push({ flavor, indexes, })
  }
  let compressed_at = directory.pos
  if compressed_at + compressed_length > input.length() {
    raise @model.Truncated(at=compressed_at, want=compressed_length)
  }
  let packed = input.clamped_view(
    start=compressed_at,
    end=compressed_at + compressed_length,
  )
  let total : Int32 = {
    let mut sum = 0
    for piece in pieces {
      sum += piece.stored_length
    }
    sum
  }
  let plain = decompress(packed, total)
  let stream = Stream::new(plain)
  let filled : Array[Piece] = []
  for piece in pieces {
    let data = stream.take(piece.stored_length)
    filled.push({
      tag: piece.tag,
      orig_length: piece.orig_length,
      stored_length: piece.stored_length,
      transformed: piece.transformed,
      data,
    })
  }
  // A transformed `glyf` is rebuilt once even when several faces share it: the
  // bytes it produces are the same for all of them.
  let rebuilds : Array[GlyphRebuild?] = []
  for piece in filled {
    if piece.tag == tag_glyf && piece.transformed {
      let (glyf, loca, x_mins) = rebuild_glyf(piece.data, limits)
      rebuilds.push(Some({ glyf, loca, x_mins, }))
    } else {
      rebuilds.push(None)
    }
  }
  if is_collection {
    let groups : Array[Array[(Int32, BytesView)]] = []
    for face in faces {
      groups.push(face_tables(filled, rebuilds, face.indexes, limits))
    }
    @sfnt.assemble_collection(flavor, groups, limits)
  } else {
    [
      @sfnt.assemble(
        faces[0].flavor,
        face_tables(filled, rebuilds, faces[0].indexes, limits),
        limits,
      ),
    ]
  }
}

///|
/// Put one face's tables back in their declared form. The transforms are per
/// table, so two faces that share a table share the work: `glyf` and its `loca`
/// come from the rebuild, and an `hmtx` comes back from the left edge of the
/// glyphs in the `glyf` this face names.
fn face_tables(
  pieces : Array[Piece],
  rebuilds : Array[GlyphRebuild?],
  indexes : Array[Int32],
  limits : @model.Limits,
) -> Array[(Int32, BytesView)] raise @model.Refused {
  let mut glyf_at = -1
  let mut loca_at = -1
  let mut number_of_h_metrics = 0
  for index in indexes {
    let piece = pieces[index]
    if piece.tag == tag_glyf {
      glyf_at = index
    } else if piece.tag == tag_loca {
      loca_at = index
    } else if piece.tag == tag_hhea && piece.data.length() >= 36 {
      number_of_h_metrics = short_at(piece.data, 34)
    }
  }
  if glyf_at >= 0 && pieces[glyf_at].transformed && loca_at < 0 {
    raise @model.MissingTable(tag="loca")
  }
  let rebuild = if glyf_at >= 0 { rebuilds[glyf_at] } else { None }
  let x_mins = match rebuild {
    Some(data) => data.x_mins
    None => []
  }
  let tables : Array[(Int32, BytesView)] = []
  for index in indexes {
    let piece = pieces[index]
    if piece.tag == tag_glyf && piece.transformed {
      match rebuild {
        Some(data) => tables.push((piece.tag, data.glyf[:]))
        None =>
          raise @model.Malformed(at=0, got="a transformed glyf with no rebuild")
      }
    } else if piece.tag == tag_loca && piece.transformed {
      match rebuild {
        Some(data) => tables.push((piece.tag, data.loca[:]))
        None =>
          raise @model.Malformed(at=0, got="a transformed loca with no glyf")
      }
    } else if piece.tag == tag_hmtx && piece.transformed {
      let rebuilt = rebuild_hmtx(piece.data, number_of_h_metrics, x_mins)
      limits.check_table(rebuilt.length())
      tables.push((piece.tag, rebuilt[:]))
    } else {
      tables.push((piece.tag, piece.data))
    }
  }
  tables
}

///|
/// One Brotli stream for the whole font. The expected size is a ceiling as well
/// as a check: a stream that expands past what the directory accounts for is
/// refused before it is trusted.
fn decompress(
  packed : BytesView,
  expected : Int32,
) -> Bytes raise @model.Refused {
  let outcome : Result[Bytes, Error] = Ok(
    @brotli.unbrotli(packed, limit=expected + decompress_slack),
  ) catch {
    error => Err(error)
  }
  match outcome {
    Ok(plain) => {
      if plain.length() != expected {
        raise @model.Malformed(
          at=0,
          got="a Brotli stream of \{plain.length()} bytes",
        )
      }
      plain
    }
    Err(_) =>
      raise @model.Malformed(at=0, got="a Brotli stream that will not expand")
  }
}
