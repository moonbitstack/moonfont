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
