// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// `avar` bends the linear mapping from user space to normalised space so that
// a design can make its axes feel even. It is a segment map per axis: pairs of
// F2Dot14 points, sorted by input, applied piecewise linearly after `fvar` has
// normalised the coordinate.

///|
/// The per-axis segment maps.
#derive(Eq, Debug)
pub(all) struct Avar {
  maps : Array[Array[(Int32, Int32)]]
}

///|
pub fn Avar::parse(
  cursor : @wire.Cursor,
  axis_count : Int32,
  limits : @model.Limits,
) -> Avar raise @model.Refused {
  cursor.seek(0)
  let major = cursor.u16()
  let minor = cursor.u16()
  if major != 1 {
    raise @model.Unsupported(at=0, got="avar version \{major}.\{minor}")
  }
  cursor.skip(2)
  let count = cursor.u16()
  if count != axis_count {
    raise @model.Malformed(
      at=6,
      got="an avar table with \{count} axes beside \{axis_count}",
    )
  }
  limits.check_glyphs(count)
  let maps : Array[Array[(Int32, Int32)]] = []
  for _ in 0..<count {
    let pairs = cursor.u16()
    let map : Array[(Int32, Int32)] = []
    for _ in 0..<pairs {
      let from = cursor.i16()
      let to = cursor.i16()
      map.push((from, to))
    }
    maps.push(map)
  }
  { maps, }
}

///|
/// Apply the segment map of one axis. A coordinate outside the first and last
/// pair keeps its distance from that pair's output, which is how `avar` extends
/// a map past its own ends. An empty map is the identity.
pub fn Avar::map_axis(self : Avar, axis : Int32, value : Int32) -> Int32 {
  if axis < 0 || axis >= self.maps.length() {
    return value
  }
  let map = self.maps[axis]
  if map.length() == 0 {
    return value
  }
  let (first_from, first_to) = map[0]
  if value <= first_from {
    return value - first_from + first_to
  }
  let (last_from, last_to) = map[map.length() - 1]
  if value >= last_from {
    return value - last_from + last_to
  }
  for i in 1..<map.length() {
    let (from, to) = map[i]
    if value <= from {
      let (before_from, before_to) = map[i - 1]
      if from == before_from {
        return to
      }
      let step = (value - before_from).to_int64() * (to - before_to).to_int64()
      return before_to + div_round(step, (from - before_from).to_int64())
    }
  }
  value
}
