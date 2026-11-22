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
  type VerticalMetrics,
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
  hmtx : @table.Metrics
  vhea : @table.Vhea?
  vmtx : @table.Metrics?
  cmap : @table.Cmap
  kern : @table.Kern
  os2 : @table.Os2
  source : @outline.GlyphSource?
  cff : @cff.Font?
  fvar : @variations.Fvar?
  avar : @variations.Avar?
  gvar : @variations.Gvar?
  hvar : @variations.MetricDeltas?
  vvar : @variations.MetricDeltas?
  mvar : @variations.Mvar?
  cvar : @variations.Cvar?
  cvt : @table.Cvt?
  limits : @model.Limits
}

///|
fn build(
  source : &@sfnt.TableSource,
  limits : @model.Limits,
) -> Face raise @model.Refused {
  let head = @table.Head::parse(
    @sfnt.table_cursor(source, @sfnt.tag_head(), limits),
  )
  let maxp = @table.Maxp::parse(
    @sfnt.table_cursor(source, @sfnt.tag_maxp(), limits),
    limits,
  )
  let hhea = @table.Hhea::parse(
    @sfnt.table_cursor(source, @sfnt.tag_hhea(), limits),
  )
  let hmtx = @table.Metrics::parse(
    @sfnt.table_cursor(source, @sfnt.tag_hmtx(), limits),
    maxp.num_glyphs,
    hhea.number_of_h_metrics,
    limits,
  )
  // A vertical pair is read only when the header exists: `vmtx` without `vhea`
  // has no count to read it against, and a font that sets text horizontally
  // usually has neither.
  let vhea = if source.has(@sfnt.tag_vhea()) {
    Some(
      @table.Vhea::parse(@sfnt.table_cursor(source, @sfnt.tag_vhea(), limits)),
    )
  } else {
    None
  }
  let vmtx = match vhea {
    Some(header) =>
      if source.has(@sfnt.tag_vmtx()) {
        Some(
          @table.Metrics::parse(
            @sfnt.table_cursor(source, @sfnt.tag_vmtx(), limits),
            maxp.num_glyphs,
            header.number_of_long_metrics,
            limits,
          ),
        )
      } else {
        None
      }
    None => None
  }
  let cmap = @table.Cmap::parse(
    @sfnt.table_cursor(source, @sfnt.tag_cmap(), limits),
    limits,
  )
  let kern = if source.has(@sfnt.tag_kern()) {
    @table.Kern::parse(
      @sfnt.table_cursor(source, @sfnt.tag_kern(), limits),
      limits,
    )
  } else {
    @table.Kern::empty()
  }
  let os2 = if source.has(@sfnt.tag_os2()) {
    @table.Os2::parse(@sfnt.table_cursor(source, @sfnt.tag_os2(), limits))
  } else {
    @table.Os2::empty()
  }
  let mut source_glyphs : @outline.GlyphSource? = None
  let mut cff : @cff.Font? = None
  if source.has(@sfnt.tag_glyf()) {
    let loca = @table.Loca::parse(
      @sfnt.table_cursor(source, @sfnt.tag_loca(), limits),
      maxp.num_glyphs,
      head.index_to_loc_format,
      limits,
    )
    let glyf = source.table_bytes(@sfnt.tag_glyf(), limits)
    source_glyphs = Some(@outline.GlyphSource::of(glyf, loca, limits))
  } else if source.has(@sfnt.tag_cff2()) {
    cff = Some(
      @cff.Font::parse(
        @sfnt.table_cursor(source, @sfnt.tag_cff2(), limits),
        true,
        head.units_per_em,
        limits,
      ),
    )
  } else if source.has(@sfnt.tag_cff()) {
    cff = Some(
      @cff.Font::parse(
        @sfnt.table_cursor(source, @sfnt.tag_cff(), limits),
        false,
        head.units_per_em,
        limits,
      ),
    )
  } else {
    raise @model.MissingTable(tag="glyf or CFF")
  }
  let fvar = if source.has(@sfnt.tag_fvar()) {
    Some(
      @variations.Fvar::parse(
        @sfnt.table_cursor(source, @sfnt.tag_fvar(), limits),
        limits,
      ),
    )
  } else {
    None
  }
  let avar = match fvar {
    Some(table) if source.has(@sfnt.tag_avar()) =>
      Some(
        @variations.Avar::parse(
          @sfnt.table_cursor(source, @sfnt.tag_avar(), limits),
          table.axes.length(),
          limits,
        ),
      )
    _ => None
  }
  let gvar = if source.has(@sfnt.tag_gvar()) {
    Some(
      @variations.Gvar::parse(
        @sfnt.table_cursor(source, @sfnt.tag_gvar(), limits),
        maxp.num_glyphs,
        limits,
      ),
    )
  } else {
    None
  }
  let hvar = if source.has(@sfnt.tag_hvar()) {
    Some(
      @variations.MetricDeltas::parse(
        @sfnt.table_cursor(source, @sfnt.tag_hvar(), limits),
        limits,
      ),
    )
  } else {
    None
  }
  let vvar = if source.has(@sfnt.tag_vvar()) {
    Some(
      @variations.MetricDeltas::parse(
        @sfnt.table_cursor(source, @sfnt.tag_vvar(), limits),
        limits,
      ),
    )
  } else {
    None
  }
  let mvar = if source.has(@sfnt.tag_mvar()) {
    Some(
      @variations.Mvar::parse(
        @sfnt.table_cursor(source, @sfnt.tag_mvar(), limits),
        limits,
      ),
    )
  } else {
    None
  }
  let cvt = if source.has(@sfnt.tag_cvt()) {
    Some(
      @table.Cvt::parse(
        @sfnt.table_cursor(source, @sfnt.tag_cvt(), limits),
        limits,
      ),
    )
  } else {
    None
  }
  let cvar = match (cvt, fvar) {
    (Some(_), Some(table)) =>
      if source.has(@sfnt.tag_cvar()) {
        Some(
          @variations.Cvar::parse(
            @sfnt.table_cursor(source, @sfnt.tag_cvar(), limits),
            table.axes.length(),
            limits,
          ),
        )
      } else {
        None
      }
    _ => None
  }
  {
    head,
    hhea,
    maxp,
    hmtx,
    vhea,
    vmtx,
    cmap,
    kern,
    os2,
    source: source_glyphs,
    cff,
    fvar,
    avar,
    gvar,
    hvar,
    vvar,
    mvar,
    cvar,
    cvt,
    limits,
  }
}

///|
/// The containers this library opens, in the order they are tried. A new
/// container format is one entry here and one package under `src/`: the
/// façade, the table layer and every reader above it stay as they are.
let containers : Array[&@sfnt.Container] = [
  @sfnt.Sfnt::new(),
  @woff.Woff1::new(),
  @woff.Woff2::new(),
]

///|
/// Every face in a file, whatever container it arrived in.
fn faces_of(
  bytes : BytesView,
  limits : @model.Limits,
) -> Array[@sfnt.TableSet] raise @model.Refused {
  limits.check_file(bytes.length())
  if bytes.length() < 4 {
    raise @model.Truncated(at=0, want=4)
  }
  let magic = (bytes[0].to_int() << 24) |
    (bytes[1].to_int() << 16) |
    (bytes[2].to_int() << 8) |
    bytes[3].to_int()
  for container in containers {
    if container.claims(magic) {
      return container.open(bytes, limits)
    }
  }
  raise @model.Unknown(at=0, got="a file that opens with \{magic}")
}

///|
/// Read the first face of a font file. A collection, a WOFF file and a WOFF2
/// file all have a first face; `decode_all` is the entry point for the rest. A
/// caller never chooses an entry point by file extension.
pub fn decode(
  bytes : BytesView,
  limits~ : @model.Limits = @model.limits,
) -> Face raise @model.Refused {
  let faces = faces_of(bytes, limits)
  build(faces[0], limits)
}

///|
/// Read every face in the file. A plain font yields exactly one.
pub fn decode_all(
  bytes : BytesView,
  limits~ : @model.Limits = @model.limits,
) -> Array[Face] raise @model.Refused {
  let faces = faces_of(bytes, limits)
  let built : Array[Face] = []
  for face in faces {
    built.push(build(face, limits))
  }
  built
}

///|
/// Build a face from a table source rather than from a file: the entry point
/// for a caller whose tables come from somewhere this library does not read,
/// such as a memory map, a file handle or a fetch that returns one table at a
/// time. `decode` is this function over the faces a container finds.
pub fn decode_from(
  source : &@sfnt.TableSource,
  limits~ : @model.Limits = @model.limits,
) -> Face raise @model.Refused {
  build(source, limits)
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
/// Font-wide metrics, in font units. At a location, `MVAR` moves the vertical
/// extent and the one-off heights: a face whose bold master is taller reports
/// that height here rather than at the default instance only.
pub fn Face::font_metrics(
  self : Face,
  location? : @variations.Location,
) -> @model.FontMetrics {
  let coords = self.normalise(location?)
  let mvar = self.mvar
  let shift = fn(tag : Int32) -> Int32 {
    if coords.length() == 0 {
      return 0
    }
    match mvar {
      Some(table) => table.delta(tag, coords)
      None => 0
    }
  }
  let result : @model.FontMetrics = {
    units_per_em: self.head.units_per_em,
    ascent: self.hhea.ascender + shift(@sfnt.tag_hasc()),
    descent: self.hhea.descender + shift(@sfnt.tag_hdsc()),
    line_gap: self.hhea.line_gap + shift(@sfnt.tag_hlgp()),
    cap_height: self.os2.cap_height + shift(@sfnt.tag_cpht()),
    x_height: self.os2.x_height + shift(@sfnt.tag_xhgt()),
    num_glyphs: self.maxp.num_glyphs,
    bounding_box: self.head.bounding_box,
  }
  result
}

///|
/// The measurements of a column, in font units. A font without `vhea` gets the
/// horizontal ones, so a caller that sets text vertically never has to ask
/// whether the vertical pair exists.
pub fn Face::vertical_metrics(
  self : Face,
  location? : @variations.Location,
) -> @model.VerticalMetrics {
  let coords = self.normalise(location?)
  let shift = fn(tag : Int32) -> Int32 {
    if coords.length() == 0 {
      return 0
    }
    match self.mvar {
      Some(table) => table.delta(tag, coords)
      None => 0
    }
  }
  match self.vhea {
    Some(header) =>
      {
        ascent: header.ascender + shift(@sfnt.tag_vasc()),
        descent: header.descender + shift(@sfnt.tag_vdsc()),
        line_gap: header.line_gap + shift(@sfnt.tag_vlgp()),
      }
    None =>
      {
        ascent: self.hhea.ascender,
        descent: self.hhea.descender,
        line_gap: self.hhea.line_gap,
      }
  }
}

///|
/// Whether the font carries vertical metrics of its own.
pub fn Face::has_vertical_metrics(self : Face) -> Bool {
  self.vhea is Some(_)
}

///|
/// The advance height of one glyph in font units, at a location: the step from
/// one glyph to the next in a column. A font without `vmtx` advances by its em,
/// which is what a vertical layout does with a font that only describes
/// horizontal text.
pub fn Face::advance_height(
  self : Face,
  glyph : @model.GlyphId,
  location? : @variations.Location,
) -> Int32 {
  let index = glyph.to_int()
  let base = match self.vmtx {
    Some(table) => table.metrics(index).0
    None => self.head.units_per_em
  }
  let coords = self.normalise(location?)
  if coords.length() == 0 {
    return base
  }
  match self.vvar {
    Some(table) => base + table.advance_delta(index, coords)
    None => base
  }
}

///|
/// The top side bearing of one glyph, in font units: the distance from the top
/// of a column to the ink.
pub fn Face::top_side_bearing(
  self : Face,
  glyph : @model.GlyphId,
  location? : @variations.Location,
) -> Int32 {
  let index = glyph.to_int()
  let (_, bearing) = match self.vmtx {
    Some(table) => table.metrics(index)
    None => (0, 0)
  }
  let coords = self.normalise(location?)
  if coords.length() == 0 {
    return bearing
  }
  match self.vvar {
    Some(table) => bearing + table.bearing_delta(index, coords)
    None => bearing
  }
}

///|
/// The control values of the font, in font units, moved to a location by
/// `cvar`. Empty for a font without a `cvt ` table. A caller that hints reads
/// these as the distances its programs snap to.
pub fn Face::cvt(self : Face, location? : @variations.Location) -> Array[Int32] {
  let values = match self.cvt {
    Some(table) => table.values.copy()
    None => []
  }
  if values.length() == 0 {
    return values
  }
  let coords = self.normalise(location?)
  if coords.length() == 0 {
    return values
  }
  match self.cvar {
    Some(table) => {
      let deltas = table.deltas(values.length(), coords) catch { _ => [] }
      for i in 0..<values.length() {
        if i < deltas.length() {
          values[i] += deltas[i]
        }
      }
      values
    }
    None => values
  }
}

///|
/// The `MVAR` value tags this face varies: empty for a font without the table,
/// otherwise the tags as four-character words.
pub fn Face::metric_tags(self : Face) -> Array[Int32] {
  match self.mvar {
    Some(table) => table.tags()
    None => []
  }
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
      Some(table) => offset = table.bearing_delta(index, coords)
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
