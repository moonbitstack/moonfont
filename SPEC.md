# moonfont -- Technical Specification

Status: authoritative for v0.1.0. Module `moonbitstack/moonfont`. Last revised 2026-11-12.
This document is the single source of truth for the architecture. `contracts/API.md`
owns names and signatures, `contracts/LAYOUT.md` owns the tree and dependency
direction, `contracts/DIFFTEST.md` owns fixtures and tolerances. Where those three
and this document disagree, the contract named by the subject wins; the disagreement
is a defect to be repaired, not a licence to interpret.

Language: en-GB throughout. No byline, attribution line or contributor mark
appears in any file.

---

## 1. Architectural thesis

moonfont is a pure MoonBit library that turns an in-memory byte span into glyph
identities, outlines, metrics and an eight-bit coverage mask, and does so with no
I/O, no platform font discovery, no device, no cache and no mutable face state.
Its single organising principle is **a font is a value, a face is a result, and
the byte span is the only state**: each layer either narrows bytes (source, reader,
table directory, table decoders) or widens meaning (decoders, domain values, path
commands, coverage, measurement), and every arrow points one way. Every predecessor
put a mutable, device-aware session at the centre -- FreeType's `FT_Face` with its
glyph slot, `FT_Size` and `FT_Library`; Skia's `SkTypeface` plus `SkFont` pair;
DirectWrite's `IDWriteFontFace` bound to a render target; fontTools' lazy `TTFont`
dictionary of tables; HarfBuzz's `hb_font_t` with callbacks -- and then had to
invent a second object to escape it. moonfont makes `Face` an immutable bundle of
borrowed, decoded tables returned by `decode`, so the same face serves a GUI at
12 px and a game at 96 px at the same time, on four backends, with zero declared
dependencies, and the parser cannot learn what a pixel is. This is why the surface
is small: once state is removed, the pen protocol, the outline builder, the raster
target, the colour painter and the subsetter cease to be five subsystems and become
five optional views over the same two values -- `PathCommand` and `CoverageMask`.

## 2. Constraints (fixed before any design work)

| Class | Constraint | Evidence |
| --- | --- | --- |
| Scale | One font file up to 256 MiB (default) or 16 MiB (strict), 65 536 glyphs, 65 536 points and 8 192 contours per glyph, masks up to 67 108 864 pixels. One file, one face at a time; no batching API. | `src/model/limits.mbt` |
| Latency | `decode` reads the directory and nine small tables, never every glyph. Outline extraction is lazy at `Face::outline`. No allocation proportional to file size. | `src/font.mbt::build` |
| Cost | Four backends from one source with no target-specific files, no FFI and no external module. A second backend must not require a second implementation. | `moon.mod`, CI matrix |
| Compliance | Font binaries are untrusted input. Only freely redistributable fonts (OFL, Apache-2.0, BSD) enter the corpus, each with source, licence and SHA-256. No personal data, no network, no filesystem. | `DECISIONS.md` D-14 |
| Team capability | One MoonBit toolchain (`moon 0.1.20261104`), one language, one deterministic generator. No Rust, C or Go toolchain is needed to run the test suite; reference tools run offline only. | `.github/workflows/ci.yml` |

## 3. Layer stack

Strict direction: **downward only**. A layer may import a layer with a lower
number, never a higher or equal one. Siblings at the same level do not import each
other; shared vocabulary lives in L0. This is mechanically checkable from each
`moon.pkg` import block (see `contracts/LAYOUT.md`, gate `LD-01`).

```
   caller:  moonegui | moongfx | moonplot | moongame
                          |
   +----------------------v-----------------------+
L7 | FACE FACADE        src/                      |  decode, decode_all, Face
   +---+--------+--------+--------+--------+------+
       |        |        |        |        |
L6     | LAYOUT | src/layout/                     |  measure
L5     |        | RASTER + COLOUR   src/raster/  |  coverage (colour: OUT)
L4     |        | OUTLINE   src/outline/         |  PathCommand, composites
L3     |        | TABLE DECODERS    src/table/   |  head, cmap, loca, glyf...
L2     |        | SFNT CONTAINER    src/sfnt/    |  Directory, TTC
L1     |        | RANDOM ACCESS     src/wire/    |  Cursor, bounds checks
L0     |        | CONTRACTS + MODEL src/model/   |  Refused, Limits, values
   +---+--------+--------+--------+--------+------+
                          |
              moonbitlang/core (built-in only)
```

| L | Name | Package path | Responsibility | Allowed to know | MUST NOT know |
| --- | --- | --- | --- | --- | --- |
| L0 | Contracts and domain model | `moonbitstack/moonfont/model` | The vocabulary every layer speaks: `Refused`, `Limits`, `Bounds`, `Point`, `PathCommand`, `Outline`, `GlyphId`, `Scale`, `CoverageMask`, `FontMetrics`, `GlyphMetrics`, `TextMetrics`. | Built-in scalar and collection types only. | Bytes, offsets, tags, table names, glyph file layout, pixels, scanlines, files, platforms. |
| L1 | Byte source and random access | `moonbitstack/moonfont/wire` | A bounds-checked big-endian `Cursor` over a `BytesView`; windows into a table; `u8`/`i8`/`u16`/`i16`/`u24`/`u32`/`tag`, seek, skip, rest. | L0. Byte order, cursor position, `Refused`. | What a font is, what a table is, any table tag, any pixel. |
| L2 | SFNT container and table directory | `moonbitstack/moonfont/sfnt` | Signature recognition (`0x00010000`, `OTTO`, `true`, `ttcf`), TTC versions 1.0/2.0, `TableRecord`, `Directory`, range validation, `tag_*` helpers, `read`. | L0, L1. The 12-byte header and 16-byte directory record. | The meaning of any table body. Never parses a table. |
| L3 | Table decoders | `moonbitstack/moonfont/table` | `Head`, `Hhea`, `Maxp`, `Hmtx`, `Cmap`, `Loca`, `Os2`, `Kern`, `GlyphData` (`Simple`, `Composite`, `Empty`). Each turns a bounded cursor into domain values and stops. | L0, L1, L2 via a bounded `Cursor`. Its own table's binary layout. | Path commands, curves, pixels, scanlines, other tables' semantics, the face. |
| L4 | Outline commands | `moonbitstack/moonfont/outline` | `GlyphSource::outline`: points plus on-curve bits become `PathCommand`s, composite components are resolved and transformed, recursion is bounded. | L0, L3. Quadratic Bezier geometry. | How a curve is flattened, how coverage is computed, which table a point came from, device pixels. |
| L5 | Rasterisation | `moonbitstack/moonfont/raster` | The one place where geometry becomes coverage. Analytic area accumulation in 26.6 fixed point, eight vertical subsamples, non-zero winding, no floating point. | L0 only: `Outline`, `Scale`, `Limits`, `CoverageMask`. | SFNT, tables, charmaps, glyph ids, files, colour, compositing, the face. |
| L6 | Layout | `moonbitstack/moonfont/layout` | `measure`: sum advances, apply legacy `kern` pairs and letter spacing, produce `TextMetrics`. | L0, L3 (`Hmtx`, `Kern`, `FontMetrics`). | Pixels, outlines, Unicode properties, bidi, script itemisation, shaping. |
| L7 | Face facade | `moonbitstack/moonfont` (`src/`) | `decode`, `decode_all`, `Face` methods, `pub using @model` re-exports. Wiring and default resolution only; no algorithm of its own. | All of L0-L6. | Nothing new. It introduces no type that a lower layer needs. |

### Invariants

- **INV-01 (no I/O).** No package under `src/` reads a file, opens a stream, uses
  a clock, consults an environment variable or performs a network call. Input is
  `BytesView`; output is a value. I/O belongs to `integration/` only.
- **INV-02 (no platform font discovery).** No family matching, system font
  enumeration, fontconfig, registry lookup, installed-font cache or fallback
  chain. Such work belongs in an integration package owned by the host.
- **INV-03 (no raster concerns in the parser).** L0-L4 contain no pixel, no
  scanline, no sample buffer, no anti-aliasing decision and no `Double`. L5 is
  the only package that may produce a `CoverageMask`.
- **INV-04 (one-way narrowing).** Lower layers never import upper layers. `raster`
  imports `model` alone -- a check that the seam is real, not decorative.
- **INV-05 (borrowed bytes).** `Face` holds `BytesView` slices, not copies of the
  file. A caller keeps the byte span alive and unchanged for the face's lifetime.
- **INV-06 (immutable face).** Every `Face` method is a pure read. There is no
  current size, current charmap, current transform, glyph slot or render mode.
  `Scale` is an argument, never state.
- **INV-07 (untrusted input).** Every declaration in the file is validated before
  the allocation it guards. No public function panics on file-derived data; all
  failures are `Refused`.
- **INV-08 (determinism).** Outline and coverage arithmetic is integer only. The
  same bytes and glyph id yield bit-identical `Outline` and `CoverageMask` on
  wasm, wasm-gc, js and native. Hinted glyphs are excluded from this promise by
  being excluded from the release.
- **INV-09 (single error type).** One `Refused` suberror with nine variants and a
  stable field vocabulary (`at`, `got`, `want`, `limit`, `tag`, `glyph`, `depth`).
  A caller writes one handler.
- **INV-10 (explicit defaults).** A default is resolved once at the facade and the
  resolved value is passed down. No internal function consults a default.
- **INV-11 (no orphan capability).** A contract with no implementation and no
  consumer is not opened in this release. Colour painting, variation locations,
  writing and subsetting are named in section 4 as convergent abstractions and
  listed as OUT in section 5; no trait, stub or placeholder for them exists in
  `src/`.

## 4. Core abstractions as neutral contracts

Each row is the invariant that mature ecosystems converge on, stated without
reference to any one library. "Binding" says how v0.1.0 realises it. Where a
contract is realised as an owned value rather than a trait, that is deliberate:
owned values make golden comparison, `Eq` derivation and four-backend determinism
straightforward (`DECISIONS.md` D-03).

| Contract | Purpose | Minimal operations | Ecosystem names | Layer | Binding in v0.1.0 |
| --- | --- | --- | --- | --- | --- |
| `Source` | An immutable, random-access span of bytes; the only state in the library. | `length`; `byte(at)`; `view(start, end)` | FreeType `FT_Stream` / `FT_Open_Args`; fontTools `SFNTReader` file object; Go `sfnt.Parse(io.ReaderAt)`; ttf-parser `Face::parse(&[u8])`; skrifa `FontRef` + `TableProvider`; HarfBuzz `hb_blob_t`; stb_truetype `unsigned char*`; SixLabors.Fonts `FontReader`; opentype.js `parseBuffer` / `DataView`; Java `Font.createFont(InputStream)`; FontBox `RandomAccessRead`; CoreText `CGDataProvider`; TTFunk `File` | L1 | Built-in `BytesView`, held by `wire.Cursor`. No trait is needed: MoonBit's built-in already supplies the contract, and adding a trait would add no capability. |
| `Reader` | A positioned, bounds-checked cursor giving big-endian integers and a window that cannot escape its parent range. | `position`, `length`, `left`, `seek`, `skip`, `u8`, `i16`, `u16`, `u32`, `tag`, `window`, `rest`, `all` | fontTools `SFNTReader` / `BinaryIO`; FreeType `FT_Stream_Read*`; read-fonts `FontRead` / `ReadArray`; opentype.js `Parser`; Typr `bin`; fontkit `r`; stb_truetype `stbtt__buf`; moonimage `wire.Cursor` | L1 | `wire.Cursor`, whose `window` returns a cursor bounded to a table. Short reads raise `Truncated` with an absolute offset. |
| `TableDirectory` | An ordered map from a four-byte tag to `(checksum, offset, length)`, with every range checked against the file before use. | `find`, `has`, `require`, `table` | FreeType `sfnt_dir` / `TT_Table`; fontTools `SFNTReader.tables`; opentype.js `font.tables`; ttf-parser `RawFace`; Go `sfnt` table records; skrifa `TableDirectory`; TTFunk `Table::Directory`; php-font-lib `DirectoryEntry`; HarfBuzz `hb_face_reference_table`; DirectWrite `TryGetFontTable` | L2 | `sfnt.Directory` holding `Array[TableRecord]`; tags are `Int32` words, so lookup is integer comparison and builds no string. |
| `Face` | One font's decoded tables plus the operations that make no sense below. | `units_per_em`, `num_glyphs`, `font_metrics`, `scale`, `glyph_index`, `outline`, `metrics`, `rasterise`, `measure` | FreeType `FT_Face`; HarfBuzz `hb_face_t` / `hb_font_t`; Skia `SkTypeface`; DirectWrite `IDWriteFontFace`; CoreText `CTFont`; `java.awt.Font` / `Font2D`; SixLabors.Fonts `Font`; PDFBox `PDFont`; opentype.js `Font`; fontkit `Font`; skrifa `FontRef`; ttf-parser `Face`; Go `sfnt.Font`; Android `Typeface`; Skiko `Typeface` | L7 | `Face`, an immutable struct of nine borrowed decoded tables. It is a *result* of `decode`, not a session: no mutable slot, no current size. |
| `Collection` | A container of N faces addressable by index; a plain font is a collection of one. | `length`, `face(index)` | FreeType `FT_New_Face(..., face_index)`; fontTools `TTCollection`; HarfBuzz `hb_face_create(blob, index)`; fontkit `TrueTypeCollection`; DirectWrite `IDWriteFontCollection`; CoreText `CTFontCollection`; Go `sfnt.Collection`; Android font families | L2 / L7 | Not a separate type. `sfnt.read` returns `Array[Directory]`, and `decode_all` returns `Array[Face]`, so a caller never branches on container kind. This is smaller than a `Collection` object and loses no operation. |
| `Charmap` | Codepoint to glyph id, with an explicit "no glyph" answer. | `glyph_index(codepoint) -> GlyphId?` | FreeType `FT_CharMap` / `FT_Get_Char_Index`; HarfBuzz `hb_font_get_nominal_glyph`; fontTools `getBestCmap`; opentype.js `charToGlyphIndex`; fontkit `CmapProcessor`; Go `sfnt.Font.GlyphIndex`; Skia `charsToGlyphs`; DirectWrite `GetGlyphIndices`; CoreText `CTFontGetGlyphsForCharacters`; TTFunk `Cmap` | L3 / L7 | `table.Cmap` with `format()` and `glyph_index()`, surfaced as `Face::glyph_index` and `Face::glyph_for`. `None` means no glyph; the caller chooses the substitute. |
| `GlyphId` | An opaque index, never a character and never a byte offset. | `of`, `to_int`, `Eq` | FreeType `FT_UInt`; HarfBuzz `hb_codepoint_t`; Skia `SkGlyphID`; CoreText `CGGlyph`; DirectWrite `UINT16`; ttf-parser `GlyphId`; skrifa `GlyphId`; Go `sfnt.GlyphIndex`; opentype.js `glyph.index` | L0 | `model.GlyphId { index : Int32 }`, `Eq` + `Debug`. |
| `OutlineSink` | The destination for path commands; the seam between parsing and every consumer. | `move_to`, `line_to`, `quad_to`, `cubic_to`, `close` | fontTools `BasePen` / `RecordingPen` / `SVGPathPen`; FreeType `FT_Outline_Funcs` + `FT_Outline_Decompose`; HarfBuzz `hb_draw_funcs_t`; skrifa `Pen`; ttf-parser `OutlineBuilder`; Skia `SkPathBuilder`; DirectWrite `IDWriteGeometrySink`; CoreText `CGPath`; `java.awt.geom.Path2D`; opentype.js `Path`; Go `sfnt.Segments`; SixLabors `IPath`; msdfgen `Shape` | L4 | Realised as an owned `Outline` value (an `Array[PathCommand]` plus `Bounds`). Consumers iterate `Outline::commands()`. A streaming pen is deliberately not exposed in v0.1.0; adding one later is additive and cannot break the value. |
| `PathCommand` | The five-verb geometry interchange type; the only thing L5 consumes from L4. | `MoveTo`, `LineTo`, `QuadTo`, `CubicTo`, `Close` | fontTools pen verbs; Skia `SkPath::Verb`; HarfBuzz draw callbacks; `CGPathElement`; Java `PathIterator` `SEG_*`; Go `sfnt.SegmentOp`; SVG path `d`; opentype.js `M`/`L`/`Q`/`C`/`Z` | L0 | `model.PathCommand`, `Eq` + `Debug`, coordinates in font units as `Int32`. Quadratic curves are preserved, never flattened at parse time. |
| `Metrics` | Font-wide and per-glyph measurements in font units, before scaling. | `units_per_em`, `ascent`, `descent`, `line_gap`, `advance`, `left_side_bearing`, `bounds` | FreeType `FT_Glyph_Metrics` / `FT_Size_Metrics`; HarfBuzz `hb_glyph_extents_t` / `hb_font_extents_t`; fontTools `hmtx` / `OS/2`; opentype.js `advanceWidth` / `ascender`; ttf-parser `Face::ascender` / `glyph_hor_advance`; skrifa `GlyphMetrics`; Go `sfnt.Font.GlyphAdvance`; SixLabors `GlyphMetrics` / `FontMetrics`; Pillow `getbbox`; Java `FontMetrics`; DirectWrite `DWRITE_FONT_METRICS` / `DWRITE_GLYPH_METRICS`; CoreText `CTFontGetAscent` | L0 | `model.FontMetrics`, `model.GlyphMetrics`, `model.TextMetrics`, `model.Bounds`. All `Int32`; no floating point. |
| `Scale` | Font units to 26.6 pixel units, passed per call rather than set on the face. | `of(ppem, units_per_em)`, `apply`, `ppem` | FreeType `FT_Set_Char_Size` / `FT_Set_Pixel_Sizes` / `FT_Matrix` / `FT_Size`; HarfBuzz `hb_font_set_scale` / `hb_font_set_ppem`; Skia `SkFont::setSize`; DirectWrite `IDWriteTextLayout` size; CoreText `CGAffineTransform`; skrifa `Size`; stb_truetype `stbtt_ScaleForPixelHeight`; opentype.js `unitsPerEm`; Pillow `size` | L0 | `model.Scale { ppem, units_per_em }`, produced by `Face::scale`. Measurement and rasterisation share it, so they cannot disagree about the pen position. |
| `VariationLocation` | Normalised coordinates along a font's variation axes. | `default(axes)`, `get(axis)`, `set(axis, value)` | FreeType `FT_Set_Var_Design_Coordinates` / `FT_MM_Var`; HarfBuzz `hb_font_set_variations` / `hb_ot_var_normalize_coords`; fontTools `varLib.instancer` / `setLocation`; DirectWrite `IDWriteFontFace5`; CoreText `CTFontCopyVariationAxes`; skrifa `Location` / `AxisCollection` / `NormalizedCoord`; opentype.js `fvar`; fontkit `getVariation`; CSS `font-variation-settings`; Android `FontVariationAxis` | L0 (reserved) | **Not opened in v0.1.0.** Only the default instance is read; `fvar`/`gvar` raise `Unsupported`. The seam is named here so that adding it later is a new subpackage, not a change to `Face`. |
| `RasterTarget` | The destination for eight-bit coverage, with its own origin and stride so an atlas can be filled without a copy. | `width`, `height`, `put(x, y, coverage)`, `at(x, y)` | FreeType `FT_Bitmap` / `FT_Render_Glyph` / `FT_GlyphSlot`; stb_truetype `stbtt_GetGlyphBitmap`; fontdue `RasterizedGlyph`; `ab_glyph` `GlyphBitmap`; Skia `SkMask` / `SkPixmap`; DirectWrite `IDWriteGlyphRunAnalysis` / `IDWriteBitmapRenderTarget`; CoreText `CGBitmapContext`; Pillow `ImageFont.getmask`; Go `golang-freetype/raster.Painter` + `image.Alpha`; msdfgen `Bitmap`; SixLabors `Buffer2D`; gioui atlas | L0 / L5 | `model.CoverageMask { width, height, left, top, samples : FixedArray[Byte] }` with `of` and `at`. It is an owned value with its own origin, which is the whole atlas-writing requirement; a trait would add indirection without adding a capability. |
| `LayoutEngine` | Turns a run of glyph ids into advances and positions. | `measure(glyphs, metrics, scale, kern, spacing)` | HarfBuzz `hb_shape` / `hb_buffer_t`; ICU `LayoutEngine`; DirectWrite `IDWriteTextAnalyzer` / `GetGlyphs`; CoreText `CTTypesetter` / `CTLine` / `CTRun`; Pango; Skia `SkShaper` / `SkParagraph`; Java `TextLayout` / `LineBreakMeasurer`; Android `StaticLayout`; `rustybuzz::shape`; `cosmic-text`; SixLabors `TextLayout`; Go `x/image/font` shaping | L6 | `layout.measure`, a pure function returning `TextMetrics`. This is measurement, not shaping: bidi, itemisation, GSUB/GPOS and syllable clustering are OUT (section 5). |
| `ColourPainter` | A visitor over a colour-glyph paint graph: transforms, clips, palette fills and nested glyphs. | `push_transform`, `push_clip`, `fill(palette_index)`, `paint_glyph`, `pop` | FreeType `FT_Paint_*` / `FT_Color` / `FT_LayerIterator` / `FT_PaintFormat`; skrifa `ColorPainter` / `ColorGlyph`; HarfBuzz `hb_paint_funcs_t`; Skia `SkCanvas` COLRv1; DirectWrite `IDWriteColorGlyphRunEnumerator` / `IDWritePaintReader`; CoreText `kCTFontPaletteColorsAttribute`; fontTools `COLR` / `CPAL` paint graph; Android COLRv1 | L5 (reserved) | **Not opened in v0.1.0.** See OUT-05. The `CoverageMask` is already the single-layer monochrome case, so a painter can be added without changing `Face::rasterise`. |
| `Writer` / `Subsetter` | The inverse transform: emit a valid SFNT from selected tables and glyph ids. | `encode(face, selection)`, `subset(glyphs)` | fontTools `TTFont.save` / `subset.Subsetter` / `pyftsubset`; HarfBuzz `hb_subset` / `hb_subset_input_t`; `klippa`; fontkit `Subset`; opentype.js `toArrayBuffer`; PDFBox `PDType0Font` subsetting; php-font-lib writer; Go `sfnt` explicitly has no encoder | Outside this stack | **Not opened in v0.1.0.** See OUT-06. Writing is the inverse transform and roughly doubles the surface; a reader that also writes is not a small library. |

### Capability seams (definition / implementation / consumer / default / failure)

A capability is only live when all three of the first columns are filled.

| Capability | Definition | Implementation | Consumer | Default | Failure semantics |
| --- | --- | --- | --- | --- | --- |
| Random access | `Source` contract, section 4 | `wire.Cursor` over `BytesView` | `sfnt.Directory::table`, every `table::*::parse` | The caller's `BytesView` | `Truncated` at the absolute offset; `OverLimit` before allocation |
| Table lookup | `TableDirectory` contract, section 4 | `sfnt.Directory` | `src/font.mbt::build`, `Face` methods | Required tables are `head`, `hhea`, `maxp`, `hmtx`, `cmap`, `loca`, `glyf` | `MissingTable(tag=...)`; unknown tags ignored |
| Outline emission | `OutlineSink` contract, section 4 | `outline.GlyphSource::outline` -> owned `Outline` | `Face::outline`, `raster::rasterise`, `Face::metrics` | Quadratic curves preserved, in font units | `Refused`; no partial outline is returned |
| Coverage | `RasterTarget` contract, section 4 | `raster::rasterise` -> `CoverageMask` | `Face::rasterise` | 8-bit grey, non-zero winding, unhinted | `OverLimit` on `mask_pixels`; no silent clamp |
| Measurement | `LayoutEngine` contract, section 4 | `layout::measure` | `Face::measure` | `letter_spacing = 0`; `kern` empty when the table is absent | No refusal; unmapped codepoints are skipped |
| Colour painting | `ColourPainter` contract, section 4 | none | none | not applicable | not opened (OUT-05) |
| Variation | `VariationLocation` contract, section 4 | none | none | default instance | `Unsupported` on `fvar` / `gvar` |
| Writing | `Writer` / `Subsetter` contract, section 4 | none | none | not applicable | not opened (OUT-06) |

## 5. Functional boundary

### IN (v0.1.0)

- SFNT containers with scaler `0x00010000`, `OTTO` and `true`, and TrueType
  collections `ttcf` versions 1.0 and 2.0.
- Required tables: `head`, `hhea`, `maxp`, `hmtx`, `cmap`, `loca`, `glyf`.
  Optional: `kern`, `OS/2`, `name`, `post`. Unknown tags are ignored.
- `cmap` formats 0, 4, 6 and 12, with a deterministic best-subtable choice.
- Simple and composite `glyf` outlines, including point matching, transforms and
  bounded recursion; `PathCommand` output with quadratic curves preserved.
- Font-wide and per-glyph metrics in font units; `Scale` in 26.6 fixed point.
- A single unhinted, eight-bit grey coverage rasteriser with non-zero winding.
- Text measurement: advances, bearings, legacy `kern` pairs, letter spacing.
- `Limits::default()` and `Limits::strict()`, one `Refused`, byte offsets.
- `decode_all` for every face in a file; a plain font yields one.
- Four backends, no I/O, deterministic output, zero declared dependencies.
- Interface export and a deterministic static API site; offline differential tests.

### OUT (each with its reason and its proper home)

| # | Out | Reason (one line) | Lives instead |
| --- | --- | --- | --- |
| OUT-01 | File, network and stream I/O; memory-mapped files | The library is pure computation on four backends, three of which have no filesystem. | `integration/` and the host application (`moonegui`, `moongfx`, `moonplot`, `moongame`). |
| OUT-02 | Platform font discovery, family matching, fallback chains, fontconfig, installed-font cache | Requires a filesystem and a platform API, and makes output depend on the machine. | An integration package owned by the host; a fontconfig/DirectWrite/CoreText bridge. |
| OUT-03 | Shaping: bidi, itemisation, GSUB/GPOS, ligatures, syllable clustering, line breaking, grapheme segmentation | Needs Unicode property data and a different scaling model; it would triple the surface and pull in `moonucd@0.1.4`. | A separate shaping library consuming `GlyphId`, `FontMetrics` and `Kern`; `moonbitstack/moonucd@0.1.4` belongs there. |
| OUT-04 | TrueType bytecode hinting, autohinting, hinted coverage | Non-deterministic across oracle versions and would break the single-corpus, four-backend guarantee. | Deferred to a gated later release with its own golden set and a per-fixture hint-mode field. |
| OUT-05 | Colour fonts (`COLR`/`CPAL`, `sbix`, `CBDT`, SVG-in-OpenType), compositing, blending, LCD/subpixel filtering, gamma | Paint graphs are an orthogonal pipeline and pixel storage belongs to the host's image type. | `moonbitstack/moonfont/colour` from v0.3.0; `moonimage@0.1.4` and `moonrgba@0.1.3` stay out of the core. |
| OUT-06 | Subsetting and font writing; name-table editing; font compilation | Writing is the inverse transform and roughly doubles the public surface. | A separate `moonbitstack/moonfont/subset` subpackage from v0.3.0 with symmetric `encode`. |
| OUT-07 | CFF1/CFF2 outlines, WOFF, WOFF2 | Each adds an independent interpreter or decompressor before one glyph has been verified. | `src/cff/`, `src/woff/` from v0.2.0; `moonzip@0.3.8` is pinned for the WOFF adapter. |
| OUT-08 | Variable fonts (`fvar`/`gvar`/`HVAR`), non-default variation locations | Delta machinery would change every metric signature. | `src/variations/` from v0.2.0, additive; `VariationLocation` is reserved in section 4. |
| OUT-09 | Glyph caches, raster caches, atlas packing, LRU eviction, glyph slots | Stateful, policy-laden and device-specific; INV-06 forbids mutable face state. | The consumer's GPU atlas (`moongfx`) or GUI glyph cache (`moonegui`). |
| OUT-10 | Pixel formats, colour management, alpha blending, image encode/decode | A coverage mask is the only output; choosing a pixel format would couple the parser to a device. | `moonbitstack/moonimage@0.1.4` / `moonrgba@0.1.3` in the consumer. |
| OUT-11 | Bitmap glyph strikes, embedded bitmaps | Bypasses the outline seam entirely and needs a pixel format. | A future bitmap-extraction subpackage, extraction only, no compositing. |
| OUT-12 | SDF / MSDF generation | A different product with a different contract. | A second render-mode subpackage; `msdfgen` is a reference, not a dependency. |
| OUT-13 | FFI and platform text APIs (CoreText, DirectWrite, Pango, Skia bridges) | Breaks four-backend purity. | `integration/`. |
| OUT-14 | Third-party MoonBit font modules as dependencies | Forbidden by the whitelist and circular as oracles. | Reference and differential-test oracles only: `mizchi/font`, `bikallem/freetype`, `Milky2018/moon_skrifa`. |
| OUT-15 | Font synthesis (faux bold/italic), optical sizing, font matching policy | Product-level decisions, not parsing. | The host application. |

## 6. Error model and defensive parsing

### Error model

One raised `Refused` suberror in `src/model/error.mbt`, `Eq` + `Debug` + `Show`,
with nine variants. The field vocabulary is fixed: `at` (absolute byte offset),
`got`, `want`, `limit`, `tag`, `glyph`, `depth`.

| Variant | Meaning | Fields |
| --- | --- | --- |
| `Unknown` | The signature is not a font this library reads. | `at`, `got` |
| `Unexpected` | A field holds a value that is not allowed here; `want` names the allowed value. | `at`, `got`, `want` |
| `Unsupported` | A well-formed part of the format this release does not read. | `at`, `got` |
| `Truncated` | The bytes end `want` short of where the format needs them, or a declared range passes EOF. | `at`, `want` |
| `OverLimit` | A declaration past the caller's `Limits` ceiling. | `limit`, `got` |
| `Malformed` | A structurally impossible value in an otherwise readable table. | `at`, `got` |
| `MissingTable` | A required table is absent from the directory. | `tag` |
| `MissingGlyph` | A glyph id outside `maxp.numGlyphs`. | `glyph` |
| `Recursion` | Composite glyphs nested past `Limits.recursion`. | `depth` |

Rules:

- Every public function either returns a complete value or raises `Refused`.
  There is no partial result, no fallback glyph and no silent default.
- `Show::to_string` names the offset and the two values, so a bug report needs no
  debugger. Variant names are API: the differential corpus asserts them.
- The single documented clamp is `Hmtx::parse` bounding `numberOfHMetrics` to
  `numGlyphs`; it is covered by a `legal_but_unusual` fixture. All other
  out-of-spec values are refused.
- Optional tables that are absent (`kern`, `OS/2`) synthesise empty values;
  required tables that are absent raise `MissingTable`. This distinction is fixed.
- No public function panics on file-derived data. `decode` indexes `faces[0]`
  only after `sfnt.read` has proven the array non-empty (an empty directory or an
  empty collection raises first).

### Limits

`Limits` is a `pub(all)` record in `src/model/limits.mbt`. Each ceiling is checked
**before** the allocation it guards.

| Field | `default()` | `strict()` | Guards |
| --- | ---: | ---: | --- |
| `file_bytes` | 268 435 456 | 16 777 216 | Whole input, checked in `sfnt.read` |
| `table_bytes` | 268 435 456 | 16 777 216 | Each table length, checked in `Directory::table` and in directory parsing |
| `glyphs` | 65 536 | 65 536 | `maxp.numGlyphs` and TTC face count |
| `points` | 65 536 | 8 192 | Points in one glyph |
| `contours` | 8 192 | 1 024 | Contours in one glyph |
| `composites` | 1 024 | 256 | Components in one composite glyph |
| `recursion` | 16 | 8 | Composite nesting depth |
| `mask_pixels` | 67 108 864 | 4 194 304 | Coverage mask area |

`check_mask` multiplies width by height in 64 bits so a declared 65 535 by
65 535 cannot wrap into a small number and pass. `Limits` is resolved once at
`decode` / `decode_all` via `limits.unwrap_or(Limits::default())` and passed down
as a value; no internal function re-resolves it (INV-10).

### Offsets, lengths, recursion and allocation

- Every `offset + length` is checked against `bytes.length()` in
  `parse_directory` before any window is taken. Negative offsets and lengths are
  refused. A table is read only through `Directory::table`, which returns a
  cursor bounded to exactly that table's bytes; a decoder cannot read another
  table's bytes by accident.
- `wire.Cursor` validates `pos + count` before every read and raises `Truncated`
  with the offset. `u32` builds an `Int32` from two 16-bit halves, so a declared
  offset or length above `2^31` arrives as a negative number and is refused by
  `parse_directory`'s `offset < 0 || length < 0` check rather than wrapping into
  a plausible small range. `tag` reads may use the full 32-bit word because a
  table tag is not a length.
- Composite glyphs carry both a component-count ceiling and a depth ceiling.
  A self-referencing composite terminates at the depth ceiling, not by looping.
  Depth is an explicit argument (`GlyphSource::outline(depth?)`), not ambient state.
- `REPEAT` flag expansion in `glyf` is capped at `numPoints`. Contour endpoint
  arrays are validated against the declared point count before they are walked.
- `loca` offsets must be monotonically non-decreasing and stay inside `glyf`.
- Validation is confined to nine boundaries: file entry, directory record, each
  table decoder, glyph range, composite recursion, each `Limits` check, the
  glyph-id check in `Face::metrics`, the mask-size check, and fixture ingest in
  `integration/`. Typed values passed between MoonBit functions are not
  re-validated; the type system already guarantees them.

**Known gap, advisory for v0.2.0:** a caller-constructed `Limits` is not
validated at construction. A negative ceiling refuses the first declaration that
touches it rather than failing loudly at load time. A `Limits::validate()` that
names the offending field, its expected range and its actual value is the fix.

## 7. Dependency matrix

### Declared dependencies

`moon.mod` for v0.1.0 contains **no `import` block**. The library has zero
declared module dependencies. This is the exact set of versions to declare in the
v0.1.0 `moon.mod`: none. `moonbitlang/core` is supplied by the toolchain and needs
no declaration; the `#derive(Debug)` and `Show` implementations cause
`moonbitlang/core/debug` to appear in `model/pkg.generated.mbti` as a
compiler-injected import, not an authored one.

| Layer | Package | Authored imports | Why |
| --- | --- | --- | --- |
| L0 | `model` | none | Pure values, `Eq`, `Debug`, `Show`. It knows nothing about bytes. |
| L1 | `wire` | `moonfont/model` | Needs `Refused` to name the failing offset. |
| L2 | `sfnt` | `model`, `wire` | Directory records and range checks. |
| L3 | `table` | `model`, `wire` | Bounded cursors into domain values. |
| L4 | `outline` | `model`, `table` | `GlyphData` to `PathCommand`. |
| L5 | `raster` | `model` **only** | Consumes `Outline`; the seam is real. |
| L6 | `layout` | `model`, `table` | `Hmtx`, `Kern`, `FontMetrics`. |
| L7 | `src` (facade) | `model`, `sfnt`, `table`, `outline`, `raster`, `layout` | Wiring and re-exports. |
| tests | `moonbitlang/core/buffer` for `"test"` | Built-in only | Byte literals in fixtures. |

### Exact pinned versions for the whole repository

The whitelist is a constraint, not a quota. Adding a dependency is a one-way door
that carries a transitive closure and four-backend verification cost.

| Module | Exact version | Where and when | Declared now? |
| --- | --- | --- | --- |
| `moonbitlang/core` | toolchain-supplied | Every layer, built-in | No declaration needed |
| `moonbitstack/moonzip` | `0.3.8` | `src/woff/` WOFF/WOFF2 adapter, v0.2.0 | No |
| `moonbitstack/moonbase` | `0.4.5` | `integration/` only, base16 fixture decoding | No (belongs in `integration/moon.mod`) |
| `moonbitstack/moonimage` | `0.1.4` | Colour/bitmap extraction, v0.3.0 | No |
| `moonbitstack/moonrgba` | `0.1.3` | Colour extraction, v0.3.0 | No |
| `moonbitstack/moonucd` | `0.1.4` | A **separate shaping library**, never moonfont | No |
| `moonbitlang/x` | `0.5.7` | Excluded: experimental, subject to frequent changes | No |
| `moonbitlang/async` | `0.22.9` | Excluded: there is no I/O | No |
| `moonvar@0.2.2`, `moonmath@0.1.4`, `moonnum@0.2.7`, `moonstl@0.1.3`, `mooncrypt@0.4.16` | as published 2026-11-12 | Excluded: nothing in the core needs them | No |
| `mizchi/font`, `bikallem/freetype`, `Milky2018/moon_skrifa` | reference only | Differential-test oracles and design references | **Never** |

`moonvar@0.2.2` is the tempting one: it supplies fixed-width big-endian reads.
It cannot supply this contract, because moonfont's cursor must raise `Refused`
carrying the byte offset and must keep a position relative to a table slice; a
generic codec that returns `None` on a short view loses both. The ~170-line
cursor is genuinely owned here. `moonbase@0.4.5` is the only stack dependency
that may appear in the repository in v0.1.0, and only inside `integration/`.

**Rule:** a dependency line may be added to `moon.mod` only in the same change
that adds a `moon.pkg` importing it. An unused import line is a defect, not a
reservation.

## 8. Public API sketch

Signatures below are the real v0.1.0 surface. Names and parameter shapes are
binding; see `contracts/API.md` for the full contract.

```moonbit
///|
/// Read the first face of a font file. A TrueType collection also has a first
/// face; `decode_all` is the entry point for the rest of them.
///
/// Decoding is lazy for outlines: the cost is a table directory and a few small
/// tables, not every glyph. The caller owns `bytes` and keeps it alive and
/// unchanged for the life of the face. `limits` resolves to
/// `Limits::default()` when omitted.
pub fn decode(
  bytes : BytesView,
  limits? : @model.Limits,
) -> Face raise @model.Refused

///|
/// Read every face in the file. A plain font yields exactly one.
pub fn decode_all(
  bytes : BytesView,
  limits? : @model.Limits,
) -> Array[Face] raise @model.Refused

///|
/// Translate a Unicode codepoint to a glyph id. `None` means the font has no
/// glyph; a caller decides what to draw in its place.
pub fn Face::glyph_index(self : Face, codepoint : Int32) -> @model.GlyphId?

///|
/// The outline of one glyph, in font units, as path commands. Curves are kept
/// as curves; flattening is the rasteriser's decision.
pub fn Face::outline(
  self : Face,
  glyph : @model.GlyphId,
) -> @model.Outline raise @model.Refused

///|
/// Horizontal metrics of one glyph, in font units.
pub fn Face::metrics(
  self : Face,
  glyph : @model.GlyphId,
) -> @model.GlyphMetrics raise @model.Refused

///|
/// Eight-bit coverage of one glyph at a pixel size. The mask carries its own
/// origin, so it can be copied into an atlas without further arithmetic.
pub fn Face::rasterise(
  self : Face,
  glyph : @model.GlyphId,
  pixels_per_em : Int32,
) -> @model.CoverageMask raise @model.Refused

///|
/// Measure a run of text at a pixel size. Unknown codepoints are skipped, so
/// the returned glyph count can be smaller than the character count.
pub fn Face::measure(
  self : Face,
  text : String,
  pixels_per_em : Int32,
  letter_spacing? : Int32,
) -> @model.TextMetrics

///|
/// Font-wide metrics, in font units.
pub fn Face::font_metrics(self : Face) -> @model.FontMetrics

///|
/// The scale for a pixel size, shared by measurement and rasterisation so the
/// two never disagree about where the pen stands.
pub fn Face::scale(self : Face, pixels_per_em : Int32) -> @model.Scale
```

The facade re-exports twelve types with `pub using @model { ... }`, so a caller
importing only `moonbitstack/moonfont` holds the error, limits, metrics, outline
and mask without knowing how many packages sit beneath. Every lower package is
also public, so a caller that wants only charmap lookup or only the rasteriser
does not load the rest.

## 9. Target backends

wasm, wasm-gc, js and native, from one source tree with no target-specific files
(`*_wasm.mbt`, `*_js.mbt`, `*_native.mbt` are forbidden under `src/`).

Constraints that follow:

- No FFI, no `extern`, no filesystem, no threads, no clock, no random, no
  environment variables. `BytesView`, `FixedArray[Byte]`, `Int32` and `Int64` are
  available on all four; nothing else may be assumed.
- No floating point in the outline or coverage pipeline. 26.6 fixed-point
  integers with 64-bit intermediate products give bit-identical masks on all
  four backends and make one golden corpus valid everywhere (INV-08).
- Offset and length arithmetic uses `Int64` where a product is involved, so a
  hostile declaration cannot wrap on a 32-bit backend.
- No dependence on map or hash iteration order; deterministic array order only.
- Gate chain, mandatory in CI: `moon check --target all --deny-warn`,
  `moon build --target all`, `moon test --target all`,
  `moon info --target all && git diff --exit-code`,
  `python3 scripts/docs/gen_api.py --check`, and
  `moon test --target all integration/difftest`.

## 10. Quality attributes, capacity and degradation

| Attribute | Number or decision |
| --- | --- |
| Decode cost | O(directory + nine small tables + `num_glyphs` for `loca`/`hmtx`), not O(file size). Target P95: <= 8 ms native and <= 25 ms wasm for a 12 MiB font with <= 100 tables. |
| Outline | O(points + contours + components) per glyph; one `Outline` allocation; no per-point heap object. |
| Rasterise | Target P95 <= 1.5 ms for one 32 ppem glyph on native; worst case bounded by `mask_pixels`. |
| Memory | Borrowed byte span plus O(`num_glyphs` + `num_tables`). `glyf` is a `BytesView`, not a copy. |
| Capacity | 65 536 glyphs; 65 536 points and 8 192 contours per glyph; 1 024 components; 16 nesting levels; 67 108 864 mask pixels (default). |
| Security | Untrusted input; nine validation boundaries; no unbounded allocation, recursion or loop; no path handling; no floating point; no panic on file-derived data. |
| Reliability | Stateless; no persistence, therefore RPO and RTO are not applicable. Recovery is regeneration: `make_font.py`, `make_fixtures.py --oracle reference`, `make_corpus.py`, `moon info`, `gen_api.py`. Six reproducible assets: `pkg.generated.mbti` files, `docs/api.html`, corpus binaries, `corpus/manifest.json`, `fixtures.json` with its SHA-256 sidecars, and embedded `.mbt` fixture literals. |
| Degradation | No partial results. Unknown tags ignored; absent optional tables synthesise empty values; unmapped codepoints return `None`; unsupported features raise `Unsupported`; excess declarations raise `OverLimit`. A caller decides every substitute. |
| Data evolution | No database. The `.mbti` files are the schema. Within 0.1.x, public changes are additive only; a breaking change requires a minor version and a regenerated corpus. |
| Commercialisation | Not applicable: no payments, no accounts, no subscription. |
| Compliance | Font corpus provenance and licence per `DECISIONS.md` D-14; no personal data, no cross-border transfer, no network. |
| SEO and rendering | Static HTML in `docs/`, deterministic and crawler-readable; no client-side build; `docs/` is the Pages root. |
| External reuse | Semantic versioning; `pub using` re-exports; `.mbti` is the machine-readable contract; a breaking signature change requires a version bump, a regenerated site and a corpus re-baseline. |

**Human-language decisions and their cost**

| Decision | Plain English | Cost of changing it |
| --- | --- | --- |
| Zero declared dependencies | Nothing else has to be installed or verified on four backends. | Low for adapters, high for anything public. |
| Owned `Outline` value, not a callback only | A caller can hold, compare and measure a glyph shape directly. | High: every consumer depends on this type. |
| `CoverageMask` with its own origin | A GPU atlas can copy the glyph in without extra arithmetic. | Medium: the mask shape is public, the algorithm is not. |
| One raised `Refused` with byte offsets | One error handler, and a bug report says where it broke. | High: a public suberror type is an API contract. |
| Unhinted integer rasterisation | The same glyph looks the same on a phone, a browser and a desktop. | Medium: adding hinting later needs its own golden set. |
| No shaping | Font reading stays small; text layout is the application's job. | High: adding it later changes the dependency set. |
| `decode_all` returns an array, not a `Collection` type | A plain font and a font collection need no branching. | Low: additive. |
| Interface-driven static site | The reference page cannot drift from the code. | Low: the generator is internal. |

## 11. Differential-test architecture

Full field names, tolerances and the regeneration interface are binding in
`contracts/DIFFTEST.md`. Summary here.

**Two corpora.** `integration/difftest/corpus/` holds 39 synthetic hostile-input
fonts: 34 with one damaged declaration, one removed table or one truncated run
that assert the exact `Refused` variant, and 5 that must be accepted.
`integration/difftest/fixtures/` holds the parity goldens for one deterministic
`synthetic.ttf`: categories `font`, `tables`, `cmap`, `metrics`, `outlines` and
`coverage`, covering container structure, format 4 charmap, advances and
bearings, simple and composite outlines with implied midpoints, and summarised
ink coverage. Measurement and every `Limits` ceiling are exercised by the
hostile corpus and by the library's own tests.

**Language-neutral format.** Canonical JSON (`sort_keys=True`, `indent=2`, one
trailing newline), raw font binaries and one SHA-256 sidecar per file. No MoonBit
type, no pickle, no binary blob a second language cannot read, no timestamp and
no absolute path. `ink_coverage` is the sole floating value and is rounded to
six decimal places. Coverage is a **summary** (`ink_coverage` and `ink_bbox`),
never a raw bitmap, because anti-aliasing is not portable bit for bit.

**Oracles.** Produced offline, never at test time. The committed goldens use the
`reference` oracle (Python `1.0.0`): an independent standard-library SFNT parser
and an 8 by 8 uniform-grid supersampler with non-zero winding -- deliberately a
different algorithm from moonfont's exact-horizontal-area vertical subsampling.
Secondary providers are pinned at fontTools `4.47.2` and Pillow `10.1.0`
(binding FreeType `2.15.0`), on Python `3.11+`. A requested third-party oracle
that is not installed is a loud failure, never a silent fallback. The wider
cross-language survey (C, C++, Rust, Go, JS, JVM, .NET, Swift, Kotlin, Ruby,
PHP, Haskell) supplies design references and reserved secondary oracles; every
third-party MoonBit font module is excluded as circular and forbidden.
FreeType output changed in 2.14.2 and 2.15.0, which is why versions are pinned.

**Tolerance rules.** `font`, `tables`, `cmap`, advance, `lsb`, `bounds`, outline
command streams, error variants and limits are exact. `scaled_bounds` and
`ink_bbox` allow 1 pixel per side; `ink_coverage` allows 5 per cent. Anti-aliasing
and hinting are never bit-identical, so hinted glyphs are excluded entirely.
Pre-registered tolerances may not be relaxed to make a failing test pass; one
calibration round is permitted before enforcement.

**Regeneration recipe (offline, maintainer-initiated).**

```
python3 scripts/difftest/make_font.py
python3 scripts/difftest/make_font.py --check
python3 scripts/difftest/make_fixtures.py --oracle reference
python3 scripts/difftest/make_corpus.py
python3 scripts/difftest/make_corpus.py --check
python3 scripts/difftest/verify_fixtures.py
python3 scripts/difftest/verify_fixtures.py --check
python3 scripts/difftest/index_fixtures.py
python3 scripts/difftest/index_fixtures.py --check
python3 scripts/difftest/embed_corpus.py --check
moon test --target all integration/difftest
moon info --target all
python3 scripts/docs/gen_api.py
```

**CI shape.** `.github/workflows/ci.yml` runs `verify_fixtures.py` and
`moon test --target all integration/difftest` on Linux only, plus the four-backend
gate chain on three operating systems. CI replays committed fixtures; it never
installs a reference toolchain, never calls an oracle at test time and never
resolves a third-party MoonBit module. Oracle drift is caught by committed
sidecars and by `--check` during offline regeneration, not in CI.

## 12. Interface export and static-site pipeline

```
moon info --target all
    -> src/**/pkg.generated.mbti      (one public interface per package)
    -> python3 scripts/docs/gen_api.py
    -> docs/api.html                  (deterministic, committed)
    -> .github/workflows/docs.yml     (upload-pages-artifact path: docs)
    -> deploy-pages                  (later; not performed in this phase)
```

- `moon info --target all` writes one `pkg.generated.mbti` per package. The
  toolchain owns those files; they are committed and never hand-edited.
- `scripts/docs/gen_api.py` reads **every** `src/**/pkg.generated.mbti`, plus
  the `///` doc comments in the sibling `.mbt` files, and writes one complete
  `docs/api.html` from a literal shell constant. The interface decides what
  exists; the source comments say what it means. `DESIGN.md` section 6 is the
  sole authority for the emitted markup, the closed class vocabulary and the
  anchor scheme; this section owns only the pipeline, the determinism rules and
  the CI gates. No fact is stated in both places.
- Determinism: discovered `.mbti` paths are sorted before any output is
  produced; declarations are sorted by a fixed kind ranking then qualified
  name, and fields, variants and parameters by name. UTF-8, LF endings, no
  BOM, exactly one trailing newline. The page contains no date, time, build
  identifier, version string, script name, absolute path or
  environment-derived count, and makes no network request. Two runs on a clean
  tree produce byte-identical output; that is the acceptance check.
- `--check` rebuilds in memory, compares byte-for-byte with the committed
  `docs/api.html`, prints a unified diff and exits non-zero on a mismatch,
  writing nothing. CI runs this mode. Plain invocation builds the whole page
  in memory and replaces the file atomically, so a partial page is never
  written; a malformed `.mbti` exits non-zero naming the offending file.
- `Makefile`: `make api` runs `moon info --target all` then the generator;
  `make docs` runs `--check`; `make site` also rebuilds the fixture index.
- **A new package appears on the site automatically.** Create
  `src/<name>/moon.pkg` and its `.mbt` files, run `moon info --target all`, and a
  `src/<name>/pkg.generated.mbti` appears. The generator's recursive glob over
  `pkg.generated.mbti` is sorted after collection and picks it up with no edit
  to any list. The section heading comes from the package path and the section
  prose from the leading `//` note in that package's `moon.pkg`, omitted when
  there is none, so no metadata file is needed either. The CI step
  `moon info --target all && git diff --exit-code` then requires both the `.mbti`
  and the regenerated page to be committed. No hard-coded package list exists.
- `.github/workflows/docs.yml` re-checks the interfaces and the page, then calls
  `actions/configure-pages@v6` and `actions/upload-pages-artifact@v5` with
  `path: docs`; a separate `deploy` job calls `actions/deploy-pages@v5`.
  Deployment is a later phase and is not performed now.

## 13. Architecture decisions

The full ledger with options, deciders and door types is `DECISIONS.md`. The
architecture-affecting entries, with their consequences, are:

| ADR | Status | Context | Decision | Consequences | Related |
| --- | --- | --- | --- | --- | --- |
| A-01 | Accepted | A Face must serve four consumers at different sizes concurrently. | Face is an immutable result; `Scale` is an argument. | No cache, no mutable slot, no thread safety question; every method is a pure read. | D-02, D-03 |
| A-02 | Accepted | Rasterisation in or out of the library? | In, as an isolated `raster/` package consuming `Outline` only. | Consumers may ignore it; `raster` importing `model` alone proves the seam. | D-02, D-04 |
| A-03 | Accepted | Owned outline versus callback-only pen. | Owned `Outline` value with `PathCommand`, curves preserved. | Golden comparison is simple; a streaming pen can be added additively. | D-03 |
| A-04 | Accepted | Untrusted input and four-backend determinism. | One `Refused`, `Limits` before allocation, integer-only unhinted coverage. | No floating point, no panics, one golden corpus valid on all four backends. | D-06, D-11 |
| A-05 | Accepted | Dependency whitelist is a constraint, not a quota. | Zero declared dependencies in v0.1.0; pinned reservations for later adapters. | Four-backend portability is trivial; every new import is a one-way door. | D-05 |
| A-06 | Accepted | Shaping and Unicode properties. | Out; measurement only, `kern` as data. | `moonucd@0.1.4` never enters the core; a shaping library consumes our values. | D-10 |
| A-07 | Accepted | Colour, variation and writing are mature convergent capabilities. | Named in section 4, not opened in v0.1.0, additive subpackages later. | No orphan contract, no placeholder trait, no breaking change to `Face`. | D-12 |
| A-08 | Accepted | Correctness oracle. | Offline, independent `reference` parser and supersampler as the committed golden; fontTools and Pillow/FreeType as pinned secondary providers; tolerances pre-registered. | No third-party MoonBit dependency; changing the oracle re-baselines the corpus. | D-08, D-09 |

Two items in `DECISIONS.md` remain marked `Open - needs decision` (D-02 on the
rasterisation boundary and D-10 on whether a consumer expects shaped text). The
code implements the recommended option for both. The decision cards must be
closed before the v0.1.0 API is frozen; otherwise section 5 and section 8 remain provisional.

## 14. End-to-end verification

One chain, executed in this order, is the definition of "the specification is
met". It covers the core success path and the key error path.

```
moon check --target all --deny-warn
moon build --target all
moon test --target all
python3 scripts/difftest/verify_fixtures.py
moon test --target all integration/difftest
python3 scripts/gates/layer_direction.py
moon info --target all && git diff --exit-code
python3 scripts/docs/gen_api.py --check
moon fmt && git diff --exit-code
```

`scripts/gates/layer_direction.py` is the one gate in that chain required by
this specification but not yet present; until it lands, the chain is not
complete and the v0.1.0 API must not be frozen.

Success path: `decode(synthetic.ttf)` -> `glyph_index(0x41)` ->
`outline(glyph)` -> `rasterise(glyph, 64)` -> a `CoverageMask` whose ink
bounding box and summed coverage agree with the pinned `coverage` golden within
the `one_pixel` and `five_percent` tolerances.
Error path: `decode(bad_signature.bin)` raises `Refused::Unknown(at=0, ...)`;
`decode(table_offset_past_eof.ttf)` raises `Refused::Truncated` at the declared
offset; `decode(contours_over_limit.ttf)` raises `Refused::OverLimit`. No case
panics, hangs or allocates past its ceiling.

Any failure in that chain is a regression. A problem it exposes becomes a
persistent fixture, and a newly discovered hostile-input shape is written back
into `scripts/difftest/make_corpus.py` before the specification is changed.
