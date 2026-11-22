// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// Where a face's tables live. This file reads the two directory layouts an
// sfnt buffer can have — one face, or a collection of them — and turns each
// into a `TableSet` that points into the buffer without copying it. Offsets are
// checked here, once, so no table decoder ever reads another table's bytes by
// accident.

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
pub fn tag_vhea() -> Int32 {
  0x76686561
}

///|
pub fn tag_vmtx() -> Int32 {
  0x766D7478
}

///|
pub fn tag_mvar() -> Int32 {
  0x4D564152
}

///|
pub fn tag_vvar() -> Int32 {
  0x56564152
}

///|
pub fn tag_cvar() -> Int32 {
  0x63766172
}

///|
pub fn tag_cvt() -> Int32 {
  0x63767420
}

///|
pub fn tag_vorg() -> Int32 {
  0x564F5247
}

///|
/// The `MVAR` value tags this library applies. They are four-character words
/// like table tags, and they name the metric a delta moves rather than a table.
pub fn tag_hasc() -> Int32 {
  0x68617363
}

///|
pub fn tag_hdsc() -> Int32 {
  0x68647363
}

///|
pub fn tag_hlgp() -> Int32 {
  0x686C6770
}

///|
pub fn tag_hcla() -> Int32 {
  0x68636C61
}

///|
pub fn tag_hcld() -> Int32 {
  0x68636C64
}

///|
pub fn tag_xhgt() -> Int32 {
  0x78686774
}

///|
pub fn tag_cpht() -> Int32 {
  0x63706874
}

///|
pub fn tag_vasc() -> Int32 {
  0x76617363
}

///|
pub fn tag_vdsc() -> Int32 {
  0x76647363
}

///|
pub fn tag_vlgp() -> Int32 {
  0x766C6770
}

///|
pub fn tag_hcrs() -> Int32 {
  0x68637273
}

///|
pub fn tag_hcrn() -> Int32 {
  0x6863726E
}

///|
pub fn tag_hcof() -> Int32 {
  0x68636F66
}

///|
pub fn tag_vcrs() -> Int32 {
  0x76637273
}

///|
pub fn tag_vcrn() -> Int32 {
  0x7663726E
}

///|
pub fn tag_vcof() -> Int32 {
  0x76636F66
}

///|
pub fn tag_unds() -> Int32 {
  0x756E6473
}

///|
pub fn tag_undo() -> Int32 {
  0x756E646F
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
    0x76686561 => "vhea"
    0x766D7478 => "vmtx"
    0x4D564152 => "MVAR"
    0x56564152 => "VVAR"
    0x63766172 => "cvar"
    0x63767420 => "cvt "
    0x564F5247 => "VORG"
    0x68617363 => "hasc"
    0x68647363 => "hdsc"
    0x686C6770 => "hlgp"
    0x68636C61 => "hcla"
    0x68636C64 => "hcld"
    0x78686774 => "xhgt"
    0x63706874 => "cpht"
    0x76617363 => "vasc"
    0x76647363 => "vdsc"
    0x766C6770 => "vlgp"
    0x68637273 => "hcrs"
    0x6863726E => "hcrn"
    0x68636F66 => "hcof"
    0x76637273 => "vcrs"
    0x7663726E => "vcrn"
    0x76636F66 => "vcof"
    0x756E6473 => "unds"
    0x756E646F => "undo"
    _ => "an unknown table"
  }
}

///|
/// Read the directory of one face at `at` in the buffer. The tables' ranges are
/// checked against the buffer here, so a later reader never has to ask whether
/// an offset is inside the file.
fn parse_face(
  bytes : BytesView,
  at : Int32,
  limits : @model.Limits,
) -> TableSet raise @model.Refused {
  let root = @wire.Cursor::new(bytes)
  let header = @wire.Cursor::at(bytes, at)
  let scaler = header.u32()
  if scaler != sfnt_true() && scaler != sfnt_otto() && scaler != sfnt_apple() {
    raise @model.Unknown(at~, got="sfnt scaler type \{scaler}")
  }
  let count = header.u16()
  header.skip(6)
  if count <= 0 {
    raise @model.Malformed(at=at + 4, got="an empty table directory")
  }
  let entries = root.window(at + 12, count * 16)
  let tags : Array[Int32] = []
  let offsets : Array[Int32] = []
  let lengths : Array[Int32] = []
  for _ in 0..<count {
    let tag = entries.tag()
    let _ = entries.u32()
    let offset = entries.u32()
    let length = entries.u32()
    limits.check_table(length)
    if offset < 0 || length < 0 || offset + length > bytes.length() {
      raise @model.Truncated(at=offset, want=length)
    }
    tags.push(tag)
    offsets.push(offset)
    lengths.push(length)
  }
  // The format asks for an ascending directory; a file that ignores that still
  // reads correctly if the set is sorted on the way in.
  let order = sort_order(tags)
  let sorted_tags : Array[Int32] = []
  let sorted_offsets : Array[Int32] = []
  let sorted_lengths : Array[Int32] = []
  for k in order {
    sorted_tags.push(tags[k])
    sorted_offsets.push(offsets[k])
    sorted_lengths.push(lengths[k])
  }
  {
    scaler,
    bytes,
    tags: sorted_tags,
    offsets: sorted_offsets,
    lengths: sorted_lengths,
  }
}

///|
/// Read every face in an sfnt buffer: a plain font yields one, a TrueType
/// collection yields one per face. A caller never has to branch on which.
pub fn read(
  bytes : BytesView,
  limits : @model.Limits,
) -> Array[TableSet] raise @model.Refused {
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
    let faces : Array[TableSet] = []
    for i in 0..<offsets.length() {
      faces.push(parse_face(bytes, offsets[i], limits))
    }
    faces
  } else {
    [parse_face(bytes, 0, limits)]
  }
}

///|
/// The sfnt version word of a buffer, or `None` when the buffer is too short to
/// carry one or opens with something that is not an sfnt scaler.
pub fn scaler_of(bytes : BytesView) -> Int32? {
  if bytes.length() < 4 {
    return None
  }
  let value = (bytes[0].to_int() << 24) |
    (bytes[1].to_int() << 16) |
    (bytes[2].to_int() << 8) |
    bytes[3].to_int()
  if value == sfnt_true() ||
    value == sfnt_otto() ||
    value == sfnt_apple() ||
    value == sfnt_ttcf() {
    Some(value)
  } else {
    None
  }
}
