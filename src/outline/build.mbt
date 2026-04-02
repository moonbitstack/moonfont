// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The TrueType outline is a compact encoding of quadratic B-splines. Two of
// its rules are worth stating plainly because every other font library has to
// rediscover them: a point between two off-curve points is IMPLIED, and a
// contour may begin on an off-curve point. Emitting explicit commands here
// means every consumer downstream — a tessellator, an SDF builder, an SVG pen
// or a rasteriser — sees the same geometry without re-implementing the spec.

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
/// The path of one simple glyph.
pub fn simple_outline(glyph : @table.SimpleGlyph) -> @model.Outline {
  let commands : Array[@model.PathCommand] = []
  let mut from = 0
  for i in 0..<glyph.end_points.length() {
    let to = glyph.end_points[i] + 1
    if to > glyph.points.length() {
      break
    }
    contour_commands(glyph.points, glyph.on_curve, from, to, commands)
    from = to
  }
  @model.Outline::of(commands, glyph.bounds)
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
/// The outline of one glyph. Composite components are resolved recursively;
/// the depth ceiling is checked before each descent, so a cyclic component
/// chain is refused rather than looping.
pub fn GlyphSource::outline(
  self : GlyphSource,
  glyph : @model.GlyphId,
  depth? : Int32,
) -> @model.Outline raise @model.Refused {
  let level = depth.unwrap_or(0)
  self.limits.check_depth(level)
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
    return @model.Outline::of([], @model.Bounds::empty())
  }
  let view = self.glyf.clamped_view(start=begin, end~)
  let data = @table.GlyphData::parse(view, self.limits)
  match data {
    Empty => @model.Outline::of([], @model.Bounds::empty())
    Simple(simple) => simple_outline(simple)
    Composite(composite) => {
      let commands : Array[@model.PathCommand] = []
      for i in 0..<composite.components.length() {
        let component = composite.components[i]
        let child = self.outline(
          @model.GlyphId::of(component.glyph_index),
          depth=level + 1,
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
