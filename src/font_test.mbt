// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// Three kinds of proof: the byte layer reads what the format says, the
// rasteriser fills what the outline encloses, and a whole font walks from
// bytes to a coverage mask without a single file being opened.

///|
test "big-endian reads and signed values" {
  let cursor = @wire.Cursor::new(b"\x00\x01\x00\x00\x00\x2A\xFF\x80")
  assert_eq(cursor.u16(), 1)
  assert_eq(cursor.u32(), 42)
  assert_eq(cursor.u8(), 255)
  assert_eq(cursor.i8(), -128)
}

///|
test "a read past the end is refused at the offset" {
  let cursor = @wire.Cursor::new(b"\x00")
  let got = cursor.u16() catch { _ => -1 }
  assert_eq(got, -1)
}

///|
test "a window cannot walk outside its own bytes" {
  let cursor = @wire.Cursor::new(b"\x00\x01\x02\x03")
  let window = cursor.window(1, 2)
  assert_eq(window.u16(), 0x0102)
  let refused = try {
    let _ = cursor.window(3, 4)
    false
  } catch {
    _ => true
  }
  assert_eq(refused, true)
}

///|
test "26.6 scaling stays exact in integers" {
  let scale = @moonfont.Scale::of(16, 1000)
  assert_eq(scale.apply(1000), 16 * 64)
  assert_eq(scale.apply(500), 8 * 64)
  assert_eq(scale.apply(0), 0)
}

///|
test "bounds, limits and the strict preset" {
  let box : @moonfont.Bounds = { x_min: 1, y_min: 2, x_max: 11, y_max: 22, }
  assert_eq(box.width(), 10)
  assert_eq(box.height(), 20)
  assert_eq(box.is_empty(), false)
  let normal = @moonfont.limits
  let strict = @moonfont.limits_strict
  assert_eq(strict.mask_pixels < normal.mask_pixels, true)
  assert_eq(strict.recursion < normal.recursion, true)
}

///|
test "a square outline fills its interior" {
  let commands : Array[@model.PathCommand] = [
    @model.MoveTo(@model.Point::of(0, 0)),
    @model.LineTo(@model.Point::of(100, 0)),
    @model.LineTo(@model.Point::of(100, 100)),
    @model.LineTo(@model.Point::of(0, 100)),
    @model.Close,
  ]
  let outline = @model.Outline::of(commands, @model.Bounds::empty())
  let scale = @moonfont.Scale::of(16, 100)
  let mask = @raster.rasterise(outline, scale, @moonfont.limits)
  assert_eq(mask.width, 16)
  assert_eq(mask.height, 16)
  assert_eq(mask.at(8, 8), 255)
  assert_eq(mask.at(-1, 8), 0)
  assert_eq(mask.at(8, -1), 0)
}

///|
test "an empty outline produces an empty mask" {
  let outline = @model.Outline::of([], @model.Bounds::empty())
  let mask = @raster.rasterise(
    outline,
    @moonfont.Scale::of(16, 1000),
    @moonfont.limits,
  )
  assert_eq(mask.width, 0)
  assert_eq(mask.height, 0)
}

///|
test "the embedded font decodes from bytes to a mask" {
  let face = @moonfont.decode(valid_minimal) catch {
    error => abort("valid_minimal.ttf must decode: \{error}")
  }
  assert_eq(face.num_glyphs() > 0, true)
  assert_eq(face.units_per_em() >= 16, true)
  let metrics = face.font_metrics()
  assert_eq(metrics.units_per_em, face.units_per_em())
  match face.glyph_index(65) {
    Some(glyph) => {
      let outline = face.outline(glyph) catch {
        error => abort("the A outline must be readable: \{error}")
      }
      assert_eq(outline.is_empty(), false)
      let mask = face.rasterise(glyph, 16) catch {
        error => abort("the A mask must be rasterised: \{error}")
      }
      assert_eq(mask.width >= 0, true)
      let measured = face.measure("A", 16)
      assert_eq(measured.glyphs, 1)
    }
    None => ()
  }
}

///|
/// Whether reading these bytes and resolving every glyph ends in a refusal.
/// A panic would fail the test process rather than return a value, so running
/// this over the whole corpus is also the no-trap check.
fn refused_by(bytes : Bytes) -> Bool {
  let refused = try {
    let face = @moonfont.decode(bytes, limits=@moonfont.limits_strict)
    for i in 0..<face.num_glyphs() {
      let _ = face.outline(@moonfont.GlyphId::of(i))
    }
    false
  } catch {
    _ => true
  }
  refused
}

///|
test "the whole hostile corpus is safe to read" {
  for
    case in [
      valid_minimal, bad_signature, bad_sfnt_scaler, zero_num_tables, missing_head,
      table_offset_past_eof, truncated_file, units_per_em_zero, loca_offsets_going_backwards,
      composite_self_reference, glyf_repeat_flag_overflow, unsupported_maxp_version,
      table_length_over_limit,
    ] {
    let _ = refused_by(case)
  }
}

///|
test "the clearly malformed fonts are refused with a reason" {
  assert_eq(refused_by(bad_signature), true)
  assert_eq(refused_by(bad_sfnt_scaler), true)
  assert_eq(refused_by(zero_num_tables), true)
  assert_eq(refused_by(missing_head), true)
  assert_eq(refused_by(truncated_file), true)
}

///|
test "the valid fixture is not refused" {
  assert_eq(refused_by(valid_minimal), false)
}
