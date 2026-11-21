// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// Every length in a font is declared by the file itself. A decoder that trusts
// those declarations before allocating is a decoder that allocates whatever a
// hostile file asks for, so each ceiling is checked before the allocation it
// guards. The ceilings also cap the work a single glyph can cause.

///|
/// The ceilings a reader works under. `limits` is the preset for an
/// application's own assets; `limits_strict` is for bytes from somewhere else.
/// A record built by hand is honoured as given: a caller who raises a ceiling
/// has said what it is willing to spend.
pub(all) struct Limits {
  /// The largest font file accepted, in bytes.
  file_bytes : Int32
  /// The largest single table accepted, in bytes.
  table_bytes : Int32
  /// The largest number of glyphs accepted.
  glyphs : Int32
  /// The largest number of points accepted in one glyph outline.
  points : Int32
  /// The largest number of contours accepted in one glyph outline.
  contours : Int32
  /// The largest number of components accepted in one composite glyph.
  composites : Int32
  /// The deepest nesting of composite glyphs accepted.
  recursion : Int32
  /// The largest coverage mask accepted, in pixels.
  mask_pixels : Int32
}

///|
/// Desktop and server defaults: generous, but finite at every declaration.
pub let limits : Limits = {
  file_bytes: 268_435_456,
  table_bytes: 268_435_456,
  glyphs: 65_536,
  points: 65_536,
  contours: 8_192,
  composites: 1_024,
  recursion: 16,
  mask_pixels: 67_108_864,
}

///|
/// What a service handling untrusted uploads would choose: a sixteenth of the
/// file ceiling, an eighth of the points, and a mask that fits a 2048-pixel
/// square.
pub let limits_strict : Limits = {
  file_bytes: 16_777_216,
  table_bytes: 16_777_216,
  glyphs: 65_536,
  points: 8_192,
  contours: 1_024,
  composites: 256,
  recursion: 8,
  mask_pixels: 4_194_304,
}

///|
/// The desktop preset as a function, for a caller that reads a preset where a
/// value is expected rather than in a parameter default.
pub fn Limits::default() -> Limits {
  limits
}

///|
/// The untrusted-input preset as a function.
pub fn Limits::strict() -> Limits {
  limits_strict
}

///|
/// Limits by name, every knob defaulted from the preset. Use this rather than a
/// record literal when only one ceiling changes: a later field added to the
/// record then keeps its default instead of failing to compile.
pub fn Limits::new(
  file_bytes~ : Int32 = limits.file_bytes,
  table_bytes~ : Int32 = limits.table_bytes,
  glyphs~ : Int32 = limits.glyphs,
  points~ : Int32 = limits.points,
  contours~ : Int32 = limits.contours,
  composites~ : Int32 = limits.composites,
  recursion~ : Int32 = limits.recursion,
  mask_pixels~ : Int32 = limits.mask_pixels,
) -> Limits {
  {
    file_bytes,
    table_bytes,
    glyphs,
    points,
    contours,
    composites,
    recursion,
    mask_pixels,
  }
}

///|
fn over(limit : Int32, got : Int32) -> Unit raise Refused {
  if got > limit {
    raise OverLimit(limit~, got~)
  }
}

///|
pub fn Limits::check_file(self : Limits, size : Int32) -> Unit raise Refused {
  over(self.file_bytes, size)
}

///|
pub fn Limits::check_table(self : Limits, size : Int32) -> Unit raise Refused {
  over(self.table_bytes, size)
}

///|
pub fn Limits::check_glyphs(self : Limits, count : Int32) -> Unit raise Refused {
  over(self.glyphs, count)
}

///|
pub fn Limits::check_outline(
  self : Limits,
  points : Int32,
  contours : Int32,
) -> Unit raise Refused {
  over(self.points, points)
  over(self.contours, contours)
}

///|
pub fn Limits::check_composites(
  self : Limits,
  count : Int32,
) -> Unit raise Refused {
  over(self.composites, count)
}

///|
pub fn Limits::check_depth(self : Limits, depth : Int32) -> Unit raise Refused {
  if depth > self.recursion {
    raise Recursion(depth~)
  }
}

///|
/// The pixel count is multiplied in 64 bits so that a declared 65535 by 65535
/// cannot wrap into a small number and slip through.
pub fn Limits::check_mask(
  self : Limits,
  width : Int32,
  height : Int32,
) -> Unit raise Refused {
  if width <= 0 || height <= 0 {
    return
  }
  let pixels = width.to_int64() * height.to_int64()
  if pixels > self.mask_pixels.to_int64() {
    raise OverLimit(limit=self.mask_pixels, got=pixels.to_int())
  }
}
