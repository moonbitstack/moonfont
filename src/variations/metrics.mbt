// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The tables that move metrics without moving outlines: `HVAR` for horizontal
// advances and side bearings, `VVAR` for vertical ones. The two have the same
// layout, so one reader serves both; what differs is which metric of the face a
// delta is added to, and that is the caller's business.
//
// A glyph id reaches a delta through a `DeltaSetIndexMap`, which is worth
// parsing once rather than per glyph: a font with a map of ten thousand entries
// would otherwise re-read its header on every advance.

///|
/// A map from a glyph id to the two-level index of the variation store.
pub(all) struct DeltaMap {
  data : BytesView
  entries_at : Int32
  count : Int32
  entry_size : Int32
  inner_bits : Int32
}

///|
/// Read a map at `at`. `None` means the table named no map there, which the
/// format uses to say "the glyph id is the index".
pub fn DeltaMap::parse(
  data : BytesView,
  at : Int32,
  limits : @model.Limits,
) -> DeltaMap? raise @model.Refused {
  if at == 0 {
    return None
  }
  if at < 0 || at + 4 > data.length() {
    raise @model.Truncated(at~, want=4)
  }
  let format = data[at].to_int()
  let entry_format = data[at + 1].to_int()
  let inner_bits = entry_format & 0x0F
  let entry_size = ((entry_format & 0x30) >> 4) + 1
  let (count, entries_at) = if format == 0 {
    ((data[at + 2].to_int() << 8) | data[at + 3].to_int(), at + 4)
  } else if format == 1 {
    (
      (data[at + 2].to_int() << 24) |
      (data[at + 3].to_int() << 16) |
      (data[at + 4].to_int() << 8) |
      data[at + 5].to_int(),
      at + 6,
    )
  } else {
    raise @model.Unsupported(at~, got="delta set index map format \{format}")
  }
  limits.check_glyphs(count)
  if count > 0 && entries_at + count * entry_size > data.length() {
    raise @model.Truncated(at=entries_at, want=count * entry_size)
  }
  Some({ data, entries_at, count, entry_size, inner_bits, })
}

///|
/// The store index of a glyph. A glyph past the end of the map uses its last
/// entry, which is what the format intends for a map that covers fewer glyphs
/// than the font has.
pub fn DeltaMap::resolve(self : DeltaMap, glyph : Int32) -> (Int32, Int32) {
  if self.count <= 0 {
    return (0, 0)
  }
  let slot = if glyph < 0 {
    0
  } else if glyph >= self.count {
    self.count - 1
  } else {
    glyph
  }
  let at = self.entries_at + slot * self.entry_size
  if at + self.entry_size > self.data.length() {
    return (0, 0)
  }
  let mut value = 0
  for k in 0..<self.entry_size {
    value = (value << 8) | self.data[at + k].to_int()
  }
  if self.inner_bits == 0 {
    (value, 0)
  } else {
    (value >> self.inner_bits, value & ((1 << self.inner_bits) - 1))
  }
}

///|
/// A metrics variation table: an item variation store and up to three maps, one
/// per metric the table may move.
pub(all) struct MetricDeltas {
  store : Store
  /// Advance: width for `HVAR`, height for `VVAR`.
  advance : DeltaMap?
  /// Left side bearing for `HVAR`, top side bearing for `VVAR`.
  bearing : DeltaMap?
  /// Right or bottom side bearing, which this library reports but never
  /// derives an advance from.
  side : DeltaMap?
}

///|
/// Read `HVAR` or `VVAR`. Both start with a version, the offset of their item
/// variation store and three map offsets; a version this library does not know
/// is refused rather than guessed at.
pub fn MetricDeltas::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> MetricDeltas raise @model.Refused {
  let data = cursor.all()
  cursor.seek(0)
  let major = cursor.u16()
  let minor = cursor.u16()
  if major != 1 {
    raise @model.Unsupported(
      at=0,
      got="metrics variation version \{major}.\{minor}",
    )
  }
  let store_at = cursor.u32()
  let advance_at = cursor.u32()
  let bearing_at = cursor.u32()
  let side_at = cursor.u32()
  if store_at <= 0 || store_at >= data.length() {
    raise @model.Truncated(at=store_at, want=8)
  }
  let store = Store::parse(
    @wire.Cursor::new(data).window(store_at, data.length() - store_at),
    limits,
  )
  {
    store,
    advance: DeltaMap::parse(data, advance_at, limits),
    bearing: DeltaMap::parse(data, bearing_at, limits),
    side: DeltaMap::parse(data, side_at, limits),
  }
}

///|
/// The advance delta of one glyph at a location, in font units.
pub fn MetricDeltas::advance_delta(
  self : MetricDeltas,
  glyph : Int32,
  coords : Array[Int32],
) -> Int32 {
  match self.advance {
    Some(map) => {
      let (outer, inner) = map.resolve(glyph)
      self.store.delta(outer, inner, coords)
    }
    None => self.store.delta(0, glyph, coords)
  }
}

///|
/// The leading side-bearing delta of one glyph, in font units.
pub fn MetricDeltas::bearing_delta(
  self : MetricDeltas,
  glyph : Int32,
  coords : Array[Int32],
) -> Int32 {
  match self.bearing {
    Some(map) => {
      let (outer, inner) = map.resolve(glyph)
      self.store.delta(outer, inner, coords)
    }
    None => 0
  }
}

///|
/// The trailing side-bearing delta of one glyph, in font units.
pub fn MetricDeltas::side_delta(
  self : MetricDeltas,
  glyph : Int32,
  coords : Array[Int32],
) -> Int32 {
  match self.side {
    Some(map) => {
      let (outer, inner) = map.resolve(glyph)
      self.store.delta(outer, inner, coords)
    }
    None => 0
  }
}
