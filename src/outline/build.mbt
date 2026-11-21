// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The TrueType outline is a compact encoding of quadratic B-splines. Two of
// its rules are worth stating plainly because every other font library has to
// rediscover them: a point between two off-curve points is IMPLIED, and a
// contour may begin on an off-curve point. Emitting explicit commands here
// means every consumer downstream — a tessellator, an SDF builder, an SVG pen
// or a rasteriser — sees the same geometry without re-implementing the spec.
//
// A variable font moves the points before any of that: the deltas arrive from
// `gvar` as one vector per point, the four phantom points included, and the
// contour structure is untouched.

///|
fn midpoint(a : @model.Point, b : @model.Point) -> @model.Point {
  @model.Point::of((a.x + b.x) / 2, (a.y + b.y) / 2)
}

///|
/// One contour to commands. The command stream always starts with a MoveTo and
/// always ends with a Close, so a consumer never has to infer the start.
fn contour_commands(
  points : Array[@model.Point],
  on_curve : Array[Bool],
  from : Int32,
  to : Int32,
  out : Array[@model.PathCommand],
) -> Unit {
  let count = to - from
  if count <= 0 {
    return
  }
  let first_on = on_curve[from]
  let last_on = on_curve[to - 1]
  let mut start : @model.Point = @model.Point::of(0, 0)
  let mut begin = from
  let mut end = to
  if first_on {
    start = points[from]
    begin = from + 1
  } else if last_on {
    // The last point is on-curve and becomes the start; it must not also be
    // emitted as a final line to itself.
    start = points[to - 1]
    end = to - 1
  } else {
    // Both ends off-curve: the start is the implied point between them.
    start = midpoint(points[to - 1], points[from])
  }
  out.push(@model.MoveTo(start))
  let mut control : @model.Point? = None
  for i in begin..<end {
    let point = points[i]
    if on_curve[i] {
      match control {
        Some(c) => {
          out.push(@model.QuadTo(c, point))
          control = None
        }
        None => out.push(@model.LineTo(point))
      }
    } else {
      match control {
        Some(c) => out.push(@model.QuadTo(c, midpoint(c, point)))
        None => ()
      }
      control = Some(point)
    }
  }
  match control {
    Some(c) => out.push(@model.QuadTo(c, start))
    None => ()
  }
  out.push(@model.Close)
}

///|
/// The path of one simple glyph, with the deltas of the instance applied when
/// the caller has a location. `deltas` is one vector per point, in the glyph's
/// own order; the phantom points at its end are not drawn.
pub fn simple_outline(
  glyph : @table.SimpleGlyph,
  deltas? : Array[(Int32, Int32)],
) -> @model.Outline {
  let points : Array[@model.Point] = []
  let moved = match deltas {
    Some(list) => list.length() >= glyph.points.length()
    None => false
  }
  for i in 0..<glyph.points.length() {
    let point = glyph.points[i]
    if moved {
      let (dx, dy) = deltas.unwrap()[i]
      points.push(@model.Point::of(point.x + dx, point.y + dy))
    } else {
      points.push(point)
    }
  }
  let commands : Array[@model.PathCommand] = []
  let mut from = 0
  for i in 0..<glyph.end_points.length() {
    let to = glyph.end_points[i] + 1
    if to > points.length() {
      break
    }
    contour_commands(points, glyph.on_curve, from, to, commands)
    from = to
  }
  // The box the file declares is kept for the default instance: metrics and
  // coverage are not obliged to agree with each other, and a caller that reads
  // a box expects the one the font wrote.
  @model.Outline::of(
    commands,
    if moved {
      box_of(points)
    } else {
      glyph.bounds
    },
  )
}

///|
/// The box a set of points implies. A varied glyph no longer agrees with the
/// box the file declared, so the box is measured again rather than carried.
fn box_of(points : Array[@model.Point]) -> @model.Bounds {
  if points.length() == 0 {
    return @model.Bounds::empty()
  }
  let mut x_min = points[0].x
  let mut x_max = points[0].x
  let mut y_min = points[0].y
  let mut y_max = points[0].y
  for point in points {
    if point.x < x_min {
      x_min = point.x
    }
    if point.x > x_max {
      x_max = point.x
    }
    if point.y < y_min {
      y_min = point.y
    }
    if point.y > y_max {
      y_max = point.y
    }
  }
  { x_min, y_min, x_max, y_max, }
}

///|
/// Apply a composite component's F2Dot14 matrix and translation. Values are
/// held in 64 bits through the multiply so a large coordinate cannot wrap.
fn transform_point(
  point : @model.Point,
  component : @table.Component,
) -> @model.Point {
  let x = point.x.to_int64()
  let y = point.y.to_int64()
  let a = component.a.to_int64()
  let b = component.b.to_int64()
  let c = component.c.to_int64()
  let d = component.d.to_int64()
  let nx = ((x * a + y * c) >> 14).to_int() + component.dx
  let ny = ((x * b + y * d) >> 14).to_int() + component.dy
  @model.Point::of(nx, ny)
}

///|
fn transform_command(
  command : @model.PathCommand,
  component : @table.Component,
) -> @model.PathCommand {
  match command {
    MoveTo(p) => @model.MoveTo(transform_point(p, component))
    LineTo(p) => @model.LineTo(transform_point(p, component))
    QuadTo(c, e) =>
      @model.QuadTo(
        transform_point(c, component),
        transform_point(e, component),
      )
    CubicTo(c1, c2, e) =>
      @model.CubicTo(
        transform_point(c1, component),
        transform_point(c2, component),
        transform_point(e, component),
      )
    Close => @model.Close
  }
}

///|
/// Everything needed to turn a glyph id into an outline, without owning the
/// font: the glyf bytes, the glyph boundaries and the caller's ceilings.
pub(all) struct GlyphSource {
  glyf : BytesView
  loca : @table.Loca
  limits : @model.Limits
}

///|
pub fn GlyphSource::of(
  glyf : BytesView,
  loca : @table.Loca,
  limits : @model.Limits,
) -> GlyphSource {
  { glyf, loca, limits, }
}

///|
/// How many points a glyph has, phantom points excluded. A caller that needs
/// the count without the outline — measurement, or a delta request — asks here
/// rather than parsing the glyph twice.
pub fn GlyphSource::points(
  self : GlyphSource,
  glyph : @model.GlyphId,
) -> Int32 raise @model.Refused {
  let data = self.data(glyph)
  match data {
    @table.GlyphData::Empty => 0
    @table.GlyphData::Simple(simple) => simple.points.length()
    @table.GlyphData::Composite(composite) => composite.components.length()
  }
}

///|
/// The contour ends of a simple glyph, or one end per component of a composite.
/// `gvar` interpolates inside a contour, so it needs this to know where a
/// contour stops.
pub fn GlyphSource::ends(
  self : GlyphSource,
  glyph : @model.GlyphId,
) -> Array[Int32] raise @model.Refused {
  let data = self.data(glyph)
  match data {
    @table.GlyphData::Empty => []
    @table.GlyphData::Simple(simple) => simple.end_points
    @table.GlyphData::Composite(composite) => {
      let ends : Array[Int32] = []
      for i in 0..<composite.components.length() {
        ends.push(i)
      }
      ends
    }
  }
}

///|
/// The points of a glyph as they stand in the file, phantom points excluded.
/// A composite glyph's "points" are its component offsets, which is what a
/// `gvar` tuple names.
pub fn GlyphSource::coordinates(
  self : GlyphSource,
  glyph : @model.GlyphId,
) -> Array[(Int32, Int32)] raise @model.Refused {
  let data = self.data(glyph)
  match data {
    @table.GlyphData::Empty => []
    @table.GlyphData::Simple(simple) => {
      let out : Array[(Int32, Int32)] = []
      for point in simple.points {
        out.push((point.x, point.y))
      }
      out
    }
    @table.GlyphData::Composite(composite) => {
      let out : Array[(Int32, Int32)] = []
      for component in composite.components {
        out.push((component.dx, component.dy))
      }
      out
    }
  }
}

///|
fn GlyphSource::data(
  self : GlyphSource,
  glyph : @model.GlyphId,
) -> @table.GlyphData raise @model.Refused {
  let index = glyph.to_int()
  let range = match self.loca.range(index) {
    Some(value) => value
    None => raise @model.MissingGlyph(glyph=index)
  }
  let (begin, end) = range
  if begin < 0 || end < begin || end > self.glyf.length() {
    raise @model.Truncated(at=begin, want=end - begin)
  }
  if begin == end {
    return @table.GlyphData::Empty
  }
  let view = self.glyf.clamped_view(start=begin, end~)
  @table.GlyphData::parse(view, self.limits)
}

///|
/// The outline of one glyph. Composite components are resolved recursively;
/// the depth ceiling is checked before each descent, so a cyclic component
/// chain is refused rather than looping.
///
/// `variation` and `coords` come as a pair: a normalised location without a
/// `gvar` table moves nothing, and a table without a location is the default
/// instance.
pub fn GlyphSource::outline(
  self : GlyphSource,
  glyph : @model.GlyphId,
  depth? : Int32,
  variation? : @variations.Gvar,
  coords? : Array[Int32],
) -> @model.Outline raise @model.Refused {
  let level = depth.unwrap_or(0)
  self.limits.check_depth(level)
  let index = glyph.to_int()
  let data = self.data(glyph)
  let location = match coords {
    Some(values) => values
    None => []
  }
  match data {
    @table.GlyphData::Empty => @model.Outline::of([], @model.Bounds::empty())
    @table.GlyphData::Simple(simple) => {
      let deltas = match variation {
        Some(table) if location.length() > 0 => {
          let points = simple.points.length()
          let anchors = self.anchors(glyph, points)
          let ends = simple.end_points
          Some(table.deltas(index, points + 4, ends, anchors, location))
        }
        _ => None
      }
      match deltas {
        Some(list) => simple_outline(simple, deltas=list)
        None => simple_outline(simple)
      }
    }
    @table.GlyphData::Composite(composite) => {
      let moved = match variation {
        Some(table) if location.length() > 0 => {
          let count = composite.components.length()
          let anchors : Array[(Int32, Int32)] = []
          for component in composite.components {
            anchors.push((component.dx, component.dy))
          }
          for _ in 0..<4 {
            anchors.push((0, 0))
          }
          let ends : Array[Int32] = []
          for i in 0..<count {
            ends.push(i)
          }
          Some(table.deltas(index, count + 4, ends, anchors, location))
        }
        _ => None
      }
      let commands : Array[@model.PathCommand] = []
      for i in 0..<composite.components.length() {
        let source = composite.components[i]
        let component = match moved {
          Some(deltas) if i < deltas.length() => {
            let (dx, dy) = deltas[i]
            let moved : @table.Component = {
              glyph_index: source.glyph_index,
              dx: source.dx + dx,
              dy: source.dy + dy,
              a: source.a,
              b: source.b,
              c: source.c,
              d: source.d,
            }
            moved
          }
          _ => source
        }
        let child = self.outline(
          @model.GlyphId::of(component.glyph_index),
          depth=level + 1,
          variation?,
          coords?,
        )
        let inner = child.commands()
        for j in 0..<inner.length() {
          commands.push(transform_command(inner[j], component))
        }
      }
      @model.Outline::of(commands, composite.bounds)
    }
  }
}

///|
/// The point coordinates `gvar` interpolates with, followed by the four
/// phantom points. The phantom points have no drawing position of their own in
/// this reader, and every one of them is a contour of one point, so a zero
/// coordinate is exact rather than approximate.
fn GlyphSource::anchors(
  self : GlyphSource,
  glyph : @model.GlyphId,
  points : Int32,
) -> Array[(Int32, Int32)] {
  let anchors = self.coordinates(glyph) catch { _ => [] }
  let out : Array[(Int32, Int32)] = []
  for i in 0..<points {
    if i < anchors.length() {
      out.push(anchors[i])
    } else {
      out.push((0, 0))
    }
  }
  for _ in 0..<4 {
    out.push((0, 0))
  }
  out
}

///|
/// How far a location moves this glyph's side bearing and advance, from the
/// four phantom points. A font with `HVAR` states the advance itself; this is
/// for the fonts that leave it to `gvar`.
pub fn GlyphSource::phantom_deltas(
  self : GlyphSource,
  glyph : @model.GlyphId,
  variation : @variations.Gvar,
  coords : Array[Int32],
) -> (Int32, Int32) raise @model.Refused {
  if coords.length() == 0 {
    return (0, 0)
  }
  let index = glyph.to_int()
  let data = self.data(glyph)
  let (count, ends) = match data {
    @table.GlyphData::Empty => (0, [])
    @table.GlyphData::Simple(simple) =>
      (simple.points.length(), simple.end_points)
    @table.GlyphData::Composite(composite) => {
      let ends : Array[Int32] = []
      for i in 0..<composite.components.length() {
        ends.push(i)
      }
      (composite.components.length(), ends)
    }
  }
  let anchors = self.anchors(glyph, count)
  let deltas = variation.deltas(index, count + 4, ends, anchors, coords)
  let mut bearing = 0
  let mut advance = 0
  if deltas.length() >= count + 4 {
    bearing = deltas[count].0
    advance = deltas[count + 1].0
  }
  (bearing, advance - bearing)
}
