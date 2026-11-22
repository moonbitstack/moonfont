// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// `cvar` varies the control value table. A hinted renderer reads `cvt ` values
// as distances to snap stems to, and a variable font whose stem widths change
// says so by moving those values; a caller that hints has to see them move with
// the location, or its snapped stems stay at the default width at every weight.
//
// The encoding is the tuple variation store `gvar` also uses, one delta per CVT
// value instead of a pair per glyph point, with no shared peaks and no
// interpolation between the values a tuple omits: a CVT entry is a number, not
// a point on a curve, so there is nothing to interpolate along.

///|
/// The `cvar` table.
pub(all) struct Cvar {
  data : BytesView
  axis_count : Int32
  tuple_count : Int32
  data_at : Int32
  shared_points : Bool
}

///|
pub fn Cvar::parse(
  cursor : @wire.Cursor,
  axis_count : Int32,
  limits : @model.Limits,
) -> Cvar raise @model.Refused {
  let data = cursor.all()
  cursor.seek(0)
  let major = cursor.u16()
  let minor = cursor.u16()
  if major != 1 {
    raise @model.Unsupported(at=0, got="cvar version \{major}.\{minor}")
  }
  let count_and_flags = cursor.u16()
  let data_at = cursor.u16()
  let tuple_count = count_and_flags & 0x0FFF
  limits.check_glyphs(tuple_count)
  if data_at > data.length() {
    raise @model.Truncated(at=data_at, want=0)
  }
  {
    data,
    axis_count,
    tuple_count,
    data_at,
    shared_points: (count_and_flags & 0x8000) != 0,
  }
}

///|
/// The delta of every control value at a normalised location, in font units.
/// The result has one entry per value of `cvt `; values no tuple names keep
/// zero, which is what the format means by leaving them out.
pub fn Cvar::deltas(
  self : Cvar,
  point_count : Int32,
  normalised : Array[Int32],
) -> Array[Int32] raise @model.Refused {
  let out : Array[Int32] = []
  for _ in 0..<point_count {
    out.push(0)
  }
  if point_count <= 0 || self.tuple_count <= 0 {
    return out
  }
  let header = Packed::new(self.data, 4)
  let body = Packed::new(self.data, self.data_at)
  let shared = if self.shared_points {
    Some(read_points(body, point_count))
  } else {
    None
  }
  for _ in 0..<self.tuple_count {
    let region = read_tuple_region(header, self.axis_count, None, normalised)
    if region.scalar == 0 {
      body.advance(region.size)
      continue
    }
    let points = if region.private_points {
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
    let values = read_deltas(body, points.length())
    body.advance(region.size)
    for i in 0..<points.length() {
      let point = points[i]
      if point >= 0 && point < point_count {
        out[point] += scale_f2dot14(values[i], region.scalar)
      }
    }
  }
  out
}
