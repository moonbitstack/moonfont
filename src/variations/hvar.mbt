// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// `HVAR` adjusts horizontal advances at a location without moving a single
// point. A font that has it is usually monospaced at every instance but still
// declares different widths, and a measurer that ignored the table would place
// the pen where the design does not.

///|
/// The horizontal metrics variation table.
#derive(Debug)
pub(all) struct Hvar {
  store : Store
  /// Offsets of the three index maps, zero when the glyph id is the index.
  advance_map : Int32
  lsb_map : Int32
  data : BytesView
}

///|
pub fn Hvar::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> Hvar raise @model.Refused {
  let data = cursor.all()
  cursor.seek(0)
  let major = cursor.u16()
  let minor = cursor.u16()
  if major != 1 {
    raise @model.Unsupported(at=0, got="HVAR version \{major}.\{minor}")
  }
  let store_at = cursor.u32()
  let advance_map = cursor.u32()
  let lsb_map = cursor.u32()
  if store_at <= 0 || store_at >= data.length() {
    raise @model.Truncated(at=store_at, want=8)
  }
  let store = Store::parse(
    @wire.Cursor::new(data).window(store_at, data.length() - store_at),
    limits,
  )
  { store, advance_map, lsb_map, data, }
}

///|
/// The advance-width delta of one glyph at a location, in font units.
pub fn Hvar::advance_delta(
  self : Hvar,
  glyph : Int32,
  coords : Array[Int32],
) -> Int32 {
  let (outer, inner) = self.index(self.advance_map, glyph)
  self.store.delta(outer, inner, coords)
}

///|
/// The left-side-bearing delta of one glyph at a location, in font units.
pub fn Hvar::lsb_delta(
  self : Hvar,
  glyph : Int32,
  coords : Array[Int32],
) -> Int32 {
  if self.lsb_map == 0 {
    0
  } else {
    let (outer, inner) = self.index(self.lsb_map, glyph)
    self.store.delta(outer, inner, coords)
  }
}

///|
/// Resolve a glyph id to the store's two-level index, through the map when the
/// font has one. A glyph past the end of a map uses its last entry, which is
/// what the format intends for fonts whose map covers fewer glyphs than it
/// claims.
fn Hvar::index(self : Hvar, map_at : Int32, glyph : Int32) -> (Int32, Int32) {
  if map_at == 0 {
    return (0, glyph)
  }
  if map_at < 0 || map_at + 2 > self.data.length() {
    return (0, 0)
  }
  let format = self.data[map_at].to_int()
  let entry_format = self.data[map_at + 1].to_int()
  let inner_bits = entry_format & 0x0F
  let entry_size = ((entry_format & 0x30) >> 4) + 1
  let mut count = 0
  let mut entries_at = 0
  if format == 0 {
    count = (self.data[map_at + 2].to_int() << 8) |
      self.data[map_at + 3].to_int()
    entries_at = map_at + 4
  } else if format == 1 {
    count = (self.data[map_at + 2].to_int() << 24) |
      (self.data[map_at + 3].to_int() << 16) |
      (self.data[map_at + 4].to_int() << 8) |
      self.data[map_at + 5].to_int()
    entries_at = map_at + 6
  } else {
    return (0, 0)
  }
  if count <= 0 {
    return (0, 0)
  }
  let slot = if glyph < 0 {
    0
  } else if glyph >= count {
    count - 1
  } else {
    glyph
  }
  let at = entries_at + slot * entry_size
  if at + entry_size > self.data.length() {
    return (0, 0)
  }
  let mut value = 0
  for k in 0..<entry_size {
    value = (value << 8) | self.data[at + k].to_int()
  }
  let outer = if inner_bits == 0 { value } else { value >> inner_bits }
  let inner = if inner_bits == 0 { 0 } else { value & ((1 << inner_bits) - 1) }
  (outer, inner)
}
