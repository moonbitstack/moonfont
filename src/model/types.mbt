// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The vocabulary shared by every layer above this one. These types are about
// typography, not about bytes: nothing here knows that a font has a table
// directory, and nothing here knows that a bitmap has scanlines. That is the
// seam that lets a parser, an outline consumer and a rasteriser evolve alone.

///|
/// A glyph's index in the font. Codepoints are not glyphs: translation belongs
/// to the charmap, and everything downstream speaks only this.
#derive(Eq, Debug)
pub(all) struct GlyphId {
  index : Int32
}

///|
pub extend GlyphId with Eq::{equal, not_equal}

///|
pub extend GlyphId with Debug::{to_repr}

///|
pub fn GlyphId::of(index : Int32) -> GlyphId {
  { index, }
}

///|
pub fn GlyphId::to_int(self : GlyphId) -> Int32 {
  self.index
}

///|
/// A point in font units, with the font's own y-up orientation.
#derive(Eq, Debug)
pub(all) struct Point {
  x : Int32
  y : Int32
}

///|
pub extend Point with Eq::{equal, not_equal}

///|
pub extend Point with Debug::{to_repr}

///|
pub fn Point::of(x : Int32, y : Int32) -> Point {
  { x, y, }
}

///|
/// An axis-aligned box in font units.
#derive(Eq, Debug)
pub(all) struct Bounds {
  x_min : Int32
  y_min : Int32
  x_max : Int32
  y_max : Int32
}

///|
pub extend Bounds with Eq::{equal, not_equal}

///|
pub extend Bounds with Debug::{to_repr}

///|
pub fn Bounds::empty() -> Bounds {
  { x_min: 0, y_min: 0, x_max: 0, y_max: 0, }
}

///|
pub fn Bounds::width(self : Bounds) -> Int32 {
  self.x_max - self.x_min
}

///|
pub fn Bounds::height(self : Bounds) -> Int32 {
  self.y_max - self.y_min
}

///|
pub fn Bounds::is_empty(self : Bounds) -> Bool {
  self.x_max <= self.x_min || self.y_max <= self.y_min
}

///|
/// One step of an outline. Quadratic and cubic segments are kept as they are in
/// the file: flattening is a rasteriser's decision, not a parser's. A consumer
/// that wants SVG, a GPU tessellator or an SDF gets the same commands.
#derive(Eq, Debug)
pub(all) enum PathCommand {
  MoveTo(Point)
  LineTo(Point)
  /// Control point, then end point.
  QuadTo(Point, Point)
  /// Two control points, then end point.
  CubicTo(Point, Point, Point)
  Close
}

///|
pub extend PathCommand with Eq::{equal, not_equal}

///|
pub extend PathCommand with Debug::{to_repr}

///|
/// A glyph outline: a command stream and the box the font declared for it.
/// The declared box is kept separate from the measured extent of the commands,
/// because metrics and coverage are not obliged to agree with each other.
pub(all) struct Outline {
  commands : Array[PathCommand]
  bounds : Bounds
}

///|
pub fn Outline::of(commands : Array[PathCommand], bounds : Bounds) -> Outline {
  { commands, bounds, }
}

///|
pub fn Outline::commands(self : Outline) -> Array[PathCommand] {
  self.commands
}

///|
pub fn Outline::bounds(self : Outline) -> Bounds {
  self.bounds
}

///|
pub fn Outline::is_empty(self : Outline) -> Bool {
  self.commands.length() == 0
}

///|
/// Horizontal metrics of one glyph, in font units.
pub(all) struct GlyphMetrics {
  advance : Int32
  left_side_bearing : Int32
  bounds : Bounds
}

///|
/// Font-wide metrics, in font units. All vertical values keep the font's y-up
/// sign: descent is negative in a well-formed font.
pub(all) struct FontMetrics {
  units_per_em : Int32
  ascent : Int32
  descent : Int32
  line_gap : Int32
  cap_height : Int32
  x_height : Int32
  num_glyphs : Int32
  bounding_box : Bounds
}

///|
/// Eight-bit coverage of one glyph, top-down rows, left-to-right columns.
/// `left` and `top` place the box relative to the pen in 26.6 pixels, so a
/// caller can blit it into an atlas without recomputing the origin.
pub(all) struct CoverageMask {
  width : Int32
  height : Int32
  left : Int32
  top : Int32
  samples : FixedArray[Byte]
}

///|
pub fn CoverageMask::of(
  width : Int32,
  height : Int32,
  left : Int32,
  top : Int32,
  samples : FixedArray[Byte],
) -> CoverageMask {
  { width, height, left, top, samples, }
}

///|
/// The coverage at `x`, `y`, from 0 to 255. Out of the box is transparent.
pub fn CoverageMask::at(self : CoverageMask, x : Int32, y : Int32) -> Int32 {
  if x < 0 || y < 0 || x >= self.width || y >= self.height {
    0
  } else {
    self.samples[y * self.width + x].to_int()
  }
}

///|
/// A size in 26.6 fixed point. The whole library computes with integers: a
/// rasteriser that used floating point would produce different coverage on
/// wasm, js and native for the same bytes, and a differential test could not
/// say what the right answer is.
/// Variable fonts (fvar/gvar/HVAR) are out of scope for 0.1.x; the default
/// instance is used and a variation seam is reserved for v0.2.0.
pub(all) struct Scale {
  /// Pixels per em, in 26.6 fixed point.
  ppem : Int32
  units_per_em : Int32
}

///|
pub fn Scale::of(pixels_per_em : Int32, units_per_em : Int32) -> Scale {
  { ppem: pixels_per_em << 6, units_per_em, }
}

///|
/// Font units to 26.6 pixels. The product is taken in 64 bits so a large
/// coordinate at a large size cannot wrap.
pub fn Scale::apply(self : Scale, units : Int32) -> Int32 {
  if self.units_per_em <= 0 {
    return 0
  }
  (units.to_int64() * self.ppem.to_int64() / self.units_per_em.to_int64()).to_int()
}

///|
pub fn Scale::ppem(self : Scale) -> Int32 {
  self.ppem
}

///|
/// The measured shape of a run of text, in 26.6 pixels.
pub(all) struct TextMetrics {
  advance : Int32
  ascent : Int32
  descent : Int32
  line_gap : Int32
  glyphs : Int32
}
