// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// `MVAR` moves the measurements that are not per glyph: the ascender and
// descender of `hhea` and `vhea`, the cap height and x-height of `OS/2`, the
// underline of `post`, and the caret slopes. A font whose weight changes its
// vertical extent is wrong at every instance without it, which is why a
// measurer that reads a location needs this table as much as `HVAR`.
//
// The table is a list of records, each naming a four-byte metric tag and the
// item-variation-store entry that moves it, so the metrics and the deltas stay
// independent: a caller asks for the tag it needs.

///|
/// The `MVAR` table.
pub(all) struct Mvar {
  store : Store
  /// `(tag, outer, inner)` per record, in the order the table declares them.
  records : Array[(Int32, Int32, Int32)]
}

///|
pub fn Mvar::parse(
  cursor : @wire.Cursor,
  limits : @model.Limits,
) -> Mvar raise @model.Refused {
  let data = cursor.all()
  cursor.seek(0)
  let major = cursor.u16()
  let minor = cursor.u16()
  if major != 1 {
    raise @model.Unsupported(at=0, got="MVAR version \{major}.\{minor}")
  }
  let _ = cursor.u16()
  let record_size = cursor.u16()
  let record_count = cursor.u16()
  let store_at = cursor.u32()
  if record_size < 8 {
    raise @model.Malformed(at=10, got="an MVAR record of \{record_size} bytes")
  }
  limits.check_glyphs(record_count)
  if store_at <= 0 || store_at >= data.length() {
    raise @model.Truncated(at=store_at, want=8)
  }
  let records : Array[(Int32, Int32, Int32)] = []
  for _ in 0..<record_count {
    let tag = cursor.u32()
    let outer = cursor.u16()
    let inner = cursor.u16()
    cursor.skip(record_size - 8)
    records.push((tag, outer, inner))
  }
  let store = Store::parse(
    @wire.Cursor::new(data).window(store_at, data.length() - store_at),
    limits,
  )
  { store, records, }
}

///|
/// The tags this table carries, ascending, so a caller can see what a font
/// varies without asking for each one.
pub fn Mvar::tags(self : Mvar) -> Array[Int32] {
  let out : Array[Int32] = []
  for record in self.records {
    out.push(record.0)
  }
  out
}

///|
/// How much one metric moves at a location, in font units. Zero for a tag the
/// table does not carry, which makes a caller's arithmetic the same whether the
/// font varies the metric or not.
pub fn Mvar::delta(self : Mvar, tag : Int32, coords : Array[Int32]) -> Int32 {
  for record in self.records {
    if record.0 == tag {
      return self.store.delta(record.1, record.2, coords)
    }
  }
  0
}
