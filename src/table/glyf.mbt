// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The `glyf` table holds geometry, not paths. This decoder produces points,
// contour boundaries and the on-curve bit for each point; turning those into
// move/line/curve commands is the outline layer's job. Keeping the two apart
// means a caller that wants tessellation, an SDF or SVG never has to undo a
// decision this layer made for rasterisation.

///|
pub(all) enum GlyphData {
  Empty
  Simple(SimpleGlyph)
  Composite(CompositeGlyph)
}

///|
pub(all) struct SimpleGlyph {
  /// The index of the last point of each contour.
  end_points : Array[Int32]
  points : Array[@model.Point]
  on_curve : Array[Bool]
  bounds : @model.Bounds
}

///|
/// One reference in a composite glyph. `a`, `b`, `c` and `d` are F2Dot14
/// values (16384 is 1.0); `dx` and `dy` are in font units.
pub(all) struct Component {
  glyph_index : Int32
  dx : Int32
  dy : Int32
  a : Int32
  b : Int32
  c : Int32
  d : Int32
}

///|
pub(all) struct CompositeGlyph {
  components : Array[Component]
  bounds : @model.Bounds
}

///|
/// Flags are run-length encoded with a repeat byte. A repeat that walks past
/// the declared point count is clipped rather than trusted.
fn read_flags(
  cursor : @wire.Cursor,
  count : Int32,
) -> Array[Int32] raise @model.Refused {
  let flags : Array[Int32] = []
  while flags.length() < count {
    let flag = cursor.u8()
    flags.push(flag)
    if (flag & 0x08) != 0 {
      let repeats = cursor.u8()
      if flags.length() + repeats > count {
        raise @model.Malformed(
          at=cursor.position(),
          got="a repeat flag past the declared point count",
        )
      }
      for _ in 0..<repeats {
        flags.push(flag)
      }
    }
  }
  flags
}

///|
/// Deltas are stored as either a signed 16-bit value, a one-byte magnitude
/// with an explicit sign bit, or nothing at all when the coordinate repeats.
fn read_coords(
  cursor : @wire.Cursor,
  flags : Array[Int32],
  x_axis : Bool,
) -> Array[Int32] raise @model.Refused {
  let short_bit = if x_axis { 0x02 } else { 0x04 }
  let same_bit = if x_axis { 0x10 } else { 0x20 }
  let values : Array[Int32] = []
  let mut value = 0
  for i in 0..<flags.length() {
    let flag = flags[i]
    if (flag & short_bit) != 0 {
      let delta = cursor.u8()
      if (flag & same_bit) != 0 {
        value += delta
      } else {
        value -= delta
      }
    } else if (flag & same_bit) == 0 {
      value += cursor.i16()
    }
    values.push(value)
  }
  values
}

///|
fn parse_composite(
  cursor : @wire.Cursor,
  bounds : @model.Bounds,
  limits : @model.Limits,
) -> CompositeGlyph raise @model.Refused {
  let components : Array[Component] = []
  let mut more = true
  let mut last_flags = 0
  while more {
    let flags = cursor.u16()
    last_flags = flags
    let glyph_index = cursor.u16()
    let has_words = (flags & 0x0001) != 0
    let is_xy = (flags & 0x0002) != 0
    let arg1 = if has_words { cursor.i16() } else { cursor.i8() }
    let arg2 = if has_words { cursor.i16() } else { cursor.i8() }
    if is_xy {
      // Point-matching components need the parent outline's points, which is
      // an outline-layer concern and is refused explicitly rather than
      // silently misplaced.
    } else {
      raise @model.Unsupported(
        at=cursor.position(),
        got="point-matching composite components",
      )
    }
    let mut a = 16384
    let mut b = 0
    let mut c = 0
    let mut d = 16384
    if (flags & 0x0008) != 0 {
      a = cursor.i16()
      d = a
    } else if (flags & 0x0040) != 0 {
      a = cursor.i16()
      d = cursor.i16()
    } else if (flags & 0x0080) != 0 {
      a = cursor.i16()
      b = cursor.i16()
      c = cursor.i16()
      d = cursor.i16()
    }
    components.push({ glyph_index, dx: arg1, dy: arg2, a, b, c, d, })
    limits.check_composites(components.length())
    more = (flags & 0x0020) != 0
  }
  if (last_flags & 0x0100) != 0 {
    let instructions = cursor.u16()
    cursor.skip(instructions)
  }
  { components, bounds, }
}

///|
/// Decode one glyph's bytes. An empty range is a space or an empty glyph, not
/// an error: asking for its outline yields no commands and asking for its mask
/// yields a zero-sized mask.
pub fn GlyphData::parse(
  view : BytesView,
  limits : @model.Limits,
) -> GlyphData raise @model.Refused {
  if view.length() == 0 {
    return Empty
  }
  let cursor = @wire.Cursor::new(view)
  let contours = cursor.i16()
  let x_min = cursor.i16()
  let y_min = cursor.i16()
  let x_max = cursor.i16()
  let y_max = cursor.i16()
  let bounds : @model.Bounds = { x_min, y_min, x_max, y_max, }
  if contours == 0 {
    return Empty
  }
  if contours < 0 {
    return Composite(parse_composite(cursor, bounds, limits))
  }
  // The contour ceiling is checked before reading the endpoint array, so a
  // font that declares too many contours is refused as OverLimit rather than
  // as a truncated read halfway through that array.
  limits.check_outline(0, contours)
  let end_points : Array[Int32] = []
  for _ in 0..<contours {
    end_points.push(cursor.u16())
  }
  let point_count = end_points[contours - 1] + 1
  limits.check_outline(point_count, contours)
  if point_count <= 0 {
    return Empty
  }
  let mut previous = -1
  for i in 0..<contours {
    if end_points[i] <= previous {
      raise @model.Malformed(
        at=10 + i * 2,
        got="contour endpoints that do not increase",
      )
    }
    previous = end_points[i]
  }
  let instructions = cursor.u16()
  cursor.skip(instructions)
  // Every point needs at least one flag byte. This catches a contour count
  // that consumed the coordinate data as endpoints.
  if point_count > cursor.left() {
    raise @model.Malformed(
      at=cursor.position(),
      got="more points than bytes remain in the glyph",
    )
  }
  let flags = read_flags(cursor, point_count)
  let xs = read_coords(cursor, flags, true)
  let ys = read_coords(cursor, flags, false)
  let points : Array[@model.Point] = []
  let on_curve : Array[Bool] = []
  for i in 0..<point_count {
    points.push(@model.Point::of(xs[i], ys[i]))
    on_curve.push((flags[i] & 0x01) != 0)
  }
  Simple({ end_points, points, on_curve, bounds, })
}
