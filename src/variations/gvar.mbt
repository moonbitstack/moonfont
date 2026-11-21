// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// `gvar` holds one tuple variation store per glyph: a set of regions in the
// design space and, for each, the point deltas that region moves. Points a
// tuple does not name are inferred from their neighbours inside the same
// contour, which is what makes a sparse delta set look like a smooth outline.
//
// The eleven steps from bytes to per-point deltas live here so the outline and
// metric layers only see integers.

///|
/// The `gvar` table, read on demand. Glyph variation data is never decoded at
/// load time: a caller that stays at the default instance never pays for it.
#derive(Debug)
pub(all) struct Gvar {
  data : BytesView
  axis_count : Int32
  shared_tuples : Int32
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
  let shared_tuple_count = cursor.u16()
  let shared_tuples = cursor.u32()
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
  if shared_tuple_count > 0 &&
    shared_tuples + shared_tuple_count * axis_count * 2 > data.length() {
    raise @model.Truncated(
      at=shared_tuples,
      want=shared_tuple_count * axis_count * 2,
    )
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
    shared_tuples,
    glyph_count: count,
    offsets,
    offset_to_data,
  }
}

///|
/// One run of `count` integers packed into bytes, with the position kept so a
/// tuple's point list and its deltas can follow one another.
priv struct Packed {
  data : BytesView
  /// Shared, because a reader hands the same run to several helpers and each
  /// must leave the cursor where it stopped.
  pos : Ref[Int32]
}

///|
fn Packed::new(data : BytesView, pos : Int32) -> Packed {
  { data, pos: Ref(pos), }
}

///|
fn Packed::position(self : Packed) -> Int32 {
  self.pos.val
}

///|
fn Packed::advance(self : Packed, count : Int32) -> Unit {
  self.pos.val += count
}

///|
fn Packed::byte(self : Packed) -> Int32 raise @model.Refused {
  let at = self.pos.val
  if at < 0 || at >= self.data.length() {
    raise @model.Truncated(at~, want=1)
  }
  let value = self.data[at].to_int()
  self.pos.val = at + 1
  value
}

///|
fn Packed::u16(self : Packed) -> Int32 raise @model.Refused {
  let high = self.byte()
  let low = self.byte()
  (high << 8) | low
}

///|
fn Packed::i16(self : Packed) -> Int32 raise @model.Refused {
  let value = self.u16()
  if value >= 0x8000 {
    value - 0x10000
  } else {
    value
  }
}

///|
/// The point numbers a tuple names. The first byte is either zero, meaning
/// every point of the glyph, or the count of numbers that follow, in runs whose
/// width the control byte selects.
fn read_points(
  packed : Packed,
  point_count : Int32,
) -> Array[Int32] raise @model.Refused {
  let first = packed.byte()
  if first == 0 {
    let all : Array[Int32] = []
    for i in 0..<point_count {
      all.push(i)
    }
    return all
  }
  let mut count = first
  if (first & 0x80) != 0 {
    count = ((first & 0x7F) << 8) | packed.byte()
  }
  if count <= 0 || count > point_count {
    raise @model.Malformed(
      at=packed.position(),
      got="a tuple naming \{count} points",
    )
  }
  let points : Array[Int32] = []
  let mut value = 0
  while points.length() < count {
    let control = packed.byte()
    let run = (control & 0x7F) + 1
    if points.length() + run > count {
      raise @model.Malformed(
        at=packed.position(),
        got="a point run past the declared count",
      )
    }
    for _ in 0..<run {
      let step = if (control & 0x80) != 0 {
        packed.u16()
      } else {
        packed.byte()
      }
      value += step
      if value < 0 || value >= point_count {
        raise @model.Malformed(
          at=packed.position(),
          got="a point number past the glyph",
        )
      }
      points.push(value)
    }
  }
  points
}

///|
/// One tuple's deltas, read as runs of zeroes, bytes or words. The x deltas
/// come first for every named point, then the y deltas.
fn read_deltas(
  packed : Packed,
  count : Int32,
) -> Array[Int32] raise @model.Refused {
  let values : Array[Int32] = []
  while values.length() < count {
    let control = packed.byte()
    let run = (control & 0x3F) + 1
    if values.length() + run > count {
      raise @model.Malformed(
        at=packed.position(),
        got="a delta run past the declared count",
      )
    }
    if (control & 0x80) != 0 {
      for _ in 0..<run {
        values.push(0)
      }
    } else if (control & 0x40) != 0 {
      for _ in 0..<run {
        values.push(packed.i16())
      }
    } else {
      for _ in 0..<run {
        let byte = packed.byte()
        values.push(if byte >= 0x80 { byte - 0x100 } else { byte })
      }
    }
  }
  values
}

///|
/// The F2Dot14 scalar of one tuple at a location, 1.0 being 16384. A peak of
/// zero on an axis means the axis does not take part; a peak outside its own
/// start and end is a malformed tuple and contributes nothing.
fn tuple_scalar(
  peak : Array[Int32],
  start : Array[Int32],
  end : Array[Int32],
  coords : Array[Int32],
  axis_count : Int32,
) -> Int32 {
  let mut scalar : Int64 = 16384
  for axis in 0..<axis_count {
    let peak_value = peak[axis]
    if peak_value == 0 {
      continue
    }
    let lower = start[axis]
    let upper = end[axis]
    if lower > peak_value || peak_value > upper {
      continue
    }
    if lower < 0 && upper > 0 {
      continue
    }
    let value = if axis < coords.length() { coords[axis] } else { 0 }
    if value == peak_value {
      continue
    }
    if value <= lower || upper <= value {
      return 0
    }
    let factor = if value < peak_value {
      div_round(
        (value - lower).to_int64() * 16384,
        (peak_value - lower).to_int64(),
      )
    } else {
      div_round(
        (value - upper).to_int64() * 16384,
        (peak_value - upper).to_int64(),
      )
    }
    scalar = scalar * factor.to_int64() / 16384
  }
  scalar.to_int()
}

///|
/// Interpolate the deltas a tuple left implicit inside one contour. The ends of
/// the contour wrap around: the run before the first touched point is
/// interpolated from the last touched point back to the first.
fn iup_contour(
  dx : Array[Int32],
  dy : Array[Int32],
  touched : Array[Bool],
  coords : Array[(Int32, Int32)],
  from : Int32,
  to : Int32,
) -> Unit {
  let n = to - from
  if n <= 0 {
    return
  }
  let xs : Array[Int32] = []
  let ys : Array[Int32] = []
  let out_x : Array[Int32] = []
  let out_y : Array[Int32] = []
  let indices : Array[Int32] = []
  for i in 0..<n {
    let (x, y) = coords[from + i]
    xs.push(x)
    ys.push(y)
    out_x.push(dx[from + i])
    out_y.push(dy[from + i])
    if touched[from + i] {
      indices.push(i)
    }
  }
  if indices.length() == 0 || indices.length() == n {
    return
  }
  let last = indices[indices.length() - 1]
  // The segment that wraps around the start of the contour.
  if indices[0] != 0 {
    iup_segment(xs, ys, out_x, out_y, 0, indices[0], indices[0], last)
  }
  for k in 0..<indices.length() {
    let start = indices[k]
    if k + 1 < indices.length() {
      let end = indices[k + 1]
      if end - start > 1 {
        iup_segment(xs, ys, out_x, out_y, start + 1, end, start, end)
      }
    }
  }
  if last != n - 1 {
    iup_segment(xs, ys, out_x, out_y, last + 1, n, last, indices[0])
  }
  for i in 0..<n {
    dx[from + i] = out_x[i]
    dy[from + i] = out_y[i]
  }
}

///|
/// Fill `[from, to)` with deltas interpolated between two referenced points of
/// the same contour, one axis at a time.
fn iup_segment(
  xs : Array[Int32],
  ys : Array[Int32],
  out_x : Array[Int32],
  out_y : Array[Int32],
  from : Int32,
  to : Int32,
  ref1 : Int32,
  ref2 : Int32,
) -> Unit {
  for i in from..<to {
    out_x[i] = interpolate(xs[i], xs[ref1], xs[ref2], out_x[ref1], out_x[ref2])
    out_y[i] = interpolate(ys[i], ys[ref1], ys[ref2], out_y[ref1], out_y[ref2])
  }
}

///|
fn interpolate(
  value : Int32,
  a : Int32,
  b : Int32,
  da : Int32,
  db : Int32,
) -> Int32 {
  if a == b {
    return if da == db { da } else { 0 }
  }
  let (low, high, low_delta, high_delta) = if a < b {
    (a, b, da, db)
  } else {
    (b, a, db, da)
  }
  if value <= low {
    low_delta
  } else if value >= high {
    high_delta
  } else {
    low_delta +
    div_round(
      (value - low).to_int64() * (high_delta - low_delta).to_int64(),
      (high - low).to_int64(),
    )
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
  // A shared point array, when the count word says so, sits at the start of
  // the serialised data and every tuple's deltas follow it.
  let shared = if has_shared_points {
    Some(read_points(tuple_data, point_count))
  } else {
    None
  }
  for _ in 0..<tuple_count {
    let size = tuple_header.u16()
    let tuple_index = tuple_header.u16()
    let embedded_peak = (tuple_index & 0x8000) != 0
    let intermediate = (tuple_index & 0x4000) != 0
    let private_points = (tuple_index & 0x2000) != 0
    let shared_index = tuple_index & 0x0FFF
    let peak : Array[Int32] = []
    let start : Array[Int32] = []
    let finish : Array[Int32] = []
    for _ in 0..<self.axis_count {
      start.push(0)
      finish.push(0)
    }
    if embedded_peak {
      for _ in 0..<self.axis_count {
        peak.push(tuple_header.i16())
      }
    } else {
      for axis in 0..<self.axis_count {
        let at = self.shared_tuples +
          shared_index * self.axis_count * 2 +
          axis * 2
        if at < 0 || at + 2 > self.data.length() {
          raise @model.Truncated(at~, want=2)
        }
        peak.push(
          {
            let value = (self.data[at].to_int() << 8) |
              self.data[at + 1].to_int()
            if value >= 0x8000 {
              value - 0x10000
            } else {
              value
            }
          },
        )
      }
    }
    if intermediate {
      for axis in 0..<self.axis_count {
        start[axis] = tuple_header.i16()
      }
      for axis in 0..<self.axis_count {
        finish[axis] = tuple_header.i16()
      }
    } else {
      for axis in 0..<self.axis_count {
        start[axis] = if peak[axis] < 0 { peak[axis] } else { 0 }
        finish[axis] = if peak[axis] > 0 { peak[axis] } else { 0 }
      }
    }
    let scalar = tuple_scalar(peak, start, finish, normalised, self.axis_count)
    if scalar == 0 {
      tuple_data.advance(size)
      continue
    }
    let body = tuple_data
    let points = if private_points {
      read_points(body, point_count)
    } else {
      match shared {
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
    let xs = read_deltas(body, points.length())
    let ys = read_deltas(body, points.length())
    tuple_data.advance(size)
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
      dx[i] += scale_f2dot14(local_dx[i], scalar)
      dy[i] += scale_f2dot14(local_dy[i], scalar)
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
