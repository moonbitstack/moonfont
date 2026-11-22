// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The item variation store is the compact form a delta table takes when it is
// neither per-point nor per-glyph: a region list, then rows of deltas, each row
// naming the regions it applies to. `HVAR` and `CFF2` both use it, so it lives
// here once rather than twice.
//
// Everything is resolved lazily against the bytes already in memory: a caller
// that never asks for a heavy instance never touches a delta.

///|
/// One region of the store: three F2Dot14 values per axis, the start, peak and
/// end of the tent.
#derive(Eq, Debug)
pub(all) struct Region {
  /// `3 * axis_count` values, start/peak/end per axis.
  coordinates : Array[Int32]
}

///|
/// The parsed store. `data` is the whole table section the store lives in, and
/// offsets inside it are relative to the store's own start, so a caller can
/// hand over a cursor bounded to the table.
#derive(Debug)
pub(all) struct Store {
  data : BytesView
  region_axis_count : Int32
  regions : Array[Region]
  /// Offsets of each ItemVariationData subtable, relative to the store start.
  items : Array[Int32]
}

///|
pub fn Store::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> Store raise @model.Refused {
  let data = cursor.all()
  cursor.seek(0)
  let format = cursor.u16()
  if format != 1 {
    raise @model.Unsupported(at=0, got="item variation store format \{format}")
  }
  let region_offset = cursor.u32()
  let item_count = cursor.u16()
  let items : Array[Int32] = []
  for _ in 0..<item_count {
    items.push(cursor.u32())
  }
  if region_offset <= 0 || region_offset >= data.length() {
    raise @model.Truncated(at=region_offset, want=6)
  }
  cursor.seek(region_offset)
  let axis_count = cursor.u16()
  let region_count = cursor.u16()
  limits.check_glyphs(region_count)
  if axis_count.to_int64() * region_count.to_int64() * 6 >
    cursor.left().to_int64() {
    raise @model.Truncated(
      at=region_offset + 4,
      want=axis_count * region_count * 6,
    )
  }
  let regions : Array[Region] = []
  for _ in 0..<region_count {
    let coordinates : Array[Int32] = []
    for _ in 0..<(axis_count * 3) {
      coordinates.push(cursor.i16())
    }
    regions.push({ coordinates, })
  }
  { data, region_axis_count: axis_count, regions, items, }
}

///|
/// The F2Dot14 scalar of one region at a normalised location, 1.0 being 16384.
/// A peak of zero means the axis does not take part, which is how a delta can
/// be restricted to a single axis.
pub fn Region::scalar(
  self : Region,
  axis_count : Int32,
  coords : Array[Int32],
) -> Int32 {
  let mut scalar : Int64 = 16384
  let mut axis = 0
  while axis < axis_count {
    let lower = self.coordinates[axis * 3]
    let peak = self.coordinates[axis * 3 + 1]
    let upper = self.coordinates[axis * 3 + 2]
    if peak != 0 {
      let value = if axis < coords.length() { coords[axis] } else { 0 }
      let mut factor : Int64 = 16384
      if value == peak {
        // At the peak the region is fully on, including when the peak sits on
        // the end of the tent rather than in its middle.
      } else if value <= lower || upper <= value {
        factor = 0
      } else if value < peak {
        factor = @wire.div_round(
          (value - lower).to_int64() * 16384,
          (peak - lower).to_int64(),
        ).to_int64()
      } else if value > peak {
        factor = @wire.div_round(
          (value - upper).to_int64() * 16384,
          (peak - upper).to_int64(),
        ).to_int64()
      }
      scalar = scalar * factor / 16384
    }
    axis += 1
  }
  scalar.to_int()
}

///|
/// How many regions one item of `index` blends. `CFF2` needs this to know how
/// many deltas to pop per operand before it can blend them.
pub fn Store::region_count(self : Store, index : Int32) -> Int32 {
  if index < 0 || index >= self.items.length() {
    return 0
  }
  let at = self.items[index]
  if at < 0 || at + 6 > self.data.length() {
    return 0
  }
  u16_at(self.data, at + 4)
}

///|
fn u16_at(data : BytesView, at : Int32) -> Int32 {
  if at < 0 || at + 1 >= data.length() {
    0
  } else {
    (data[at].to_int() << 8) | data[at + 1].to_int()
  }
}

///|
/// One item's contribution at a location: the sum of its deltas times the
/// scalar of the region each one belongs to.
pub fn Store::delta(
  self : Store,
  index : Int32,
  item : Int32,
  coords : Array[Int32],
) -> Int32 {
  if index < 0 || index >= self.items.length() {
    return 0
  }
  let at = self.items[index]
  let item_count = u16_at(self.data, at)
  let word_count = u16_at(self.data, at + 2)
  let region_count = u16_at(self.data, at + 4)
  if item < 0 || item >= item_count {
    return 0
  }
  let long_words = (word_count & 0x8000) != 0
  let words = word_count & 0x7FFF
  if words > region_count {
    return 0
  }
  let indexes = at + 6
  let row = indexes + region_count * 2
  let word_size = if long_words { 4 } else { 2 }
  let tail_size = if long_words { 2 } else { 1 }
  let row_size = words * word_size + (region_count - words) * tail_size
  let begin = row + item * row_size
  if begin < 0 || begin + row_size > self.data.length() {
    return 0
  }
  let mut total = 0
  for i in 0..<region_count {
    let offset = begin +
      (if i < words {
        i * word_size
      } else {
        words * word_size + (i - words) * tail_size
      })
    let delta = if i < words {
      if long_words {
        i32_at(self.data, offset)
      } else {
        i16_at(self.data, offset)
      }
    } else if long_words {
      i16_at(self.data, offset)
    } else {
      let byte = self.data[offset].to_int()
      if byte >= 0x80 {
        byte - 0x100
      } else {
        byte
      }
    }
    if delta != 0 {
      let region = u16_at(self.data, indexes + i * 2)
      if region < self.regions.length() {
        total += scale_f2dot14(
          delta,
          self.regions[region].scalar(self.region_axis_count, coords),
        )
      }
    }
  }
  total
}

///|
/// A run of per-region deltas applied at a location: what a CFF 2 `blend`
/// operand needs.
pub fn Store::blend(
  self : Store,
  index : Int32,
  deltas : Array[Int32],
  coords : Array[Int32],
) -> Int32 {
  if index < 0 || index >= self.items.length() {
    return 0
  }
  let at = self.items[index]
  let region_count = u16_at(self.data, at + 4)
  let indexes = at + 6
  let mut total = 0
  for i in 0..<region_count {
    if i >= deltas.length() {
      break
    }
    let region = u16_at(self.data, indexes + i * 2)
    if region >= 0 && region < self.regions.length() && deltas[i] != 0 {
      total += scale_f2dot14(
        deltas[i],
        self.regions[region].scalar(self.region_axis_count, coords),
      )
    }
  }
  total
}

///|
fn i16_at(data : BytesView, at : Int32) -> Int32 {
  let value = u16_at(data, at)
  if value >= 0x8000 {
    value - 0x10000
  } else {
    value
  }
}

///|
fn i32_at(data : BytesView, at : Int32) -> Int32 {
  (u16_at(data, at) << 16) | u16_at(data, at + 2)
}
