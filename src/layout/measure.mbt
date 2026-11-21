// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// A measured run is a sum in 26.6 pixels. Keeping the sum in the same fixed
// point as the rasteriser means `measure` and `rasterise` agree about where the
// next glyph starts, with no conversion at the boundary.
//
// This is measurement only: advances plus kerning. Shaping (GSUB/GPOS, bidi,
// line-breaking) is a separate library and is excluded from the core.

///|
/// The horizontal extent of a run of glyph ids, plus the font's vertical
/// rhythm at the same size. Advances come from a function rather than a table
/// because a variable font's advance depends on the location, and a caller
/// that has no variation injects the constant width of the default instance.
pub fn measure(
  glyphs : Array[@model.GlyphId],
  advance_of : (Int32) -> Int32,
  font : @model.FontMetrics,
  scale : @model.Scale,
  kern : @table.Kern,
  letter_spacing? : Int32,
) -> @model.TextMetrics {
  let spacing = letter_spacing.unwrap_or(0)
  let mut advance = 0
  for i in 0..<glyphs.length() {
    advance += scale.apply(advance_of(glyphs[i].to_int()))
    if i + 1 < glyphs.length() {
      let pair = kern.between(glyphs[i].to_int(), glyphs[i + 1].to_int())
      advance += scale.apply(pair)
    }
    advance += spacing
  }
  let result : @model.TextMetrics = {
    advance,
    ascent: scale.apply(font.ascent),
    descent: scale.apply(font.descent),
    line_gap: scale.apply(font.line_gap),
    glyphs: glyphs.length(),
  }
  result
}
