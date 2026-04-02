// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// Eight vertical subsamples with exact horizontal area, entirely in 26.6 fixed
// point. There is deliberately no floating point anywhere in this file: a
// rasteriser that computed in Float would return different coverage on wasm,
// js and native for the same bytes, and no differential test could then say
// what the right answer was. Integer arithmetic makes the mask a function of
// the input alone.

///|
priv struct Edge {
  x0 : Int64
  y0 : Int64
  x1 : Int64
  y1 : Int64
  dir : Int32
}

///|
fn abs64(value : Int64) -> Int64 {
  if value < 0 {
    -value
  } else {
    value
  }
}

///|
fn floor_div(value : Int64, unit : Int64) -> Int32 {
  let quotient = value / unit
  let remainder = value % unit
  (if remainder < 0 { quotient - 1 } else { quotient }).to_int()
}

///|
fn ceil_div(value : Int64, unit : Int64) -> Int32 {
  let quotient = value / unit
  let remainder = value % unit
  (if remainder > 0 { quotient + 1 } else { quotient }).to_int()
}

///|
fn clamp(value : Int32, low : Int32, high : Int32) -> Int32 {
  if value < low {
    low
  } else if value > high {
    high
  } else {
    value
  }
}

///|
/// Font units, y-up, to 26.6 pixels, y-down.
fn to_screen(point : @model.Point, scale : @model.Scale) -> (Int64, Int64) {
  (scale.apply(point.x).to_int64(), (-scale.apply(point.y)).to_int64())
}

///|
fn add_edge(
  edges : Array[Edge],
  from : (Int64, Int64),
  to : (Int64, Int64),
) -> Unit {
  let (x0, y0) = from
  let (x1, y1) = to
  if y0 == y1 {
    return
  }
  // In screen coordinates y grows downwards, so an edge travelling upwards
  // contributes +1 to the non-zero winding count.
  let dir = if y0 > y1 { 1 } else { -1 }
  edges.push({ x0, y0, x1, y1, dir, })
}

///|
/// The number of line segments a curve is broken into. Two pixels of chord per
/// segment keeps the error below one subsample at any size, and the ceiling
/// keeps a pathological curve from doing unbounded work.
fn curve_steps(span : Int64) -> Int32 {
  let steps = (span / 128).to_int() + 1
  clamp(steps, 1, 64)
}

///|
fn curve_span(
  a : (Int64, Int64),
  b : (Int64, Int64),
  c : (Int64, Int64),
) -> Int64 {
  let (ax, ay) = a
  let (bx, by) = b
  let (cx, cy) = c
  let mut span = abs64(bx - ax)
  if abs64(by - ay) > span {
    span = abs64(by - ay)
  }
  if abs64(cx - bx) > span {
    span = abs64(cx - bx)
  }
  if abs64(cy - by) > span {
    span = abs64(cy - by)
  }
  if abs64(cx - ax) > span {
    span = abs64(cx - ax)
  }
  if abs64(cy - ay) > span {
    span = abs64(cy - ay)
  }
  span
}

///|
fn flatten(outline : @model.Outline, scale : @model.Scale) -> Array[Edge] {
  let edges : Array[Edge] = []
  let commands = outline.commands()
  let zero : Int64 = 0
  let mut current : (Int64, Int64) = (zero, zero)
  let mut start : (Int64, Int64) = (zero, zero)
  for i in 0..<commands.length() {
    match commands[i] {
      MoveTo(p) => {
        current = to_screen(p, scale)
        start = current
      }
      LineTo(p) => {
        let next = to_screen(p, scale)
        add_edge(edges, current, next)
        current = next
      }
      QuadTo(control, end) => {
        let p0 = current
        let p1 = to_screen(control, scale)
        let p2 = to_screen(end, scale)
        let steps = curve_steps(curve_span(p0, p1, p2))
        let (x0, y0) = p0
        let (x1, y1) = p1
        let (x2, y2) = p2
        for k in 1..<(steps + 1) {
          let t : Int64 = (k * 64 / steps).to_int64()
          let u : Int64 = 64 - t
          let nx = (u * u * x0 + 2 * u * t * x1 + t * t * x2) / 4096
          let ny = (u * u * y0 + 2 * u * t * y1 + t * t * y2) / 4096
          let next : (Int64, Int64) = (nx, ny)
          add_edge(edges, current, next)
          current = next
        }
      }
      CubicTo(control1, control2, end) => {
        let p0 = current
        let p1 = to_screen(control1, scale)
        let p2 = to_screen(control2, scale)
        let p3 = to_screen(end, scale)
        let steps = curve_steps(curve_span(p0, p1, p3))
        let (x0, y0) = p0
        let (x1, y1) = p1
        let (x2, y2) = p2
        let (x3, y3) = p3
        for k in 1..<(steps + 1) {
          let t : Int64 = (k * 64 / steps).to_int64()
          let u : Int64 = 64 - t
          let nx = (
              u * u * u * x0 +
              3 * u * u * t * x1 +
              3 * u * t * t * x2 +
              t * t * t * x3
            ) /
            262144
          let ny = (
              u * u * u * y0 +
              3 * u * u * t * y1 +
              3 * u * t * t * y2 +
              t * t * t * y3
            ) /
            262144
          let next : (Int64, Int64) = (nx, ny)
          add_edge(edges, current, next)
          current = next
        }
      }
      Close => {
        add_edge(edges, current, start)
        current = start
      }
    }
  }
  edges
}

///|
/// Insertion sort of crossings, carrying each edge's winding direction with
/// it. A glyph contour rarely has more than a few dozen crossings on one
/// scanline, so this is both smaller and more predictable than a general sort.
fn sort_crossings(xs : Array[Int64], dirs : Array[Int32]) -> Unit {
  for i in 1..<xs.length() {
    let key_x = xs[i]
    let key_d = dirs[i]
    let mut j = i - 1
    while j >= 0 && xs[j] > key_x {
      xs[j + 1] = xs[j]
      dirs[j + 1] = dirs[j]
      j -= 1
    }
    xs[j + 1] = key_x
    dirs[j + 1] = key_d
  }
}

///|
fn empty_mask() -> @model.CoverageMask {
  @model.CoverageMask::of(0, 0, 0, 0, FixedArray::make(0, b'\x00'))
}

///|
/// Turn an outline into eight-bit coverage at `scale`.
///
/// Each pixel row is sampled at eight vertical positions. At each of them the
/// edges crossing that line are intersected, sorted and paired by non-zero
/// winding; the horizontal span between a pair is accumulated into the pixels
/// it covers as an exact 26.6 length. Eight samples times 64 units per pixel
/// is 512, so the final scaling to 0..255 is exact and integer.
pub fn rasterise(
  outline : @model.Outline,
  scale : @model.Scale,
  limits : @model.Limits,
) -> @model.CoverageMask raise @model.Refused {
  let edges = flatten(outline, scale)
  if edges.length() == 0 {
    return empty_mask()
  }
  let mut min_x = edges[0].x0
  let mut max_x = edges[0].x0
  let mut min_y = edges[0].y0
  let mut max_y = edges[0].y0
  for i in 0..<edges.length() {
    let edge = edges[i]
    if edge.x0 < min_x {
      min_x = edge.x0
    }
    if edge.x0 > max_x {
      max_x = edge.x0
    }
    if edge.x1 < min_x {
      min_x = edge.x1
    }
    if edge.x1 > max_x {
      max_x = edge.x1
    }
    if edge.y0 < min_y {
      min_y = edge.y0
    }
    if edge.y0 > max_y {
      max_y = edge.y0
    }
    if edge.y1 < min_y {
      min_y = edge.y1
    }
    if edge.y1 > max_y {
      max_y = edge.y1
    }
  }
  let left = floor_div(min_x, 64)
  let top = floor_div(min_y, 64)
  let width = ceil_div(max_x, 64) - left
  let height = ceil_div(max_y, 64) - top
  if width <= 0 || height <= 0 {
    return empty_mask()
  }
  limits.check_mask(width, height)
  let count = width * height
  let accumulated = FixedArray::make(count, 0)
  let samples = FixedArray::make(count, b'\x00')
  let right_edge = (left + width) * 64
  for py in 0..<height {
    for sub in 0..<8 {
      // The centre of one of eight vertical bands inside this pixel row.
      let y = ((top + py) * 64 + sub * 8 + 4).to_int64()
      let xs : Array[Int64] = []
      let dirs : Array[Int32] = []
      for i in 0..<edges.length() {
        let edge = edges[i]
        let low = if edge.y0 < edge.y1 { edge.y0 } else { edge.y1 }
        let high = if edge.y0 < edge.y1 { edge.y1 } else { edge.y0 }
        if y >= low && y < high {
          let x = edge.x0 +
            (y - edge.y0) * (edge.x1 - edge.x0) / (edge.y1 - edge.y0)
          xs.push(x)
          dirs.push(edge.dir)
        }
      }
      sort_crossings(xs, dirs)
      let mut winding = 0
      for k in 0..<(xs.length() - 1) {
        winding += dirs[k]
        let xa = xs[k]
        let xb = xs[k + 1]
        if winding != 0 && xb > xa {
          let first = clamp(floor_div(xa, 64) - left, 0, width - 1)
          let last = clamp(ceil_div(xb, 64) - left, 0, width)
          for px in first..<last {
            let pixel_start = ((left + px) * 64).to_int64()
            let pixel_end = pixel_start + 64
            let from = if xa > pixel_start { xa } else { pixel_start }
            let to = if xb < pixel_end {
              xb
            } else if right_edge.to_int64() < pixel_end {
              right_edge.to_int64()
            } else {
              pixel_end
            }
            let overlap = to - from
            if overlap > 0 {
              let at = py * width + px
              accumulated[at] = accumulated[at] + overlap.to_int()
            }
          }
        }
      }
    }
  }
  for i in 0..<count {
    let value = accumulated[i].to_int64() * 255 / 512
    samples[i] = clamp(value.to_int(), 0, 255).to_byte()
  }
  @model.CoverageMask::of(width, height, left, top, samples)
}
