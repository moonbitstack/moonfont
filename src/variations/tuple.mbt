// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The tuple variation store: the encoding `gvar` and `cvar` share. A store is a
// run of tuples, each naming a region of the design space and carrying deltas
// for the points it names; how many values a point has, and what they mean, is
// the caller's business.
//
// Keeping the encoding in one file is what makes a third table with the same
// shape cheap: a reader of the bytes above only has to supply the point count
// and say what to do with the values.

///|
/// A run of bytes with a moving position, so a tuple's header, its point
/// numbers and its deltas can follow one another.
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
/// The peaks a tuple may share, as `axis_count` F2Dot14 values each. A `gvar`
/// table has them; a `cvar` table does not.
priv struct SharedTuples {
  data : BytesView
  at : Int32
  count : Int32
  axis_count : Int32
}

///|
fn SharedTuples::peak(
  self : SharedTuples,
  index : Int32,
  axis : Int32,
) -> Int32 raise @model.Refused {
  if index < 0 || index >= self.count {
    raise @model.Malformed(at=self.at, got="a tuple naming region \{index}")
  }
  let at = self.at + index * self.axis_count * 2 + axis * 2
  if at < 0 || at + 2 > self.data.length() {
    raise @model.Truncated(at~, want=2)
  }
  let value = (self.data[at].to_int() << 8) | self.data[at + 1].to_int()
  if value >= 0x8000 {
    value - 0x10000
  } else {
    value
  }
}

///|
/// What one tuple header says about the tuple that follows it.
priv struct TupleRegion {
  /// The size of this tuple's data: its point numbers and deltas, excluding the
  /// four-byte header itself.
  size : Int32
  /// Its scalar at the location, 1.0 being 16384.
  scalar : Int32
  /// Whether it carries its own point numbers instead of the shared array.
  private_points : Bool
}

///|
/// Read one tuple header: its region, its scalar at the location, and where its
/// data ends. A tuple whose peak sits outside its own start and end is
/// malformed; the format says such a tuple contributes nothing, so it is
/// reported as a zero scalar rather than refused.
fn read_tuple_region(
  header : Packed,
  axis_count : Int32,
  shared : SharedTuples?,
  normalised : Array[Int32],
) -> TupleRegion raise @model.Refused {
  let size = header.u16()
  let index = header.u16()
  let embedded_peak = (index & 0x8000) != 0
  let intermediate = (index & 0x4000) != 0
  let private_points = (index & 0x2000) != 0
  let shared_index = index & 0x0FFF
  let peak : Array[Int32] = []
  let start : Array[Int32] = []
  let finish : Array[Int32] = []
  for _ in 0..<axis_count {
    start.push(0)
    finish.push(0)
  }
  if embedded_peak {
    for _ in 0..<axis_count {
      peak.push(header.i16())
    }
  } else {
    let table = match shared {
      Some(table) => table
      None =>
        raise @model.Malformed(
          at=header.position(),
          got="a tuple naming a shared peak in a table that has none",
        )
    }
    for axis in 0..<axis_count {
      peak.push(table.peak(shared_index, axis))
    }
  }
  if intermediate {
    for axis in 0..<axis_count {
      start[axis] = header.i16()
    }
    for axis in 0..<axis_count {
      finish[axis] = header.i16()
    }
  } else {
    for axis in 0..<axis_count {
      start[axis] = if peak[axis] < 0 { peak[axis] } else { 0 }
      finish[axis] = if peak[axis] > 0 { peak[axis] } else { 0 }
    }
  }
  {
    size,
    scalar: tuple_scalar(peak, start, finish, normalised, axis_count),
    private_points,
  }
}

///|
/// The point numbers a tuple names. The first byte is either zero, meaning
/// every point, or the count of numbers that follow, in runs whose width the
/// control byte selects.
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
          got="a point number past the declared count",
        )
      }
      points.push(value)
    }
  }
  points
}

///|
/// One run of deltas, read as runs of zeroes, bytes or words.
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
/// start and end is malformed and contributes nothing.
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
      @wire.div_round(
        (value - lower).to_int64() * 16384,
        (peak_value - lower).to_int64(),
      )
    } else {
      @wire.div_round(
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
    @wire.div_round(
      (value - low).to_int64() * (high_delta - low_delta).to_int64(),
      (high - low).to_int64(),
    )
  }
}
