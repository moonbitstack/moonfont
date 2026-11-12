# Long-tail font ecosystems and the cross-language architectural common ground

A technical survey of font handling in Haskell, Kotlin and PHP, with secondary notes on
Swift/CoreText and Ruby, followed by a synthesis of the abstractions that every ecosystem
converges on and a proposed architecture, functional boundary and differential-test strategy
for a clean-room font library.

## Scope, method and verification convention

The focus is the long tail: ecosystems that are not usually covered by surveys of the C, C++,
C#, Python, Rust and Go font stacks. Part 1 records, for each library or stack, its name,
version where verifiable, licence, source URL, real public API identifiers grouped by concern,
feature coverage, architectural stance and one idea worth carrying into a new design. Part 2
derives the common ground.

Method: public documentation and repository contents were consulted through search and page
retrieval, and identifier spellings were checked against those primary sources. Anything that
could not be confirmed against a primary source is marked `[unverified]`. Where secondary
aggregators disagree about a licence, version or exact class name, the conflict is stated
rather than resolved by assertion. No identifier, version or licence has been invented.

A note on names: the brief named `PlatformFont` among the Compose types. It does not appear in
the current `androidx.compose.ui.text.font` package reference. The current platform-specific
abstraction is `AndroidFont` (an abstract class implementing `Font`, with
`AndroidFont.TypefaceLoader`). Whether an earlier release exposed an interface literally named
`PlatformFont` is `[unverified]`. Correspondingly, the brief named `Font_Table_glyf`,
`Font_Table_cmap` and `Font_TrueType_Collection` among PHP classes: those underscore-style names
belong to the pre-namespace, pre-PSR-4 generation of php-font-lib and are confirmed in old
bundled copies of dompdf; the current equivalents are namespaced and are given below.

Feature coverage is recorded against twelve axes: TTF, OTF/CFF, WOFF, WOFF2, TTC, variable
fonts, colour fonts, bitmap strikes, shaping, subsetting, writing (serialising a font back out),
and rasterisation. In the coverage tables `Y` means supported, `P` partial or conditional,
`N` absent, and `?` not verifiable from the consulted sources.

---

# Part 1 — The long tail

## 1.1 Haskell

Haskell is the most instructive of the three primary ecosystems because it contains both a
genuine native parser written in the language and a cluster of thin bindings to C libraries,
side by side. It is also the ecosystem in which the split between "parse outlines" and "shape
text" is most explicit.

### 1.1.1 FontyFruity

- **Name / version / licence.** `FontyFruity`; latest 0.5.3.5 (Stackage LTS 24.52 and Hackage);
  BSD-3-Clause; credited to Vincent Berthoux in the Hackage metadata.
- **Sources.** `https://hackage-content.haskell.org/package/FontyFruity`,
  `https://stackage.org/package/FontyFruity`,
  `https://hackage.haskell.org/package/FontyFruity-0.4/docs/Graphics-Text-TrueType.html`,
  `https://hackage.haskell.org/package/FontyFruity-0.2/docs/Graphics-Text-TrueType.html`,
  source repository `https://github.com/Twinside/FontyFruity.git` (declared in the Hackage
  metadata).
- **API identifiers, grouped.**
  - *Byte source and parsing:* `decodeFont :: ByteString -> Either String Font`,
    `loadFontFile :: FilePath -> IO (Either String Font)`.
  - *Face and table directory:* `Font` with fields `_fontOffsetTable :: !OffsetTable`,
    `_fontTables :: ![(ByteString, ByteString)]` (tag and raw bytes), `_fontNames`,
    `_fontHeader`, `_fontMaxp`, `_fontMap :: Maybe CharacterMaps`, `_fontGlyph`,
    `_fontLoca`, `_fontHorizontalHeader`, `_fontHorizontalMetrics`; `unitsPerEm :: Font -> Word16`.
  - *Charmap and glyph ids:* `isPlaceholder :: Font -> Char -> Bool`,
    `getCharacterGlyphsAndMetrics :: Font -> Char -> (Float, Vector RawGlyph)`, `RawGlyph` with
    `_rawGlyphIndex :: !Int`, `_rawGlyphContour :: ![Vector (Int16, Int16)]`,
    `_rawGlyphCompositionScale :: ![CompositeScaling]`; `CompositeScaling` with fields `_a`
    through `_f` (`Int16`) — a direct transcription of the composite-glyph transform.
  - *Outlines and positioning:* `getStringCurveAtPoint :: Dpi -> (Float, Float) -> [(Font, PointSize, String)] -> [[Vector (Float, Float)]]`,
    `getGlyphForStrings :: Dpi -> [(Font, PointSize, String)] -> [[Vector (Float, Float)]]`,
    `stringBoundingBox :: Font -> Dpi -> PointSize -> String -> (Float, Float)`;
    `type Dpi = Int`, `type PointSize = Int`.
  - *Platform discovery (in the same module):* `FontCache`, `FontDescriptor` with
    `_descriptorFamilyName :: Text` and `_descriptorStyle :: FontStyle`, `emptyFontCache`,
    `findFontInCache`, `buildCache :: IO FontCache`, `enumerateFonts`,
    `findFontOfFamily :: String -> FontStyle -> IO (Maybe FilePath)`; `FontStyle` with
    `_fontStyleBold`, `_fontStyleItalic`.
  - Module: `Graphics.Text.TrueType` (plus `Graphics.Text.TrueType.Internal`).
- **Feature coverage.** TTF `Y`; OTF/CFF `N` (TrueType-flavoured only); WOFF `N`; WOFF2 `N`;
  TTC `?` (no collection API in the documented surface); variable `N`; colour `N`;
  bitmap strikes `N`; shaping `N` (no kerning, no GSUB/GPOS, no ligatures — it maps `Char`
  to glyph contours one at a time); subsetting `N`; writing `N`; rasterisation `N` (explicitly
  "curves to be drawn with a library like Rasterific"). Reverse dependencies include
  `Rasterific`, `rasterific-svg` and `diagrams-rasterific`.
- **Architectural stance.** A pure, in-memory, single-shot decoder: a strict `ByteString` in,
  an immutable `Font` record of decoded tables out, returning contours as vectors of points
  rather than a path-command stream. `Either String` for errors. It is a native parser, not a
  binding. Its one impurity is that font discovery (`buildCache`, `findFontOfFamily`) lives in
  the same module as the decoder — a layering mistake worth avoiding.
- **Worth stealing.** `getGlyphForStrings` deliberately returns all glyphs at the same origin
  ("they are not placed like with `getStringCurveAtPoint`") so callers can extract geometry
  for further manipulation. Separating *outline extraction* from *text placement* in the public
  API is a clean, reusable boundary; a latecomer should offer both, not just the laid-out form.

### 1.1.2 SVGFonts

- **Name / version / licence.** `SVGFonts`; 1.8.1 is the Stackage LTS 24.0 pin and the GitHub
  tag; 1.8.2 appears on Hackage with a newer README; BSD-3-Clause; credited to Tillmann Vogt.
- **Sources.** `https://www.stackage.org/lts-24.0/package/SVGFonts`,
  `https://hackage-content.haskell.org/package/SVGFonts-1.8.2/src/README.md`,
  `https://github.com/diagrams/SVGFonts`,
  `https://hackage.haskell.org/package/SVGFonts-1.8.0.1/docs/Graphics-SVGFonts-Text.html`,
  `https://hackage.haskell.org/package/SVGFonts-1.4/docs/Graphics-SVGFonts-ReadFont.html`,
  `https://hackage.haskell.org/package/SVGFonts-1.2.1/docs/Graphics-SVGFonts-ReadFont.html`,
  `https://diagrams.github.io/haddock/SVGFonts/Graphics-SVGFonts-ReadFont.html`.
- **API identifiers, grouped.**
  - *Older `ReadFont` surface (1.2–1.6):* `textSVG :: String -> Double -> Path R2`,
    `textSVG' :: TextOpts -> Path R2`, `textSVG_`, `TextOpts` with fields `txt`, `fdo`,
    `mode`, `spacing`, `underline`, `textWidth`, `textHeight`; `FontData` (a record from 1.4
    onward, a large tuple in 1.2.1); `SvgGlyph` / `SvgGlyphs` (`Map String (String, Double, String)`);
    `Kern` with `kernU1S`, `kernU2S`, `kernG1S`, `kernG2S`, `kernK`;
    `type OutlineMap n = Map String (Path V2 n)`; `type PreparedFont n = (FontData n, OutlineMap n)`;
    `openFont :: FilePath -> FontData` (1.2.1) becoming
    `loadFont :: (Read n, RealFloat n) => FilePath -> IO (PreparedFont n)` and
    `loadFont' :: (XmlSource s, Read n, RealFloat n) => String -> s -> (String, PreparedFont n)`;
    `horizontalAdvances`, `hadv` / `horizontalAdvance`, `kernAdvance`, `bbox_dy`, `bbox_lx`,
    `bbox_ly`, `underlinePosition`, `underlineThickness`, `outlMap`,
    `commands :: String -> SvgGlyphs -> [PathCommand]`, `commandsToTrails`, `ro`, `bit`, `lin`,
    `lin2`; `data Mode = INSIDE_H | INSIDE_W | INSIDE_WH`, `mWH`, `mW`, `mH`;
    `data Spacing = HADV | KERN`, `isKern`.
  - *Current `Text` surface (1.8+):* `data TextOpts n` with `textFont :: PreparedFont n`,
    `spacing`, `underline`; `data PreparedText n` with `fontTop`, `fontBottom`,
    `preglyphs :: [(String, n)]`; `prepare`, `draw_glyphs`, `shift_glyphs`,
    `characterStrings'`, `svgText`, `svgText_raw`, `svgText_modifyPreglyphs`,
    `svgText_fitRect`, `svgText_fitRect_stretchySpace`, `PathInRect`, `fit_width`,
    `fit_height`, `set_envelope`, `drop_rect`, `textSVG` (retained for compatibility);
    module `Graphics.SVGFonts.Wrap` for configurable wrapping.
  - `FontData n` fields include `fontDataGlyphs`, `fontDataKerning`, `fontDataBoundingBox`,
    `fontDataUnitsPerEm`, `fontDataHorizontalAdvance`, `fontDataAscent`, `fontDataDescent`,
    `fontDataXHeight`, `fontDataCapHeight`, `fontDataUnderlinePos`,
    `fontDataUnderlineThickness`, `fontDataRawKernings`, `fontDataPanose`,
    `fontDataUnicodeRange`, and the four horizontal and four vertical baseline fields.
- **Feature coverage.** TTF `N` (it does not read `.ttf` at all); OTF/CFF `N`; WOFF `N`;
  WOFF2 `N`; TTC `N`; variable `N`; colour `N`; bitmap `N`; shaping `P` (kerning, ligatures
  and Unicode, but from the SVG-Font model, not GSUB/GPOS); subsetting `P` (the README advises
  trimming the SVG file to the characters used); writing `N`; rasterisation `N` (delegated to
  a diagrams backend). It reads **SVG-Font XML**, which the user is told to produce with
  FontForge ("Save All") — the format was chosen precisely because it is easy to parse in
  Haskell.
- **Architectural stance.** A native, pure-Haskell, format-specific parser that converts a font
  into `diagrams` `Path` values. It is a *text-to-outline* library for a vector-graphics
  framework, not a font-file library. Since 1.8 it inserts an explicit intermediate
  `PathInRect` between shaping and final placement, which keeps the local origin at the left
  end of the baseline and carries the enclosing rectangle for line stacking.
- **Worth stealing.** `horizontalAdvances` deliberately treats "a character" as a `String`,
  with the documentation noting "A character is stored with a string (because of ligatures
  like `ffi`)". Encoding a preglyph as a string cluster rather than a single code point is a
  small, robust way to keep ligature handling out of the low-level glyph lookup. The
  `PathInRect` intermediate is likewise a good pattern: keep the metric rectangle alongside
  the geometry instead of throwing it away after stroking.

### 1.1.3 diagrams text handling (`diagrams-lib`)

- **Name / version / licence.** `diagrams-lib`, module `Diagrams.TwoD.Text`; docs consulted for
  1.5; BSD-style (per the module header).
- **Source.** `https://hackage.haskell.org/package/diagrams-lib-1.5/docs/Diagrams-TwoD-Text.html`.
- **API identifiers.** `data Text n = Text (T2 n) (TextAlignment n) String`;
  `data TextAlignment n = BaselineText | BoxAlignedText n n`; `text`, `alignedText`,
  `baselineText`, `topLeftText`, `mkText'`; `Font (Last String)` with `getFont`, `font`,
  `fontFamily` lens-style accessors; `FontSize (Recommend (Last n))` with `fontSize`,
  `fontSizeO`, `fontSizeL`, `recommendFontSize`, `getFontSize`; `TextAlignment`,
  `Text`, `Font`, `FontSize`.
- **Feature coverage.** No font parsing whatsoever. It is an *attribute and primitive* layer:
  a `Text` primitive holds a string, an alignment and a scale-invariant transform; all scaling
  comes from a `FontSize` attribute. The module header is explicit that the primitive "takes up
  no space", because text size information is not available to the backend-agnostic layer.
- **Architectural stance.** A renderer-agnostic scene-graph primitive. Backends decide how to
  resolve `Font` and how much space text occupies; SVGFonts exists precisely to supply real
  outlines where a backend cannot.
- **Worth stealing.** The `Recommend`/`Last` attribute machinery cleanly separates "a hint
  about size" from "an enforced size", and the honest admission that a text primitive has no
  intrinsic envelope is a useful warning: a layout layer must not pretend to know ink bounds
  it has not measured.

### 1.1.4 `freetype2` (Hackage, Jason Dagit)

- **Name / version / licence.** `freetype2` 0.2.0, "Haskell bindings for FreeType 2 library",
  Haskell98. Licence of the binding `[unverified]` from the consulted page; the underlying
  FreeType is under the FreeType Licence / GPL dual terms.
- **Sources.** `https://hackage.haskell.org/package/freetype2/docs/FreeType-Core-Base.html`,
  `https://www.adrian.geek.nz/haskell_docs/graphics` (a detailed reading of these bindings).
- **API identifiers** (`FreeType.Core.Base` and sibling modules), grouped.
  - *Library and face:* `FT_Init_FreeType`, `FT_Done_FreeType`, `FT_New_Face`,
    `FT_New_Memory_Face`, `FT_Open_Face`, `FT_Open_Args`, `FT_Done_Face`, `FT_Reference_Face`,
    `FT_Attach_File`, `FT_Attach_Stream`, `FT_Parameter`, `FT_Face_Properties`.
  - *Capability predicates:* `FT_HAS_FIXED_SIZES`, `FT_HAS_COLOR`,
    `FT_HAS_MULTIPLE_MASTERS`, `FT_IS_SFNT`, `FT_IS_SCALABLE`, `FT_IS_FIXED_WIDTH`,
    `FT_IS_CID_KEYED`, `FT_IS_TRICKY`, `FT_IS_NAMED_INSTANCE`, `FT_IS_VARIATION`,
    `FT_HAS_FAST_GLYPHS`.
  - *CharSize and scaling:* `FT_Set_Char_Size`, `FT_Set_Pixel_Sizes`, `FT_Request_Size`,
    `FT_Select_Size`, `FT_Size_RequestRec`, `FT_Size_Request_Type`, `FT_Set_Transform`.
  - *Glyph loading and charmaps:* `FT_Load_Glyph`, `FT_Get_Char_Index`,
    `FT_Get_First_Char`, `FT_Get_Next_Char`, `FT_Get_Name_Index`,
    `FT_Get_Glyph_Name`, `FT_Get_Postscript_Name`, `FT_CharMapRec`, `FT_Select_Charmap`,
    `FT_Set_Charmap`, `FT_Get_FSType_Flags`.
  - *Metrics, modes and kerning:* `FT_Size_Metrics`, `FT_Glyph_Metrics`, `FT_Bitmap_Size`,
    `FT_Get_Kerning`, `FT_Kerning_Mode`, `FT_Get_Track_Kerning`, `FT_Render_Mode`,
    `FT_LOAD_TARGET_MODE`, `FT_LOAD_XXX`, `FT_SUBGLYPH_FLAG_XXX`, `FT_FSTYPE_XXX`.
- **Feature coverage.** Essentially that of the underlying C library: TTF, OTF/CFF, WOFF
  (through FreeType's own handling), TTC (face indices), variable fonts, colour and bitmap
  strikes (`FT_HAS_COLOR`, `FT_HAS_FIXED_SIZES`), rasterisation (`FT_Render_Mode`), kerning;
  no shaping, no subsetting, no writing. Exact WOFF2 and variable-font behaviour is
  `[unverified]` for the version consulted.
- **Architectural stance.** A near one-to-one FFI transcription. As the reading of the code
  notes, the bindings are handwritten with helper functions for memory allocation and error
  reformatting, use `bracket` to pair setup/cleanup, use `Storable` record types produced via
  the `hsc2hs` preprocessor, expose raw FFI bindings in `Internal` modules with a trailing
  apostrophe, and convert non-zero return values into `FtError` exceptions through `ftError`,
  `AutoError` and `AutoAllocaError`. It is still "very raw bindings".
- **Worth stealing.** `FT_New_Memory_Face` and `FT_Open_Args`/`FT_Attach_Stream` show the
  value of a byte-source abstraction that is independent of a file path; a core parser should
  accept memory, not filenames. The `ftError`/`AutoError` pattern also shows how to keep a
  raw C API usable without hiding it behind an opinionated model.

### 1.1.5 The Krantz-XRF / Argonaut binding family, Typograffiti and Balkón

- **Name / version / licence.** `FreeType`, `FreeType-Rasterific`, `FreeType-convert` and a
  generated `HarfBuzz` binding (repository `Krantz-XRF/FreeType`, 2019); `Typograffiti`,
  `Balkón` and `CatTrap` in the Argonaut stack; HarfBuzz bindings maintained by Adrian
  Cochrane and ICU bindings by Bryan O'Sullivan. Versions and licences `[unverified]`.
- **Sources.** `https://github.com/Krantz-XRF/FreeType/blob/master/README.md`,
  `https://www.adrian.geek.nz/haskell_docs/graphics`,
  `https://argonaut-constellation.org/2023/03/19/text-layout.html`.
- **API identifiers.** `FreeType.LowLevel.Types`, `FreeType.Types`,
  `FreeType.LowLevel.Size`, `FreeType.LowLevel.Generic`, `Data.FixedPoint`,
  `FreeType.LowLevel.Glyph`, `FreeType.Glyph`, `FreeType.Rasterific` (the module naming rule
  is documented: for APIs concerning `FT_Glyph`, drop the `FT_` prefix and look in
  `FreeType.LowLevel.Glyph` and `FreeType.Glyph`). `Balkón` is described as a pure function
  from text and properties to positioned glyphs; `Typograffiti` paints glyphs onto an output
  medium; `CatTrap` defines the boxes.
- **Feature coverage.** FreeType-level parsing and outlines plus a Rasterific rendering
  backend, plus HarfBuzz shaping. The HarfBuzz binding is described in its own README as
  "automatically generated from the HarfBuzz's C headers" and "currently not well tested, so
  use at your own risk".
- **Architectural stance.** A deliberately *layered* Haskell stack: a low-level FFI layer, a
  high-level layer, a separate rendering backend, a separate shaping binding, a separate
  Unicode/break-iteration layer, a pure layout engine, and a painter. This is the clearest
  Haskell example of the layered architecture proposed in Part 2. The Balkón write-up also
  records two concrete difficulties worth heeding: HarfBuzz emits glyphs in visual
  left-to-right order regardless of input direction, and the units of `x_advance` are a
  recurring source of confusion.
- **Worth stealing.** Treat layout as a pure function over `text + properties -> positioned
  glyphs`, with itemisation, BiDi and line breaking as explicit run-splitting stages before
  shaping. Keep the painting step (`Typograffiti`) wholly separate from the shaping step.

### 1.1.6 `harfbuzz-pure` / `Data.Text.Glyphize`

- **Name / version / licence.** `harfbuzz-pure` 1.0.0.1 (and 1.0.0.0); module
  `Data.Text.Glyphize`; licence `[unverified]` from the consulted pages.
- **Sources.** `https://hackage.haskell.org/package/harfbuzz-pure-1.0.0.1/src/Data/Text/Glyphize.hs`,
  `https://hackage.haskell.org/package/harfbuzz-pure-1.0.0.0/docs/Data-Text-Glyphize.html`.
- **API identifiers** (the module export list is the authoritative inventory), grouped.
  - *Layout:* `shape :: Font -> Buffer -> [Feature] -> [(GlyphInfo, GlyphPos)]`,
    `Buffer`, `ContentType`, `ClusterLevel`, `Direction`, `defaultBuffer`,
    `guessSegmentProperties`, `dirFromStr`, `dirToStr`, `dirReverse`, `dirBackward`,
    `dirForward`, `dirHorizontal`, `dirVertical`, `scriptHorizontalDir`, `languageDefault`,
    `tag_from_string`, `tag_to_string`, `GlyphInfo`, `GlyphPos`, `Feature`, `featTag`,
    `globalStart`, `globalEnd`, `parseFeature`, `unparseFeature`, `parseVariation`,
    `unparseVariation`, `Variation`, `varTag`.
  - *Face and table access:* `Face`, `createFace`, `ftCreateFace`, `emptyFace`, `countFace`,
    `faceTableTags`, `faceGlyphCount`, `faceCollectUnicodes`, `faceCollectVarSels`,
    `faceCollectVarUnicodes`, `faceIndex`, `faceUpem`, `faceBlob`, `faceTable`.
  - *Font and metrics:* `Font`, `createFont`, `ftCreateFont`, `emptyFont`, `fontFace`,
    `fontGlyph`, `fontGlyphAdvance`, `fontGlyphContourPoint`,
    `fontGlyphContourPointForOrigin`, `fontGlyphFromName`, `fontGlyphHAdvance`,
    `fontGlyphVAdvance`, `fontGlyphHKerning`, `fontGlyphHOrigin`, `fontGlyphVOrigin`,
    `fontGlyphKerningForDir`, `fontGlyphName`, `fontGlyphName_`, `fontGlyphOriginForDir`,
    `fontNominalGlyph`, `fontPPEm`, `fontPtEm`, `fontScale`, `fontVarGlyph`,
    `fontVarCoordsNormalized`, `fontTxt2Glyph`, `fontGlyph2Str`, `GlyphExtents`,
    `fontGlyphExtents`, `fontGlyphExtentsForOrigin`, `FontExtents`, `fontExtentsForDir`,
    `fontHExtents`, `fontVExtents`, `FontOptions`, `defaultFontOptions`,
    `createFontWithOptions`, `ftCreateFontWithOptions`.
  - *Version:* `version`, `versionAtLeast`, `versionString`; the FFI calls are
    `hb_shape`, `hb_version`, `hb_version_atleast`, `hb_version_string`.
- **Feature coverage.** Shaping `Y` (delegated to C HarfBuzz); face/blob/table access `Y`;
  glyph advances, origins, extents, nominal glyphs and variation coordinates `Y`; no raster,
  no subsetting, no writing, no outline sink (the consulted export list contains no draw
  functions).
- **Architectural stance.** A thin, typed FFI wrapper that makes `hb_shape` a pure function by
  using `unsafePerformIO` over `withForeignPtr` and a thawed buffer copy. It pairs neatly with
  the `freetype2` binding via the `ftCreateFace` / `ftCreateFont` constructors, which is a
  useful pattern: a shaper that accepts a *font abstraction supplied by another library*
  rather than owning font parsing itself.
- **Worth stealing.** The `ftCreateFont` / `ftCreateFace` pair is an explicit adapter seam
  between a parser and a shaper. A latecomer should let the shaping layer consume a
  `FontFace` trait/interface it does not own, so FreeType, HarfBuzz or a native parser can all
  be plugged in.

### 1.1.7 Names that could not be verified

No Hackage package named `HSFont`, no Haskell `FontBox`-like package, and no Haskell package
named `typography` could be confirmed from the consulted sources `[unverified]`. The
frequently cited `Typography` / `Typography.OpenFont` is a **C#** project (LayoutFarm), not a
Haskell one. `font-kit` is likewise not a Haskell package; it belongs to other ecosystems.
This is recorded as a negative finding rather than filled in by guesswork. If equivalents
exist on Hackage, they are not prominent enough to appear in the package indices consulted.

### 1.1.8 Haskell: consolidated stance

Haskell has exactly two native font parsers of note (`FontyFruity` for TrueType outlines,
`SVGFonts` for SVG-Font outlines), neither of which shapes text, rasterises, or writes fonts.
Everything else is a binding to C (FreeType, HarfBuzz, ICU) or a pure composition layer over
those bindings (Balkón, Typograffiti, `diagrams`). The ecosystem's functional boundary is
therefore unusually legible: **native Haskell code handles geometry, layout policy and
composition; C libraries handle parsing, hinting, rasterisation and shaping.** The one
counterexample worth noting is that `FontyFruity` mixes system font discovery into its parser
module, and `SVGFonts` requires an external FontForge conversion step because the SVG-Font
format is deprecated on the web. A latecomer should not repeat either choice.

## 1.2 Kotlin

Kotlin is the clearest case of an ecosystem with **no native font-file parser at all**. Every
route to a glyph goes through a platform service: Android's framework (which wraps Skia /
FreeType / HarfBuzz / Minikin), CoreText or DirectWrite under Skiko, or the JVM's Java2D. The
API surfaces are rich in *descriptors, loading strategies, metrics and shaping*, and almost
empty in *tables, glyph outlines and byte sources*.

### 1.2.1 Android framework: `android.graphics.Typeface`, `Paint`, `Canvas`, `android.text`

- **Name / version / licence.** Part of the Android SDK, `android.graphics` and `android.text`;
  Apache License 2.0 for the Android Open Source Project sources (confirmed in the headers of
  the Compose sources quoted below). No independent version number; API levels are the
  versioning unit.
- **Sources.** `https://developer.android.google.cn/reference/android/graphics/Paint?hl=hr`,
  `https://javadoc.io/static/com.google.android/android/2.3.3/android/graphics/Paint.html`.
- **API identifiers, grouped.**
  - *Typeface construction:* `Typeface.create(String, int)`, `Typeface.create(Typeface, int)`,
    `Typeface.createFromAsset(AssetManager, String)`, `Typeface.createFromFile(File)` /
    `Typeface.createFromFile(String)`, `Typeface.createFromResources`, `Typeface.DEFAULT`,
    `Typeface.DEFAULT_BOLD`, `Typeface.SANS_SERIF`, `Typeface.SERIF`, `Typeface.MONOSPACE`,
    `Typeface.BOLD`, `Typeface.ITALIC`, `Typeface.BOLD_ITALIC`.
  - *Paint font attributes:* `setTypeface(Typeface)`, `getTypeface()`, `setTextSize(float)`,
    `getTextSize()`, `setTextScaleX(float)`, `setTextSkewX(float)`, `getTextScaleX()`,
    `getTextSkewX()`, `setTextAlign(Paint.Align)`, `getTextAlign()`, `setFontFeatureSettings`
    `[unverified]`, `getTextLocale()` / `getTextLocales()`, `setUnderlineText`,
    `setStrikeThruText`, `setFakeBoldText`, `setLinearText(boolean)`, `setSubpixelText(boolean)`,
    `setHinting` `[unverified]`, `setAntiAlias`, `isAntiAlias()`, flags `ANTI_ALIAS_FLAG`,
    `DEV_KERN_TEXT_FLAG`, `LINEAR_TEXT_FLAG`, `SUBPIXEL_TEXT_FLAG`, `FAKE_BOLD_TEXT_FLAG`.
  - *Measurement:* `measureText(String)`, `measureText(String, int, int)`,
    `measureText(char[], int, int)`, `measureText(CharSequence, int, int)`,
    `getTextBounds(String, int, int, Rect)`, `getTextBounds(char[], int, int, Rect)`,
    `getTextBounds(CharSequence, int, int, Rect)`, `getTextWidths(...)` (four overloads),
    `getTextRunAdvances(char[], int, int, int, int, boolean, float[], int)`,
    `breakText(...)` (three overloads), `getTextRunCursor(...)` (two overloads),
    `getFontMetrics()`, `getFontMetrics(Paint.FontMetrics)`, `getFontMetricsInt(...)`,
    `ascent()`, `descent()`, `getFontSpacing()`, `getUnderlinePosition()`,
    `getUnderlineThickness()`, `getWordSpacing()`; `Paint.FontMetrics` fields `top`, `ascent`,
    `descent`, `bottom`, `leading`; `Paint.FontMetricsInt` with integer equivalents.
  - *Outlines and glyph coverage:* `getTextPath(char[], int, int, float, float, Path)`,
    `getTextPath(String, int, int, float, float, Path)`, `hasGlyph(String)`.
  - *Drawing:* `Canvas.drawText(...)`, `Canvas.drawTextRun(...)`, `Canvas.drawTextOnPath(...)`.
  - *Layout (android.text):* `StaticLayout`, `DynamicLayout`, `BoringLayout`, `TextPaint`,
    `Layout.getLineCount()` / `getLineWidth()` / `getPrimaryHorizontal()`. These names are
    standard framework APIs and were not individually fetched `[unverified]`.
- **Feature coverage.** TTF/OTF/TTC/variable/colour/bitmap `Y` at load time (via the platform),
  but no table-level access; shaping `Y` (via Minikin/HarfBuzz, not exposed as GSUB/GPOS);
  rasterisation `Y` (into a `Canvas`); subsetting `N`; writing `N`; WOFF/WOFF2 `N` as a
  recognised input format.
- **Architectural stance.** A handle-and-descriptor API. `Typeface` is an opaque loaded font;
  `Paint` is a mutable bag of rendering parameters; measurement and drawing are methods on
  `Paint`/`Canvas`. There is no byte source, no table directory, no glyph-id surface (glyphs
  appear only as a `ShortArray` in Skiko or inside a `Path` here), and no outline sink.
  `getTextPath` returns a `Path` object, not a callback stream.
- **Worth stealing.** The explicit distinction between `measureText` (advance width, including
  side bearings) and `getTextBounds` (tight ink bounding box) is a genuinely useful API
  contract that many libraries conflate. A differential-test suite should fixture both
  separately, because engines disagree on which one they expose.

### 1.2.2 `androidx.compose.ui.text.font`

- **Name / version / licence.** `androidx.compose.ui:ui-text`; Apache License 2.0 (confirmed in
  the source headers at `cs.android.com`). Individual functions carry "Added in" API levels:
  `FontFamily` in 1.0.0, `FontLoadingStrategy` in 1.2.0, `variationSettings` in
  1.13.0-beta02 / 1.10.0 depending on the overload, `AndroidFont` in 1.2.0.
- **Sources.** `https://developer.android.com/reference/kotlin/androidx/compose/ui/text/font/package-summary`,
  `https://developer.android.google.cn/reference/kotlin/androidx/compose/ui/text/font/package-summary?hl=zh-tw`,
  `https://developer.android.com/develop/ui/compose/text/fonts`,
  `https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:compose/ui/ui-text/src/commonMain/kotlin/androidx/compose/ui/text/font/FontFamily.kt`,
  `https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:/compose/ui/ui-text/src/commonMain/kotlin/androidx/compose/ui/text/font/Font.kt`,
  `https://developer.android.google.cn/reference/kotlin/androidx/compose/ui/text/font/Font.html`,
  `https://android-dot-devsite-v2-prod.appspot.com/reference/kotlin/androidx/compose/ui/text/font/AndroidFont`.
- **API identifiers, grouped.**
  - *Interfaces:* `Font` (with `weight: FontWeight`, `style: FontStyle`,
    `loadingStrategy: FontLoadingStrategy`, `variationSettings: FontVariation.Settings`, and
    the deprecated nested `Font.ResourceLoader`), `FontFamily.Resolver`, `Typeface`,
    `FontVariation.Setting` ("Represents a single point in a variation, such as 0.7 or 100"),
    `AndroidFont.TypefaceLoader`. Deprecated: `Font.ResourceLoader`.
  - *Classes:* `FontFamily`, `FontListFontFamily`, `GenericFontFamily`, `SystemFontFamily`,
    `FileBasedFontFamily`, `LoadedFontFamily`, `ResourceFont`, `AndroidFont`,
    `DeviceFontFamilyName`, `FontLoadingStrategy`, `FontStyle`, `FontSynthesis`,
    `FontWeight` (range 1..1000), `FontVariation.Settings`. Object: `FontVariation`.
  - *`FontLoadingStrategy` values:* `Blocking`, `OptionalLocal`, `Async`.
  - *Font constructors (top-level functions named `Font`):* `Font(resId: Int, weight, style,
    loadingStrategy, variationSettings)`, `Font(file: File, weight, style, variationSettings)`,
    `Font(path: String, assetManager: AssetManager, weight, style, variationSettings)`,
    `Font(fileDescriptor: ParcelFileDescriptor, ...)` (`@RequiresApi(26)`),
    `Font(familyName: DeviceFontFamilyName, weight, style, variationSettings)`.
  - *Family and resolution:* `FontFamily(vararg fonts: Font)`, `FontFamily(fonts: List<Font>)`,
    `FontFamily(typeface: Typeface)`, `Font.toFontFamily()`, `Typeface(typeface: android.graphics.Typeface)`,
    `createFontFamilyResolver(context)`, `createFontFamilyResolver(context, coroutineContext)`,
    `FontFamily.Resolver.preload(fontFamily)`, `FontFamily.Resolver.resolve(...)`,
    `resolveAsTypeface(...)`, `Font.MaximumAsyncTimeoutMillis = 15_000L`.
  - *Downloadable fonts:* `androidx.compose.ui.text.googlefonts.GoogleFont`,
    `GoogleFont.Provider`, `Font(googleFont = ..., fontProvider = ...)`.
  - *Not present:* `PlatformFont` (see the verification note above). The platform descriptor is
    `AndroidFont`, an abstract class implementing `Font` with `loadingStrategy`,
    `typefaceLoader` and `variationSettings`.
- **Feature coverage.** TTF/OTF/TTC/variable/colour/bitmap `Y` through the platform; WOFF/WOFF2
  `N`; shaping `Y` but not exposed; subsetting `N`; writing `N`; rasterisation `Y` through
  Compose's `Paragraph`/`Text` pipeline. Variable fonts are exposed as *settings applied at
  load time* (`FontVariation.Settings`, applied on API 26+ via
  `Typeface.Builder.setFontVariationSettings`), not as an axis-inspection API.
- **Architectural stance.** A declarative, `@Immutable` descriptor layer plus a resolver.
  `Font` is a description of *where a font comes from and how it should be requested*; it is
  not a parsed font. `FontFamily.Resolver` maps a descriptor chain to a platform typeface, with
  an explicit state machine for asynchronous loads (`initial -> loading with timeout ->
  resolved`, reflow at most once, `MaximumAsyncTimeoutMillis` of 15 seconds). This is the most
  sophisticated **resource-lifecycle** model in any surveyed ecosystem.
- **Worth stealing.** The `Resolver.preload` / `resolve` split and the fallback-chain model
  ("the loading mechanism will try to resolve the online font first, and then the font located
  in your local `R.font` resource folder") are a good template for a platform integration
  package: descriptor, resolution, caching and lifecycle should be one separable layer, with
  a documented timeout and reflow policy, and nothing of it should leak into the parser.

### 1.2.3 Compose Multiplatform resources

- **Name / version / licence.** `org.jetbrains.compose.components:components-resources` (Compose
  Multiplatform); Apache License 2.0 `[unverified]` for this specific component. Documentation
  consulted for the 1.7.0-era resource API.
- **Sources.** `https://kotlinlang.org/docs/multiplatform/compose-multiplatform-resources-usage.html`,
  `https://www.jetbrains.com.cn/en-us/help/kotlin-multiplatform-dev/compose-multiplatform-resources-usage.html`.
- **API identifiers.** `org.jetbrains.compose.resources.Font` — a `@Composable` function
  `@Composable fun Font(resource: FontResource, weight: FontWeight = FontWeight.Normal,
  style: FontStyle = FontStyle.Normal): Font`; `FontResource`, `Res.font.*` generated
  identifiers, `Res.allFontResources: Map<String, FontResource>`, `Res.readBytes(path)`,
  `getString`, `pluralStringResource`, `painterResource`, `FontFamily`, `FontWeight`,
  `FontStyle`. Font files live in `src/commonMain/composeResources/font` as `*.ttf` or
  `*.otf`. The generated `Res` class is `internal` by default and can be made public with
  `compose.resources { publicResClass = true; packageOfResClass = "..." }`.
- **Feature coverage.** The official documentation states: "Compose Multiplatform supports TTF,
  OTF, TTC, and variable font formats on all platforms. WOFF and WOFF2 are available on web and
  macOS only." Shaping, subsetting, writing `N`; rasterisation `Y` through the platform.
- **Architectural stance.** A compile-time resource compiler plus a composable loader. Font
  loading is `@Composable` and may suspend on iOS; `TextStyle` and `Typography` must therefore
  also be composable. This is a *build-time / UI-lifecycle* concern, one full layer above font
  data.
- **Worth stealing.** The honest, per-platform format matrix (TTF/OTF/TTC/variable everywhere;
  WOFF/WOFF2 only on web and macOS) is exactly the kind of capability declaration a core
  library should avoid making silently. Format support belongs to the platform adapter and
  must be documented per target, not assumed.

### 1.2.4 Skiko (`org.jetbrains.skia`)

- **Name / version / licence.** Skiko, JetBrains' Kotlin Multiplatform bindings to Skia;
  Apache License 2.0 `[unverified]` from the consulted pages. Module path
  `skiko/src/commonMain/kotlin/org/jetbrains/skia/`.
- **Sources.** `https://jetbrains.github.io/skiko/skiko/org.jetbrains.skia/-font/index.html`,
  `https://jetbrains.github.io/skiko/skiko/org.jetbrains.skia/-font/-font.html`,
  `https://jetbrains.github.io/skiko/skiko/org.jetbrains.skia/-typeface/index.html`,
  `https://deepwiki.com/JetBrains/skiko/7-configuration-and-properties`,
  `https://deepwiki.com/JetBrains/skiko/7.5-text-and-fonts`,
  `https://deepwiki.com/JetBrains/skiko/7.5.2-shaping-textblob-and-textline`,
  `https://api.skia.org/classSkFontMgr.html`, `https://skia.org/docs/dev/design/text_overview`.
- **API identifiers, grouped.**
  - *`Typeface` (verified from the kdoc):* `familyName`, `familyNames`, `glyphsCount`,
    `unitsPerEm`, `uniqueId`, `variationAxes: Array<FontVariationAxis>?`,
    `variations: Array<FontVariation>?`, `bounds`, `fontStyle`, `isBold`, `isItalic`,
    `isFixedPitch`, `tablesCount`, `tableTags: Array<String>`, `getTableData(tag: String): Data?`,
    `getTableSize(tag: String)`, `getStringGlyphs(s: String): ShortArray`,
    `getUTF32Glyph(unichar: Int): Short`, `getUTF32Glyphs(uni: IntArray?): ShortArray`,
    `getKerningPairAdjustments(glyphs: ShortArray?): IntArray?`,
    `makeClone(variation: FontVariation): Typeface`,
    `makeClone(variations: Array<FontVariation>, collectionIndex: Int = 0): Typeface`.
    Note the exact spellings `glyphsCount` and `uniqueId`.
  - *`Font` (verified):* constructors `Font()`, `Font(typeface: Typeface?)`,
    `Font(typeface, size: Float)`, `Font(typeface, size, scaleX, skewX)`; properties `edging`,
    `hinting`, `isAutoHintingForced`, `isBaselineSnapped`, `isEmboldened`, `isLinearMetrics`,
    `isSubpixel`, `metrics: FontMetrics`, `size`, `scaleX`, `skewX`, `spacing`, `typeface`;
    functions `getBounds(glyphs: ShortArray?, p: Paint? = null)`,
    `getPath(glyph: Short): Path?`, `getPaths`, `getPositions`, `getXPositions`,
    `getWidths`, `getStringGlyphs`, `getStringGlyphsCount`, `getUTF32Glyph`, `getUTF32Glyphs`,
    `measureText(s, p): Rect`, `measureTextWidth`, `makeWithSize`, `setTypeface`,
    `areBitmapsEmbedded` / `setBitmapsEmbedded`, `close`.
  - *`FontMgr`:* `makeFromData(data, ttcIndex = 0)`, `makeFromFile(path, ttcIndex = 0)`,
    `makeFromStream(...)`, `matchFamily`, `matchFamilyStyle`,
    `matchFamilyStyleCharacter`, `countFamilies`, `getFamilyName`, `createStyleSet`,
    `FontMgr.default` (the exact Kotlin spelling `FontMgr.default` appeared in the consulted
    material; the C++ equivalents are `SkFontMgr::RefDefault()` / `RefEmpty()`).
  - *Shaping and layout:* `org.jetbrains.skia.shaper.Shaper` with `makePrimitive`,
    `makeShaperDrivenWrapper(fontMgr)`, `makeShapeThenWrap(fontMgr)`,
    `makeShapeDontWrapOrReorder(fontMgr)`, `makeCoreText()`; `ShapingOptions`, `RunInfo`,
    `ManagedRunIterator`, `FontMgrRunIterator`, `HbIcuScriptRunIterator`,
    `IcuBidiRunIterator`, `TextBlobBuilderRunHandler`; `TextBlob`, `TextBlobBuilder`,
    `TextLine`; `Paragraph`, `ParagraphBuilder`, `ParagraphStyle`, `TextStyle`,
    `FontCollection`; `BreakIterator`.
  - *Rendering types:* `Canvas`, `Surface`, `Bitmap`, `Pixmap`, `Image`, `Data`, `ImageInfo`,
    `ColorInfo`, `ColorSpace`, `Codec`, `Paint`, `Path`, `FontEdging`, `FontHinting`.
- **Feature coverage.** TTF/OTF/CFF/TTC/variable/colour/bitmap/WOFF `Y` through native Skia
  (Skia itself uses FreeType, CoreText or DirectWrite, plus HarfBuzz and ICU); WOFF2 `[unverified]`;
  shaping `Y` (HarfBuzz, ICU, CoreText on macOS); subsetting `N`; writing `N`; rasterisation
  `Y` (into `Surface`/`Bitmap`). Table access is available but shallow: `tableTags`,
  `getTableData`, `getTableSize`, `tablesCount` — raw `Data`, not typed tables.
- **Architectural stance.** A four-tier typography stack in one binding: `Typeface`/`Font` for
  low-level metrics and glyph ids; `Shaper`/`TextBlob`/`TextLine` for shaping; `Paragraph` for
  rich layout, BiDi and wrapping; `BreakIterator` for Unicode segmentation. Skiko is a
  **binding to Skia**, not a font library: every capability above byte-source abstraction is
  delegated to C++ Skia, which in turn delegates to platform font services. Crucially it
  still exposes `makeFromData` (a byte-array constructor) and raw table bytes, which makes it
  the only Kotlin route to something resembling a font-file API.
- **Worth stealing.** The `Typeface` / `Font` split: `Typeface` is the immutable font resource
  (family, axes, glyph count, unitsPerEm, table tags), while `Font` is the sized and styled
  *instance* (`size`, `scaleX`, `skewX`, `edging`, `hinting`, `isSubpixel`). A latecomer should
  keep "face" and "instance" as distinct values; conflating them (as FreeType's `FT_Face`
  and CoreText's `CTFont` do) makes caching and variation handling much harder. Second,
  `getPath` returns `Path?` and is documented to return `null` "If glyph is described by a
  bitmap" — an explicit, typed statement of a capability gap rather than a silent fallback.

### 1.2.5 JVM font libraries usable from Kotlin

`java.awt.Font`, `java.awt.font.FontRenderContext`, `java.awt.font.GlyphVector`,
`java.awt.font.TextLayout`, `java.awt.font.LineBreakMeasurer`, `Font.createFont(int, InputStream)`
and `Font.deriveFont(float)` are usable directly from Kotlin/JVM. `GlyphVector.getGlyphOutline`
and `TextLayout.getOutline(AffineTransform)` provide outline access; `FontMetrics` provides
measurement. These are standard JDK APIs and were not individually fetched `[unverified]`.
Their stance is the same as Android's: an opaque loaded font plus a measurement/drawing
pipeline, with parsing delegated to the JDK's native font rasteriser. No table directory, no
subsetting, no writing.

### 1.2.6 Kotlin: consolidated stance

There is **no native Kotlin font-file parser**. `android.graphics.Typeface`, Compose's `Font`,
Compose resources, Skiko and Java2D are all descriptors or bindings over Skia, FreeType,
CoreText, DirectWrite or Minikin. The functional boundary is stark: Kotlin owns *font
selection, asynchronous loading, fallback chains, family matching, variation settings,
shaping orchestration and text layout*; C/C++ and the OS own *parsing, hinting, rasterisation
and glyph substitution*. The single most transferable idea is the descriptor/resolver split —
a `Font` that describes *where bytes come from* and a `Resolver` that turns it into a usable
typeface — because it keeps I/O and platform state entirely out of the data layer.

## 1.3 PHP

PHP is the opposite of Kotlin: it has a genuine, widely deployed, pure-PHP font parser and
subsetter (php-font-lib), plus three rasterisation wrappers (GD, Intervention Image, TCPDF)
that merely call FreeType. It is also the ecosystem with the most confusing naming history,
because the library changed both its namespace scheme and its repository home.

### 1.3.1 `phenx/php-font-lib` and `dompdf/php-font-lib`

- **Name / version / licence.** The canonical repository is now **`dompdf/php-font-lib`**:
  retrieving `https://github.com/PhenX/php-font-lib` resolves to the dompdf repository title.
  The verified `composer.json` declares `"name": "dompdf/php-font-lib"` and
  `"license": "LGPL-2.1-or-later"`, with `"homepage": "https://github.com/dompdf/php-font-lib"`,
  PSR-4 autoload `FontLib\\` -> `src/FontLib`, PHP `^7.1 || ^8.0` and `ext-mbstring`.
  **Version:** the repository lists 1.0.2 as the latest release (January 2026); the Ubuntu
  24.04 package is 0.5.4+dfsg-3; Packagist history for `phenx/php-font-lib` runs 0.3.1 (2014)
  through 1.0.0 (April 2024).
  **Licence conflict, stated explicitly:** third-party aggregators disagree. OpenHub records
  "GNU Lesser General Public License v3.0 only"; a vendored project licence manifest records
  `phenx/php-font-lib` 0.5.1 as LGPL-3.0; Libraries.io records `phenx/php-font-lib` 1.0.0 as
  `SSPL-1.0`. The repository's own `composer.json` says `LGPL-2.1-or-later`. These conflict;
  the repository declaration is the most authoritative of the consulted sources, but anyone
  depending on the licence should verify the exact release they consume.
- **Sources.** `https://github.com/dompdf/php-font-lib`,
  `https://raw.githubusercontent.com/dompdf/php-font-lib/master/composer.json`,
  `https://deepwiki.com/dompdf/php-font-lib/4.2-opentype-fonts`,
  `https://deepwiki.com/dompdf/php-font-lib/6.2-glyph-data-(glyf)`,
  `https://ubuntu.pkgs.org/24.04/ubuntu-universe-arm64/php-font-lib_0.5.4+dfsg-3_all.deb.html`,
  `https://libraries.io/packagist/phenx%2Fphp-font-lib`,
  `https://www.openhub.net/p/php-font-lib`,
  `https://deepwiki.com/jasonsarino/hms/4.2-font-management-and-typography` (for the legacy
  underscore class names).
- **API identifiers, grouped.**
  - *Entry point and format detection:* `\FontLib\Font::load(string $path)` — a static factory
    that inspects the first four bytes and dispatches on magic numbers: `"OTTO"` ->
    `\FontLib\OpenType\File`; `"\x00\x01\x00\x00"`, `"true"`, `"typ1"` ->
    `\FontLib\TrueType\File`; `"wOFF"` -> `\FontLib\WOFF\File`; `"ttcf"` ->
    `\FontLib\TrueType\Collection`. `parse()`, `close()`, `open($path, $mode)`.
  - *Byte source:* `\FontLib\BinaryStream` (constants `modeRead`, `modeWrite`,
    `modeReadWrite`), `\FontLib\Header`, `\FontLib\EncodingMap`, `\FontLib\AdobeFontMetrics`,
    `\FontLib\Exception\FontNotFoundException`. Binary reads of integers, floats and strings
    with big-endian handling.
  - *Table directory:* `\FontLib\Table\DirectoryEntry`, `\FontLib\Table\Table`,
    `\FontLib\TrueType\TableDirectoryEntry`, `\FontLib\OpenType\TableDirectoryEntry`,
    `\FontLib\WOFF\TableDirectoryEntry`, `parseTableEntries()`, `getBTable($name)`,
    `getData("cmap", "subtables")`, `directory_info`.
  - *Tables (one class each under `FontLib\Table\Type`):* `cmap`, `glyf`, `head`, `hhea`,
    `hmtx`, `kern`, `loca`, `maxp`, `name`, `nameRecord`, `os2`, `post`. Each has `_parse()`
    and, where applicable, `_encode()`.
  - *Charmap:* `getUnicodeCharMap()`; the `cmap` parser builds a `glyphIndexArray` and supports
    cmap formats 2, 4 and 12 (per the consulted description).
  - *Outlines:* `\FontLib\Glyph\Outline` (factory `Outline::init()` dispatching on
    `numberOfContours`: non-negative -> `\FontLib\Glyph\OutlineSimple`, negative ->
    `\FontLib\Glyph\OutlineComposite`), `\FontLib\Glyph\OutlineComponent`; fields `$offset`,
    `$size`, `$numberOfContours`, `$xMin`, `$yMin`, `$xMax`, `$yMax`, `$raw`;
    `getGlyphIDs()` recursively collects composite references; the `glyf` parser is described
    as also offering SVG path generation for glyph outlines (the exact method name is
    `[unverified]`). The `loca` table supplies offsets; `_encode()` re-pads to 4-byte
    alignment and rewrites `loca`.
  - *Metadata:* `getFontName()`, `getFontSubfamily()`, `getFontSubfamilyID()`,
    `getFontFullName()`, `getFontVersion()`, `getFontWeight()`, `getFontPostscriptName()`.
  - *Writing and subsetting:* `setSubset(string $chars)`, `reduce()`,
    `encode(array("OS/2"))`, `saveAdobeFontMetrics($path)`, `save()`, `exportTTF()`,
    `importTTF()` (the last two appear in a secondary tutorial; `[unverified]`).
    `\FontLib\Font::UTF8ToUTF16()` / `UTF16ToUTF8()` and `\FontLib\Font::$debug` are described
    in secondary sources `[unverified]`.
  - *Legacy pre-namespace class names* (confirmed in an old bundled dompdf copy, files such as
    `font_truetype.cls.php`, `font_table_cmap.cls.php`, `font_table_glyf.cls.php`):
    `Font_TrueType`, `Font_Table_cmap`, `Font_Table_glyf`, `Font_Table_loca`,
    `Font_Table_kern`, `Font_Table_post`, `Font_Metrics`, and the `adobe_font_metrics` class.
    The exact legacy spelling `Font_TrueType_Collection` could not be confirmed
    `[unverified]`; the modern equivalent is `\FontLib\TrueType\Collection`, which is
    `Countable` per a secondary source.
  - *Containers:* `\FontLib\WOFF\File`, `\FontLib\WOFF\Header`, `\FontLib\EOT\File`,
    `\FontLib\EOT\Header`, `\FontLib\TrueType\Collection`, `\FontLib\OpenType\File` (which
    "inherits directly from `TrueType\File` without additional functionality" — CFF is not
    parsed differently).
- **Feature coverage.** TTF `Y`; OTF `P` (the `"OTTO"` magic is recognised but only
  TrueType-flavoured glyphs are handled; CFF `N`); WOFF `Y` (read, and EOT header support);
  WOFF2 `N`; TTC `Y`; variable `N`; colour `N`; bitmap `N`; shaping `N` (a legacy `kern`
  table is parsed, GSUB/GPOS are not); subsetting `Y`; writing `Y`; rasterisation `N`.
- **Architectural stance.** A hand-written, object-oriented, table-per-class parser with a
  shared `BinaryStream` base, a magic-number factory, and — unusually — a **symmetric
  reader/writer**: `_parse()` and `_encode()` on the same table classes, with a real subsetter
  (`setSubset` / `reduce` / `encode`). It is a native PHP implementation, not a binding. Its
  natural consumer is a PDF generator (dompdf), which explains the AFM output and the emphasis
  on metrics and subsetting rather than rendering.
- **Worth stealing.** The symmetric `_parse()` / `_encode()` pair on each table class, driven
  by a single shared binary stream abstraction, is the cleanest demonstration in the survey
  that reading and writing belong to the same *table vocabulary* even when they are separate
  operations. Also worth stealing: recursive `getGlyphIDs()` over composite glyph references,
  which is exactly what a subsetter must get right and is easy to forget.

### 1.3.2 GD (`imagettftext` and friends)

- **Name / version / licence.** PHP GD extension functions; PHP 4 through PHP 8; the PHP manual
  is under the PHP documentation licence `[unverified]` and the GD library under its own
  licence. Requires PHP compiled with FreeType support (`--with-freetype-dir=DIR`).
- **Sources.** `https://www.php.net/manual/en/function.imagettftext.php`,
  `https://www.php.net/manual/en/function.imagettfbbox.php`,
  `https://www.php.net/manual/en/function.imagefttext.php` (content verified against the
  mirrored manual pages returned during research, including the Portuguese and Ukrainian
  translations and `https://phpdoctest.github.io/en/function.imagettftext.html`).
- **API identifiers, grouped.**
  - *Raster text:* `imagettftext($image, $size, $angle, $x, $y, $color, $fontfile, $text)`,
    `imagettfbbox($size, $angle, $font_filename, $string, $options = [])`,
    `imagefttext($image, $size, $angle, $x, $y, $color, $font_filename, $text, $options = [])`,
    `imageftbbox(...)`.
  - *Legacy PostScript Type1 functions:* `imagepsbbox`, `imagepsencodefont`,
    `imagepsextendfont`, `imagepsfreefont`, `imagepsloadfont`, `imagepsslantfont`,
    `imagepstext` (removed in PHP 7.0; listed in the manual index consulted).
  - *Environment and built-in fonts:* `putenv('GDFONTPATH=' . realpath('.'))`,
    `imageloadfont`, `imagechar`, `imagestring`, `imagefontwidth`, `imagefontheight`.
  - *Parameter semantics:* `$image` is a `GdImage` from PHP 8.0 (a `resource` before);
    `$size` in points (pixel size in GD1); `$angle` counter-clockwise in degrees; `$x`, `$y`
    define the baseline origin of the first character; a negative `$color` index disables
    anti-aliasing; `$text` is UTF-8 and may contain decimal/hexadecimal numeric character
    references; unsupported characters render as a hollow rectangle. Both bbox functions
    return an eight-element array of four points: lower-left, lower-right, upper-right,
    upper-left (X,Y pairs).
  - *Aliasing change:* "Prior to PHP 8.0.0, `imageftbbox()` was an extended variant of
    `imagettfbbox()`; as of PHP 8.0.0, `imagettfbbox()` is an alias of `imageftbbox()`" and
    "as of PHP 8.0.0, `imagettftext()` is an alias of `imagefttext()`". The `$options` array
    supports `linespacing`.
- **Feature coverage.** TTF `Y` (rasterisation only); everything else `N` from PHP's
  perspective — the underlying FreeType may handle more, but nothing is exposed. No table
  access, no charmap API, no glyph ids, no outlines, no shaping API, no subsetting, no writing.
- **Architectural stance.** A flat procedural raster API. It is a **binding to FreeType**; the
  font is identified by a filesystem path string and consumed only through pixels. There is no
  font object at all.
- **Worth stealing.** The eight-point bounding-box return with a documented point order is a
  compact, language-neutral fixture for ink bounds. Also instructive as a negative example:
  implicit font search via `GDFONTPATH` and automatic `.ttf` suffix appending are exactly the
  kind of hidden I/O a core parser must never perform.

### 1.3.3 Intervention Image

- **Name / version / licence.** `intervention/image`; v3/v4 documented; requires PHP >= 8.3
  from v4, with GD, Imagick or libvips as the driver; MIT licence.
- **Sources.** `https://image.intervention.io/v4/modifying-images/text-fonts`,
  `http://image.intervention.io/v2/api/text`, `https://packagist.org/packages/intervention/image`.
- **API identifiers, grouped.**
  - *v3/v4:* `Image::text(string $text, int $x, int $y, callable|FontInterface $font)`,
    `Intervention\Image\Typography\FontFactory` with `filepath(string)`, `size(float)`,
    `color(string|ColorInterface)`, `stroke($color, int $width = 1)`, `align($horizontal,
    $vertical)`, `valign`, `lineHeight(float)`, `angle(float)`, `wrap(int $width)`;
    `Intervention\Image\Alignment`, `ImageManager::usingDriver(Driver::class)`,
    `Intervention\Image\Drivers\Gd\Driver`, `Drivers\Imagick\Driver`,
    `Drivers\Vips\Driver` `[unverified]`.
  - *v2:* `Intervention\Image\Font` with `file($filepath)`, `size($size)`, `color($color)`,
    `align($align)`, `valign($valign)`, `angle($angle)`, `getBoxSize()` and `applyToImage()`;
    `Image::text($text, $x, $y, Closure $callback)`.
- **Feature coverage.** Rasterisation `Y` via GD/Imagick/libvips (hence FreeType); wrapping and
  line height `Y`; no parsing, no charmap, no outlines, no shaping API, no subsetting, no
  writing. Font selection is a `filepath` string.
- **Architectural stance.** A fluent, driver-agnostic image-editing facade over three raster
  backends. Text is one of many image modifications; the font is a configuration value, not a
  modelled object.
- **Worth stealing.** `wrap($width)` with the explicit note "Hyphenation is not performed" is
  a good example of stating a capability boundary in the API documentation. More broadly, the
  `FontFactory` callback pattern keeps dozens of typographic knobs out of the image object's
  method declaration.

### 1.3.4 TCPDF and tc-lib-pdf

- **Name / version / licence.** Legacy `tecnickcom/TCPDF` (deprecated); current
  `tecnickcom/tc-lib-pdf` plus companion `tecnickcom/tc-lib-pdf-font`, PHP >= 8.2,
  LGPL-3.0-or-later for tc-lib-pdf.
- **Sources.** `https://tcpdf.org/`,
  `https://deepwiki.com/tecnickcom/TCPDF/2.3-font-management`,
  `https://www.peterdev.pl/how-to-set-a-font-in-pdf`.
- **API identifiers, grouped.**
  - *Legacy:* `TCPDF_FONTS::addTTFfont($fontfile, $fonttype = '', $enc = '', $flags = 32,
    $outpath = '', $platform_id = 3, $encoding_id = 1, $addcbbox = false, $link = false)`,
    `SetFont($family, $style, $size)`, `AddFont($family, $style, $file)`,
    `$pdf->writeHTML($html)`, `$pdf->Output()`, `K_PATH_FONTS`, the CLI tool
    `vendor/tecnickcom/tcpdf/tools/tcpdf_addfont.php` (flags `-b -f 32 -o ... -i ...`).
    Generated artefacts: a PHP metrics definition (`fontname.php`), compressed font data
    (`fontname.z`) and a character-to-glyph map (`fontname.ctg.z`). PDF descriptor flags:
    1 fixed, 4 symbol, 8 script, 32 non-symbolic, 64 italic, 65536 all caps, 131072 small
    caps. Built-in core fonts: `helvetica`, `times`, `courier`, `symbol`, `zapfdingbats` (with
    `b`/`i`/`bi` variants).
  - *Current:* `Com\Tecnick\Pdf\Tcpdf`, `$pdf->font->insert($pdf->pon, 'helvetica', '', 12)`,
    `addPage`, `addHTMLCell`, `getOutPDFString()`, `renderPDF()`; font generation via
    `vendor/tecnickcom/tc-lib-pdf-font/util/build_fonts.php` and Composer hooks
    `tc-lib-pdf-fonts` / `post-install-cmd` / `post-autoload-dump`; `K_PATH_FONTS` pointing at
    `vendor/tecnickcom/tc-lib-pdf-font/target/fonts`.
- **Feature coverage.** TTF `Y` for metric conversion; OTF `N`; WOFF/WOFF2 `N` ("TCPDF does
  not support OpenType nor WOFF2 fonts"); TTC `N`; variable/colour/bitmap/shaping `N`;
  subsetting `P` (it produces a converted metrics artefact for PDF embedding, not a general
  subset); writing `P` (an ad-hoc `.php`/`.z`/`.ctg.z` format, not a font file).
- **Architectural stance.** A document-generation library that treats fonts as *build-time
  inputs to be compiled into a private metrics format*. Font conversion is a bootstrap step
  ("asset preparation such as font generation is part of project bootstrap, not a bundled
  step"). There is no runtime font object exposed to the caller.
- **Worth stealing.** The build-time font preparation step with Composer hooks is a good
  pattern for keeping a heavyweight, licence-sensitive conversion out of the runtime path.
  Its `.php`/`.z`/`.ctg.z` output is also a clear warning: an ad-hoc derived format is a
  liability, and a clean-room library should emit standard font bytes instead.

### 1.3.5 WOFF/WOFF2 and HarfBuzz bindings in PHP

No mainstream, stable PECL extension exposing HarfBuzz shaping could be confirmed from the
consulted sources `[unverified]`; the PECL package browser was consulted but no font or
HarfBuzz package was identified there. WOFF2 conversion in PHP projects is typically delegated
to an external CLI (`fonttools subset --flavor=woff2`, `ttf2woff2`) or to a small third-party
extension: the GitHub topic listing shows `hyhnet/php-ext-font-subset` described as "Native PHP
Extension for fast TTF/OTF font subsetting with HarfBuzz" — a single-contributor project whose
stability and API are `[unverified]`. This is a real capability gap: PHP has a pure-PHP
TrueType/WOFF parser and subsetter, but **no native shaping and no native WOFF2 codec**.
Shaping and WOFF2 are reached by shelling out to C/Python tools. That boundary is itself one
of the clearest findings in this survey.

### 1.3.6 PHP: consolidated stance

PHP has one native font library of substance (`php-font-lib`), which is a parser, metrics
extractor, AFM generator and subsetter with a symmetric reader/writer. Everything else (GD,
Intervention Image, TCPDF) is a **FreeType or PDF-toolchain wrapper** that consumes a font as a
file path and produces pixels or PDF dictionaries. The ecosystem's native boundary ends
exactly at "TrueType tables, metrics, outlines and subsets"; shaping, CFF, variable fonts,
colour fonts, WOFF2 and rasterisation are all delegated. That is a defensible, unusually
well-defined scope, and a good model for a first release.

## 1.4 Secondary notes: Swift/CoreText and Ruby/TTFunk

### 1.4.1 Swift / CoreText

- **Name / version / licence.** CoreText is an Apple system framework; `CTFont` is an opaque C
  type bridged to Swift. Closed-source system library, no open licence; no independent version.
- **Sources.** `https://developer.apple.com/documentation/coretext/ctfont`,
  `https://developer.apple.com/documentation/coretext/ctfont?language=objc`,
  `https://apple-docs.everest.mt/docs/coretext/ctfont`,
  `https://pkg.go.dev/github.com/tmc/apple@v0.6.18/coretext`,
  `https://deepwiki.com/servo/core-foundation-rs/4.1-font-management`.
- **API identifiers, grouped.**
  - *Creation:* `CTFontCreateWithName`, `CTFontCreateWithNameAndOptions`,
    `CTFontCreateWithFontDescriptor`, `CTFontCreateWithFontDescriptorAndOptions`,
    `CTFontCreateUIFontForLanguage`, `CTFontCreateCopyWithAttributes`,
    `CTFontCreateCopyWithSymbolicTraits`, `CTFontCreateCopyWithFamily`,
    `CTFontCreateForString`, `CTFontCreateForStringWithLanguage`,
    `CTFontCreateWithGraphicsFont`, `CTFontCopyGraphicsFont`, `CTFontGetPlatformFont`.
  - *Font data and names:* `CTFontCopyFontDescriptor`, `CTFontCopyAttribute`,
    `CTFontGetSize`, `CTFontGetMatrix`, `CTFontGetSymbolicTraits`, `CTFontCopyTraits`,
    `CTFontCopyDefaultCascadeListForLanguages`, `CTFontCopyPostScriptName`,
    `CTFontCopyFamilyName`, `CTFontCopyFullName`, `CTFontCopyDisplayName`,
    `CTFontCopyName`, `CTFontCopyLocalizedName`.
  - *Encoding and coverage:* `CTFontCopyCharacterSet`, `CTFontGetStringEncoding`,
    `CTFontCopySupportedLanguages`.
  - *Metrics:* `CTFontGetAscent`, `CTFontGetDescent`, `CTFontGetLeading`,
    `CTFontGetUnitsPerEm`, `CTFontGetGlyphCount`, `CTFontGetBoundingBox`,
    `CTFontGetUnderlinePosition`, `CTFontGetUnderlineThickness`, `CTFontGetSlantAngle`,
    `CTFontGetCapHeight`, `CTFontGetXHeight`.
  - *Glyph data:* `CTFontCreatePathForGlyph`, `CTFontGetGlyphWithName`,
    `CTFontGetBoundingRectsForGlyphs`, `CTFontGetAdvancesForGlyphs`,
    `CTFontGetOpticalBoundsForGlyphs`, `CTFontGetVerticalTranslationsForGlyphs`,
    `CTFontGetLigatureCaretPositions`.
  - *Variations and features:* `CTFontCopyVariationAxes`, `CTFontCopyVariation`,
    `CTFontCopyFeatures`, `CTFontCopyFeatureSettings`.
  - *Glyph mapping and drawing:* `CTFontGetGlyphsForCharacters`, `CTFontDrawGlyphs`,
    `CTFontDrawImageFromAdaptiveImageProviderAtPoint`.
  - *Raw tables:* `CTFontCopyAvailableTables`, `CTFontCopyTable`, `CTFontTableTag`,
    `CTFontTableOptions`, `CTFontGetTypeID`, `CTFontHasTable` (the last appears in the Go
    binding listing).
  - *Related layout types:* `CTFontCollection`, `CTFontDescriptor`, `CTFrame`,
    `CTFramesetter`, `CTGlyphInfo`, `CTLine`, `CTParagraphStyle`, `CTRun`, `CTRunDelegate`,
    `CTTextTab`, `CTTypesetter`.
- **Feature coverage.** Everything through the platform; raw table bytes are exposed via
  `CTFontCopyTable`, so a motivated caller can parse tables itself. Shaping is available
  through `CTLine`/`CTRun`/`CTFramesetter`, not through a GSUB/GPOS API. No subsetting, no
  writing, no direct raster target (drawing goes to a `CGContext`). `CGGlyph` is the glyph-id
  type (a `UInt16`).
- **Architectural stance.** Swift has **no native font library**; CoreText is a C framework
  with opaque handles, `CFData` blobs for tables, `CGPath` for outlines and a `CGContext` for
  drawing. `CTFont` notably combines face, size, transform matrix and variation settings in
  one object, unlike Skiko's `Typeface`/`Font` split.
- **Worth stealing.** `CTFontCopyTable` / `CTFontCopyAvailableTables`: even a fully opaque
  platform font object should let a caller reach the raw table bytes. That single affordance
  makes it possible to put a clean-room parser on top of a platform font without asking the
  platform to parse tables.

### 1.4.2 Ruby / TTFunk

- **Name / version / licence.** `ttfunk` 1.8.0 (documented at prawnpdf.org); licensed under
  "Matz's terms for Ruby, GPLv2, or GPLv3" (the repository carries `COPYING`, `GPLv2`,
  `GPLv3`, `LICENSE`, `LICENSING`); maintained as a dependency of Prawn. Older repository:
  `https://github.com/higher-pixels/ttfunk`; current documentation host is prawnpdf.org.
- **Sources.** `https://prawnpdf.org/docs/ttfunk/1.8.0/TTFunk/File.html`,
  `https://prawnpdf.org/docs/ttfunk/1.8.0/method_list.html`,
  `http://patch-diff.githubusercontent.com/higher-pixels/ttfunk`.
- **API identifiers, grouped.**
  - *File and byte source:* `TTFunk::File.open(path_or_io)`, `.from_dfont(file, which = 0)`,
    `.from_ttc(io, which = 0)`, `.verify_and_open`, `.verify_and_read`, `#contents` (raw
    `String`), `#directory` (`TTFunk::Directory`), `#directory_info(tag)`,
    `#initialize(contents, offset = 0)`. Also `TTFunk::Collection`, `TTFunk::ResourceFile`,
    `TTFunk::EncodedString`, `TTFunk::Placeholder`, `TTFunk::BitField`,
    `TTFunk::BinUtils.rangify`, `TTFunk::SubTable`, `TTFunk::Table#raw`, `#offset`, `#recode`.
  - *Face accessors (all typed, optional tables):* `#name`, `#header`, `#cmap`, `#cff`,
    `#glyph_outlines` (glyf), `#glyph_locations` (loca), `#horizontal_header` (hhea),
    `#horizontal_metrics` (hmtx), `#maximum_profile` (maxp), `#os2`, `#postscript` (post),
    `#kerning` (kern), `#sbix`, `#vertical_origins` (VORG), `#digital_signature` (DSIG),
    `#find_glyph(glyph_id)`, `#ascent`, `#descent`, `#bbox`, `#line_gap`.
  - *Charmap:* `TTFunk::Table::Cmap::Subtable` with `#unicode?`, `#code_map`,
    `#platform_id`; `TTFunk::Table::Cmap` exposes `#tables`.
  - *Outlines:* `TTFunk::Table::Glyf::Simple`, `Glyf::Compound`, `Glyf::PathBased`
    (`#path`, `#number_of_contours`, `#raw`, `#recode`), `TTFunk::Table::Cff::Charstring`
    (`#render`, `#raw`), `TTFunk::Table::Cff::Path` (`#move_to`, `#render`,
    `#number_of_contours`), plus `Cff::Header`, `TopDict`, `PrivateDict`, `FontDict`,
    `Charset`, `Encoding`, `FdSelector`, `Index`.
  - *Bitmap strikes:* `TTFunk::Table::Sbix` (`#num_strikes`), `Sbix::BitmapData` (`#ppem`,
    `#resolution`).
  - *Subsetting and writing:* `TTFunk::Subset::Base`, `Subset::Unicode`,
    `Subset::Unicode8Bit`, `Subset::CodePage` with `#original_glyph_ids`,
    `#new_to_old_glyph`, `#old_to_new_glyph`, `#new_cmap_table`, `#min_left_side_bearing`;
    `TTFunk::TTFEncoder` (`#original`, `#encode`).
- **Feature coverage.** TTF `Y`; TTC `Y` (`from_ttc`), dfont `Y`; CFF `P` (the 1.8.0 API
  surface contains a substantial `Table::Cff` namespace including `Charstring` and `Path`,
  whereas older documentation describes CFF-flavoured OpenType as unsupported — this
  discrepancy is `[unverified]` and should be resolved against the exact release); WOFF/WOFF2
  `N`; variable `N`; colour `P` (sbix bitmap strikes are read); shaping `N`; subsetting `Y`;
  writing `Y` (`TTFEncoder`); rasterisation `N`.
- **Architectural stance.** A **genuine native, pure-Ruby parser** with lazy per-table loading,
  a raw `contents` string, a table directory, typed table objects and a separate subsetter for
  PDF embedding. It is one of very few parsed-font libraries in a scripting language that
  does not bind FreeType at all. Ruby's font capability boundary is thus: parse, measure,
  subset and embed (Prawn); rasterise and shape elsewhere.
- **Worth stealing.** Lazy, per-table parsing over an immutable raw `contents` string with
  `#directory_info(tag)` — a clean realisation of "face = borrowed bytes + table offsets".
  Also worth stealing: the subsetter keeps explicit `old_to_new_glyph` / `new_to_old_glyph`
  maps and a `#new_cmap_table`, which is the right shape for a glyph-renumbering writer.

## 1.5 Where there is no native font library

This is a finding in its own right and is worth stating plainly, because it defines the
functional boundary of a latecomer.

| Ecosystem | Native font-file parser? | What it binds instead | What it owns natively |
|---|---|---|---|
| Haskell | Yes (FontyFruity, SVGFonts) | FreeType, HarfBuzz, ICU, Rasterific, backend rasterisers | Pure geometry, layout policy, composition |
| Kotlin | **No** | Skia (FreeType / CoreText / DirectWrite + HarfBuzz + ICU), Minikin, Java2D | Descriptors, loading strategy, fallback chains, UI layout |
| PHP | Yes (php-font-lib) | FreeType (GD, Imagick), PDF toolchains | Table parsing, metrics, AFM, subsetting, font writing |
| Swift | **No** | CoreText (and CoreGraphics) | App-level font descriptors and UI |
| Ruby | Yes (TTFunk) | Prawn for PDF embedding (not a font parser) | Table parsing, metrics, subsetting, encoding |

The pattern: **the moment an ecosystem has a mature OS-level text stack, it stops producing
font parsers.** Kotlin and Swift bind Skia/CoreText; PHP, Haskell and Ruby, which historically
needed to inspect and embed fonts for PDF or vector output without a reliable platform text
service, produced native parsers. That is a product decision about functional boundaries, not
an accident of language design. A clean-room latecomer targeting WebAssembly, embedded or
server contexts should note that those are precisely the contexts where no Skia/CoreText
service exists — so the native-parser path is the relevant one.

## 1.6 Aggregated feature-coverage matrix

Legend: `Y` supported, `P` partial or conditional, `N` absent, `?` unverified. "Raster"
denotes a raster target exposed to the caller, not merely pixels drawn somewhere.

| Library | TTF | OTF/CFF | WOFF | WOFF2 | TTC | Var | Colour | Bitmap | Shape | Subset | Write | Raster |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FontyFruity (Haskell) | Y | N | N | N | ? | N | N | N | N | N | N | N |
| SVGFonts (Haskell) | N | N | N | N | N | N | N | N | P | P | N | N |
| diagrams-lib text (Haskell) | N | N | N | N | N | N | N | N | N | N | N | N |
| freetype2 (Haskell FFI) | Y | Y | Y | ? | Y | Y | Y | Y | N | N | N | Y |
| harfbuzz-pure (Haskell FFI) | Y | Y | ? | ? | P | Y | N | N | Y | N | N | N |
| Android Typeface/Paint | Y | Y | N | N | Y | Y | Y | Y | Y | N | N | Y |
| androidx.compose.ui.text.font | Y | Y | N | N | Y | Y | Y | Y | Y | N | N | Y |
| Compose MP resources | Y | Y | P | P | Y | Y | ? | ? | N | N | N | Y |
| Skiko | Y | Y | Y | ? | Y | Y | Y | Y | Y | N | N | Y |
| php-font-lib | Y | P | Y | N | Y | N | N | N | N | Y | Y | N |
| GD / Intervention Image | Y | ? | N | N | ? | ? | ? | ? | N | N | N | Y |
| TCPDF / tc-lib-pdf | Y | N | N | N | N | N | N | N | N | P | P | N |
| CoreText (Swift) | Y | Y | ? | ? | Y | Y | Y | Y | Y | N | N | Y |
| TTFunk (Ruby) | Y | P | N | N | Y | N | P | Y | N | Y | Y | N |

Reading the matrix: **no single library in the long tail covers the full column set.** The
only entries with both subsetting and writing (`php-font-lib`, `TTFunk`) have no shaping and
no rasterisation; the only entries with shaping and rasterisation (Skiko, Android, Compose,
CoreText) have no subsetting and no writing. A latecomer that owns parsing, subsetting,
writing *and* a coverage-mask rasteriser, while leaving shaping and platform discovery to
sibling packages, occupies a real gap.

---

# Part 2 — Cross-language synthesis

## 2.1 A taxonomy of convergent abstractions

Every ecosystem above, even the pure bindings, converges on the same set of concerns. The
table below names each as a neutral interface and records the local name(s) under which each
ecosystem exposes it. Where an ecosystem has no equivalent, that is recorded as a dash: the
absence is data.

| # | Neutral abstraction | Responsibility | Names across the surveyed ecosystems |
|---|---|---|---|
| 1 | `ByteSource` / `RandomAccessReader` | Borrowed bytes; bounded, offset-based reads of `u8/u16/u32/i16/F2Dot14`; `len()`, `slice(off,len)` | Haskell `ByteString` (`decodeFont`), `FT_New_Memory_Face` / `FT_Open_Args` / `FT_Attach_Stream`; Go `[]byte` / `io.ReaderAt` (`sfnt.Parse`, `sfnt.ParseReaderAt`); PHP `\FontLib\BinaryStream`, `Font::load(path)`, `open(...)`; Ruby `TTFunk::File.open(io)` / `#contents`; Kotlin `FontMgr.makeFromData(Data)` / `makeFromStream` / `makeFromFile`, `Res.readBytes(path): ByteArray`; CoreText `CTFontManagerCreateFontDescriptorsFromData(CFDataRef)`; fontTools `TTFont(file=...)` / `BytesIO`; Rust `&[u8]` (`ttf_parser::Face::parse`) |
| 2 | `TableDirectory` | Container magic, `numTables`, tag -> (offset, length, checksum), raw table bytes | Haskell `_fontOffsetTable`, `_fontTables :: [(ByteString, ByteString)]`; PHP `\FontLib\Table\DirectoryEntry`, `parseTableEntries()`, `getBTable($name)`, `getData("cmap","subtables")`; Ruby `TTFunk::Directory`, `#directory_info(tag)`; Kotlin **table access is shallow**: `Typeface.tableTags`, `getTableData(tag)`, `getTableSize(tag)`, `tablesCount`; CoreText `CTFontCopyAvailableTables`, `CTFontCopyTable`, `CTFontTableTag`; fontTools `TTFont.reader.tables`, `ttx`; Go internal offsets; C# `SixLabors.Fonts.FontReader`; ttf-parser `Face::tables()` `[unverified]`. Android, Compose, GD, TCPDF: dash |
| 3 | `FontFace` | Immutable parsed font at a collection index; no size, no pixels | Haskell `Font`, `FT_Face`; PHP `\FontLib\TrueType\File`, `\FontLib\OpenType\File`; Ruby `TTFunk::File`; Go `sfnt.Font`; Rust `ttf_parser::Face`; C# `SixLabors.Fonts.Font`, `Typography.OpenFont.Typeface`; Kotlin `org.jetbrains.skia.Typeface`, `android.graphics.Typeface`; Compose `androidx.compose.ui.text.font.Typeface`; CoreText `CTFont`; fontTools `TTFont`. Note Skiko splits face (`Typeface`) from instance (`Font`) |
| 4 | `FontCollection` | `len()`, `face(i)` over TTC/dfont | Haskell `FT_New_Face(..., face_index)`, `FT_Open_Args`; PHP `\FontLib\TrueType\Collection` (`ttcf`); Ruby `TTFunk::File.from_ttc(io, which)`, `TTFunk::Collection`, `TTFunk::ResourceFile.from_dfont`; Go `sfnt.ParseCollection`, `Collection.NumFonts()`, `Collection.Font(i)`; fontTools `TTCollection`, `TTFont(fontNumber=...)`; Kotlin `FontMgr.makeFromData(data, ttcIndex)` / `SkFontMgr::makeFromData(..., ttcIndex)`, `Skiko Typeface.makeClone(variations, collectionIndex)`; CoreText `CTFontCollection`; C# `FontCollection`; Compose resources support TTC. FontyFruity, SVGFonts: dash |
| 5 | `Charmap` | `glyph_id(codepoint) -> GlyphId?`, enumerate codepoints, list subtables | Haskell `_fontMap :: Maybe CharacterMaps`, `isPlaceholder`, `FT_Get_Char_Index`, `FT_Get_First_Char`, `FT_Get_Next_Char`, `FT_CharMapRec`, `FT_Select_Charmap`; PHP `getUnicodeCharMap()`, `\FontLib\Table\Type\cmap`, `\FontLib\EncodingMap`; Ruby `#cmap`, `Table::Cmap::Subtable#unicode?`, `#code_map`; Go `sfnt.Font.GlyphIndex(b, r)`; Kotlin `Font.getStringGlyphs`, `getUTF32Glyph`, `getUTF32Glyphs`; CoreText `CTFontGetGlyphsForCharacters`, `CTFontCopyCharacterSet`; HarfBuzz `hb_font_get_nominal_glyph` / `fontNominalGlyph`; Android `Paint.hasGlyph`; fontTools `getBestCmap()`, `getReverseGlyphMap()` |
| 6 | `GlyphId` | `u16`, with `0` reserved for `.notdef` | `CGGlyph` (CoreText), `GlyphIndex` (Go sfnt), `GlyphId` (Rust ttf-parser), `Short` / `ShortArray` (Skiko), `Int` (`_rawGlyphIndex`, FontyFruity), integer ids (PHP, TTFunk, HarfBuzz `hb_codepoint_t`), glyph *names* (fontTools, which is name-centric) |
| 7 | `OutlineSink` | `move_to`, `line_to`, `quad_to`, optional `cubic_to`, `close`, optional `begin(contour_count)`, optional `add_component(gid, transform)` | fontTools `BasePen` / `RecordingPen` / `TTGlyphPen` / `SVGPathPen` (`moveTo`, `lineTo`, `curveTo`, `qCurveTo`, `closePath`, `endPath`, `addComponent`); FreeType `FT_Outline_Funcs` (`move_to`, `line_to`, `conic_to`, `cubic_to`, `shift`, `delta`) with `FT_Outline_Decompose`; HarfBuzz `hb_draw_funcs_t`; SixLabors `IGlyphRenderer`; C# Typography `BeginRead(contourCount)`; Go `sfnt.LoadGlyph -> Segments`; stb_truetype `stbtt_vertex`; fontations `OutlinePen`; Skiko `Font.getPath(glyph): Path?` (a returned path object, **not** a sink); CoreText `CTFontCreatePathForGlyph -> CGPath`; CoreGraphics `CGPathApply`; FontyFruity `Vector (Int16,Int16)` contours (returned data, no sink); SVGFonts `commands :: String -> SvgGlyphs -> [PathCommand]` then `commandsToTrails`; TTFunk `Glyf::PathBased#path`, `Cff::Path#move_to`/`#render`; PHP `FontLib\Glyph\Outline` (outline data, SVG path output `[unverified]`) |
| 8 | `PathCommand` | `MoveTo`, `LineTo`, `QuadTo`, `CubicTo`, `Close`, `EndPath`, `Component` | SVG path (`M/L/Q/C/Z`); diagrams `Path V2 n`, `Trail`, `Segment Closed R2`; CoreGraphics `kCGPathElementMoveToPoint` / `AddLineToPoint` / `AddQuadCurveToPoint` / `AddCurveToPoint` / `CloseSubpath`; Skia `SkPath`; fontTools `qCurveTo` (implied on-curve points) vs `curveTo`; HarfBuzz synthesises cubics from quadratics on request. **TrueType glyf is quadratic; CFF/CFF2 is cubic** |
| 9 | `Metrics` | `unitsPerEm`, ascent/descent/lineGap, cap/x height, font bbox, per-glyph bbox, advance, LSB/RSB, underline, slant, kerning | Haskell `unitsPerEm`, `stringBoundingBox`, `(Float, Vector RawGlyph)`, `FT_Size_Metrics`, `FT_Glyph_Metrics`, `FT_Get_Kerning`; CoreText `CTFontGetAscent/Descent/Leading/UnitsPerEm/CapHeight/XHeight/BoundingBox/UnderlinePosition/UnderlineThickness/SlantAngle`, `CTFontGetAdvancesForGlyphs`, `CTFontGetBoundingRectsForGlyphs`, `CTFontGetOpticalBoundsForGlyphs`; Android `Paint.FontMetrics` (`top/ascent/descent/bottom/leading`), `getFontMetrics`, `measureText`, `getTextBounds`, `getTextWidths`; Skiko `FontMetrics`, `getWidths`, `getBounds`, `measureTextWidth`, `spacing`, `getKerningPairAdjustments`; Go `sfnt.GlyphAdvance`, `GlyphBounds`, `Bounds`, `Kern`; TTFunk `#ascent`, `#descent`, `#bbox`, `#line_gap`, `Table::Hhea`, `Table::Hmtx`; PHP `Table\Type\{head,hhea,hmtx,maxp,os2}`, `saveAdobeFontMetrics`; HarfBuzz `GlyphExtents`, `FontExtents`, `fontGlyphExtents`, `fontHExtents` |
| 10 | `Instance` (scaling / variation model) | face x ppem x design coords x synthesis; unitsPerEm -> ppem; transform matrix; axes; named instances; delta application | FreeType `FT_Set_Char_Size`, `FT_Set_Pixel_Sizes`, `FT_Request_Size`, `FT_Select_Size`, `FT_Set_Transform`, `FT_Matrix`, `FT_IS_VARIATION`, `FT_HAS_MULTIPLE_MASTERS`; CoreText `CTFontCreateWithName(name, size, matrix)`, `CTFontGetSize`, `CTFontGetMatrix`, `CTFontCopyVariationAxes`, `CTFontCopyVariation`; Compose `FontVariation.Setting`, `FontVariation.Settings`, `FontWeight` (1..1000), `FontSynthesis`; Skiko `Font(typeface, size, scaleX, skewX)`, `Typeface.variationAxes`, `variations`, `makeClone(variation)`, `FontVariationAxis`; HarfBuzz `fontScale`, `fontPPEm`, `fontPtEm`, `fontVarCoordsNormalized`, `hb_font_set_variations`; Go `fixed.Int26_6`, `ppem`, `font.Hinting`; fontTools `varLib`, `instancer`, `fvar`; FontyFruity `Dpi`, `PointSize`; PHP GD `$size` in points |
| 11 | `CoverageMask` | width x height x format (mono / A8 / LCD subpixel), origin offset, pitch; `rasterize(instance, gid, subpixel_offset, target)` writing into caller-owned storage | FreeType `FT_Render_Glyph`, `FT_Render_Mode` (NORMAL/MONO/LCD/LCD_V), `FT_Bitmap`, `FT_GlyphSlot.bitmap`, `FT_Glyph_To_Bitmap`, `FT_PIXEL_MODE_BGRA`; stb_truetype `stbtt_GetGlyphBitmapBox`, `stbtt_MakeGlyphBitmap`; Go `golang.org/x/image/font/opentype` `Face.Glyph -> image.Alpha`, `vector.Rasterizer`; fontdue/ab_glyph coverage buffers; Skiko `Surface`/`Bitmap`/`Pixmap`, `FontEdging`, `FontHinting`, `isSubpixel`, `areBitmapsEmbedded` (raster entirely inside Skia, **no mask API exposed**); Android `Canvas.drawText`, `ANTI_ALIAS_FLAG`, `SUBPIXEL_TEXT_FLAG`; PHP GD `imagettftext` into `GdImage`; Intervention `Image::text`; CoreText `CTFontDrawGlyphs` into `CGContext`. FontyFruity, SVGFonts, php-font-lib, TTFunk: **no raster at all** |
| 12 | `LayoutEngine` | itemisation, BiDi, script detection, `shape(text, instance, script, direction, language, features) -> GlyphRun[]` with glyph ids, clusters, advances, offsets; line breaking | HarfBuzz C `hb_shape`, `hb_buffer_t`, `hb_font_t`, `hb_feature_t`, `hb_glyph_info_t`, `hb_glyph_position_t`, `hb_direction_t`, `hb_script_t`; Haskell `Data.Text.Glyphize.shape`, `Buffer`, `GlyphInfo`, `GlyphPos`, `Feature`, `guessSegmentProperties`; Skiko `Shaper` (`makePrimitive`, `makeShaperDrivenWrapper`, `makeShapeThenWrap`, `makeShapeDontWrapOrReorder`, `makeCoreText`), `TextBlob`, `TextBlobBuilder`, `TextLine`, `Paragraph`, `ParagraphBuilder`, `ParagraphStyle`, `TextStyle`, `FontCollection`, `BreakIterator`, `FontMgrRunIterator`, `HbIcuScriptRunIterator`, `IcuBidiRunIterator`; CoreText `CTLine`, `CTRun`, `CTFramesetter`, `CTTypesetter`, `CTParagraphStyle`, `CTGlyphInfo`; Android `getTextRunAdvances`, `getTextRunCursor`, `breakText`, `StaticLayout`; Compose `TextLayoutResult`, `Paragraph`, `MultiParagraph`, `TextMeasurer`, `AnnotatedString`; Haskell Balkón / Typograffiti / CatTrap; Pango (Haskell `pango` binding `[unverified]`) |
| 13 | `SubstitutionTable` / `PositioningTable` | GSUB/GPOS/GDEF as *enumerable data* (scripts, languages, features, lookups) and as an *applying engine* | HarfBuzz applies them via `hb_shape` and exposes `hb_ot_layout_*`; fontTools `TTFont['GSUB']`, `['GPOS']`, `feaLib`, `otlLib`; CoreText `CTFontCopyFeatures`, `CTFontCopyFeatureSettings`; Compose `FontVariation.Settings` and `fontFeatureSettings` `[unverified]`; Skiko delegates to HarfBuzz with `ShapingOptions`; SVGFonts `Kern`, `kernAdvance`, `Spacing = HADV | KERN`; PHP `Table\Type\kern` (legacy only); TTFunk `Table::Kern::Format0`; Go `sfnt.Kern` (legacy only). The distinction between *enumerating* layout tables (inspection, editors, ligature lists) and *applying* them (shaping) is consistently blurred; a latecomer should separate the two |
| 14 | `ColourPainter` | COLR/CPAL layer records, CBDT/CBLC, sbix, SVG table; layer/palette selection, bitmap strike at ppem | fontTools `TTFont['COLR']`, `['CPAL']`, `['CBDT']`, `['sbix']`, `['SVG ']`; FreeType `FT_HAS_COLOR`, `FT_LOAD_COLOR`, `FT_PIXEL_MODE_BGRA`; CoreText `CTFontDrawImageFromAdaptiveImageProviderAtPoint`, `CTAdaptiveImageProvidingObject`; TTFunk `Table::Sbix`, `#num_strikes`, `Sbix::BitmapData#ppem`; Skia/Skiko handles colour glyphs internally; PHP, FontyFruity, SVGFonts: dash. Core should expose layers as **data**, never paint them |
| 15 | `FontWriter` | `subset(face, codepoints/gids, options) -> bytes`, `write(face) -> bytes`, WOFF wrapping, variable instancing, checksum fixups | fontTools `fontTools.subset`, `pyftsubset`, `TTFont.save`, `varLib.instancer`, `ttLib.woff2`; PHP `setSubset`, `reduce`, `encode(array("OS/2"))`, `exportTTF`, `importTTF`, `_encode()`; Ruby `TTFunk::Subset::{Base,Unicode,Unicode8Bit,CodePage}`, `TTFunk::TTFEncoder`, `old_to_new_glyph`, `new_cmap_table`; HarfBuzz `hb-subset` (`hb_subset_input_t`, `hb_subset_or_fail`) `[unverified]`; Go `seehuhn/go-sfnt` (read/write/subset) while `golang.org/x/image/font/sfnt` explicitly "does not provide an encoder"; TCPDF `addTTFfont` produces an ad-hoc `.php`/`.z`/`.ctg.z` artefact. FreeType, CoreText, Skia, Android, GD: dash |

### 2.1.1 Divergences that matter for a new design

Four disagreements recur and should be settled deliberately rather than inherited.

**Face versus instance.** FreeType's `FT_Face` and CoreText's `CTFont` carry size, matrix and
variation settings on the face object; Skiko splits `Typeface` (resource) from `Font` (sized
instance), and Compose further splits `Font` (descriptor) from `Typeface` (resolved platform
object). The split is better: faces are immutable and shareable across sizes, instances are
cheap values, and caches can be keyed on the instance without mutating a face.

**Outline sink versus returned path.** fontTools, FreeType, HarfBuzz, SixLabors and fontations
use a callback sink; Skiko, CoreText, FontyFruity, SVGFonts, Go `sfnt` and stb_truetype return
a path object or a point/segment array. A sink avoids allocation, supports `@nogc`-style
operation and lets the caller choose a path representation; a returned path is easier to
inspect, edit and cache. Provide both from one decoder: `drawOutline(gid, coords, sink)` and
`decodeOutline(gid, coords, Segment[])`.

**Font units at the parser boundary.** Go `sfnt.LoadGlyph` bakes `ppem` and the y-axis flip
into the returned segments, and its own documentation concedes that this blocks hinting.
FontyFruity returns contours in font units with `y` upward for `getCharacterGlyphsAndMetrics`
and flips to an image-like coordinate system (origin upper-left) only in
`getStringCurveAtPoint`. CoreText `CTFontCreatePathForGlyph` returns scaled paths. Keep the
parser in **font units, y-up, hinting-free**, and apply scaling and y-flip in the instance /
raster layer. Explicit contour boundaries must survive the sink: `ab_glyph`-style
self-contained segments lose them and an inspector needs them.

**Name-centric versus id-centric.** fontTools is organised around glyph names; the C, Rust,
Go, Kotlin and PHP libraries are organised around `u16` glyph ids. A neutral core should treat
`GlyphId` as primary and expose glyph names as an optional decoration derived from `post` or
CFF, since names are absent in most modern fonts and are not stable across subsetting.

## 2.2 A proposed layered architecture for a clean-room latecomer

Name the packages `moonfont-*`. Dependencies point **strictly downward**; no lower layer may
import a higher one, and the three `L3` siblings are mutually independent.

```
L5  moonfont-render        optional adapters: canvas / PDF / SVG / image editors
L4  moonfont-platform      byte-source implementations, discovery, fallback, cache, async
L3a moonfont-shape         itemisation, BiDi, shaping, line breaking
L3b moonfont-raster        coverage mask, hinting, anti-aliasing, colour assembly
L3c moonfont-write         subsetting, font writing, WOFF wrapping, instancing
L2  moonfont-core          Face, typed tables, charmap, GlyphId, Metrics, Instance, OutlineSink
L1  moonfont-tables        container detection, table directory, raw table bytes
L0  moonfont-bytes         ByteSource / RandomAccessReader, bounded primitives, checksums
```

Dependency direction: `L5 -> L4 -> {L3a, L3b, L3c} -> L2 -> L1 -> L0`. `L3a`, `L3b` and
`L3c` all depend on `L2` and on nothing else at their own level; they share only the neutral
`L2` interfaces (`FontFace`, `GlyphId`, `OutlineSink`, `Instance`, `Metrics`). Nothing depends
on `L4` except `L5`, and `L4` is the only layer allowed to know that an operating system or a
UI toolkit exists.

**Layer contracts.**

- **L0 `moonfont-bytes`.** A `ByteSource` trait over borrowed bytes: `len()`, `u8/u16/u32/i16`
  at an offset with explicit endianness, `slice(off,len)`, `F2Dot14`, `checksum(off,len)`.
  Every read is bounds-checked with a declared maximum allocation. No I/O, no allocation
  proportional to an untrusted length, no global state.
- **L1 `moonfont-tables`.** Container detection on the sfnt magic values (`0x00010000`, `OTTO`,
  `true`, `typ1`, `ttcf`, `wOFF`, `wOF2`), the table directory (tag, checksum, offset, length),
  TTC collection enumeration, and decompression of WOFF/WOFF2 tables through an **injected
  codec interface** (Brotli is not implemented here). Exposes `tags()`, `entry(tag)` and
  `raw_table(tag)`. Owns no interpretation of glyph data.
- **L2 `moonfont-core`.** Typed, borrowed views over tables: `head`, `hhea`, `hmtx`, `maxp`,
  `cmap` (formats 0, 2, 4, 6, 12, 13, 14), `loca`, `glyf`, `CFF`/`CFF2`, `fvar`/`gvar`/
  `avar`/`HVAR`/`MVAR`, `kern`, `GSUB`/`GPOS`/`GDEF` as data, `name`, `OS/2`, `post`,
  `COLR`/`CPAL`/`CBDT`/`CBLC`/`sbix`/`SVG `. Defines `FontFace`, `FontCollection`,
  `Charmap`, `GlyphId`, `Metrics`, `Instance` (face x ppem x coords x synthesis),
  `OutlineSink`, `PathCommand` and `ColourLayers`. Outlines are emitted in **font units, y-up,
  with explicit contour boundaries and bounded composite-glyph recursion**. No pixels, no
  hinting, no I/O, no platform types, no Unicode/ICU dependency (a cmap maps codepoints to
  glyph ids; script and direction are `L3a` concerns).
- **L3a `moonfont-shape`.** Consumes `FontFace`, `Charmap`, `Metrics` and GSUB/GPOS data;
  injects Unicode/script/BiDi tables; produces `GlyphRun[]` with glyph ids, clusters,
  advances and offsets; owns line breaking and hyphenation. Does not rasterise, draw or load
  files.
- **L3b `moonfont-raster`.** Consumes `OutlineSink` output from `L2` and an `Instance`;
  rasterises into a **caller-owned** `CoverageMask` region (width, height, pitch, origin,
  format). Owns hinting, anti-aliasing, subpixel geometry and colour-glyph assembly. Does not
  re-parse tables. `CoverageMask` is the only raster concept in the whole stack.
- **L3c `moonfont-write`.** Consumed table views from `L2` and the container from `L1`;
  implements `subset()`, `write()`, WOFF wrapping and variable instancing, with explicit
  glyph-renumbering maps (as TTFunk's `old_to_new_glyph` / `new_cmap_table` demonstrates).
  Re-encodes the table directory and recomputes checksums. Does not shape or rasterise.
- **L4 `moonfont-platform`.** Filesystem-backed `ByteSource` implementations, font discovery
  (fontconfig / DirectWrite / CoreText / Android `AssetManager` / Compose resources), family
  matching, fallback chains, the descriptor/resolver model, caches and asynchronous loading.
  This is where `FontLoadingStrategy.Async`, `MaximumAsyncTimeoutMillis`, `GDFONTPATH`-style
  search (if wanted at all) and `Res.readBytes` belong.
- **L5 `moonfont-render`.** Adapters that push glyph runs into a canvas, `CGContext`,
  `SkCanvas`, PDF content stream or image editor, and any UI-facing text widgets.

**What MUST NOT cross a layer boundary.**

1. **No I/O in L0–L3.** No `open`, no environment variables, no implicit font search, no
   network, no filesystem paths in a declaration. Byte sources are injected. `Font::load(path)`
   and `GDFONTPATH` are `L4` conveniences, not core API.
2. **No platform font discovery in L0–L3.** `FontCache`, `buildCache`, `findFontOfFamily`,
   `FontMgr.matchFamily`, `CTFontManagerCopyAvailableFontFamilyNames`,
   `Res.allFontResources` and fallback chains are `L4` only. FontyFruity's conflation of
   `buildCache` with `decodeFont` in one module is the counterexample.
3. **No raster concerns in L1–L2.** No `ppem`, no pixel grid, no y-flip, no `FT_Render_Mode`,
   no `FontEdging`, no `ANTI_ALIAS_FLAG`, no gamma, no `CoverageMask`. Go `sfnt.LoadGlyph`
   baking `ppem` and the y-flip into `Segments` is the counterexample.
4. **No hinting in L2.** Hinting is an `L3b` quality policy; the core emits unhinted font-unit
   outlines. Hinting output is engine-specific and must never be part of a bit-equality
   contract with another engine.
5. **No platform types in core types.** No `CTFont`, `CGContext`, `SkCanvas`, `android.graphics.Typeface`,
   `Paint`, `GdImage`, `Canvas`, `Bitmap`, `Typeface` or `FontResource` in an `L2` declaration.
6. **No table tags or raw offsets above L2.** `L3a`/`L3b`/`L3c` consume typed views, not
   `getTableData('GSUB')`. Conversely, `L1` must know nothing about `glyf` or `CFF` internals.
7. **No glyph cache inside `FontFace`.** Caches keyed by `(face, gid, ppem, coords, subpixel,
   flags)` belong in `L4`/`L5`; Skia keeps its glyph cache separate from the typeface for good
   reason, and `sfnt.Font` requires the caller to supply a reusable `*Buffer`.
8. **No colour painting in the outline sink.** `COLR`/`CPAL` layers and bitmap strikes are
   `L2` data; selecting a palette and compositing is `L3b`/`L5`.
9. **No Unicode/ICU dependency in L0–L2.** A cmap is a codepoint-to-glyph-id map; BiDi,
   script itemisation, line breaking and language tagging are `L3a` with injected data.
10. **No async, UI-thread or lifecycle policy in L0–L3.** Loading strategies, timeouts,
    reflow, composable/suspending loaders and `MaximumAsyncTimeoutMillis` are `L4`/`L5`.
11. **Read and write are symmetrical but separate.** `L3c` may reuse the `L2` table
    vocabulary, but `L2` must not import `L3c`; `golang.org/x/image/font/sfnt` declining to
    provide an encoder at all is a legitimate, defensible boundary.
12. **No unbounded resource use in L0–L2.** Table lengths, composite depth, CFF subroutine
    depth and variation-axis counts are bounded in the parser; `seehuhn/go-sfnt` accepting an
    explicit memory budget and `sfnt` bounding compound-glyph depth are good precedents.

## 2.3 Functional boundary proposal

### IN

1. **Container parsing** for sfnt (`0x00010000`, `true`, `typ1`), `OTTO`, TTC (`ttcf`), WOFF
   and WOFF2, with decompression via an injected codec.
2. **Table directory** enumeration, checksum verification and raw table byte access — the
   `CTFontCopyTable` / `php-font-lib getBTable` affordance.
3. **Typed core tables**: `head`, `hhea`, `hmtx`, `maxp`, `cmap`, `loca`, `glyf`, `CFF`,
   `CFF2`, `name`, `OS/2`, `post`, `kern`, `VORG`, `vmtx`, `vhea`.
4. **Charmap** for all standard formats, including format 12/13 supplementary planes and
   format 14 Unicode variation selectors; symbol-font mappings; `.notdef` as glyph 0.
5. **Glyph outlines** to an `OutlineSink` in font units, with explicit contour boundaries,
   composite glyph resolution (with a recursion cap), and both quadratic (glyf) and cubic
   (CFF) commands.
6. **Metrics**: `unitsPerEm`, ascent/descent/lineGap, cap/x height, font and per-glyph bounds,
   advance widths and LSB/RSB, underline position/thickness, slant angle, legacy `kern` pairs,
   vertical metrics.
7. **Variation model**: `fvar` axes and named instances, coordinate normalisation, `gvar`/
   `HVAR`/`MVAR`/`avar` delta application, and an `Instance` value.
8. **Layout data as data**: `GSUB`, `GPOS`, `GDEF` enumerable by script, language, feature and
   lookup, for inspection and for `moonfont-shape`; not an applying engine in the core.
9. **Colour and bitmap data as data**: `COLR`/`CPAL` layer records and palettes, `CBDT`/`CBLC`,
   `sbix`, `SVG ` documents, exposed as records.
10. **Naming and metadata**: `name` records, `OS/2` fields, `post` glyph names, embedding
    permission bits (`fsType`, `FT_Get_FSType_Flags`) as data.
11. **Subsetting and font writing** in `moonfont-write`: codepoint/glyph-id closure (including
    recursive composite references, as `php-font-lib getGlyphIDs()` does), glyph renumbering,
    cmap regeneration, checksum and offset fixups, WOFF/WOFF2 wrapping, variable instancing.
12. **Coverage-mask rasterisation** in `moonfont-raster` into caller-owned buffers, with a
    declared mask format and origin.
13. **Deterministic, panic-free behaviour on malformed input**, with typed error categories and
    bounded resource consumption.
14. **A pure, `I/O`-free, platform-neutral API** with borrowed-byte faces that stay valid while
    the caller keeps the source alive (the `sfnt.Parse` lifetime contract).

### OUT

Each item has a one-line reason and a note on where it should live instead.

| # | OUT item | Reason (one line) | Where instead |
|---|---|---|---|
| 1 | Platform font discovery, family matching and fallback chains | Requires OS registries, locale configuration and fontconfig/DirectWrite/CoreText state, none of which is font data | `moonfont-platform` |
| 2 | System font enumeration and caches (`FontCache`, `buildCache`, `findFontOfFamily`, `FontMgr.matchFamily`) | Filesystem and OS state; FontyFruity mixing it into the parser is the exact mistake to avoid | `moonfont-platform` |
| 3 | Asynchronous loading, UI-thread scheduling and timeouts (`FontLoadingStrategy.Async`, `MaximumAsyncTimeoutMillis`, reflow) | Application lifecycle and UI policy, not a property of a font file | `moonfont-platform` + `moonfont-render` |
| 4 | Network font downloading (`GoogleFont.Provider`, downloadable fonts) | I/O and credentials; a core library must be usable fully offline | `moonfont-platform` (or an app-level package) |
| 5 | Filesystem paths as a core input type | Hides I/O behind a parser and makes WebAssembly and embedded targets unusable | `moonfont-platform` supplies a `ByteSource` |
| 6 | Raster image codecs (PNG/JPEG/WEBP) and general image editing | GD/Intervention Image's domain, unrelated to font data | `moonfont-render` |
| 7 | Drawing into `CGContext`, `SkCanvas`, `Canvas`, `GdImage` or a PDF content stream | Rendering concern; the core stops at outlines and a `CoverageMask` | `moonfont-render` |
| 8 | Paragraph layout, line breaking, BiDi, itemisation and hyphenation | Needs Unicode/ICU data and an application-supplied line-width policy | `moonfont-shape` |
| 9 | Text widgets, `TextStyle`, `Typography`, theming, `AnnotatedString` | UI toolkit concern with no font-file semantics | `moonfont-render` |
| 10 | TrueType hinting interpreter and autohinting | An engine-specific raster-quality policy whose output is deliberately not bit-identical across implementations | `moonfont-raster` as a swappable, optional module |
| 11 | Anti-aliasing filters, gamma, subpixel LCD and ClearType | Device- and driver-specific; a coverage mask from one engine never equals another's | `moonfont-raster` |
| 12 | Colour font painting (COLR gradients, palette selection, SVG-in-OT rendering) | Painting requires a compositor and a colour space; the core exposes layers as data only | `moonfont-raster` + `moonfont-render` |
| 13 | WOFF2 Brotli compression/decompression implementation | A general-purpose codec with its own security surface; inject it rather than reimplement | `moonfont-codecs` adapter injected into `L1`/`L3c` |
| 14 | Adobe Font Metrics (`.ufm`/`.afm`) generation | A legacy PDF-toolchain artefact, not a font format concern | `moonfont-legacy` adapter |
| 15 | TCPDF-style `.php`/`.z`/`.ctg.z` converted font artefacts | An ad-hoc derived format that is a liability to maintain and cannot be read by other tools | `moonfont-legacy` adapter; prefer standard font bytes |
| 16 | PDF/document generation and PDF font embedding | Document concern (Prawn, TCPDF, dompdf), several layers above font parsing | separate integration package |
| 17 | Subsetting as a network service or CLI font kit | Deployment concern, not a library capability | separate tooling package |
| 18 | Font licensing and embedding-permission enforcement | Legal/policy decision that varies by jurisdiction and application | application-level policy |
| 19 | Adobe Glyph List name resolution beyond `post`/CFF names | A name service, and glyph names are absent or unstable in most modern fonts | optional `moonfont-names` helper |
| 20 | Font design/editing, UFO/Glyphs source compilation and FEA compilation | A font editor's domain; out of scope for a reader | separate authoring package |
| 21 | A built-in glyph cache keyed by `(face, gid, ppem)` | Cache invalidation on variation-coordinate and ppem changes is a policy, not a parse result | `moonfont-platform` / `moonfont-render` |
| 22 | Optical bounds, ligature caret positions and vertical origin *policy* beyond raw table fields | Table data is IN; the policy for applying it belongs with layout | `moonfont-shape` |

**Integration packages.** The OUT items are not all discarded; they are relocated. The intended
package set alongside the core is:

- `moonfont-platform` — items 1–5, 21, plus `ByteSource` implementations for files, assets and
  resources, the descriptor/resolver model and the async state machine.
- `moonfont-shape` — items 8, 22, with injected Unicode data.
- `moonfont-raster` — items 10–12, a separable module that may be omitted entirely by a
  consumer that only wants outlines.
- `moonfont-render` — items 6, 7, 9.
- `moonfont-codecs` — item 13.
- `moonfont-legacy` — items 14–15.
- `moonfont-names` — item 19.

This is the single most important architectural decision: **the core is a pure function from
borrowed bytes to typed tables, outlines, metrics and (optionally) new font bytes.** Every
other concern is an adapter.

## 2.4 Differential-test strategy using offline oracles

### 2.4.1 Oracle set

"Offline" means the oracles run as locally installed, version-pinned tools inside the CI
image; the golden fixtures are committed, so the test job needs no network access.

| Language | Oracles | Role |
|---|---|---|
| C / C++ | FreeType (`FT_Outline_Decompose`, `FT_Load_Glyph`, `FT_Render_Glyph`, `FT_Get_Kerning`), HarfBuzz (`hb-shape`, `hb-view`, `hb-subset`), stb_truetype (`stbtt_GetGlyphBitmapBox`, `stbtt_MakeGlyphBitmap`), Skia (`SkFontMgr::makeFromData`, `SkTypeface`), msdfgen | Rasterisation and shaping reference; `hb-shape` is the canonical position oracle |
| C# | SixLabors.Fonts (`Font`, `FontMetrics`, `IGlyphRenderer`, `FontReader`), SkiaSharp (`SKFontManager`, `SKPaint.MeasureText`), LayoutFarm/Typography (`Typography.OpenFont`) | Independent managed implementation; note SixLabors.Fonts uses the Six Labors Split Licence, which must not be conflated with permissive licences |
| Python | fontTools (`TTFont`, `ttx`, `fontTools.pens.recordingPen`, `fontTools.subset`, `varLib.instancer`, `ttLib.woff2`), `uharfbuzz`, `freetype-py` | **Primary structural oracle**, because `ttx` emits a canonical, inspectable XML dump of every table |
| Rust | `ttf-parser` (`Face`, `OutlineBuilder`), `owned_ttf_parser`, `rustybuzz`, `ab_glyph`, `fontdue`, fontations (`read-fonts`, `skrifa`, `OutlinePen`) | Independent, memory-safe parser; a second structural oracle with different design choices |
| Go | `golang.org/x/image/font/sfnt` (`Parse`, `ParseCollection`, `GlyphIndex`, `GlyphAdvance`, `GlyphBounds`, `Kern`, `LoadGlyph`), `golang.org/x/image/font/opentype`, `go-text/typesetting`, `seehuhn/go-sfnt`, `golang/freetype` | Third structural oracle with an explicitly documented "no encoder" boundary and a caller-owned `*Buffer` |

Oracle library names in this table that were not individually retrieved against primary
documentation during this survey are marked `[unverified]` in the sources list; they are
well-known packages but their exact current versions should be pinned in `oracles.lock`
before use.

### 2.4.2 Golden fixture categories

1. **Table-directory fields.** `sfntVersion`, `numTables`, `searchRange`, `entrySelector`,
   `rangeShift`; per-table `tag`, `checkSum`, `offset`, `length`; TTC header (`ttcf`,
   `numFonts`, face offsets); WOFF/WOFF2 header fields (`flavor`, `length`, `numTables`,
   `totalSfntSize`, `majorVersion`, `minorVersion`, `metaOffset`, `privOffset`).
2. **Typed table fields.** `head` (`unitsPerEm`, `indexToLocFormat`, `xMin/yMin/xMax/yMax`,
   `macStyle`, `flags`, `created`, `modified`), `hhea` (`ascender`, `descender`, `lineGap`,
   `numberOfHMetrics`, `advanceWidthMax`, `minLeftSideBearing`), `maxp` (`version`,
   `numGlyphs`), `hmtx` (advance + LSB per glyph), `name` (name records with
   platform/encoding/language/nameID), `OS/2` (`usWeightClass`, `fsSelection`,
   `sTypoAscender/Descender/LineGap`, `usWinAscent/Descent`, `sCapHeight`, `sxHeight`,
   `fsType`), `post` (`italicAngle`, `underlinePosition`, `underlineThickness`),
   `fvar` (axis tags, min/default/max, nameIDs), `GDEF/GSUB/GPOS` header versions and
   script/language/feature/lookup counts, `COLR`/`CPAL` record and palette counts,
   `CBDT`/`sbix` strike descriptors.
3. **cmap mappings.** For each subtable, the `(platformID, encodingID, format)` triple and a
   curated set of `(codepoint, gid)` pairs; format 4 segment boundaries, format 12 groups,
   format 14 variation-selector sequences, symbol-font `0xF000` mappings, supplementary-plane
   codepoints, and the missing-glyph result (`gid = 0`).
4. **Glyph ids.** `glyph_index(c)` over a curated set covering Latin, Greek, Cyrillic, Arabic,
   Devanagari, CJK, emoji, ZWJ sequences, variation selectors, combining marks and `.notdef`;
   plus glyph-name-to-gid where `post` or CFF supplies names.
5. **Advances.** `hmtx` advances per glyph (font units), vertical advances (`vmtx`/`VVAR`),
   `HVAR` advances at several variation coordinates, and scaled advances at a declared `ppem`
   with a declared rounding mode. Legacy `kern` pairs.
6. **Bounds.** Per-glyph bounding boxes from `glyf`/CFF in font units; scaled bounds with
   hinting disabled; the union font bounds; and the **tight ink bounds versus advance width**
   distinction (Android `getTextBounds` versus `measureText`, Skiko `measureText` versus
   `getBounds`, FontyFruity `stringBoundingBox`) recorded as two separate fields.
7. **Outline command streams.** For each `(gid, variation coords)`, the ordered command stream
   with explicit contour boundaries in font units: `moveTo(x,y)`, `lineTo(x,y)`,
   `quadTo(cx,cy,x,y)`, `cubicTo(c1x,c1y,c2x,c2y,x,y)`, `close`/`endPath`, and composite
   `addComponent(gid, a,b,c,d,e,f, flags)` together with the flattened resolved stream.
   Include quadratic-to-cubic elevation and implied on-curve insertion as explicit variants.
8. **Coverage bitmaps.** Eight-bit alpha (and mono) masks over a ppem matrix
   `{8, 12, 16, 24, 32, 48, 64}`, subpixel offsets `{0, 1/3, 2/3}`, and render modes
   `{mono, A8, LCD}`; store width, height, pitch, origin offset, format and raw bytes.
9. **Layout positions.** For shaped runs tagged with `(script, direction, language, features)`,
   the `GlyphInfo` (codepoint, cluster, glyph id) and `GlyphPosition` (`x_advance`,
   `y_advance`, `x_offset`, `y_offset`) stream plus total advance; include `hb-shape`-style
   golden strings.
10. **Subset round-trips.** `subset(codepoints) -> reparse -> table fields / cmap / glyph ids`,
    asserting invariance of the retained glyphs; re-encode GSUB/GPOS after glyph remapping and
    compare representations (the technique used by `seehuhn/go-sfnt`'s subset round-trip
    tests).
11. **Malformed and edge fixtures.** Truncated tables, overlapping offsets, zero-length `glyf`,
    deep composite recursion, incorrect checksums, out-of-range format-4 segments, CFF with
    missing charstrings, truncated WOFF2 Brotli payload. Assert the **error category**, never
    message text.

### 2.4.3 Language-neutral fixture serialisation format

Use **canonical JSON** (RFC 8785 JCS: UTF-8, sorted object keys, no insignificant whitespace)
for all structured records, with **binary sidecar blobs** referenced by SHA-256. Rationale:
JSON is readable, diffable in review and available in every target language; a Python generator
built on fontTools can emit it; and canonicalisation makes committed fixtures byte-stable.

Layout:

```
fixtures/
  manifest.json                 # schema_version, fixtures list, licence manifest
  fonts/<sha256>.ttf            # pinned, redistributable fonts only
  fonts/manifest.json           # filename, sha256, licence, source URL
  golden/<category>/<id>.jsonl  # one JSON object per line
  blobs/<sha256>.bin            # masks, outline streams, encoded fonts
  oracles.lock                  # pinned oracle versions
  archive/<tag>/...             # previous golden set after regeneration
```

Each record:

```json
{
  "schema_version": 1,
  "fixture_id": "cmap.format12.noto-sans-cjk.gid-0041",
  "category": "cmap_mapping",
  "font_sha256": "...",
  "font_filename": "NotoSansCJK-Regular.ttc",
  "face_index": 0,
  "ppem": null,
  "variation_coords": {},
  "hinting": "none",
  "render_mode": null,
  "engine": "fonttools",
  "engine_version": "4.x",
  "units": "font_units",
  "rounding": null,
  "value": {"subtable": {"platformID": 3, "encodingID": 10, "format": 12},
            "pairs": [[65, 36], [0x4E00, 814]]}
}
```

Binary payloads are referenced rather than inlined:

```json
"value": {"blob": "<sha256>", "width": 32, "height": 32, "pitch": 32,
          "origin": [2, 27], "format": "a8"}
```

Numeric conventions: integers where the format is integral; fixed-point values encoded as an
integer numerator with an explicit `scale` field (for example `{"raw": 3712, "scale": 64}`
for 26.6); never bare floats for anything that will be compared exactly. `fontTools` `ttx`
XML is generated as a **secondary, human-readable** artefact for table fields, not as the
source of truth. Fonts must be OFL/Apache/BSD-licensed (Noto, DejaVu, Roboto, a variable
font with a known `fvar`, a colour font with COLR/CPAL, a sbix/CBDT bitmap font, a CFF OTF,
a TTC, a WOFF and a WOFF2); no proprietary fonts may be committed.

### 2.4.4 Tolerance rules per category

The governing fact: **anti-aliasing, gamma, subpixel geometry and hinting are not bit-identical
across engines.** FreeType, stb_truetype, Skia, fontdue and SixLabors use different filters,
different hinting interpreters (FreeType v35/v40 versus its autohinter), and different
subpixel layouts. Any rule that demands byte equality across engines for a coverage bitmap is
wrong. The rules below are therefore deliberately asymmetric.

| Category | Rule |
|---|---|
| Table-directory fields, typed table fields, checksums, name records, axis defaults/min/max, named-instance coordinates | **Exact equality.** Zero tolerance; any disagreement is a parser bug |
| cmap mappings, glyph ids, glyph names, `.notdef` behaviour | **Exact equality.** Any disagreement is a bug |
| Advances in font units (unhinted `hmtx`, `vmtx`) | **Exact integer equality** |
| Scaled advances at a declared `ppem` | Exact only if all parties use the same declared fixed-point scale and rounding mode (for example 26.6 with round-half-up); otherwise `±1` in 1/64 px. The rounding mode must be a fixture field, because FreeType, HarfBuzz and Go `fixed.Int26_6` differ |
| Variation deltas (`gvar`/`HVAR` interpolated) | `±1` font unit (16.16 interpolation differs by implementation); axis metadata exact |
| Bounds in font units | **Exact** |
| Scaled bounds (hinting disabled) | `±1` px per edge |
| Hinted bounds | **Excluded from cross-engine equality**; assert only the property `hinted ⊆ unhinted + 2px` |
| Outline command stream: sequence and command types | **Exact equality** after canonicalisation |
| Outline coordinates | Exact for `glyf` (integers) and for CFF fixed-point; `±1` for quadratic-to-cubic elevation and implied on-curve insertion; **contour boundaries must match exactly** |
| Outline normalisation before comparison | Canonicalise `closePath` versus an explicit final `lineTo` back to the start; insert implied on-curve points for `qCurveTo`; elevate quadratics to cubics only when the fixture requests it; flatten composite references in a declared order |
| Coverage bitmaps, **same engine and same version** | **Exact byte equality** (this is the regression contract, and bit-exactness here is both achievable and required) |
| Coverage bitmaps, **different engines** | **Never byte equality.** Compare statistics: total ink coverage within `±5 per cent`; bounding box of non-zero pixels within `±1 px`; a `3x3`-dilated, 2x-downsampled IoU `>= 0.95`; per-pixel difference on the blurred mask `<= 32/255` with at most `1 per cent` of pixels exceeding it. Exclude subpixel LCD, gamma-corrected, ClearType and hinted results entirely — keep them as engine-specific regression fixtures only |
| Layout positions | Exact glyph-id sequence and cluster mapping when the same shaper and version are used; advances within `±1` unit at 26.6; across shapers (HarfBuzz / rustybuzz / CoreText) require a **declared fixed font set** so fallback is not a variable, and allow differences only where font fallback legitimately differs |
| Error fixtures | Exact equality of the **error category** (`InvalidOffset`, `TableTooShort`, `UnsupportedCmapFormat`, `CompositeDepthExceeded`, `ChecksumMismatch`); message text is never compared |

Every record carries `engine`, `engine_version`, `hinting`, `render_mode`, `ppem` and
`variation_coords` precisely so that a comparator can **refuse** to compare two records taken
under incompatible settings. A comparison across incompatible settings is a fixture bug, not a
library failure.

### 2.4.5 Regeneration recipe

1. **Pin the inputs.** `fixtures/fonts/manifest.json` records each font's SHA-256, licence and
   source URL. `oracles.lock` pins FreeType, HarfBuzz, fontTools, rustybuzz, ttf-parser,
   `golang.org/x/image`, SixLabors.Fonts and SkiaSharp versions.
2. **Emit the canonical structural set.** A single Python generator using
   `fontTools.ttLib.TTFont` (with `fontTools.pens.recordingPen` for outline streams,
   `ttx` for table fields, `fontTools.subset` and `varLib.instancer` for round-trips) writes
   the golden records for categories 1–6, 7, 10 and 11. fontTools is the structural oracle of
   record because it exposes every table as data.
3. **Emit each oracle's view.** One small, language-neutral CLI per oracle reads the same
   fixture specification and writes the same JSONL schema: FreeType via `FT_Outline_Decompose`,
   `FT_Load_Glyph`, `FT_Render_Glyph`, `FT_Get_Kerning`; HarfBuzz via a tiny `hb_shape` harness
   (or `hb-shape --output-format=json` where available); SixLabors.Fonts via a recording
   `IGlyphRenderer`; ttf-parser via a recording `OutlineBuilder`; Go `sfnt` via `LoadGlyph`,
   `GlyphAdvance`, `GlyphBounds`, `GlyphIndex`, `Kern`; stb_truetype and fontdue for masks.
   Each writes to `out/<engine>/<fixture_id>.jsonl`.
4. **Canonicalise.** A single normaliser converts every engine's stream into the neutral
   `PathCommand` schema (declared elevation, implied-point insertion, close normalisation,
   composite flattening order) and normalises numeric scales to the declared `scale` field.
5. **Compare.** A language-neutral comparator (ideally written in MoonBit itself, as a
   self-test) reads `golden/` and `out/` and applies the per-category tolerance table; it emits
   JUnit XML plus a Markdown diff report and exits non-zero only on a genuine regression.
6. **Regenerate deliberately.** `make regenerate-golden` is an explicit, reviewed operation:
   it bumps `schema_version`, requires a human diff review, and archives the previous golden
   set under `golden/archive/<tag>/`. CI must never regenerate golden files silently, and a
   golden-file change must appear as a visible diff in review.
7. **Keep masks separate.** Coverage masks are stored as **engine-specific** golden blobs;
   the cross-engine statistical comparison is a separate, non-blocking job that publishes a
   report rather than failing the build.

### 2.4.6 CI shape

| Job | Blocking? | What it does |
|---|---|---|
| A `unit` | Yes | Pure MoonBit unit and property tests; no oracles; runs on every push |
| B `structural-diff` | Yes | Exact-category comparison against fontTools, ttf-parser, Go `sfnt` and SixLabors.Fonts; matrix over MoonBit backends (native, wasm, js) and operating systems |
| C `shaping-diff` | Yes | HarfBuzz / rustybuzz positions with a declared font set; CoreText shaping on macOS is informational only, because platform shaping legitimately differs |
| D `raster-stats` | **No** | Coverage statistics versus FreeType, stb_truetype, Skia and fontdue; publishes a report; never fails on a per-pixel difference |
| E `self-regression` | Yes | Byte-exact comparison of moonfont's output against its own previously committed blobs; this is where bit-exactness **is** required, because the engine is identical |
| F `fuzz-malformed` | Yes | Fuzz and property inputs; asserts typed error categories, no panics, bounded allocation, bounded composite depth |
| G `provenance` | Yes | Verifies fixture-font licences and SHA-256 pins; fails on an unlicensed or unpinned font |

The CI image is built once with the pinned oracle toolchain and the committed golden fixtures;
the test jobs themselves run **offline** with no network access. Oracle builds are cached by
`oracles.lock` hash. Gate policy: any exact-category mismatch fails; any tolerance-category
value outside its documented band fails; raster-statistical differences produce a warning and
a published report only. A change to the tolerances themselves requires a `schema_version`
bump and review, so that a loosening of the contract is always visible.

---

## Sources

All URLs below were consulted during the survey. Where a page was reached through a regional
mirror or a translated manual, the canonical URL is listed alongside or instead, and the
conflict or uncertainty is noted in the relevant section above.

### Haskell

- https://hackage-content.haskell.org/package/FontyFruity
- https://stackage.org/package/FontyFruity
- https://hackage.haskell.org/package/FontyFruity-0.4/docs/Graphics-Text-TrueType.html
- https://hackage.haskell.org/package/FontyFruity-0.3/docs/Graphics-Text-TrueType.html
- https://hackage.haskell.org/package/FontyFruity-0.2/docs/Graphics-Text-TrueType.html
- https://github.com/Twinside/FontyFruity.git
- https://hackage.haskell.org/package/SVGFonts-1.2.1/docs/Graphics-SVGFonts-ReadFont.html
- https://hackage.haskell.org/package/SVGFonts-1.4/docs/Graphics-SVGFonts-ReadFont.html
- https://hackage.haskell.org/package/SVGFonts-1.8.0.1/docs/Graphics-SVGFonts-Text.html
- https://hackage-content.haskell.org/package/SVGFonts-1.8.2/src/README.md
- https://www.stackage.org/lts-24.0/package/SVGFonts
- https://github.com/diagrams/SVGFonts
- https://diagrams.github.io/haddock/SVGFonts/Graphics-SVGFonts-ReadFont.html
- https://hackage.haskell.org/package/diagrams-lib-1.5/docs/Diagrams-TwoD-Text.html
- https://hackage.haskell.org/package/freetype2/docs/FreeType-Core-Base.html
- https://github.com/Krantz-XRF/FreeType/blob/master/README.md
- https://www.adrian.geek.nz/haskell_docs/graphics
- https://argonaut-constellation.org/2023/03/19/text-layout.html
- https://hackage.haskell.org/package/harfbuzz-pure-1.0.0.1/src/Data/Text/Glyphize.hs
- https://hackage.haskell.org/package/harfbuzz-pure-1.0.0.0/docs/Data-Text-Glyphize.html
- https://hackage.haskell.org/

### Kotlin

- https://developer.android.google.cn/reference/android/graphics/Paint?hl=hr
- https://developer.android.com/reference/android/graphics/Paint
- https://javadoc.io/static/com.google.android/android/2.3.3/android/graphics/Paint.html
- https://developer.android.com/reference/kotlin/androidx/compose/ui/text/font/package-summary
- https://developer.android.google.cn/reference/kotlin/androidx/compose/ui/text/font/package-summary?hl=zh-tw
- https://developer.android.google.cn/reference/kotlin/androidx/compose/ui/text/font/package-summary?hl=en
- https://developer.android.google.cn/reference/kotlin/androidx/compose/ui/text/font/Font.html
- https://developer.android.com/develop/ui/compose/text/fonts
- https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:compose/ui/ui-text/src/commonMain/kotlin/androidx/compose/ui/text/font/FontFamily.kt
- https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:/compose/ui/ui-text/src/commonMain/kotlin/androidx/compose/ui/text/font/Font.kt
- https://android-dot-devsite-v2-prod.appspot.com/reference/kotlin/androidx/compose/ui/text/font/AndroidFont
- https://android-dot-devsite-v2-prod.appspot.com/reference/kotlin/androidx/compose/ui/text/font/package-summary?authuser=0
- https://kotlinlang.org/docs/multiplatform/compose-multiplatform-resources-usage.html
- https://www.jetbrains.com.cn/en-us/help/kotlin-multiplatform-dev/compose-multiplatform-resources-usage.html
- https://jetbrains.github.io/skiko/skiko/org.jetbrains.skia/-font/index.html
- https://jetbrains.github.io/skiko/skiko/org.jetbrains.skia/-font/-font.html
- https://jetbrains.github.io/skiko/skiko/org.jetbrains.skia/-typeface/index.html
- https://deepwiki.com/JetBrains/skiko/7-configuration-and-properties
- https://deepwiki.com/JetBrains/skiko/7.5-text-and-fonts
- https://deepwiki.com/JetBrains/skiko/7.5.2-shaping-textblob-and-textline
- https://api.skia.org/classSkFontMgr.html
- https://skia.org/docs/dev/design/text_overview

### PHP

- https://github.com/dompdf/php-font-lib
- https://raw.githubusercontent.com/dompdf/php-font-lib/master/composer.json
- https://deepwiki.com/dompdf/php-font-lib/4.2-opentype-fonts
- https://deepwiki.com/dompdf/php-font-lib/6.2-glyph-data-(glyf)
- https://ubuntu.pkgs.org/24.04/ubuntu-universe-arm64/php-font-lib_0.5.4+dfsg-3_all.deb.html
- https://libraries.io/packagist/phenx%2Fphp-font-lib
- https://www.openhub.net/p/php-font-lib
- https://github.com/dpc-sdp/merlin-framework/blob/develop/licenses.md
- https://deepwiki.com/jasonsarino/hms/4.2-font-management-and-typography
- https://www.php.net/manual/en/function.imagettftext.php
- https://www.php.net/manual/en/function.imagettfbbox.php
- https://www.php.net/manual/en/function.imagefttext.php
- https://phpdoctest.github.io/en/function.imagettftext.html
- https://php.net/manual/pt_BR/function.imagettfbbox.php
- https://www.php.net/manual/uk/function.imagettfbbox.php
- https://image.intervention.io/v4/modifying-images/text-fonts
- http://image.intervention.io/v2/api/text
- https://packagist.org/packages/intervention/image
- https://tcpdf.org/
- https://deepwiki.com/tecnickcom/TCPDF/2.3-font-management
- https://www.peterdev.pl/how-to-set-a-font-in-pdf
- https://pecl.php.net/packages.php
- https://github.com/topics/font-subsetting

### Swift / CoreText and Ruby

- https://developer.apple.com/documentation/coretext/ctfont
- https://developer.apple.com/documentation/coretext/ctfont?language=objc
- https://apple-docs.everest.mt/docs/coretext/ctfont
- https://pkg.go.dev/github.com/tmc/apple@v0.6.18/coretext
- https://deepwiki.com/servo/core-foundation-rs/4.1-font-management
- https://prawnpdf.org/docs/ttfunk/1.8.0/TTFunk/File.html
- https://prawnpdf.org/docs/ttfunk/1.8.0/method_list.html
- http://patch-diff.githubusercontent.com/higher-pixels/ttfunk

### Cross-language and oracle material

- https://golang.org/x/image/font/sfnt
- https://pkg.go.dev/golang.org/x/image/font/sfnt
- https://simoncozens.github.io/fonts-and-layout/features.html
- https://sparkles.petar-kirov.dev/research/font-libraries/comparison
- https://goodgithub.com/reports/font-parsing-and-rasterization-libraries.html
- https://hackage.haskell.org/package/freetype2/docs/FreeType-Core-Base.html
- https://hackage.haskell.org/package/harfbuzz-pure-1.0.0.1/src/Data/Text/Glyphize.hs

Library names in the oracle table that were not individually retrieved against primary
documentation during this survey — `msdfgen`, `SkiaSharp`, `LayoutFarm/Typography`,
`uharfbuzz`, `freetype-py`, `owned_ttf_parser`, `rustybuzz`, `ab_glyph`, `fontdue`,
`fontations` (`read-fonts`, `skrifa`), `go-text/typesetting`, `seehuhn/go-sfnt`,
`golang/freetype`, `hb-subset`, `ttf-parser::OutlineBuilder` and `golang.org/x/image/font/opentype`
— are `[unverified]` as to exact current versions and should be pinned in `oracles.lock`
before the differential-test harness is built.
