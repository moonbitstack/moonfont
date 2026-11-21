// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// One door. A caller hands over bytes and gets a face; everything else is a
// method on that face. The types are re-exported from the model, so a caller
// that only imports `moonfont` has the error, the limits, the metrics and the
// masks in hand without knowing how many packages sit underneath.
//
// A face is one of two outline kinds — quadratic through `glyf`, cubic through
// `CFF` or `CFF2` — and either may vary along `fvar` axes. A caller never
// branches on which: `outline`, `metrics` and `rasterise` answer the same way.

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
/// The desktop preset, re-exported so one import reaches every name a caller
/// needs.
pub let limits : @model.Limits = @model.limits

///|
/// The untrusted-input preset.
pub let limits_strict : @model.Limits = @model.limits_strict

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
  source : @outline.GlyphSource?
  cff : @cff.Font?
  fvar : @variations.Fvar?
  avar : @variations.Avar?
  gvar : @variations.Gvar?
  hvar : @variations.Hvar?
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
  let mut source : @outline.GlyphSource? = None
  let mut cff : @cff.Font? = None
  if directory.has(@sfnt.tag_glyf()) {
    let loca = @table.Loca::parse(
      directory.table(bytes, @sfnt.tag_loca(), limits),
      maxp.num_glyphs,
      head.index_to_loc_format,
      limits,
    )
    let glyf = directory.table(bytes, @sfnt.tag_glyf(), limits).all()
    source = Some(@outline.GlyphSource::of(glyf, loca, limits))
  } else if directory.has(@sfnt.tag_cff2()) {
    cff = Some(
      @cff.Font::parse(
        directory.table(bytes, @sfnt.tag_cff2(), limits),
        true,
        head.units_per_em,
        limits,
      ),
    )
  } else if directory.has(@sfnt.tag_cff()) {
    cff = Some(
      @cff.Font::parse(
        directory.table(bytes, @sfnt.tag_cff(), limits),
        false,
        head.units_per_em,
        limits,
      ),
    )
  } else {
    raise @model.MissingTable(tag="glyf or CFF")
  }
  let fvar = if directory.has(@sfnt.tag_fvar()) {
    Some(
      @variations.Fvar::parse(
        directory.table(bytes, @sfnt.tag_fvar(), limits),
        limits,
      ),
    )
  } else {
    None
  }
  let avar = match fvar {
    Some(table) if directory.has(@sfnt.tag_avar()) =>
      Some(
        @variations.Avar::parse(
          directory.table(bytes, @sfnt.tag_avar(), limits),
          table.axes.length(),
          limits,
        ),
      )
    _ => None
  }
  let gvar = if directory.has(@sfnt.tag_gvar()) {
    Some(
      @variations.Gvar::parse(
        directory.table(bytes, @sfnt.tag_gvar(), limits),
        maxp.num_glyphs,
        limits,
      ),
    )
  } else {
    None
  }
  let hvar = if directory.has(@sfnt.tag_hvar()) {
    Some(
      @variations.Hvar::parse(
        directory.table(bytes, @sfnt.tag_hvar(), limits),
        limits,
      ),
    )
  } else {
    None
  }
  {
    head,
    hhea,
    maxp,
    hmtx,
    cmap,
    kern,
    os2,
    source,
    cff,
    fvar,
    avar,
    gvar,
    hvar,
    limits,
  }
}

///|
/// Read the first face of a font file. A TrueType collection also has a first
/// face; `decode_all` is the entry point for the rest of them. A WOFF or WOFF2
/// container is unpacked first, so a caller never chooses an entry point by
/// file extension.
pub fn decode(
  bytes : BytesView,
  limits~ : @model.Limits = @model.limits,
) -> Face raise @model.Refused {
  let plain = @woff.unpack(bytes, limits)
  let faces = @sfnt.read(plain, limits)
  build(plain, faces[0], limits)
}

///|
/// Read every face in the file. A plain font yields exactly one.
pub fn decode_all(
  bytes : BytesView,
  limits~ : @model.Limits = @model.limits,
) -> Array[Face] raise @model.Refused {
  let plain = @woff.unpack(bytes, limits)
  let directories = @sfnt.read(plain, limits)
  let faces : Array[Face] = []
  for i in 0..<directories.length() {
    faces.push(build(plain, directories[i], limits))
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
/// Whether the outlines are PostScript (`CFF` or `CFF2`) rather than TrueType.
pub fn Face::is_postscript(self : Face) -> Bool {
  self.cff is Some(_)
}

///|
/// Whether the font varies, and therefore whether an outline is a function of
/// a location rather than a constant.
pub fn Face::is_variable(self : Face) -> Bool {
  self.fvar is Some(_)
}

///|
/// The axes a caller may set. Empty for a font that does not vary.
pub fn Face::axes(self : Face) -> Array[@variations.Axis] {
  match self.fvar {
    Some(table) => table.axes
    None => []
  }
}

///|
/// The named instances the font offers, in `fvar` order.
pub fn Face::instances(self : Face) -> Array[@variations.Instance] {
  match self.fvar {
    Some(table) => table.instances
    None => []
  }
}

///|
/// The default instance: every axis at its default, which is where a font
/// without variation tables sits.
pub fn Face::location(self : Face) -> @variations.Location {
  match self.fvar {
    Some(table) => @variations.Location::default(table)
    None => { coords: [], }
  }
}

///|
/// A location on this face, from user-space axis values in 16.16 fixed point.
/// An axis the caller does not name keeps its default, and a font without axes
/// ignores every one of them.
pub fn Face::at(
  self : Face,
  values : Array[(Int32, Int32)],
) -> @variations.Location {
  match self.fvar {
    Some(table) => @variations.Location::of(table, values)
    None => { coords: [], }
  }
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
/// The normalised coordinates of a location. A location with fewer values than
/// the font has axes keeps the rest at their default.
fn Face::normalise(
  self : Face,
  location? : @variations.Location,
) -> Array[Int32] {
  match (self.fvar, location) {
    (Some(table), Some(at)) =>
      match self.avar {
        Some(mapping) => at.normalise(table, avar=mapping)
        None => at.normalise(table)
      }
    _ => []
  }
}

///|
/// The outline of one glyph, in font units, as path commands. Curves are kept
/// as curves; flattening is the rasteriser's decision. At a location, the
/// glyph is the instance the design describes there.
pub fn Face::outline(
  self : Face,
  glyph : @model.GlyphId,
  location? : @variations.Location,
) -> @model.Outline raise @model.Refused {
  let coords = self.normalise(location?)
  match self.cff {
    Some(font) => font.outline(glyph.to_int(), coords)
    None =>
      match (self.source, self.gvar) {
        (Some(source), Some(table)) if coords.length() > 0 =>
          source.outline(glyph, variation=table, coords~)
        (Some(source), _) => source.outline(glyph)
        (None, _) => raise @model.MissingTable(tag="glyf or CFF")
      }
  }
}

///|
/// The advance width of one glyph in font units, at a location.
pub fn Face::advance(
  self : Face,
  glyph : @model.GlyphId,
  location? : @variations.Location,
) -> Int32 {
  let index = glyph.to_int()
  let (width, _) = self.hmtx.metrics(index)
  let coords = self.normalise(location?)
  if coords.length() == 0 {
    return width
  }
  match self.hvar {
    Some(table) => width + table.advance_delta(index, coords)
    None =>
      match (self.gvar, self.source) {
        (Some(table), Some(source)) => {
          let (_, delta) = source.phantom_deltas(glyph, table, coords) catch {
            _ => (0, 0)
          }
          width + delta
        }
        _ => width
      }
  }
}

///|
/// Horizontal metrics of one glyph, in font units.
pub fn Face::metrics(
  self : Face,
  glyph : @model.GlyphId,
  location? : @variations.Location,
) -> @model.GlyphMetrics raise @model.Refused {
  let index = glyph.to_int()
  if index < 0 || index >= self.maxp.num_glyphs {
    raise @model.MissingGlyph(glyph=index)
  }
  let (_, bearing) = self.hmtx.metrics(index)
  let coords = self.normalise(location?)
  let mut offset = 0
  if coords.length() > 0 {
    match self.hvar {
      Some(table) => offset = table.lsb_delta(index, coords)
      None =>
        match (self.gvar, self.source) {
          (Some(table), Some(source)) =>
            offset = (source.phantom_deltas(glyph, table, coords) catch {
                _ => (0, 0)
              }).0
          _ => ()
        }
    }
  }
  let outline = self.outline(glyph, location?)
  let result : @model.GlyphMetrics = {
    advance: self.advance(glyph, location?),
    left_side_bearing: bearing + offset,
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
  location? : @variations.Location,
) -> @model.CoverageMask raise @model.Refused {
  let outline = self.outline(glyph, location?)
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
  location? : @variations.Location,
) -> @model.TextMetrics {
  let glyphs : Array[@model.GlyphId] = []
  for character in text {
    match self.cmap.glyph_index(character.to_int()) {
      Some(glyph) => glyphs.push(glyph)
      None => ()
    }
  }
  let at = location
  @layout.measure(
    glyphs,
    index => {
      match at {
        Some(point) => self.advance(@model.GlyphId::of(index), location=point)
        None => self.advance(@model.GlyphId::of(index))
      }
    },
    self.font_metrics(),
    self.scale(pixels_per_em),
    self.kern,
    letter_spacing=letter_spacing.unwrap_or(0),
  )
}
