// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// A font is a directory of named byte ranges. Every other reader asks this
// layer for one range and gets a cursor that cannot walk outside it: a table
// decoder therefore cannot read another table's bytes by accident, and a
// hostile offset is refused at the directory rather than deep in a parser.
//
// Only TrueType `glyf` outlines are read. CFF and CFF2 (an `OTTO` container
// without `glyf`) are refused as MissingTable, and a PostScript-outline
// interpreter is reserved for v0.2.0.

///|
/// Table tags are four ASCII bytes held as a word. Comparison stays integer
/// comparison, and no string has to be built to find a table.
pub fn tag_head() -> Int32 {
  0x68656164
}

///|
pub fn tag_hhea() -> Int32 {
  0x68686561
}

///|
pub fn tag_maxp() -> Int32 {
  0x6D617870
}

///|
pub fn tag_hmtx() -> Int32 {
  0x686D7478
}

///|
pub fn tag_cmap() -> Int32 {
  0x636D6170
}

///|
pub fn tag_loca() -> Int32 {
  0x6C6F6361
}

///|
pub fn tag_glyf() -> Int32 {
  0x676C7966
}

///|
pub fn tag_kern() -> Int32 {
  0x6B65726E
}

///|
pub fn tag_name() -> Int32 {
  0x6E616D65
}

///|
pub fn tag_post() -> Int32 {
  0x706F7374
}

///|
pub fn tag_os2() -> Int32 {
  0x4F532F32
}

///|
pub fn tag_cff() -> Int32 {
  0x43464620
}

///|
pub fn tag_cff2() -> Int32 {
  0x43464632
}

///|
pub fn tag_fvar() -> Int32 {
  0x66766172
}

///|
pub fn tag_avar() -> Int32 {
  0x61766172
}

///|
pub fn tag_gvar() -> Int32 {
  0x67766172
}

///|
pub fn tag_hvar() -> Int32 {
  0x48564152
}

///|
/// The four signatures a TrueType-flavoured container may open with.
fn sfnt_true() -> Int32 {
  0x00010000
}

///|
fn sfnt_otto() -> Int32 {
  0x4F54544F
}

///|
fn sfnt_apple() -> Int32 {
  0x74727565
}

///|
fn sfnt_ttcf() -> Int32 {
  0x74746366
}

///|
/// A readable name for a refusal message; never built during a table lookup.
pub fn tag_string(tag : Int32) -> String {
  match tag {
    0x68656164 => "head"
    0x68686561 => "hhea"
    0x6D617870 => "maxp"
    0x686D7478 => "hmtx"
    0x636D6170 => "cmap"
    0x6C6F6361 => "loca"
    0x676C7966 => "glyf"
    0x6B65726E => "kern"
    0x6E616D65 => "name"
    0x706F7374 => "post"
    0x4F532F32 => "OS/2"
    0x43464620 => "CFF "
    0x43464632 => "CFF2"
    0x66766172 => "fvar"
    0x61766172 => "avar"
    0x67766172 => "gvar"
    0x48564152 => "HVAR"
    _ => "an unknown table"
  }
}

///|
/// One entry of the table directory. Offsets are absolute in the file.
pub(all) struct TableRecord {
  tag : Int32
  checksum : Int32
  offset : Int32
  length : Int32
}

///|
/// One face's directory. A single font is a collection of one; that is the
/// whole difference between a .ttf and a .ttc at this layer.
pub(all) struct Directory {
  scaler : Int32
  records : Array[TableRecord]
}

///|
pub fn Directory::find(self : Directory, tag : Int32) -> TableRecord? {
  for i in 0..<self.records.length() {
    if self.records[i].tag == tag {
      return Some(self.records[i])
    }
  }
  None
}

///|
pub fn Directory::has(self : Directory, tag : Int32) -> Bool {
  match self.find(tag) {
    Some(_) => true
    None => false
  }
}

///|
pub fn Directory::require(
  self : Directory,
  tag : Int32,
) -> TableRecord raise @model.Refused {
  match self.find(tag) {
    Some(record) => record
    None => raise @model.MissingTable(tag=tag_string(tag))
  }
}

///|
/// A cursor bounded to exactly the table's bytes. This is the only way any
/// higher layer gets to read a table.
pub fn Directory::table(
  self : Directory,
  bytes : BytesView,
  tag : Int32,
  limits : @model.Limits,
) -> @wire.Cursor raise @model.Refused {
  let record = self.require(tag)
  limits.check_table(record.length)
  @wire.Cursor::new(bytes).window(record.offset, record.length)
}

///|
fn parse_directory(
  bytes : BytesView,
  at : Int32,
  limits : @model.Limits,
) -> Directory raise @model.Refused {
  let root = @wire.Cursor::new(bytes)
  let header = root.window(at, 12)
  let scaler = header.u32()
  if scaler != sfnt_true() && scaler != sfnt_otto() && scaler != sfnt_apple() {
    raise @model.Unknown(at~, got="sfnt scaler type \{scaler}")
  }
  let count = header.u16()
  header.skip(6)
  if count <= 0 {
    raise @model.Malformed(at=at + 4, got="an empty table directory")
  }
  let records : Array[TableRecord] = []
  let entries = root.window(at + 12, count * 16)
  for _ in 0..<count {
    let tag = entries.tag()
    let checksum = entries.u32()
    let offset = entries.u32()
    let length = entries.u32()
    limits.check_table(length)
    if offset < 0 || length < 0 || offset + length > bytes.length() {
      raise @model.Truncated(at=offset, want=length)
    }
    records.push({ tag, checksum, offset, length, })
  }
  { scaler, records, }
}

///|
/// Read every face in the file. A plain font yields one directory, a TrueType
/// collection yields one per face, and a caller never has to branch on which.
pub fn read(
  bytes : BytesView,
  limits : @model.Limits,
) -> Array[Directory] raise @model.Refused {
  limits.check_file(bytes.length())
  let root = @wire.Cursor::new(bytes)
  let signature = root.u32()
  if signature == sfnt_ttcf() {
    let version = root.u32()
    if version != 0x00010000 && version != 0x00020000 {
      raise @model.Unsupported(at=4, got="TTC version \{version}")
    }
    let count = root.u32()
    if count <= 0 {
      raise @model.Malformed(at=8, got="an empty collection")
    }
    limits.check_glyphs(count)
    let offsets : Array[Int32] = []
    for _ in 0..<count {
      offsets.push(root.u32())
    }
    let faces : Array[Directory] = []
    for i in 0..<offsets.length() {
      faces.push(parse_directory(bytes, offsets[i], limits))
    }
    faces
  } else {
    [parse_directory(bytes, 0, limits)]
  }
}
