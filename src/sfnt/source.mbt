// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// What every layer above this one reads a font through. A container format does
// not hand out a file, it hands out faces, and a face is a set of named byte
// ranges: `TableSource` is that idea as an interface, and `TableSet` is the
// in-memory implementation every container in this repository produces.
//
// Everything downstream — table decoders, the variation model, the façade, the
// browser binding — asks for a tag and gets bytes. None of them knows whether
// the bytes came from a plain file, a collection, a WOFF stream or a caller's
// own storage, so adding a container is adding one `Container` entry and none
// of the readers change.

///|
/// A face, seen as a bag of named byte ranges.
///
/// `TableSet` is the implementation this library uses; a caller with tables
/// behind a file handle, a memory map or a network fetch implements this to
/// decode without first gathering the whole font into one buffer.
pub(open) trait TableSource {
  /// The sfnt version word the face declares.
  fn scaler(Self) -> Int32
  /// Whether the face carries a table with this tag.
  fn has(Self, tag : Int32) -> Bool
  /// The bytes of one table, bounded to exactly that table. Raises
  /// `MissingTable` for a tag the face does not carry.
  fn table_bytes(Self, tag : Int32, limits : @model.Limits) -> BytesView raise @model.Refused
}

///|
/// One face: the tables a container found, each a range of one buffer.
///
/// The ranges may overlap and may be shared with another `TableSet` — that is
/// what a collection is — so this type never rewrites its buffer. A container
/// that has to expand its tables builds one buffer and hands every face a view
/// of it.
pub(all) struct TableSet {
  scaler : Int32
  /// The buffer every offset below points into.
  bytes : BytesView
  /// Table tags, ascending, so a lookup can stop early.
  tags : Array[Int32]
  offsets : Array[Int32]
  lengths : Array[Int32]
}

///|
/// The index of a tag in the set, or `-1`. The tags are kept ascending and a
/// face has at most a few dozen tables, so a scan with an early exit beats a
/// binary search that has to be tested separately.
fn TableSet::index_of(self : TableSet, tag : Int32) -> Int32 {
  for i in 0..<self.tags.length() {
    if self.tags[i] == tag {
      return i
    }
    if self.tags[i] > tag {
      return -1
    }
  }
  -1
}

///|
pub fn TableSet::has(self : TableSet, tag : Int32) -> Bool {
  self.index_of(tag) >= 0
}

///|
/// The tags this face carries, ascending.
pub fn TableSet::tags(self : TableSet) -> Array[Int32] {
  self.tags.copy()
}

///|
/// The bytes of one table, without copying. The view is exactly the table, so
/// an offset inside the table is an offset inside the view.
pub fn TableSet::table_bytes(
  self : TableSet,
  tag : Int32,
  limits : @model.Limits,
) -> BytesView raise @model.Refused {
  let index = self.index_of(tag)
  if index < 0 {
    raise @model.MissingTable(tag=tag_string(tag))
  }
  let length = self.lengths[index]
  limits.check_table(length)
  let at = self.offsets[index]
  self.bytes.clamped_view(start=at, end=at + length)
}

///|
/// A cursor bounded to one table. This is the only way a table decoder gets to
/// read, which is why no decoder has to check that an offset stayed inside its
/// own table.
pub fn table_cursor(
  source : &TableSource,
  tag : Int32,
  limits : @model.Limits,
) -> @wire.Cursor raise @model.Refused {
  @wire.Cursor::new(source.table_bytes(tag, limits))
}

///|
pub impl TableSource for TableSet with fn scaler(self) {
  self.scaler
}

///|
pub impl TableSource for TableSet with fn has(self, tag) {
  self.has(tag)
}

///|
pub impl TableSource for TableSet with fn table_bytes(self, tag, limits) {
  self.table_bytes(tag, limits)
}

///|
/// Collect tables into one buffer and describe them as a face.
///
/// A container that expands its tables — WOFF and WOFF2 both do — ends up with
/// owned bytes per table and no file to point into. Copying them into one
/// buffer, four-byte aligned, gives a face whose tables are as cheap to read as
/// a plain file's, and costs one pass over bytes that were decompressed anyway.
pub fn assemble(
  scaler : Int32,
  tables : Array[(Int32, BytesView)],
  limits : @model.Limits,
) -> TableSet raise @model.Refused {
  let sorted = tables.copy()
  for i in 1..<sorted.length() {
    let key = sorted[i]
    let mut j = i - 1
    while j >= 0 && sorted[j].0 > key.0 {
      sorted[j + 1] = sorted[j]
      j -= 1
    }
    sorted[j + 1] = key
  }
  let writer = @wire.Writer::new()
  let tags : Array[Int32] = []
  let offsets : Array[Int32] = []
  let lengths : Array[Int32] = []
  for entry in sorted {
    let (tag, data) = entry
    limits.check_table(data.length())
    writer.align(4)
    offsets.push(writer.length())
    lengths.push(data.length())
    tags.push(tag)
    writer.bytes(data)
  }
  { scaler, bytes: writer.to_bytes()[:], tags, offsets, lengths, }
}

///|
/// One buffer assembled from the tables of several faces, so that a collection
/// shares the tables its faces have in common. Returns one `TableSet` per face,
/// all pointing into the same buffer.
pub fn assemble_collection(
  scaler : Int32,
  faces : Array[Array[(Int32, BytesView)]],
  limits : @model.Limits,
) -> Array[TableSet] raise @model.Refused {
  // First pass: assign every distinct table a slot. A table is distinct when
  // no slot already holds the same tag and the same bytes.
  let slots : Array[(Int32, BytesView)] = []
  let per_face : Array[Array[Int32]] = []
  for face in faces {
    let indexes : Array[Int32] = []
    for entry in face {
      let mut found = -1
      for i in 0..<slots.length() {
        if slots[i].0 == entry.0 && same_bytes(slots[i].1, entry.1) {
          found = i
          break
        }
      }
      if found < 0 {
        found = slots.length()
        slots.push(entry)
      }
      indexes.push(found)
    }
    per_face.push(indexes)
  }
  // Second pass: lay the slots out once, four-byte aligned.
  let writer = @wire.Writer::new()
  let slot_offsets : Array[Int32] = []
  for slot in slots {
    limits.check_table(slot.1.length())
    writer.align(4)
    slot_offsets.push(writer.length())
    writer.bytes(slot.1)
  }
  let bytes = writer.to_bytes()[:]
  let sets : Array[TableSet] = []
  for i in 0..<faces.length() {
    let tags : Array[Int32] = []
    let offsets : Array[Int32] = []
    let lengths : Array[Int32] = []
    for k in 0..<faces[i].length() {
      let slot = per_face[i][k]
      tags.push(slots[slot].0)
      offsets.push(slot_offsets[slot])
      lengths.push(slots[slot].1.length())
    }
    let order = sort_order(tags)
    let sorted_tags : Array[Int32] = []
    let sorted_offsets : Array[Int32] = []
    let sorted_lengths : Array[Int32] = []
    for k in order {
      sorted_tags.push(tags[k])
      sorted_offsets.push(offsets[k])
      sorted_lengths.push(lengths[k])
    }
    sets.push({
      scaler,
      bytes,
      tags: sorted_tags,
      offsets: sorted_offsets,
      lengths: sorted_lengths,
    })
  }
  sets
}

///|
fn same_bytes(a : BytesView, b : BytesView) -> Bool {
  if a.length() != b.length() {
    return false
  }
  for i in 0..<a.length() {
    if a[i] != b[i] {
      return false
    }
  }
  true
}

///|
/// The permutation that puts the tags of one face in order.
fn sort_order(tags : Array[Int32]) -> Array[Int32] {
  let order : Array[Int32] = []
  for i in 0..<tags.length() {
    order.push(i)
  }
  for i in 1..<order.length() {
    let key = order[i]
    let mut j = i - 1
    while j >= 0 && tags[order[j]] > tags[key] {
      order[j + 1] = order[j]
      j -= 1
    }
    order[j + 1] = key
  }
  order
}
