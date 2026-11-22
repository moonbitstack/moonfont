// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// `gvar` holds one tuple variation store per glyph: a set of regions in the
// design space and, for each, the point deltas that region moves. Points a
// tuple does not name are inferred from their neighbours inside the same
// contour, which is what makes a sparse delta set look like a smooth outline.
//
// The store's encoding is in `tuple.mbt`, shared with `cvar`; this file adds
// what is specific to glyphs: where each glyph's store starts and the four
// phantom points the metrics are read from.

///|
/// The `gvar` table, read on demand. Glyph variation data is never decoded at
/// load time: a caller that stays at the default instance never pays for it.
pub struct Gvar {
  data : BytesView
  axis_count : Int32
  /// Where the shared peaks start, and how many there are.
  shared_at : Int32
  shared_count : Int32
  glyph_count : Int32
  /// One offset per glyph boundary, relative to `offset_to_data`.
  offsets : Array[Int32]
  offset_to_data : Int32
}

///|
pub fn Gvar::parse(
  cursor : @wire.Cursor,
  glyph_count : Int32,
  limits : @model.Limits,
) -> Gvar raise @model.Refused {
  let data = cursor.all()
  cursor.seek(0)
  let major = cursor.u16()
  let minor = cursor.u16()
  if major != 1 {
    raise @model.Unsupported(at=0, got="gvar version \{major}.\{minor}")
  }
  let axis_count = cursor.u16()
  let shared_count = cursor.u16()
  let shared_at = cursor.u32()
  let count = cursor.u16()
  let flags = cursor.u16()
  let offset_to_data = cursor.u32()
  if count != glyph_count {
    raise @model.Malformed(
      at=12,
      got="a gvar table with \{count} glyphs beside \{glyph_count}",
    )
  }
  limits.check_glyphs(axis_count)
  if shared_count > 0 &&
    shared_at + shared_count * axis_count * 2 > data.length() {
    raise @model.Truncated(at=shared_at, want=shared_count * axis_count * 2)
  }
  let long_offsets = (flags & 0x0001) != 0
  let offsets : Array[Int32] = []
  for _ in 0..<(count + 1) {
    let value = if long_offsets { cursor.u32() } else { cursor.u16() * 2 }
    if value < 0 ||
      (offsets.length() > 0 && value < offsets[offsets.length() - 1]) {
      raise @model.Malformed(
        at=cursor.position(),
        got="a gvar offset going backwards",
      )
    }
    offsets.push(value)
  }
  {
    data,
    axis_count,
    shared_at,
    shared_count,
    glyph_count: count,
    offsets,
    offset_to_data,
  }
}

///|
/// Per-point deltas of one glyph at a normalised location, in font units.
/// `point_count` includes the four phantom points the metrics use; `ends` are
/// the last point index of each contour, and for a composite glyph they are the
/// component indices, so a component's offset moves as its own one-point
/// contour.
pub fn Gvar::deltas(
  self : Gvar,
  glyph : Int32,
  point_count : Int32,
  ends : Array[Int32],
  coords : Array[(Int32, Int32)],
  normalised : Array[Int32],
) -> Array[(Int32, Int32)] raise @model.Refused {
  let dx : Array[Int32] = []
  let dy : Array[Int32] = []
  for _ in 0..<point_count {
    dx.push(0)
    dy.push(0)
  }
  if point_count <= 0 || glyph < 0 || glyph + 1 >= self.offsets.length() {
    return zip_deltas(dx, dy)
  }
  let begin = self.offsets[glyph]
  let end = self.offsets[glyph + 1]
  if begin == end {
    return zip_deltas(dx, dy)
  }
  let base = self.offset_to_data + begin
  if base < 0 || base + 4 > self.data.length() {
    raise @model.Truncated(at=base, want=4)
  }
  let header = Packed::new(self.data, base)
  let count_and_flags = header.u16()
  let tuple_count = count_and_flags & 0x0FFF
  let has_shared_points = (count_and_flags & 0x8000) != 0
  let data_offset = header.u16()
  let tuple_header = Packed::new(self.data, base + 4)
  let tuple_data = Packed::new(self.data, base + data_offset)
  let shared_peaks : SharedTuples? = if self.shared_count > 0 {
    Some({
      data: self.data,
      at: self.shared_at,
      count: self.shared_count,
      axis_count: self.axis_count,
    })
  } else {
    None
  }
  // A shared point array, when the count word says so, sits at the start of
  // the serialised data and every tuple's deltas follow it.
  let shared_points = if has_shared_points {
    Some(read_points(tuple_data, point_count))
  } else {
    None
  }
  for _ in 0..<tuple_count {
    let region = read_tuple_region(
      tuple_header,
      self.axis_count,
      shared_peaks,
      normalised,
    )
    if region.scalar == 0 {
      tuple_data.advance(region.size)
      continue
    }
    let points = if region.private_points {
      read_points(tuple_data, point_count)
    } else {
      match shared_points {
        Some(list) => list
        None => {
          let all : Array[Int32] = []
          for i in 0..<point_count {
            all.push(i)
          }
          all
        }
      }
    }
    let xs = read_deltas(tuple_data, points.length())
    let ys = read_deltas(tuple_data, points.length())
    tuple_data.advance(region.size)
    let local_dx : Array[Int32] = []
    let local_dy : Array[Int32] = []
    let touched : Array[Bool] = []
    for _ in 0..<point_count {
      local_dx.push(0)
      local_dy.push(0)
      touched.push(false)
    }
    for i in 0..<points.length() {
      let point = points[i]
      local_dx[point] = xs[i]
      local_dy[point] = ys[i]
      touched[point] = true
    }
    if points.length() < point_count && ends.length() > 0 {
      let mut from = 0
      for contour_end in ends {
        let to = contour_end + 1
        if to > from && to <= point_count - 4 {
          iup_contour(local_dx, local_dy, touched, coords, from, to)
        }
        from = to
      }
      // The four phantom points are contours of their own and never
      // interpolate, so nothing is left to fill in for them.
    }
    for i in 0..<point_count {
      dx[i] += scale_f2dot14(local_dx[i], region.scalar)
      dy[i] += scale_f2dot14(local_dy[i], region.scalar)
    }
  }
  zip_deltas(dx, dy)
}

///|
fn zip_deltas(dx : Array[Int32], dy : Array[Int32]) -> Array[(Int32, Int32)] {
  let out : Array[(Int32, Int32)] = []
  for i in 0..<dx.length() {
    out.push((dx[i], dy[i]))
  }
  out
}
