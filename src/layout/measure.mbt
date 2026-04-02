// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// A measured run is a sum in 26.6 pixels. Keeping the sum in the same fixed
// point as the rasteriser means `measure` and `rasterise` agree about where the
// next glyph starts, with no conversion at the boundary.

///|
/// The horizontal extent of a run of glyph ids, plus the font's vertical
/// rhythm at the same size.
pub fn measure(
  glyphs : Array[@model.GlyphId],
  hmtx : @table.Hmtx,
  font : @model.FontMetrics,
  scale : @model.Scale,
  kern : @table.Kern,
  letter_spacing? : Int32,
) -> @model.TextMetrics {
  let spacing = letter_spacing.unwrap_or(0)
  let mut advance = 0
  for i in 0..<glyphs.length() {
    let (width, _) = hmtx.metrics(glyphs[i].to_int())
    advance += scale.apply(width)
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
