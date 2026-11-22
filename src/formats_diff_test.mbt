// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The replay of the format fixtures. Each case names a font, a glyph and a
// location; the expected command stream came from fontTools and the expected
// ink from FreeType, both cross-checked against each other before they were
// written down. A tolerance of one unit covers the difference between a float
// interpolation and this library's integer one.
//
// Every mismatch is collected into one report so a run shows all of them, and
// the report is the assertion: the test driver prints it as the difference.

///|
fn flatten(outline : @moonfont.Outline) -> Array[Int32] {
  let out : Array[Int32] = []
  for command in outline.commands() {
    match command {
      @moonfont.PathCommand::MoveTo(p) => {
        out.push(0)
        out.push(p.x)
        out.push(p.y)
      }
      @moonfont.PathCommand::LineTo(p) => {
        out.push(1)
        out.push(p.x)
        out.push(p.y)
      }
      @moonfont.PathCommand::QuadTo(control, end) => {
        out.push(2)
        out.push(control.x)
        out.push(control.y)
        out.push(end.x)
        out.push(end.y)
      }
      @moonfont.PathCommand::CubicTo(a, b, end) => {
        out.push(3)
        out.push(a.x)
        out.push(a.y)
        out.push(b.x)
        out.push(b.y)
        out.push(end.x)
        out.push(end.y)
      }
      @moonfont.PathCommand::Close => out.push(4)
    }
  }
  out
}

///|
fn gap(a : Int32, b : Int32) -> Int32 {
  if a >= b {
    a - b
  } else {
    b - a
  }
}

///|
fn outline_at(
  face : @moonfont.Face,
  glyph : Int32,
  coords : Array[(Int32, Int32)],
) -> @moonfont.Outline raise {
  if coords.length() == 0 {
    face.outline(@moonfont.GlyphId::of(glyph))
  } else {
    face.outline(@moonfont.GlyphId::of(glyph), location=face.at(coords))
  }
}

///|
test "the format fixtures replay their outlines" {
  let mut report = ""
  for expectation in outline_cases {
    let face = @moonfont.decode(expectation.font, limits=@moonfont.limits) catch {
      error => {
        report = report + "\{expectation.label}: will not decode: \{error}\n"
        continue
      }
    }
    let outline = outline_at(face, expectation.glyph, expectation.coords) catch {
      error => {
        report = report + "\{expectation.label}: outline refused: \{error}\n"
        continue
      }
    }
    let actual = flatten(outline)
    if actual.length() != expectation.ops.length() {
      let found = actual.length()
      let wanted = expectation.ops.length()
      report = report +
        "\{expectation.label}: \{found} values, want \{wanted}\n"
      continue
    }
    for i in 0..<actual.length() {
      if gap(actual[i], expectation.ops[i]) > expectation.tolerance {
        let found = actual[i]
        let wanted = expectation.ops[i]
        report = report +
          "\{expectation.label}: value \{i} is \{found}, want \{wanted}\n"
        break
      }
    }
  }
  assert_eq(report, "")
}

///|
test "the format fixtures replay their metrics" {
  let mut report = ""
  for expectation in outline_cases {
    let face = @moonfont.decode(expectation.font, limits=@moonfont.limits) catch {
      error => {
        report = report + "\{expectation.label}: will not decode: \{error}\n"
        continue
      }
    }
    let glyph = @moonfont.GlyphId::of(expectation.glyph)
    let metrics = if expectation.coords.length() == 0 {
      face.metrics(glyph) catch {
        error => {
          report = report + "\{expectation.label}: metrics refused: \{error}\n"
          continue
        }
      }
    } else {
      face.metrics(glyph, location=face.at(expectation.coords)) catch {
        error => {
          report = report + "\{expectation.label}: metrics refused: \{error}\n"
          continue
        }
      }
    }
    if gap(metrics.advance, expectation.advance) > expectation.tolerance {
      let found = metrics.advance
      let wanted = expectation.advance
      report = report +
        "\{expectation.label}: advance is \{found}, want \{wanted}\n"
    }
    if gap(metrics.left_side_bearing, expectation.lsb) > expectation.tolerance {
      let found = metrics.left_side_bearing
      let wanted = expectation.lsb
      report = report +
        "\{expectation.label}: bearing is \{found}, want \{wanted}\n"
    }
  }
  assert_eq(report, "")
}

///|
/// Pixels of ink in a mask, as a whole number: a coverage sample counts as one
/// 255th of a pixel.
fn ink_of(mask : @moonfont.CoverageMask) -> Int32 {
  let mut total = 0
  for y in 0..<mask.height {
    for x in 0..<mask.width {
      total += mask.at(x, y)
    }
  }
  if total > 0 {
    (total + 127) / 255
  } else {
    0
  }
}

///|
test "the format fixtures replay their coverage" {
  let mut report = ""
  for expectation in ink_cases {
    let face = @moonfont.decode(expectation.font, limits=@moonfont.limits) catch {
      error => {
        report = report + "\{expectation.label}: will not decode: \{error}\n"
        continue
      }
    }
    let mask = face.rasterise(
      @moonfont.GlyphId::of(expectation.glyph),
      expectation.ppem,
    ) catch {
      error => {
        report = report + "\{expectation.label}: mask refused: \{error}\n"
        continue
      }
    }
    let measured = ink_of(mask)
    let allowance = if expectation.ink / 20 > 1 {
      expectation.ink / 20
    } else {
      1
    }
    if gap(measured, expectation.ink) > allowance {
      let found = measured
      let wanted = expectation.ink
      report = report +
        "\{expectation.label}: ink is \{found}, want \{wanted}\n"
    }
    // The mask is tight around the ink, so its own box is the box FreeType's
    // non-zero samples describe. `top` counts upwards here, `mask.top`
    // downwards.
    let box : Array[Int32] = [
      mask.left,
      -mask.top,
      mask.left + mask.width,
      -(mask.top + mask.height),
    ]
    let wanted : Array[Int32] = [
      expectation.left,
      expectation.top,
      expectation.right,
      expectation.bottom,
    ]
    for i in 0..<4 {
      if gap(box[i], wanted[i]) > 1 {
        let found = box[i]
        let edge = wanted[i]
        report = report +
          "\{expectation.label}: edge \{i} is \{found}, want \{edge}\n"
      }
    }
  }
  assert_eq(report, "")
}

///|
/// One face of a collection, read through the container the case names.
fn face_of_collection(expectation : CollectionCase) -> @moonfont.Face raise {
  let faces = @moonfont.decode_all(expectation.font, limits=@moonfont.limits)
  if faces.length() != 2 {
    raise Failure::Failure("\{faces.length()} faces")
  }
  faces[expectation.face.to_int()]
}

///|
test "a collection replays the same faces through either container" {
  let mut report = ""
  for expectation in collection_cases {
    let face = face_of_collection(expectation) catch {
      error => {
        report = report +
          "\{expectation.label}: the collection will not open: \{error}\n"
        continue
      }
    }
    let outline = face.outline(@moonfont.GlyphId::of(expectation.glyph)) catch {
      error => {
        report = report + "\{expectation.label}: outline refused: \{error}\n"
        continue
      }
    }
    let actual = flatten(outline)
    if actual.length() != expectation.ops.length() {
      let found = actual.length()
      let wanted = expectation.ops.length()
      report = report +
        "\{expectation.label}: \{found} values, want \{wanted}\n"
      continue
    }
    for i in 0..<actual.length() {
      if actual[i] != expectation.ops[i] {
        let found = actual[i]
        let wanted = expectation.ops[i]
        report = report +
          "\{expectation.label}: value \{i} is \{found}, want \{wanted}\n"
        break
      }
    }
    let metrics = face.metrics(@moonfont.GlyphId::of(expectation.glyph)) catch {
      error => {
        report = report + "\{expectation.label}: metrics refused: \{error}\n"
        continue
      }
    }
    if metrics.advance != expectation.advance {
      let found = metrics.advance
      let wanted = expectation.advance
      report = report +
        "\{expectation.label}: advance is \{found}, want \{wanted}\n"
    }
    if metrics.left_side_bearing != expectation.lsb {
      let found = metrics.left_side_bearing
      let wanted = expectation.lsb
      report = report +
        "\{expectation.label}: bearing is \{found}, want \{wanted}\n"
    }
  }
  assert_eq(report, "")
}

///|
test "the metrics fixtures replay their variations" {
  let mut report = ""
  for expectation in metric_cases {
    let face = @moonfont.decode(expectation.font, limits=@moonfont.limits) catch {
      error => {
        report = report + "\{expectation.label}: will not decode: \{error}\n"
        continue
      }
    }
    let at = face.at(expectation.coords)
    let wide = if expectation.coords.length() == 0 {
      face.font_metrics()
    } else {
      face.font_metrics(location=at)
    }
    let column = if expectation.coords.length() == 0 {
      face.vertical_metrics()
    } else {
      face.vertical_metrics(location=at)
    }
    for
      pair in [
        ("ascent", wide.ascent, expectation.ascent),
        ("descent", wide.descent, expectation.descent),
        ("line gap", wide.line_gap, expectation.line_gap),
        ("cap height", wide.cap_height, expectation.cap_height),
        ("x height", wide.x_height, expectation.x_height),
        ("vertical ascent", column.ascent, expectation.vertical_ascent),
        ("vertical descent", column.descent, expectation.vertical_descent),
        ("vertical line gap", column.line_gap, expectation.vertical_line_gap),
      ] {
      let (name, found, wanted) = pair
      if found != wanted {
        report = report +
          "\{expectation.label}: \{name} is \{found}, want \{wanted}\n"
      }
    }
    let glyph = @moonfont.GlyphId::of(expectation.glyph)
    let advance = if expectation.coords.length() == 0 {
      face.advance_height(glyph)
    } else {
      face.advance_height(glyph, location=at)
    }
    if advance != expectation.advance_height {
      let found = advance
      let wanted = expectation.advance_height
      report = report +
        "\{expectation.label}: advance height is \{found}, want \{wanted}\n"
    }
    let bearing = if expectation.coords.length() == 0 {
      face.top_side_bearing(glyph)
    } else {
      face.top_side_bearing(glyph, location=at)
    }
    if bearing != expectation.top_bearing {
      let found = bearing
      let wanted = expectation.top_bearing
      report = report +
        "\{expectation.label}: top bearing is \{found}, want \{wanted}\n"
    }
    let values = try {
      if expectation.coords.length() == 0 {
        face.cvt()
      } else {
        face.cvt(location=at)
      }
    } catch {
      error => {
        report = report +
          "\{expectation.label}: control values refused: \{error}\n"
        continue
      }
    }
    if values.length() != expectation.cvt.length() {
      report = report +
        "\{expectation.label}: \{values.length()} control values, want \{expectation.cvt.length()}\n"
    } else {
      for i in 0..<values.length() {
        if values[i] != expectation.cvt[i] {
          let found = values[i]
          let wanted = expectation.cvt[i]
          report = report +
            "\{expectation.label}: control value \{i} is \{found}, want \{wanted}\n"
        }
      }
    }
  }
  assert_eq(report, "")
}

///|
test "a one-face collection is still a collection" {
  let faces = @moonfont.decode_all(
    sample_collection_transformed,
    limits=@moonfont.limits,
  ) catch {
    error => abort("the wrapped collection will not open: \{error}")
  }
  assert_eq(faces.length(), 1)
  // The outline cases already draw this face through `decode`; here the point
  // is that asking for every face of the container returns one whose tables
  // came out of the collection directory rather than the single-font path.
  assert_eq(faces[0].num_glyphs(), 7)
  assert_eq(faces[0].is_variable(), true)
}
