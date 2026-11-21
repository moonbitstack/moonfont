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
pub fn unpack_woff2(
  input : BytesView,
  limits : @model.Limits,
) -> BytesView raise @model.Refused {
  let flavor = word_at(input, 4)
  if flavor == 0x74746366 {
    raise @model.Unsupported(at=4, got="a WOFF 2 collection")
  }
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
  reassemble(filled, flavor, limits)
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

///|
/// Put every table back and write the SFNT. `glyf` is rebuilt first because the
/// `loca` and `hmtx` transforms are derived from it.
fn reassemble(
  pieces : Array[Piece],
  flavor : Int32,
  limits : @model.Limits,
) -> Bytes raise @model.Refused {
  let mut glyph_body : Bytes? = None
  let mut x_mins : Array[Int32] = []
  let mut glyf_index = -1
  let mut loca_index = -1
  for i in 0..<pieces.length() {
    if pieces[i].tag == tag_glyf {
      glyf_index = i
    } else if pieces[i].tag == tag_loca {
      loca_index = i
    }
  }
  let mut loca_body : Bytes? = None
  if glyf_index >= 0 && pieces[glyf_index].transformed {
    let (glyf, loca, mins) = rebuild_glyf(pieces[glyf_index].data, limits)
    glyph_body = Some(glyf)
    loca_body = Some(loca)
    x_mins = mins
  }
  let number_of_h_metrics = {
    let mut value = 0
    for piece in pieces {
      if piece.tag == tag_hhea && piece.data.length() >= 36 {
        value = short_at(piece.data, 34)
      }
    }
    value
  }
  let outputs : Array[Piece] = []
  for piece in pieces {
    if piece.tag == tag_glyf && glyph_body is Some(_) {
      outputs.push({
        tag: piece.tag,
        orig_length: glyph_body.unwrap().length(),
        stored_length: glyph_body.unwrap().length(),
        transformed: false,
        data: glyph_body.unwrap()[:],
      })
    } else if piece.tag == tag_loca && loca_body is Some(_) {
      outputs.push({
        tag: piece.tag,
        orig_length: loca_body.unwrap().length(),
        stored_length: loca_body.unwrap().length(),
        transformed: false,
        data: loca_body.unwrap()[:],
      })
    } else if piece.tag == tag_hmtx && piece.transformed {
      let rebuilt = rebuild_hmtx(piece.data, number_of_h_metrics, x_mins)
      outputs.push({
        tag: piece.tag,
        orig_length: rebuilt.length(),
        stored_length: rebuilt.length(),
        transformed: false,
        data: rebuilt[:],
      })
    } else {
      outputs.push(piece)
    }
  }
  if glyf_index >= 0 && loca_index < 0 {
    raise @model.MissingTable(tag="loca")
  }
  write_sfnt(outputs, flavor)
}

///|
/// Write the tables into one SFNT, sorted by tag, each starting on a
/// four-byte boundary.
fn write_sfnt(pieces : Array[Piece], flavor : Int32) -> Bytes {
  let order : Array[Int32] = []
  for i in 0..<pieces.length() {
    order.push(i)
  }
  for i in 1..<order.length() {
    let key = order[i]
    let mut j = i - 1
    while j >= 0 && pieces[order[j]].tag > pieces[key].tag {
      order[j + 1] = order[j]
      j -= 1
    }
    order[j + 1] = key
  }
  let count = pieces.length()
  let writer = Writer::new()
  let mut power = 1
  let mut selector = 0
  while power * 2 <= count {
    power *= 2
    selector += 1
  }
  writer.u32(flavor)
  writer.u16(count)
  writer.u16(power * 16)
  writer.u16(selector)
  writer.u16(count * 16 - power * 16)
  let mut data_at = 12 + count * 16
  let starts : Array[Int32] = []
  for k in 0..<count {
    let piece = pieces[order[k]]
    writer.tag(piece.tag)
    writer.u32(checksum(piece.data))
    writer.u32(data_at)
    writer.u32(piece.data.length())
    starts.push(data_at)
    data_at += (piece.data.length() + 3) / 4 * 4
  }
  for k in 0..<count {
    let piece = pieces[order[k]]
    writer.align(4)
    writer.bytes(piece.data)
    writer.align(4)
  }
  writer.to_bytes()
}
