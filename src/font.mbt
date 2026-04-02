// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// One door. A caller hands over bytes and gets a face; everything else is a
// method on that face. The types are re-exported from the model, so a caller
// that only imports `moonfont` has the error, the limits, the metrics and the
// masks in hand without knowing how many packages sit underneath.

///|
pub using @model {
  type Bounds,
  type CoverageMask,
  type FontMetrics,
  type GlyphId,
  type GlyphMetrics,
  type Limits,
  type Outline,
  type PathCommand,
  type Point,
  type Refused,
  type Scale,
  type TextMetrics,
}

///|
/// The version of the library.
pub fn version() -> String {
  "0.1.0"
}

///|
/// A loaded font face. It owns no bytes it did not borrow: parsing is lazy for
/// glyph outlines, so loading a large font costs a table directory and a few
/// small tables, not every glyph.
pub struct Face {
  head : @table.Head
  hhea : @table.Hhea
  maxp : @table.Maxp
  hmtx : @table.Hmtx
  cmap : @table.Cmap
  kern : @table.Kern
  os2 : @table.Os2
  source : @outline.GlyphSource
  limits : @model.Limits
}

///|
fn build(
  bytes : BytesView,
  directory : @sfnt.Directory,
  limits : @model.Limits,
) -> Face raise @model.Refused {
  let head = @table.Head::parse(
    directory.table(bytes, @sfnt.tag_head(), limits),
  )
  let maxp = @table.Maxp::parse(
    directory.table(bytes, @sfnt.tag_maxp(), limits),
    limits,
  )
  let hhea = @table.Hhea::parse(
    directory.table(bytes, @sfnt.tag_hhea(), limits),
  )
  let hmtx = @table.Hmtx::parse(
    directory.table(bytes, @sfnt.tag_hmtx(), limits),
    maxp.num_glyphs,
    hhea.number_of_h_metrics,
    limits,
  )
  let loca = @table.Loca::parse(
    directory.table(bytes, @sfnt.tag_loca(), limits),
    maxp.num_glyphs,
    head.index_to_loc_format,
    limits,
  )
  let cmap = @table.Cmap::parse(
    directory.table(bytes, @sfnt.tag_cmap(), limits),
    limits,
  )
  let kern = if directory.has(@sfnt.tag_kern()) {
    @table.Kern::parse(directory.table(bytes, @sfnt.tag_kern(), limits), limits)
  } else {
    @table.Kern::empty()
  }
  let os2 = if directory.has(@sfnt.tag_os2()) {
    @table.Os2::parse(directory.table(bytes, @sfnt.tag_os2(), limits))
  } else {
    @table.Os2::empty()
  }
  let glyf = directory.table(bytes, @sfnt.tag_glyf(), limits).all()
  let source = @outline.GlyphSource::of(glyf, loca, limits)
  { head, hhea, maxp, hmtx, cmap, kern, os2, source, limits, }
}

///|
/// Read the first face of a font file. A TrueType collection also has a first
/// face; `decode_all` is the entry point for the rest of them.
pub fn decode(
  bytes : BytesView,
  limits? : @model.Limits,
) -> Face raise @model.Refused {
  let limits = limits.unwrap_or(@model.Limits::default())
  let faces = @sfnt.read(bytes, limits)
  build(bytes, faces[0], limits)
}

///|
/// Read every face in the file. A plain font yields exactly one.
pub fn decode_all(
  bytes : BytesView,
  limits? : @model.Limits,
) -> Array[Face] raise @model.Refused {
  let limits = limits.unwrap_or(@model.Limits::default())
  let directories = @sfnt.read(bytes, limits)
  let faces : Array[Face] = []
  for i in 0..<directories.length() {
    faces.push(build(bytes, directories[i], limits))
  }
  faces
}

///|
/// How many glyphs the font declares.
pub fn Face::num_glyphs(self : Face) -> Int32 {
  self.maxp.num_glyphs
}

///|
/// The units in which outlines and advances are measured.
pub fn Face::units_per_em(self : Face) -> Int32 {
  self.head.units_per_em
}

///|
/// Font-wide metrics, in font units.
pub fn Face::font_metrics(self : Face) -> @model.FontMetrics {
  let result : @model.FontMetrics = {
    units_per_em: self.head.units_per_em,
    ascent: self.hhea.ascender,
    descent: self.hhea.descender,
    line_gap: self.hhea.line_gap,
    cap_height: self.os2.cap_height,
    x_height: self.os2.x_height,
    num_glyphs: self.maxp.num_glyphs,
    bounding_box: self.head.bounding_box,
  }
  result
}

///|
/// The scale for a pixel size, shared by measurement and rasterisation so the
/// two never disagree about where the pen stands.
pub fn Face::scale(self : Face, pixels_per_em : Int32) -> @model.Scale {
  @model.Scale::of(pixels_per_em, self.head.units_per_em)
}

///|
/// Translate a Unicode codepoint to a glyph id. `None` means the font has no
/// glyph; a caller decides what to draw in its place.
pub fn Face::glyph_index(self : Face, codepoint : Int32) -> @model.GlyphId? {
  self.cmap.glyph_index(codepoint)
}

///|
/// Translate a character to a glyph id.
pub fn Face::glyph_for(self : Face, character : Char) -> @model.GlyphId? {
  self.cmap.glyph_index(character.to_int())
}

///|
/// The outline of one glyph, in font units, as path commands. Curves are kept
/// as curves; flattening is the rasteriser's decision.
pub fn Face::outline(
  self : Face,
  glyph : @model.GlyphId,
) -> @model.Outline raise @model.Refused {
  self.source.outline(glyph)
}

///|
/// Horizontal metrics of one glyph, in font units.
pub fn Face::metrics(
  self : Face,
  glyph : @model.GlyphId,
) -> @model.GlyphMetrics raise @model.Refused {
  let index = glyph.to_int()
  if index < 0 || index >= self.maxp.num_glyphs {
    raise @model.MissingGlyph(glyph=index)
  }
  let (advance, bearing) = self.hmtx.metrics(index)
  let outline = self.outline(glyph)
  let result : @model.GlyphMetrics = {
    advance,
    left_side_bearing: bearing,
    bounds: outline.bounds(),
  }
  result
}

///|
/// Eight-bit coverage of one glyph at a pixel size. The mask carries its own
/// origin, so it can be copied into an atlas without further arithmetic.
pub fn Face::rasterise(
  self : Face,
  glyph : @model.GlyphId,
  pixels_per_em : Int32,
) -> @model.CoverageMask raise @model.Refused {
  let outline = self.outline(glyph)
  @raster.rasterise(outline, self.scale(pixels_per_em), self.limits)
}

///|
/// The legacy kern adjustment between two glyphs, in font units. Zero for
/// fonts that carry kerning only in GPOS, which this library does not shape.
pub fn Face::kern_between(
  self : Face,
  left : @model.GlyphId,
  right : @model.GlyphId,
) -> Int32 {
  self.kern.between(left.to_int(), right.to_int())
}

///|
/// Measure a run of text at a pixel size. Unknown codepoints are skipped, so
/// the returned `glyphs` count can be smaller than the character count.
pub fn Face::measure(
  self : Face,
  text : String,
  pixels_per_em : Int32,
  letter_spacing? : Int32,
) -> @model.TextMetrics {
  let glyphs : Array[@model.GlyphId] = []
  for character in text {
    match self.cmap.glyph_index(character.to_int()) {
      Some(glyph) => glyphs.push(glyph)
      None => ()
    }
  }
  @layout.measure(
    glyphs,
    self.hmtx,
    self.font_metrics(),
    self.scale(pixels_per_em),
    self.kern,
    letter_spacing=letter_spacing.unwrap_or(0),
  )
}
