# Systems Font Libraries: Public API and Feature Inventory

A survey of the public API surface and feature set of font libraries in the C, C++,
Rust and Go ecosystems, assembled as background for a new MoonBit font library.
The aim is a "latecomer with hindsight" view: derive the best-of-breed union of
capabilities from libraries that have already been stress-tested in production.

## Method, conventions and verification

Every identifier quoted below was checked against a primary source: an official
API reference, a repository header file, or the crate/module documentation index.
Identifiers are reproduced exactly, including case, underscores and namespace
prefixes; where a plausible-sounding name does not exist, that is stated rather
than silently corrected into a real one. Claims that could not be tied to a primary
source are marked **unverified** and gathered in the "Unverified claims" section
near the end. Licence and version are stated where the primary source exposed
them; otherwise the word **unverified** is used rather than a guess.

This document is written in en-GB British English throughout. Code identifiers,
OpenType table tags and type names retain their source spelling (for example
`COLR`, `CPAL`, `hb_color_t`, `SkColor`), because they are code, not prose.
No emoji are used.

Cross-document version note: a sibling research file cites "FreeType 2.15.0" and
"stb_truetype 1.27". The primary sources checked for this inventory are the
official FreeType API reference labelled **2.14.3** and the `stb_truetype.h`
header labelled **v1.26**. Both higher numbers are treated as **unverified**
pending a release artefact; the verified values are used below.

Matrix legend, used in both tables:

- `Y` — supported as a first-class, documented feature.
- `P` — partial, limited, delegated, or available only through a lower-level API.
- `N` — explicitly absent or explicitly excluded by the library's own documentation.
- `O` — out of scope by design; the library does not address this concern at all.
- `?` — unverified.

No cell is left empty.

### Table A. Format, container and glyph coverage

| Library | Lang | TTF | OTF/CFF | CFF2 | TTC | WOFF | WOFF2 | Bitmap strikes | COLR/CPAL | sbix | SVG | Variable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FreeType 2.14.3 | C | Y | Y | P | Y | P | P | Y | Y | Y | Y | Y |
| HarfBuzz 15.0.0 | C | Y | Y | P | Y | O | O | P | Y | P | Y | Y |
| stb_truetype 1.26 | C | Y | N | O | P | O | O | O | O | O | O | O |
| libschrift | C | Y | N | O | O | O | O | O | O | O | O | O |
| fontconfig 2.18.2 | C | O | O | O | O | O | O | O | O | O | O | O |
| msdfgen | C++ | Y | Y | ? | O | O | O | O | O | O | Y | O |
| Skia | C++ | Y | Y | P | Y | O | O | P | P | P | O | Y |
| ICU / Paragraph | C++ | O | O | O | O | O | O | O | O | O | O | O |
| HarfBuzz C++ wrappers | C++ | Y | Y | P | Y | O | O | P | Y | P | Y | Y |
| DirectWrite | C++ | Y | Y | P | Y | P | P | P | Y | ? | Y | Y |
| ttf-parser 0.25.1 | Rust | Y | Y | Y | Y | O | O | Y | P | Y | Y | Y |
| skrifa 0.50.0 | Rust | Y | Y | Y | Y | O | O | Y | Y | Y | ? | Y |
| read-fonts 0.47.0 | Rust | Y | Y | Y | Y | O | O | Y | Y | Y | Y | Y |
| write-fonts 0.56.0 | Rust | Y | Y | P | O | O | O | P | Y | P | P | P |
| fontdue 0.9.5 | Rust | Y | Y | O | O | O | O | O | O | O | O | O |
| ab_glyph 0.2.32 | Rust | Y | Y | O | O | O | O | P | O | O | P | Y |
| rusttype 0.9.3 | Rust | Y | P | O | Y | O | O | O | O | O | O | O |
| glyph_brush 0.7.12 | Rust | P | P | O | O | O | O | O | O | O | O | O |
| rustybuzz 0.20.1 | Rust | Y | Y | P | Y | O | O | O | O | O | O | Y |
| cosmic-text 0.19.0 | Rust | Y | Y | ? | ? | O | O | P | ? | ? | ? | Y |
| kurbo 0.13.1 | Rust | O | O | O | O | O | O | O | O | O | O | O |
| pathfinder | Rust | O | O | O | O | O | O | O | O | O | O | O |
| x/image/font/sfnt v0.48.0 | Go | Y | Y | N | Y | O | O | N | N | N | N | N |
| x/image/font v0.48.0 | Go | O | O | O | O | O | O | O | O | O | O | O |
| golang/freetype | Go | Y | N | O | P | O | O | O | O | O | O | O |
| x/image/font/opentype v0.48.0 | Go | Y | Y | N | Y | O | O | N | N | N | N | N |
| gioui.org/font/opentype v0.10.3 | Go | Y | Y | O | Y | O | O | P | O | O | O | P |
| benoitkugler/textlayout v0.3.2 | Go | Y | Y | O | P | O | O | Y | O | O | O | Y |

### Table B. Rendering, layout and system capabilities

| Library | Hinting | Kern/GPOS | OT shaping | Vertical | SDF/MSDF | LCD/subpixel | Atlas cache | Discovery | Fallback | Subsetting | Writing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FreeType 2.14.3 | Y | P | O | Y | Y | Y | Y | O | O | O | O |
| HarfBuzz 15.0.0 | N | Y | Y | Y | O | O | O | O | O | Y | P |
| stb_truetype 1.26 | N | P | O | O | Y | P | Y | O | O | O | O |
| libschrift | N | P | O | O | O | O | O | O | O | O | O |
| fontconfig 2.18.2 | O | O | O | O | O | O | O | Y | Y | O | O |
| msdfgen | O | O | O | O | Y | O | P | O | O | O | O |
| Skia | Y | Y | P | P | O | Y | Y | Y | Y | P | O |
| ICU / Paragraph | O | P | P | P | O | O | O | O | O | O | O |
| HarfBuzz C++ wrappers | N | Y | Y | Y | O | O | O | O | O | Y | P |
| DirectWrite | Y | Y | Y | Y | O | Y | P | Y | Y | O | O |
| ttf-parser 0.25.1 | O | P | O | Y | O | O | O | O | O | O | O |
| skrifa 0.50.0 | Y | P | O | Y | O | Y | O | O | O | O | O |
| read-fonts 0.47.0 | O | P | O | Y | O | O | O | O | O | O | O |
| write-fonts 0.56.0 | O | P | O | O | O | O | O | O | O | O | Y |
| fontdue 0.9.5 | N | P | P | P | O | Y | P | O | O | O | O |
| ab_glyph 0.2.32 | O | P | O | O | O | O | O | O | O | O | O |
| rusttype 0.9.3 | N | P | O | N | O | P | Y | O | O | O | O |
| glyph_brush 0.7.12 | O | P | P | O | O | O | Y | O | O | O | O |
| rustybuzz 0.20.1 | O | Y | Y | Y | O | O | O | O | O | O | O |
| cosmic-text 0.19.0 | P | Y | Y | P | O | P | Y | Y | Y | O | O |
| kurbo 0.13.1 | O | O | O | O | O | O | O | O | O | O | O |
| pathfinder | P | O | O | O | O | Y | Y | O | O | O | O |
| x/image/font/sfnt v0.48.0 | P | P | O | O | O | O | O | O | O | O | N |
| x/image/font v0.48.0 | P | P | O | O | O | O | O | O | O | O | O |
| golang/freetype | Y | P | O | O | O | O | O | O | O | O | O |
| x/image/font/opentype v0.48.0 | P | P | O | O | O | O | P | O | O | O | N |
| gioui.org/font/opentype v0.10.3 | O | Y | Y | P | O | O | O | P | O | O | O |
| benoitkugler/textlayout v0.3.2 | O | Y | Y | Y | O | O | O | O | O | O | O |

Reading the two tables together: no single library covers every cell. FreeType is
the broadest single "font service" for formats and rasterisation; HarfBuzz and its
ports own shaping and subsetting; fontconfig, Skia, DirectWrite and cosmic-text own
discovery and fallback; the fontations family (read-fonts, skrifa, write-fonts) is
the most systematic about table-level access and safety; and the small pure-Rust
and pure-Go parsers (ttf-parser, fontdue, `sfnt`) are the most convenient to run
offline.

---

## 1. C libraries

### 1.1 FreeType — 2.14.3

- **Positioning:** the de-facto C font service: loading, scaling, hinting,
  outline extraction, rasterisation and caching for a very wide range of formats.
- **Licence:** dual — the FreeType Licence (FTL, BSD-style with a credit clause)
  or GPLv2. FTL is GPLv3-compatible but not GPLv2-compatible.
- **Source:** `https://freetype.org/freetype2/docs/reference/ft2-index.html`,
  `https://freetype.org/license.html`, `https://freetype.org/`.

**Public interface (exact identifiers), grouped by concern**

- Library and face lifecycle: `FT_Library`, `FT_Face`, `FT_FaceRec`,
  `FT_Init_FreeType`, `FT_Done_FreeType`, `FT_Library_Version`, `FT_New_Library`,
  `FT_Done_Library`, `FT_New_Face`, `FT_New_Memory_Face`, `FT_Open_Face`,
  `FT_Open_Args`, `FT_Attach_File`, `FT_Attach_Stream`, `FT_Done_Face`,
  `FT_Reference_Face`, `FT_Face_Properties`, `FT_FaceRec`, `FT_Select_Charmap`.
- Sizing and scaling: `FT_Set_Char_Size`, `FT_Set_Pixel_Sizes`,
  `FT_Request_Size`, `FT_Size_Request`, `FT_Select_Size`, `FT_Set_Transform`,
  `FT_Get_Transform`, `FT_Size`, `FT_Size_Metrics`, `FT_SizeRec`,
  `FT_Activate_Size`, `FT_New_Size`, `FT_Done_Size`.
- Character mapping: `FT_Get_Char_Index`, `FT_Get_First_Char`,
  `FT_Get_Next_Char`, `FT_Select_Charmap`, `FT_Set_Charmap`,
  `FT_Get_Charmap_Index`, `FT_CharMap`, `FT_CharMapRec`, `FT_Encoding`,
  `FT_ENC_TAG`, `FT_Load_Char`. Also Unicode variation selectors:
  `FT_Face_GetCharVariantIndex`, `FT_Face_GetCharsOfVariant`,
  `FT_Face_GetVariantsOfChar`, `FT_Face_GetVariantSelectors`,
  `FT_Face_GetCharVariantIsDefault`.
- Glyph loading and rendering: `FT_Load_Glyph`, `FT_Render_Glyph`,
  `FT_GlyphSlot`, `FT_GlyphSlotRec`, `FT_Glyph_Metrics`, `FT_Glyph_Format`,
  `FT_GLYPH_FORMAT_BITMAP`, `FT_GLYPH_FORMAT_OUTLINE`, `FT_GLYPH_FORMAT_SVG`,
  `FT_Glyph`, `FT_Get_Glyph`, `FT_Done_Glyph`, `FT_Glyph_To_Bitmap`,
  `FT_Glyph_Get_CBox`, `FT_Glyph_Transform`, `FT_Glyph_Copy`. Render and load
  flags: `FT_LOAD_DEFAULT`, `FT_LOAD_RENDER`, `FT_LOAD_NO_HINTING`,
  `FT_LOAD_NO_BITMAP`, `FT_LOAD_NO_SCALE`, `FT_LOAD_NO_AUTOHINT`,
  `FT_LOAD_FORCE_AUTOHINT`, `FT_LOAD_COLOR`, `FT_LOAD_NO_SVG`,
  `FT_LOAD_MONOCHROME`, `FT_LOAD_NO_RECURSE`, `FT_LOAD_PEDANTIC`,
  `FT_LOAD_CROP_BITMAP`, `FT_LOAD_SBITS_ONLY`, `FT_LOAD_BITMAP_METRICS_ONLY`,
  `FT_LOAD_VERTICAL_LAYOUT`, `FT_LOAD_TARGET_NORMAL`, `FT_LOAD_TARGET_LIGHT`,
  `FT_LOAD_TARGET_MONO`, `FT_LOAD_TARGET_LCD`, `FT_LOAD_TARGET_LCD_V`,
  `FT_Load_Target_Mode`; render modes `FT_RENDER_MODE_NORMAL`,
  `FT_RENDER_MODE_LIGHT`, `FT_RENDER_MODE_MONO`, `FT_RENDER_MODE_LCD`,
  `FT_RENDER_MODE_LCD_V`, `FT_RENDER_MODE_SDF`.
- Outlines: `FT_Outline`, `FT_Outline_Funcs`, `FT_Outline_Decompose`,
  `FT_Outline_MoveToFunc`, `FT_Outline_LineToFunc`, `FT_Outline_ConicToFunc`,
  `FT_Outline_CubicToFunc`, `FT_Outline_Get_BBox`, `FT_Outline_Get_CBox`,
  `FT_Outline_Get_Bitmap`, `FT_Outline_Render`, `FT_Outline_Transform`,
  `FT_Outline_Translate`, `FT_Outline_Reverse`, `FT_Outline_Check`,
  `FT_Outline_Copy`, `FT_Outline_New`, `FT_Outline_Done`,
  `FT_Outline_Embolden`, `FT_Outline_EmboldenXY`, `FT_Orientation`,
  `FT_OutlineGlyph`, `FT_OutlineGlyphRec`. Stroking: `FT_Stroker`,
  `FT_Stroker_New`, `FT_Stroker_Set`, `FT_Stroker_ParseOutline`,
  `FT_Stroker_Export`, `FT_Glyph_Stroke`, `FT_Glyph_StrokeBorder`.
- Metrics and kerning: `FT_Get_Kerning`, `FT_Kerning_Mode`,
  `FT_KERNING_DEFAULT`, `FT_KERNING_UNFITTED`, `FT_KERNING_UNSCALED`,
  `FT_Get_Track_Kerning`, `FT_Get_Advance`, `FT_Get_Advances`,
  `FT_ADVANCE_FLAG_FAST_ONLY`, `FT_BBox`, `FT_Glyph_Metrics`.
- Bitmaps and pixels: `FT_Bitmap`, `FT_Bitmap_Init`, `FT_Bitmap_Copy`,
  `FT_Bitmap_Convert`, `FT_Bitmap_Blend`, `FT_Bitmap_Embolden`,
  `FT_Bitmap_Done`, `FT_Bitmap_Size`, `FT_Pixel_Mode`, `FT_PIXEL_MODE_MONO`,
  `FT_PIXEL_MODE_GRAY`, `FT_PIXEL_MODE_GRAY2`, `FT_PIXEL_MODE_GRAY4`,
  `FT_PIXEL_MODE_LCD`, `FT_PIXEL_MODE_LCD_V`, `FT_PIXEL_MODE_BGRA`,
  `FT_BitmapGlyph`. LCD filters: `FT_LcdFilter`, `FT_Library_SetLcdFilter`,
  `FT_Library_SetLcdFilterWeights`, `FT_Library_SetLcdGeometry`,
  `FT_LCD_FILTER_DEFAULT`, `FT_LCD_FILTER_LIGHT`, `FT_LCD_FILTER_LEGACY`,
  `FT_LCD_FILTER_NONE`.
- Variable and multiple-master fonts: `FT_MM_Var`, `FT_Var_Axis`,
  `FT_Var_Named_Style`, `FT_Multi_Master`, `FT_MM_Axis`, `FT_Get_MM_Var`,
  `FT_Done_MM_Var`, `FT_Set_MM_Design_Coordinates`,
  `FT_Set_MM_Blend_Coordinates`, `FT_Set_MM_WeightVector`,
  `FT_Set_Var_Design_Coordinates`, `FT_Set_Var_Blend_Coordinates`,
  `FT_Get_Var_Design_Coordinates`, `FT_Get_Var_Blend_Coordinates`,
  `FT_Get_MM_Blend_Coordinates`, `FT_Get_MM_WeightVector`,
  `FT_Get_Var_Axis_Flags`, `FT_Get_Default_Named_Instance`,
  `FT_Set_Named_Instance`, `FT_Get_Multi_Master`, `FT_Var_Axis_Flags`.
- Colour, layers and SVG: `FT_Palette_Data`, `FT_Palette_Data_Get`,
  `FT_Palette_Select`, `FT_Palette_Set_Foreground_Color`,
  `FT_PALETTE_FOR_LIGHT_BACKGROUND`, `FT_PALETTE_FOR_DARK_BACKGROUND`,
  `FT_Color`, `FT_Get_Color_Glyph_Layer`, `FT_Get_Color_Glyph_ClipBox`,
  `FT_Get_Color_Glyph_Paint`, `FT_Get_Paint`, `FT_Get_Paint_Layers`,
  `FT_COLR_Paint`, `FT_OpaquePaint`, `FT_PaintFormat`, `FT_ColorLine`,
  `FT_ColorStop`, `FT_ColorStopIterator`, `FT_Get_Colorline_Stops`,
  `FT_LayerIterator`, `FT_PaintSolid`, `FT_PaintLinearGradient`,
  `FT_PaintRadialGradient`, `FT_PaintSweepGradient`, `FT_PaintGlyph`,
  `FT_PaintColrGlyph`, `FT_PaintColrLayers`, `FT_PaintTransform`,
  `FT_PaintTranslate`, `FT_PaintScale`, `FT_PaintRotate`, `FT_PaintSkew`,
  `FT_PaintComposite`, `FT_Composite_Mode`, `FT_Color_Root_Transform`,
  `FT_COLOR_INCLUDE_ROOT_TRANSFORM`, `FT_COLOR_NO_ROOT_TRANSFORM`;
  `FT_SVG_Document`, `FT_SVG_DocumentRec`, `FT_SvgGlyph`, `FT_SvgGlyphRec`,
  `SVG_RendererHooks`, `SVG_Lib_Init_Func`, `SVG_Lib_Free_Func`,
  `SVG_Lib_Render_Func`, `SVG_Lib_Preset_Slot_Func`. Face flags:
  `FT_FACE_FLAG_COLOR`, `FT_FACE_FLAG_SBIX`, `FT_FACE_FLAG_SVG`,
  `FT_FACE_FLAG_VARIATION`, `FT_FACE_FLAG_FIXED_SIZES`, `FT_HAS_COLOR`,
  `FT_HAS_SBIX`, `FT_HAS_SVG`, `FT_IS_VARIATION`, `FT_HAS_VERTICAL`.
- SDF: `FT_RENDER_MODE_SDF`, `FT_RASTER_FLAG_SDF`, plus the `spread` module
  property. Low-level raster API: `FT_Raster`, `FT_Raster_Params`,
  `FT_Raster_Funcs`, `FT_Span`, `FT_SpanFunc`.
- SFNT table access and names: `FT_Get_Sfnt_Table`, `FT_Load_Sfnt_Table`,
  `FT_Sfnt_Table_Info`, `FT_Sfnt_Tag`, `FT_SFNT_HEAD`, `FT_SFNT_MAXP`,
  `FT_SFNT_OS2`, `FT_SFNT_HHEA`, `FT_SFNT_VHEA`, `FT_SFNT_POST`,
  `FT_Get_Sfnt_Name_Count`, `FT_Get_Sfnt_Name`, `FT_Get_Sfnt_LangTag`,
  `FT_Get_Postscript_Name`, `FT_Get_Glyph_Name`, `FT_Get_Name_Index`,
  `TT_Header`, `TT_HoriHeader`, `TT_VertHeader`, `TT_MaxProfile`, `TT_OS2`,
  `TT_Postscript`, `TT_PCLT`.
- Caching subsystem (atlas-like): `FTC_Manager`, `FTC_Manager_New`,
  `FTC_Manager_Done`, `FTC_Manager_LookupFace`, `FTC_Manager_LookupSize`,
  `FTC_Manager_RemoveFaceID`, `FTC_Manager_Reset`, `FTC_ImageCache`,
  `FTC_ImageCache_New`, `FTC_ImageCache_Lookup`, `FTC_ImageCache_LookupScaler`,
  `FTC_SBitCache`, `FTC_SBitCache_New`, `FTC_SBitCache_Lookup`,
  `FTC_SBitCache_LookupScaler`, `FTC_CMapCache`, `FTC_CMapCache_New`,
  `FTC_CMapCache_Lookup`, `FTC_ImageType`, `FTC_Scaler`, `FTC_SBit`,
  `FTC_Node`, `FTC_Node_Unref`, `FTC_FaceID`, `FTC_Face_Requester`.
- Miscellaneous: `FT_Get_Font_Format`, `FT_Get_FSType_Flags`,
  `FT_Get_SubGlyph_Info`, `FT_Get_Gasp`, `FT_Property_Set`, `FT_Property_Get`,
  `FT_Set_Renderer`, `FT_Get_Renderer`, `FT_Stream`, `FT_Stream_IoFunc`,
  `FT_Stream_CloseFunc`, `FT_Stream_OpenGzip`, `FT_Stream_OpenLZW`,
  `FT_Stream_OpenBzip2`, `FT_Incremental_Interface`, `FT_OpenType_Validate`,
  `FT_TrueTypeGX_Validate`.

**Coverage notes.** See Tables A and B. FreeType is the only library here that
combines hinting, LCD subpixel rendering, SDF, COLRv1 paint graphs, sbix, SVG,
bitmap strikes, variable fonts and a cache subsystem in one C API. WOFF and WOFF2
container support is **P** (build-dependent decompression; **unverified** whether
every build enables it). CFF2 outline support is **P** (**unverified** as a
first-class capability). `FT_Get_Kerning` reads legacy `kern` and simple GPOS
kerning but the full GPOS table is not exposed, hence **P**.

**Out of scope and architectural stance.** Text layout and shaping are explicitly
excluded (that is HarfBuzz's job); font discovery and family fallback are excluded
(fontconfig's job); rendering to arbitrary surfaces is left to the client.
FreeType does not build or write font files. The library is stateful: an
`FT_Library`, an `FT_Face` with a mutable glyph slot, a current size and a
current charmap. It owns its own allocator hooks (`FT_Memory`, `FT_Alloc_Func`,
`FT_Free_Func`, `FT_Realloc_Func`) and can be driven from an `FT_Stream` — so it
can do I/O, but also accepts `FT_New_Memory_Face` for pure in-memory operation.
It is C, reference-counted in places, and its tolerance to malformed fonts is a
deliberate design goal.

**Differential-test oracle suitability.** Excellent, and the industry reference.
Runs fully offline from a fixture byte buffer via `FT_New_Memory_Face` with no
I/O; needs a C toolchain and a compiled harness (or the `ftview`/`ftdump`-style
utilities). Comparable outputs: glyph id (`FT_Get_Char_Index`), advance width
(`FT_Glyph_Metrics.horiAdvance` or `FT_Get_Advance`), bounding box
(`FT_Glyph_Get_CBox`, `FT_Outline_Get_CBox`), outline commands
(`FT_Outline_Decompose` with a recording `FT_Outline_Funcs`), and the coverage
bitmap (`FT_Bitmap.buffer` after `FT_Render_Glyph`). Tolerance issues: with
`FT_LOAD_NO_HINTING | FT_LOAD_NO_BITMAP` and `FT_RENDER_MODE_NORMAL` the outline
is deterministic, but anti-aliasing, LCD filtering, stem darkening and the
TrueType interpreter make pixel comparison version- and configuration-sensitive;
compare hinted runs at a fixed interpreter version (`TT_INTERPRETER_VERSION_40`)
and fixed load flags.

**Worth stealing.** The single `FT_Parameter` / `FT_Property_Set` mechanism for
tuning global behaviour (hinting engine, stem darkening, LCD filter weights)
without changing the core API — a clean, extensible "capability flags" seam.

### 1.2 HarfBuzz — 15.0.0

- **Positioning:** the reference OpenType text shaping engine: Unicode text in,
  positioned glyph ids out. It also carries a production font subsetter and
  low-level OpenType table query APIs.
- **Licence:** MIT (the project describes its licence as "Old MIT"; the C API and
  ABI are guaranteed stable).
- **Source:** `https://github.com/harfbuzz/harfbuzz`, `https://harfbuzz.github.io/`.
- **Version note:** 15.0.0 is reported by a secondary source (Wikipedia, dated
  22 October 2026) as the stable release; the headers fetched are from the `main`
  branch. Treat the exact stable tag as **unverified**.

**Public interface (exact identifiers)**

- Umbrella: `hb.h` includes `hb-blob.h`, `hb-buffer.h`, `hb-common.h`,
  `hb-deprecated.h`, `hb-draw.h`, `hb-face.h`, `hb-font.h`, `hb-map.h`,
  `hb-paint.h`, `hb-set.h`, `hb-shape.h`, `hb-shape-plan.h`, `hb-style.h`,
  `hb-unicode.h`, `hb-version.h`.
- Blobs and faces: `hb_blob_t`, `hb_blob_create`, `hb_blob_create_or_fail`,
  `hb_blob_create_from_file`, `hb_blob_get_data`, `hb_blob_get_length`,
  `hb_blob_destroy`, `hb_face_t`, `hb_face_count`, `hb_face_create`,
  `hb_face_create_or_fail`, `hb_face_create_or_fail_using`,
  `hb_face_create_from_file_or_fail`, `hb_face_create_for_tables`,
  `hb_reference_table_func_t`, `hb_face_reference_table`,
  `hb_face_reference_blob`, `hb_face_get_table_tags`,
  `hb_get_table_tags_func_t`, `hb_face_get_glyph_count`, `hb_face_get_upem`,
  `hb_face_set_upem`, `hb_face_get_index`, `hb_face_set_index`,
  `hb_face_collect_unicodes`, `hb_face_collect_variation_selectors`,
  `hb_face_collect_variation_unicodes`, `hb_face_builder_create`,
  `hb_face_builder_add_table`, `hb_face_builder_sort_tables`,
  `hb_face_destroy`, `hb_face_reference`, `hb_face_make_immutable`.
- Fonts: `hb_font_t`, `hb_font_create`, `hb_font_create_sub_font`,
  `hb_font_get_empty`, `hb_font_set_scale`, `hb_font_get_scale`,
  `hb_font_set_ppem`, `hb_font_get_ppem`, `hb_font_set_ptem`,
  `hb_font_set_variations`, `hb_font_set_var_coords_design`,
  `hb_font_set_var_named_instance`, `hb_font_get_nominal_glyph`,
  `hb_font_get_variation_glyph`, `hb_font_get_glyph`,
  `hb_font_get_glyph_h_advance`, `hb_font_get_glyph_v_advance`,
  `hb_font_get_glyph_h_advances`, `hb_font_get_glyph_v_advances`,
  `hb_font_get_glyph_extents`, `hb_font_get_h_extents`, `hb_font_get_v_extents`,
  `hb_font_get_glyph_contour_point`, `hb_font_get_glyph_name`,
  `hb_font_draw_glyph`, `hb_font_draw_glyph_or_fail`, `hb_font_paint_glyph`,
  `hb_font_get_face`, `hb_font_set_funcs`, `hb_font_funcs_create`,
  `hb_font_set_parent`, `hb_font_get_parent`, `hb_font_destroy`,
  `hb_font_extents_t`, `hb_glyph_extents_t`, `hb_font_funcs_t`,
  `hb_draw_funcs_t`, `hb_paint_funcs_t`. Note: there is no plain
  `hb_font_get_glyph_advance` or `hb_font_get_font_extents`; the real names are
  direction-split (`hb_font_get_glyph_h_advance`, `hb_font_get_h_extents`) or
  direction-aware (`hb_font_get_glyph_advance_for_direction`,
  `hb_font_get_extents_for_direction`).
- Buffers: `hb_buffer_t`, `hb_buffer_create`, `hb_buffer_reset`,
  `hb_buffer_clear_contents`, `hb_buffer_add_utf8`, `hb_buffer_add_utf16`,
  `hb_buffer_add_utf32`, `hb_buffer_add_codepoints`,
  `hb_buffer_guess_segment_properties`, `hb_buffer_set_direction`,
  `hb_buffer_set_script`, `hb_buffer_set_language`,
  `hb_buffer_set_cluster_level`, `hb_buffer_set_flags`,
  `hb_buffer_set_replacement_codepoint`, `hb_buffer_set_invisible_glyph`,
  `hb_buffer_set_not_found_glyph`, `hb_buffer_normalize_glyphs`,
  `hb_buffer_reverse`, `hb_buffer_get_length`, `hb_buffer_get_glyph_infos`,
  `hb_buffer_get_glyph_positions`, `hb_buffer_destroy`,
  `hb_buffer_reference`; `hb_glyph_info_t` (public fields `codepoint`, `cluster`),
  `hb_glyph_position_t` (public fields `x_advance`, `y_advance`, `x_offset`,
  `y_offset`), `hb_buffer_flags_t`, `hb_buffer_cluster_level_t`,
  `hb_buffer_content_type_t`, `hb_segment_properties_t`. Note: the real setters are
  `hb_buffer_set_invisible_glyph` and `hb_buffer_set_not_found_glyph`, not the
  shorter forms.
- Shaping: `hb_shape`, `hb_shape_full`, `hb_shape_justify` (experimental),
  `hb_shape_list_shapers`, `hb_shape_plan_t`, `hb_shape_plan_create`,
  `hb_shape_plan_execute`, `hb_feature_t`, `hb_feature_from_string`,
  `hb_feature_to_string`, `HB_FEATURE_GLOBAL_START`, `HB_FEATURE_GLOBAL_END`,
  `hb_direction_t`, `hb_script_t`, `hb_language_t`.
- OpenType layout (`hb-ot-layout.h`): `HB_OT_TAG_GDEF`, `HB_OT_TAG_GSUB`,
  `HB_OT_TAG_GPOS`, `HB_OT_TAG_BASE`, `HB_OT_TAG_JSTF`,
  `HB_OT_TAG_DEFAULT_SCRIPT`, `HB_OT_TAG_DEFAULT_LANGUAGE`,
  `hb_ot_layout_has_glyph_classes`, `hb_ot_layout_get_glyph_class`,
  `hb_ot_layout_get_glyphs_in_class`, `hb_ot_layout_get_attach_points`,
  `hb_ot_layout_get_ligature_carets`,
  `hb_ot_layout_table_get_script_tags`, `hb_ot_layout_table_find_script`,
  `hb_ot_layout_table_select_script`, `hb_ot_layout_table_get_feature_tags`,
  `hb_ot_layout_script_get_language_tags`,
  `hb_ot_layout_script_select_language`, `hb_ot_layout_script_select_language2`,
  `hb_ot_layout_language_get_required_feature_index`,
  `hb_ot_layout_language_get_required_feature`,
  `hb_ot_layout_language_get_feature_indexes`,
  `hb_ot_layout_language_get_feature_tags`,
  `hb_ot_layout_language_find_feature`, `hb_ot_layout_feature_get_lookups`,
  `hb_ot_layout_table_get_lookup_count`, `hb_ot_layout_collect_features`,
  `hb_ot_layout_collect_features_map`, `hb_ot_layout_collect_lookups`,
  `hb_ot_layout_lookup_collect_glyphs`,
  `hb_ot_layout_table_find_feature_variations`,
  `hb_ot_layout_feature_with_variations_get_lookups`,
  `hb_ot_layout_has_substitution`, `hb_ot_layout_has_positioning`,
  `hb_ot_layout_lookup_get_glyph_alternates`,
  `hb_ot_layout_lookup_collect_glyph_alternates`,
  `hb_ot_layout_lookup_would_substitute`,
  `hb_ot_layout_lookup_substitute_closure`,
  `hb_ot_layout_lookups_substitute_closure`, `hb_ot_layout_get_size_params`,
  `hb_ot_layout_lookup_get_optical_bound`, `hb_ot_layout_feature_get_name_ids`,
  `hb_ot_layout_feature_get_characters`, `hb_ot_layout_get_font_extents`,
  `hb_ot_layout_get_baseline`, `hb_ot_layout_get_baseline_with_fallback`,
  `hb_ot_layout_baseline_tag_t`, `hb_ot_layout_get_extender_glyphs`.
- Variable fonts (`hb-ot-var.h`): `HB_OT_TAG_VAR_AXIS_ITALIC`,
  `HB_OT_TAG_VAR_AXIS_OPTICAL_SIZE`, `HB_OT_TAG_VAR_AXIS_SLANT`,
  `HB_OT_TAG_VAR_AXIS_WIDTH`, `HB_OT_TAG_VAR_AXIS_WEIGHT`,
  `hb_ot_var_has_data`, `hb_ot_var_get_axis_count`, `hb_ot_var_get_axis_infos`,
  `hb_ot_var_find_axis_info`, `hb_ot_var_axis_info_t`,
  `hb_ot_var_axis_flags_t`, `HB_OT_VAR_AXIS_FLAG_HIDDEN`,
  `hb_ot_var_get_named_instance_count`,
  `hb_ot_var_named_instance_get_subfamily_name_id`,
  `hb_ot_var_named_instance_get_postscript_name_id`,
  `hb_ot_var_named_instance_get_design_coords`,
  `hb_ot_var_normalize_variations`, `hb_ot_var_normalize_coords`.
- Colour (`hb-ot-color.h`): `hb_ot_color_has_palettes`,
  `hb_ot_color_palette_get_count`, `hb_ot_color_palette_get_name_id`,
  `hb_ot_color_palette_color_get_name_id`, `hb_ot_color_palette_get_flags`,
  `hb_ot_color_palette_get_colors`, `hb_ot_color_palette_flags_t`,
  `hb_ot_color_has_layers`, `hb_ot_color_glyph_get_layers`,
  `hb_ot_color_layer_t`, `hb_ot_color_has_paint`,
  `hb_ot_color_glyph_has_paint`, `hb_ot_color_has_svg`,
  `hb_ot_color_get_svg_document_count`,
  `hb_ot_color_glyph_get_svg_document_index`,
  `hb_ot_color_get_svg_document_glyph_range`,
  `hb_ot_color_glyph_reference_svg`, `hb_ot_color_has_png`,
  `hb_ot_color_glyph_reference_png`, `hb_color_t`, `hb_color_get_alpha`,
  `hb_color_get_red`. `hb-ot.h` additionally includes `hb-ot-font.h`,
  `hb-ot-math.h`, `hb-ot-meta.h`, `hb-ot-metrics.h`, `hb-ot-name.h`,
  `hb-ot-shape.h`, `hb-ot-fetch.h`.
- Subsetting (`hb-subset.h`): `hb_subset_input_t`, `hb_subset_plan_t`,
  `hb_subset_flags_t`, `hb_subset_sets_t`, `HB_SUBSET_FLAGS_DEFAULT`,
  `HB_SUBSET_FLAGS_NO_HINTING`, `HB_SUBSET_FLAGS_RETAIN_GIDS`,
  `HB_SUBSET_FLAGS_DESUBROUTINIZE`, `HB_SUBSET_FLAGS_NAME_LEGACY`,
  `HB_SUBSET_FLAGS_SET_OVERLAPS_FLAG`,
  `HB_SUBSET_FLAGS_PASSTHROUGH_UNRECOGNIZED`,
  `HB_SUBSET_FLAGS_NOTDEF_OUTLINE`, `HB_SUBSET_FLAGS_GLYPH_NAMES`,
  `HB_SUBSET_FLAGS_NO_PRUNE_UNICODE_RANGES`,
  `HB_SUBSET_FLAGS_NO_LAYOUT_CLOSURE`,
  `HB_SUBSET_FLAGS_OPTIMIZE_IUP_DELTAS`, `HB_SUBSET_FLAGS_NO_BIDI_CLOSURE`,
  `HB_SUBSET_FLAGS_IFTB_REQUIREMENTS`, `HB_SUBSET_FLAGS_RETAIN_NUM_GLYPHS`,
  `HB_SUBSET_FLAGS_DOWNGRADE_CFF2`, `HB_SUBSET_FLAGS_CFF_IDENTITY_CHARSET`,
  `HB_SUBSET_SETS_GLYPH_INDEX`, `HB_SUBSET_SETS_UNICODE`,
  `HB_SUBSET_SETS_NO_SUBSET_TABLE_TAG`, `HB_SUBSET_SETS_DROP_TABLE_TAG`,
  `HB_SUBSET_SETS_NAME_ID`, `HB_SUBSET_SETS_NAME_LANG_ID`,
  `HB_SUBSET_SETS_LAYOUT_FEATURE_TAG`, `HB_SUBSET_SETS_LAYOUT_SCRIPT_TAG`,
  `hb_subset_input_create_or_fail`, `hb_subset_input_reference`,
  `hb_subset_input_destroy`, `hb_subset_input_set_user_data`,
  `hb_subset_input_get_user_data`, `hb_subset_input_keep_everything`,
  `hb_subset_input_unicode_set`, `hb_subset_input_glyph_set`,
  `hb_subset_input_set`, `hb_subset_input_old_to_new_glyph_mapping`,
  `hb_subset_input_get_flags`, `hb_subset_input_set_flags`,
  `hb_subset_input_pin_all_axes_to_default`,
  `hb_subset_input_pin_axis_to_default`, `hb_subset_input_pin_axis_location`,
  `hb_subset_input_get_axis_range`, `hb_subset_input_set_axis_range`,
  `hb_subset_axis_range_from_string`, `hb_subset_axis_range_to_string`,
  `hb_subset_preprocess`, `hb_subset_or_fail`,
  `hb_subset_plan_create_or_fail`, `hb_subset_plan_execute_or_fail`,
  `hb_subset_plan_destroy`, `hb_subset_plan_old_to_new_glyph_mapping`,
  `hb_subset_plan_new_to_old_glyph_mapping`,
  `hb_subset_plan_unicode_to_old_glyph_mapping`, `hb_subset_plan_reference`.

**Coverage notes.** Tables A and B. HarfBuzz reads font files through
`hb_blob_t` and `hb_face_create(blob, index)`; it does not rasterise glyphs to
pixels, does not hint, and does not discover fonts. Hinting is explicitly `N`.
Shaping supports OpenType, AAT and Graphite via pluggable shapers; COLRv0 layers,
COLRv1 paint (`hb_ot_color_has_paint`), SVG documents and PNG (CBDT/sbix)
bitmaps are exposed as data, not as rendered images. WOFF/WOFF2 are `O` because
HarfBuzz expects already-decompressed SFNT data.

**Out of scope and architectural stance.** No rasterisation, no hinting, no font
discovery, no line breaking, no bidi paragraph handling (callers use ICU/fribidi).
It is a C API implemented in C++, with immutable, reference-counted objects
(`hb_face_t`, `hb_font_t`, `hb_blob_t`) and caller-owned buffers. It is designed
to be embedded: `hb_face_create_for_tables` accepts a callback, so the caller
supplies table bytes and HarfBuzz performs no I/O. The C API and ABI are
guaranteed stable across major versions.

**Differential-test oracle suitability.** Strong for shaping and structural
queries, weak for pixels. Runs fully offline from a fixture through
`hb_blob_create` + `hb_face_create`; needs a C/C++ toolchain, or the `hb-shape`
CLI utility. Comparable outputs: shaped glyph ids and positions
(`hb_buffer_get_glyph_infos` / `hb_buffer_get_glyph_positions`), nominal glyph
mapping (`hb_font_get_nominal_glyph`), advances, `hb_font_get_glyph_extents`,
axis information (`hb_ot_var_get_axis_infos`), and table tags
(`hb_face_get_table_tags`). Tolerance: shaping is deterministic given the same
Unicode version, shaper and font, but features, cluster levels and script tags
must be pinned; HarfBuzz does not emit coverage bitmaps, so it cannot validate
rasterisation on its own.

**Worth stealing.** The immutable-object plus "font funcs" virtual table design:
`hb_font_funcs_create` with per-glyph callbacks lets a host supply glyph metrics,
outlines and advances from any backend without HarfBuzz knowing the font format —
an ideal way to keep a shaping layer independent of a parser.

### 1.3 stb_truetype.h — 1.26

- **Positioning:** a single-header, dependency-free TrueType parser and
  rasteriser for games; public API documented in one comment block at the top.
- **Licence:** public domain (Unlicense) or MIT, at the user's choice.
- **Source:** `https://github.com/nothings/stb/blob/master/stb_truetype.h`,
  `https://nothings.org/stb/`, `https://github.com/nothings/stb/blob/master/LICENSE`.

**Public interface (exact identifiers)**

- Container: `stbtt_fontinfo`, `stbtt_InitFont`, `stbtt_GetFontOffsetForIndex`,
  `stbtt_GetNumberOfFonts`, `stbtt_GetFontName?` (**unverified** — not present in
  the checked API block). There is **no** `stbtt_InitFontOffset`; the offset is a
  parameter of `stbtt_InitFont`.
- Character mapping: `stbtt_FindGlyphIndex`, `stbtt_GetCodepointShape`,
  `stbtt_GetGlyphShape`, `stbtt_IsGlyphEmpty`, `stbtt_vertex` (with `x`, `y`,
  `cx`, `cy`, `cx1`, `cy1`, `type` and the `STBTT_vmove`, `STBTT_vline`,
  `STBTT_vcurve`, `STBTT_vcubic` vertex types).
- Metrics: `stbtt_GetFontVMetrics`, `stbtt_GetCodepointHMetrics`,
  `stbtt_GetGlyphHMetrics`, `stbtt_GetCodepointKernAdvance`,
  `stbtt_GetGlyphKernAdvance`, `stbtt_GetCodepointBox`, `stbtt_GetGlyphBox`,
  `stbtt_ScaleForPixelHeight`, `stbtt_ScaleForMappingEmToPixels`,
  `stbtt_GetFontBoundingBox?` (**unverified**).
- Rasterisation: `stbtt_GetCodepointBitmap`,
  `stbtt_GetCodepointBitmapSubpixel`, `stbtt_MakeCodepointBitmap`,
  `stbtt_MakeCodepointBitmapSubpixel`, `stbtt_GetGlyphBitmap`,
  `stbtt_GetGlyphBitmapBox`, `stbtt_GetGlyphBitmapBoxSubpixel`,
  `stbtt_GetCodepointBitmapBox`, `stbtt_GetCodepointBitmapBoxSubpixel`,
  `stbtt_MakeGlyphBitmap`, `stbtt_MakeGlyphBitmapSubpixel`.
- Signed distance fields: `stbtt_GetGlyphSDF`, `stbtt_GetCodepointSDF`,
  `stbtt_FreeSDF`, with `STBTT_SDF` parameters such as `padding`, `onedge_value`,
  `pixel_dist_scale`.
- Baked atlas (simple 3D API): `stbtt_bakedchar`, `stbtt_aligned_quad`,
  `stbtt_BakeFontBitmap`, `stbtt_GetBakedQuad`.
- Packed atlas (improved 3D API): `stbtt_pack_context`, `stbtt_packer?`,
  `stbtt_PackBegin`, `stbtt_PackEnd`, `stbtt_PackFontRange`,
  `stbtt_PackFontRanges`, `stbtt_PackSetOversampling`,
  `stbtt_PackSetSkipMissingCodepoints`, `stbtt_GetPackedQuad`,
  `stbtt_pack_range`, `stbtt_PackFontRangesGatherRects`,
  `stbtt_PackFontRangesPackRects`, `stbtt_PackFontRangesRenderIntoRects`,
  `stbtt_MakeGlyphBitmapSubpixelPrefilter`, `stbtt_PackSetAllowOutOfRange`.

**Coverage notes.** TrueType `glyf` outlines only; no CFF/OTF (`N` in Table A), no
variable fonts, no hinting, no colour or bitmap glyph tables, no SVG. `P` for TTC
via `stbtt_GetFontOffsetForIndex`. `P` for kerning (`kern` table only, no GPOS).
`Y` for SDF, `Y` for atlas baking, `P` for subpixel (positional oversampling, not
LCD colour filtering).

**Out of scope and architectural stance.** Deliberately tiny and dependency-free:
one header, compiled by defining `STB_TRUETYPE_IMPLEMENTATION` in exactly one
translation unit. No I/O, no dynamic allocation beyond what the caller supplies
(except the optional SDF path which returns a `malloc`-ed buffer freed by
`stbtt_FreeSDF`). No hinting by design; anti-aliasing is a simple
oversampling/supersampling rasteriser. Not hardened against malicious fonts.

**Differential-test oracle suitability.** Extremely convenient. It runs fully
offline from a fixture byte array, needs only a C compiler and one `#include`, and
has no build system or external dependencies. Comparable outputs: glyph id
(`stbtt_FindGlyphIndex`), advance (`stbtt_GetCodepointHMetrics`), bounding box
(`stbtt_GetCodepointBox` / `stbtt_GetGlyphBitmapBox`), outline vertices
(`stbtt_GetGlyphShape`), the 8-bit coverage bitmap
(`stbtt_GetCodepointBitmap`), and the SDF field (`stbtt_GetCodepointSDF`).
Tolerance issues: its anti-aliasing algorithm is its own, so coverage bitmaps will
not match FreeType pixel-for-pixel; compare with a per-pixel tolerance or compare
only glyph ids, advances, boxes and vertex sequences. No hinting means no
interpreter-version drift.

**Worth stealing.** The `stbtt_vertex` array as the single outline interchange
format: one flat struct with a `type` tag and up to six coordinates, returned by
one function, consumed by everyone. A newcomer can expose exactly one canonical
outline representation and keep every backend behind it.

### 1.4 libschrift

- **Positioning:** a small, fast, dependency-free TrueType rasteriser in C; a
  minimal alternative to FreeType for Latin text.
- **Licence:** ISC (© 2019-2022 Thomas Oltmann and contributors).
- **Version:** **unverified** (the checked header carries no release number).
- **Source:** `https://github.com/tomolt/libschrift`,
  `https://raw.githubusercontent.com/tomolt/libschrift/master/schrift.h`,
  `https://raw.githubusercontent.com/tomolt/libschrift/master/LICENSE`.

**Public interface (exact identifiers)** — the complete header is small:

- Types: `SFT`, `SFT_Font`, `SFT_UChar`, `SFT_Glyph`, `SFT_LMetrics`,
  `SFT_GMetrics`, `SFT_Kerning`, `SFT_Image`, and the flag `SFT_DOWNWARD_Y`.
- `struct SFT` fields: `font`, `xScale`, `yScale`, `xOffset`, `yOffset`, `flags`.
- `struct SFT_LMetrics`: `ascender`, `descender`, `lineGap`.
- `struct SFT_GMetrics`: `advanceWidth`, `leftSideBearing`, `yOffset`,
  `minWidth`, `minHeight`.
- `struct SFT_Kerning`: `xShift`, `yShift`.
- `struct SFT_Image`: `pixels`, `width`, `height`.
- Functions: `sft_version`, `sft_loadmem`, `sft_loadfile`, `sft_freefont`,
  `sft_lmetrics`, `sft_lookup`, `sft_gmetrics`, `sft_kerning`, `sft_render`.

**Coverage notes.** TrueType outlines, grayscale anti-aliased coverage into a
caller-supplied `SFT_Image.pixels` buffer, line metrics, glyph metrics and
kerning. No CFF, no hinting, no colour/bitmap/SVG, no variable fonts, no atlas,
no discovery. Everything else is `O` or `N`.

**Out of scope and architectural stance.** Extremely narrow by design: nine
functions. `SFT` is a plain struct holding scaling and offset, so there is no
hidden global state; the caller owns all buffers, including the output pixels.
`sft_loadmem` gives pure in-memory operation; `sft_loadfile` is the only I/O
entry point. No allocation inside the render path, no unsafe tricks, no
thread-local state.

**Differential-test oracle suitability.** Good and very lightweight. Runs offline
from a fixture via `sft_loadmem`; needs only a C compiler. Comparable outputs:
glyph id (`sft_lookup`), advance and bearings (`sft_gmetrics`), line metrics
(`sft_lmetrics`), kerning (`sft_kerning`), and the 8-bit coverage buffer
(`sft_render`). Tolerance issues: its own anti-aliasing, no hinting, and a
Y-axis convention controlled by `SFT_DOWNWARD_Y`, so the flag must be pinned
before comparing bitmaps.

**Worth stealing.** Passing the render target in as a plain `SFT_Image` struct
with `pixels`, `width`, `height`: the library never allocates, never picks a
pixel format, and never owns the surface. The caller can point `pixels` at any
stride-compatible buffer.

### 1.5 fontconfig — 2.18.2 (developer reference labelled 2.15.0)

- **Positioning:** system-wide font configuration, discovery, matching and
  substitution. It does not parse glyphs or render anything.
- **Licence:** a permissive MIT-style licence ("Permission to use, copy, modify,
  distribute, and sell ... without fee"), © Keith Packard, Red Hat, Inc. and
  others.
- **Version note:** the official `freedesktop.org/fontconfig/` page states the
  current stable series is **2.18.2**; the developer reference is labelled
  **2.15.0**; other mirrors list 2.17.x. Treat the exact current release as
  **unverified**.
- **Source:** `https://www.freedesktop.org/software/fontconfig/fontconfig-devel/fcfontmatch.html`,
  `https://www.freedesktop.org/software/fontconfig/fontconfig-devel/fcdefaultsubstitute.html`,
  `https://www.freedesktop.org/software/fontconfig/fontconfig-devel/fcconfigparseandloadfrommemory.html`,
  `https://www.freedesktop.org/software/fontconfig/fontconfig-devel/t1.html`.

**Public interface (exact identifiers)**

- Core objects: `FcPattern`, `FcConfig`, `FcFontSet`, `FcCharSet`,
  `FcObjectSet`, `FcMatrix`, `FcValue`, `FcResult`, `FcChar8`, `FcBool`,
  `FcStrSet`, `FcStrList`, `FcLangSet`, `FcRange`.
- Pattern lifecycle and access: `FcPatternCreate`, `FcPatternDuplicate`,
  `FcPatternDestroy`, `FcPatternAdd`, `FcPatternAddString`,
  `FcPatternAddInteger`, `FcPatternAddDouble`, `FcPatternAddBool`,
  `FcPatternAddCharSet`, `FcPatternAddMatrix`, `FcPatternAddLangSet`,
  `FcPatternAddRange`, `FcPatternGet`, `FcPatternGetString`,
  `FcPatternGetInteger`, `FcPatternGetDouble`, `FcPatternGetBool`,
  `FcPatternGetCharSet`, `FcPatternGetMatrix`, `FcPatternGetLangSet`,
  `FcPatternGetRange`, `FcPatternDel`, `FcPatternRemove`, `FcPatternPrint`,
  `FcPatternFormat`, `FcPatternEqual`, `FcPatternHash`, `FcPatternObjectCount`.
- Configuration: `FcInit`, `FcFini`, `FcInitLoadConfig`, `FcInitLoadConfigAndFonts`,
  `FcConfigCreate`, `FcConfigDestroy`, `FcConfigSetCurrent`,
  `FcConfigGetCurrent`, `FcConfigBuildFonts`, `FcConfigGetFonts`,
  `FcConfigParseAndLoad`, `FcConfigParseAndLoadFromMemory`,
  `FcConfigSubstitute`, `FcConfigSubstituteWithPat`, `FcConfigGetConfigFiles`,
  `FcConfigGetCacheDirs`, `FcConfigGetFontDirs`, `FcConfigGetRescanInterval`,
  `FcConfigEnableHome`, `FcConfigReference`, `FcConfigGetSysRoot`,
  `FcConfigSetSysRoot`, `FcConfigAddBlank?` (**unverified**).
- Matching and substitution: `FcFontMatch`, `FcFontSort`, `FcFontRenderPrepare`,
  `FcDefaultSubstitute`, `FcFontList`, `FcConfigGetFonts`,
  `FcFontSetCreate`, `FcFontSetDestroy`, `FcFontSetAdd`, `FcFontSetList`,
  `FcFontSetMatch`, `FcFontSetPrint`, `FcObjectSetCreate`,
  `FcObjectSetAdd`, `FcObjectSetDestroy`, `FcObjectSetVaBuild`.
- Character sets and names: `FcCharSetCreate`, `FcCharSetDestroy`,
  `FcCharSetAddChar`, `FcCharSetHasChar`, `FcCharSetCount`,
  `FcCharSetIntersect`, `FcCharSetUnion`, `FcCharSetSubtract`,
  `FcCharSetMerge?` (**unverified**), `FcNameParse`, `FcNameUnparse`,
  `FcNameRegisterObjectTypes`, `FcNameRegisterConstants`, `FcValueSave`,
  `FcMatrixInit`, `FcMatrixCopy`, `FcMatrixEqual`, `FcMatrixMultiply`,
  `FcMatrixRotate`, `FcMatrixScale`, `FcMatrixShear`.
- Command-line utilities: `fc-list`, `fc-match`, `fc-cache`, `fc-cat`,
  `fc-query`, `fc-scan`, `fc-pattern`, `fc-validate`.

Verified function declarations from primary documentation include
`FcPattern * FcFontMatch(FcConfig *config, FcPattern *p, FcResult *result);`,
`void FcDefaultSubstitute(FcPattern *pattern);` and
`FcBool FcConfigParseAndLoadFromMemory(FcConfig *config, const FcChar8 *buffer, FcBool complain);`.
The `FcFontMatch` documentation explicitly names `FcFontRenderPrepare`,
`FcConfigSubstitute` and `FcDefaultSubstitute` as required companions.

**Coverage notes.** Tables A and B show `O` for every glyph/format column by
design. `Y` for discovery and fallback, which is its whole purpose. It relies on
FreeType (or another rasteriser) to actually draw glyphs; the official
description states it does not render fonts and does not depend on X.

**Out of scope and architectural stance.** No glyph parsing, no rasterisation, no
shaping, no writing. It is a configuration-and-index service with its own XML
configuration language, an on-disk cache, and a pattern algebra (a font is
described by a bag of typed properties and matched by weighted rules). It does
file-system I/O and caches state on disk, so it is the least "pure computation"
library in this survey.

**Differential-test oracle suitability.** Poor for glyph comparison, useful as a
fixture-selection oracle. It cannot produce glyph ids, outlines or bitmaps from a
standalone font file; it needs a configured system font directory. A C toolchain
and a controlled `fonts.conf` are required. Comparable outputs: matched family
name, style, file path and charset coverage. Tolerance issues: results depend on
the installed font set and configuration, so reproducible offline use demands a
hermetic config and a pinned font directory.

**Worth stealing.** Modelling a font request as a property bag
(`FcPattern`) plus a substitution pipeline (`FcConfigSubstitute` →
`FcDefaultSubstitute` → `FcFontMatch` → `FcFontRenderPrepare`): fallback becomes
a sequence of well-defined, inspectable transformations rather than a hard-coded
list of families.

### 1.6 msdfgen

- **Positioning:** a C++ utility and library for generating (multi-channel)
  signed distance fields from vector shapes and font glyphs, for real-time
  graphics.
- **Licence:** MIT (© 2014-2026 Viktor Chlumsky).
- **Version:** **unverified** (no stable release number confirmed from a primary
  source).
- **Source:** `https://github.com/Chlumsky/msdfgen`,
  `https://github.com/Chlumsky/msdfgen/blob/master/README.md`,
  `https://github.com/Chlumsky/msdfgen/blob/master/LICENSE.txt`,
  `https://github.com/Chlumsky/msdf-atlas-gen`.

**Public interface (exact identifiers)** — all in namespace `msdfgen`, exposed by
`msdfgen.h` (core, dependency-free) and `msdfgen-ext.h` (extensions):

- Core shapes: `Shape`, `Contour`, `EdgeHolder`, `LinearEdge`, `QuadraticEdge`,
  `CubicEdge`, `Bitmap`, `BitmapRef`, `BitmapConstRef`, `Vector2`, `Projection`,
  `Range`, `SDFTransformation`, `Shape::normalize`, `Shape::bounds`,
  `Shape::contours`, `Shape::edges`, `EdgeHolder::color`, `edgeColoringSimple`,
  `edgeColoringInkTrap`, `edgeColoringByDistance`, `simulate8bit`.
- Generation: `generateSDF`, `generatePSDF`, `generateMSDF`, `generateMTSDF`,
  `renderSDF`, `renderMSDF`, `distanceTransform?` (**unverified** as a public
  symbol), `signedDistance?` (**unverified**).
- Font and SVG loading (extension module): `FreetypeHandle`, `FontHandle`,
  `initializeFreetype`, `deinitializeFreetype`, `loadFont`, `destroyFont`,
  `loadGlyph`, `loadSvgShape`, `GlyphIndex`, `FONT_SCALING_EM_NORMALIZED`,
  `FONT_SCALING_LEGACY`, `getFontMetrics?` (**unverified**),
  `getGlyphShape?` (**unverified**).
- Output helpers: `savePng`, `saveBmp`, `saveTiff`, `saveTga?`
  (**unverified**), `saveBinary?` (**unverified**), and the `msdfgen` console
  program with modes `sdf`, `psdf`, `msdf`, `mtsdf` and options `-font`, `-svg`,
  `-shapedesc`, `-o`, `-dimensions`, `-range`, `-pxrange`, `-scale`,
  `-translate`, `-autoframe`, `-angle`, `-testrender`, `-exportshape`,
  `-printmetrics`.

The README example is representative:
`initializeFreetype()` → `loadFont(ft, path)` →
`loadGlyph(shape, font, 'A', FONT_SCALING_EM_NORMALIZED)` →
`shape.normalize()` → `edgeColoringSimple(shape, 3.0)` →
`generateMSDF(msdf, shape, t)` → `savePng(msdf, "output.png")`, where
`t` is an `SDFTransformation(Projection(32.0, Vector2(0.125, 0.125)), Range(0.125))`.

**Coverage notes.** It consumes glyph outlines rather than parsing fonts itself:
font loading is delegated to FreeType (the extension module), and SVG shapes can
be loaded directly. `Y` for SDF/MSDF (this is its reason to exist), `Y` for SVG
input, `P` for atlases via the companion `msdf-atlas-gen`. CFF2 handling depends
on FreeType and is **unverified**. It does no shaping, no hinting, no colour
glyph rendering and no font discovery.

**Out of scope and architectural stance.** The core module has no dependencies and
uses bare C++; the extension module pulls in FreeType, TinyXML2, libpng and
optionally Skia. It is a pure computation over a `Shape`: no I/O in the core, no
rasterisation of outlines to a conventional coverage mask (it computes distance
fields instead), and no font file writing. The caller owns the `Bitmap`.

**Differential-test oracle suitability.** Moderate, and specialised. Runs offline
from a fixture font through `loadFont` with a C++ toolchain and a FreeType build.
Comparable outputs: the distance field values in `Bitmap` (float), the shape
description exported by `-exportshape` (edge-coloured contours as text), and
`-printmetrics` layout data. Tolerance issues: distance fields are floating-point
and sensitive to `Range`, `Projection`, edge-colouring heuristics and corner
angle; the exported shape description is the most stable thing to compare.

**Worth stealing.** Treating corner detection and edge colouring as an explicit,
separable preprocessing step (`edgeColoringSimple(shape, angle)`) before field
generation: a clean illustration of keeping geometric analysis separate from
rasterisation.

---

## 2. C++ libraries

### 2.1 Skia

- **Positioning:** Google's 2D graphics engine; its font layer provides typeface
  loading, glyph measurement, hinting, LCD rendering, text blobs, system font
  management and fallback.
- **Licence:** BSD 3-Clause (Copyright (c) 2011 Google Inc.).
- **Version:** **unverified** (Skia is developed as a rolling source tree without
  a stable release tag).
- **Source:** `https://api.skia.org/classSkTypeface.html`,
  `https://api.skia.org/classSkFont.html`,
  `https://api.skia.org/classSkFontMgr.html`,
  `https://api.skia.org/classSkTextBlobBuilder.html`,
  `https://skia.org/`, `https://github.com/google/skia/blob/main/LICENSE`.

**Public interface (exact identifiers)**

- `SkTypeface`: public methods `fontStyle`, `isBold`, `isItalic`,
  `isFixedPitch`, `getVariationDesignPosition`, `getVariationDesignParameters`,
  `uniqueID`, `makeClone`, `serialize`, `unicharsToGlyphs`, `textToGlyphs`,
  `unicharToGlyph`, `countGlyphs`, `countTables`, `getTableTags`,
  `getTableSize`, `getTableData`, `copyTableData`, `getUnitsPerEm`,
  `getKerningPairAdjustments`, `createFamilyNameIterator`, `getFamilyName`,
  `getPostScriptName`, `openStream`, `openExistingStream`, `createScalerContext`,
  `getBounds`, `filterRec`, `getFontDescriptor`; static members `Equal`,
  `MakeDefault`, `MakeEmpty`, `MakeFromName`, `MakeFromFile`, `MakeFromStream`,
  `MakeFromData`, `MakeDeserialize`, `Register`; public types
  `SerializeBehavior`, `FactoryId`. Note: there is **no** `getStyle`,
  `getFontStyle`, `charsToGlyphs`, `getGlyphCount` or `getUPEM` — the real names
  are `fontStyle`, `unicharsToGlyphs`/`textToGlyphs`/`unicharToGlyph`,
  `countGlyphs` and `getUnitsPerEm`. `SkFontID` is not the identifier here;
  the type is `SkTypefaceID`. `SkGlyphID` is used throughout as the glyph index
  type. Related types: `SkFontStyle`, `SkFontArguments`, `SkFontStyleSet`,
  `SkTypeface::SerializeBehavior`, `SkData`, `SkStreamAsset`.
- `SkFont`: `getTypeface`, `setTypeface`, `setSize`, `getSize`, `setScaleX`,
  `getScaleX`, `setSkewX`, `getSkewX`, `setEmbolden`, `isEmbolden`, `setEdging`,
  `getEdging`, `setHinting`, `getHinting`, `setLinearMetrics`, `isLinearMetrics`,
  `setSubpixel`, `isSubpixel`, `setBaselineSnap`, `isBaselineSnap`,
  `getMetrics`, `getSpacing`, `textToGlyphs`, `countText`, `getWidths`,
  `getWidthsBounds`, `getPos`, `getXPos`, `getIntercepts`, `getBounds`,
  `getPaths`, `getPath`, `unicharToGlyph`, `unicharsToGlyphs`, `makeWithSize`
  (lower-case `m`), `getSlant?` (**unverified**). Types: `SkFont::Edging`
  (`kAlias`, `kAntiAlias`, `kSubpixelAntiAlias`), `SkFontHinting`,
  `SkFontMetrics`, `SkGlyphID`, `SkFontArguments`, `SkPath`, `SkRect`.
  Note: `setVariationDesignPosition`, `getMetricsAndPath` and
  `MakeWithSize` are **not** exact public names; the lower-case `makeWithSize`
  is.
- `SkFontMgr`: `countFamilies`, `getFamilyName`, `createStyleSet`,
  `matchFamily`, `matchFamilyStyle`, `matchFamilyStyleCharacter`,
  `makeFromData`, `makeFromFile`, `makeFromStream`, `legacyMakeTypeface`,
  `ref`, `unref`, `unique`; statics `RefDefault`, `RefEmpty`; protected virtuals
  `onCountFamilies`, `onGetFamilyName`, `onCreateStyleSet`, `onMatchFamily`,
  `onMatchFamilyStyle`, `onMatchFamilyStyleCharacter`, `onMakeFromData`,
  `onMakeFromStreamIndex`, `onMakeFromStreamArgs`, `onMakeFromFile`,
  `onLegacyMakeTypeface`. Types: `SkFontStyleSet`, `SkFontStyle`,
  `SkFontArguments`, `SkString`. `matchFamilyStyleCharacter` is the explicit
  system font-fallback entry point.
- Text blobs: `SkTextBlob`, `SkTextBlobBuilder`, `SkTextBlobBuilder::RunBuffer`,
  `SkTextBlobBuilder::make`, `allocRun`, `allocRunPos`, `allocRunPosH`,
  `allocRunRSXform`, `allocRunText`, `allocRunTextPosH`, `allocRunTextPos`,
  `allocRunTextRSXform`; `SkTextBlob::MakeFromText`, `MakeFromString`,
  `MakeFromPosText`, `MakeFromPosTextH`, `MakeFromRSXform`, `Bounds`, `uniqueID`,
  `getIntercepts`, `serialize`, `MakeFromBuffer`, `SkTextBlob::Iter`.
  `RunBuffer` fields: `glyphs`, `pos`, `utf8text`, `clusters`.
  Types: `SkTextEncoding`, `SkRSXform`, `SkPoint`, `SkScalar`, `SkGlyphID`.
- `SkPaint` (text-relevant): `setTextEncoding`, `getTextEncoding`,
  `setTypeface`, `getTypeface`, `getFontMetrics`, `measureText`,
  `getTextWidths`, `setStyle`, `setColor`, `setShader`, `setBlendMode`,
  `setAntiAlias`, `setLCDRenderText`. `SkPath` (outline sink): `moveTo`,
  `lineTo`, `quadTo`, `conicTo`, `cubicTo`, `close`, `addPath`, `getBounds`,
  `SkPath::Iter`, `SkPath::Verb`. Higher-level shaping lives in `SkShaper`,
  `SkParagraph` (the `modules/skshaper` and `modules/skparagraph` modules, built
  on HarfBuzz and ICU).

**Coverage notes.** `Y` for TTF, OTF, TTC (via the `ttcIndex` parameter of
`makeFromFile`/`makeFromData`), variable fonts, hinting, kerning, LCD/subpixel
(`SkFont::Edging`, `setSubpixel`, `setLCDRenderText`), glyph atlases (the internal
strike cache), discovery (`SkFontMgr`) and fallback
(`matchFamilyStyleCharacter`). `P` for CFF2, bitmap strikes, COLR/CPAL, sbix and
shaping (shaping is a module, not core); **unverified** for the exact extent of
COLRv1 and CFF2 support. `O` for SDF, subsetting and writing.

**Out of scope and architectural stance.** Skia is a full 2D renderer, not a
standalone font library: parsing is delegated to platform backends (FreeType,
DirectWrite, CoreText), and shaping to HarfBuzz/ICU modules. Typefaces are
immutable, reference-counted (`sk_sp`) and thread-safe; `SkFont` is a cheap
value-type configuration over a typeface. It does I/O (`makeFromFile`) but also
accepts `SkData` and `SkStreamAsset`. It does not write font binaries.

**Differential-test oracle suitability.** Moderate. Runs offline from a fixture
via `SkFontMgr::makeFromData` with a C++ toolchain and a Skia build (a large
dependency). Comparable outputs: glyph ids (`SkTypeface::unicharToGlyph`,
`SkFont::textToGlyphs`), advances (`SkFont::getWidths`), bounds
(`SkFont::getBounds`, `SkFont::getWidthsBounds`), path verbs
(`SkFont::getPath` into an `SkPath`), and metrics (`SkFont::getMetrics`).
Tolerance issues: hinting engine, edging mode, subpixel positioning and platform
backend differences all shift results; pin `SkFontHinting`, `SkFont::Edging` and
the backend. Coverage bitmaps require a full `SkSurface`/`SkCanvas` draw.

**Worth stealing.** Splitting the immutable resource (`SkTypeface`) from the cheap
mutable configuration (`SkFont`): size, scale, skew, edging, hinting and subpixel
settings live in a small copyable value, so one parsed font can serve hundreds of
styles without re-parsing.

### 2.2 ICU layout engine / Paragraph

- **Positioning:** historically ICU's complex-text layout engine; today ICU
  provides bidi, script and Arabic-shaping primitives while paragraph layout is
  built on HarfBuzz.
- **Licence:** the Unicode/ICU licence (similar to the earlier ICU 1.8.1-57
  licence); licence changed with ICU 58 when the project joined the Unicode
  Consortium.
- **Version:** **unverified** for the current ICU release; the relevant milestone
  (ICU 58, LayoutEngine removed) is verified.
- **Source:** `https://unicode-org.github.io/icu/userguide/layoutengine/`,
  `https://unicode-org.github.io/icu/userguide/layoutengine/paragraph.html`.

**Public interface (exact identifiers)**

- Removed Line LayoutEngine (ICU 54 deprecated, ICU 58 removed):
  `LayoutEngine`, `LayoutEngineFactory`, `layoutEngineFactory`,
  `LEFontInstance`, `LEUnicode`, `LEErrorCode`, `LE_NO_ERROR`,
  `layoutChars`, `getGlyphs`, `getGlyphPositions`, `getCharIndices`,
  `ScriptRun`, `PortableFontInstance`, `ParagraphLayout` (layoutex),
  `icu-le-hb`. These are historical; the official user guide states plainly:
  "The ICU Line LayoutEngine has been removed in ICU 58 ... Users of ICU Layout
  are strongly encouraged to consider the HarfBuzz project as a replacement."
- Still present and relevant: `UBiDi`, `ubidi_open`, `ubidi_close`,
  `ubidi_setPara`, `ubidi_getVisualRun`, `ubidi_getLogicalRun`,
  `ubidi_getLevelAt`, `ubidi_countRuns`, `UBiDiLevel`, `UBIDI_LTR`,
  `UBIDI_RTL`, `UBiDiTransform`, `ubidi_getReordering`; `u_shapeArabic`,
  `U_SHAPE_*` flags, `UScriptCode`, `uscript_getScript`, `uscript_getScriptCode`,
  `uloc_getScript?` (**unverified**), `UBreakIterator`, `utext_openUTF8`.
- Paragraph layout (layoutex, built against HarfBuzz): `ParagraphLayout`,
  `ParagraphLayout::Line`, `ParagraphLayout::VisualRun`, `FontRuns`,
  `ValueRuns`, `LocaleRuns`, `RunArray`, `LEFontInstance`.

**Coverage notes.** ICU is not a font parser or rasteriser, so Tables A and B are
almost entirely `O`. Its contribution is `P` for shaping (historically via the
LayoutEngine, now via HarfBuzz in `ParagraphLayout`) and `P` for vertical/bidi
handling (`UBiDi`). No glyph outlines, metrics parsing, colour glyphs, SDF,
atlases, discovery or fallback of its own.

**Out of scope and architectural stance.** ICU deliberately does not read font
files: the old LayoutEngine required a user-supplied `LEFontInstance` subclass to
abstract a platform font. It owns Unicode properties, bidi ordering, script runs
and line breaking, not pixels. The modern stance is explicit delegation to
HarfBuzz for shaping and to the client for rendering.

**Differential-test oracle suitability.** Weak for glyphs, useful for text-run
boundaries. It cannot load a font file on its own. With a C++ toolchain it can
produce deterministic bidi levels (`UBiDi`), script runs and Arabic presentation
forms (`u_shapeArabic`), which are useful as inputs to a shaping oracle rather
than as glyph outputs. Tolerance issues: Unicode version drift changes
`UBiDi` and script data between ICU releases.

**Worth stealing.** Keeping Unicode text segmentation (bidi, script runs, line
breaks) completely outside the font layer: the font library receives already
segmented, single-script, single-direction runs, which dramatically simplifies
its contract.

### 2.3 HarfBuzz C++ wrappers

- **Positioning:** a thin RAII/ownership layer over the HarfBuzz C API, shipped in
  the same repository; it adds no font functionality.
- **Licence:** MIT (same as HarfBuzz).
- **Version:** tied to HarfBuzz (15.0.0 reported; exact tag **unverified**).
- **Source:** `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-cplusplus.hh`.

**Public interface (exact identifiers)**

- Macro gate: `HB_CPLUSPLUS_HH`.
- Namespace `hb`: `hb::shared_ptr<T>`, `hb::unique_ptr<T>`, `hb::vtable<T>`,
  `hb::vtable_t`, `hb::is_shared_ptr`, `hb::is_unique_ptr`, `HB_DEFINE_VTABLE`.
- `shared_ptr<T>` members: `element_type`, `get`, `swap`, `get_empty`,
  `reference`, `destroy`, `set_user_data`, `get_user_data`, `operator T*`,
  `operator bool`, `operator==`, `operator!=`, `operator*`, `operator->`.
- `unique_ptr<T>` members: `element_type`, `get`, `release`, `swap`,
  `operator T*`, `operator bool`, `operator*`, `operator->`; copy deleted,
  move enabled.
- `HB_DEFINE_VTABLE` specialisations registered for: `buffer`, `blob`, `face`,
  `font`, `font_funcs`, `map`, `set`, `shape_plan`, `unicode_funcs`,
  `draw_funcs`, `paint_funcs`, and (conditionally) `subset_input`,
  `subset_plan`, `raster_image`, `raster_draw`, `raster_paint`, `vector_draw`,
  `vector_paint`, `gpu_draw`. A `std::hash` specialisation is provided for both
  pointer wrappers.

**Coverage notes.** Identical to HarfBuzz in Tables A and B — the wrappers are
ownership sugar. `hb_face_t`, `hb_font_t`, `hb_buffer_t`, `hb_blob_t`,
`hb_shape`, `hb_subset_or_fail` and all `hb_ot_*` functions remain the real API.

**Out of scope and architectural stance.** No parsing, no I/O, no allocation
policy of its own; it wraps the C reference-counting (`*_reference` /
`*_destroy`) in C++11 smart pointers. Header-only, no ABI of its own.

**Differential-test oracle suitability.** Same as HarfBuzz, with a slightly nicer
harness. Needs a C++11 toolchain; no additional runtime dependency.

**Worth stealing.** A header-only RAII shim over a C core: the core stays
language-agnostic and stable, while host languages get ownership safety without
duplicating any logic.

### 2.4 DirectWrite

- **Positioning:** Microsoft's Windows text stack: font enumeration, font-face
  metrics and outlines, text analysis, shaping, layout and ClearType rendering.
- **Licence:** proprietary Windows API (COM); not redistributable as source.
- **Version:** tied to the Windows SDK / OS version; **unverified** as a discrete
  library release.
- **Source:** `https://learn.microsoft.com/en-us/windows/win32/api/dwrite/nn-dwrite-idwritefontface`,
  `https://learn.microsoft.com/en-us/Windows/Win32/directwrite/appendix--win32-migration`.

**Public interface (exact identifiers)**

- `IDWriteFontFace` (verified method list): `GetDesignGlyphMetrics`, `GetFiles`,
  `GetGdiCompatibleGlyphMetrics`, `GetGdiCompatibleMetrics`, `GetGlyphCount`,
  `GetGlyphIndices`, `GetGlyphRunOutline`, `GetIndex`, `GetMetrics`,
  `GetRecommendedRenderingMode`, `GetSimulations`, `GetType`, `IsSymbolFont`,
  `ReleaseFontTable`, `TryGetFontTable`. Newer versions add `IDWriteFontFace1` …
  `IDWriteFontFace5` with `GetUnicodeRanges`, `GetMetrics`,
  `GetGlyphImageData`, `GetFontAxisValues` (**unverified** for exact version
  placement). `DWRITE_GLYPH_METRICS`, `DWRITE_FONT_METRICS`,
  `DWRITE_FONT_FACE_TYPE`, `DWRITE_GLYPH_RUN`, `DWRITE_GLYPH_IMAGE_FORMATS`
  (`DWRITE_GLYPH_IMAGE_FORMATS_PNG`, `..._SVG`, `..._COLR`, `..._SBIX`
  — exact constant set **unverified**), `IDWriteFontFace::GetGlyphRunOutline`
  calls back through `IDWriteGeometrySink` / `IDWriteOutlineSink`.
- Factory and collection: `IDWriteFactory`, `DWriteCreateFactory`,
  `GetSystemFontCollection`, `CreateCustomFontCollection`,
  `CreateCustomFontFileReference`, `CreateTextFormat`, `CreateTextLayout`,
  `CreateFontFace`, `IDWriteFontCollection`, `IDWriteFontCollection::FindFamilyName`,
  `GetFontFamily`, `IDWriteFontFamily`, `IDWriteFont`, `IDWriteFont::HasCharacter`.
- Text analysis and layout: `IDWriteTextAnalyzer`, `IDWriteTextAnalyzer::AnalyzeScript`,
  `AnalyzeBidi`, `AnalyzeNumberSubstitution`, `AnalyzeLineBreakpoints`,
  `GetGlyphs`, `GetGlyphPlacements`, `GetGlyphs`, `IDWriteTextLayout`,
  `IDWriteTextLayout::Draw`, `GetMetrics`, `SetFontSize`, `SetFontFamilyName`,
  `IDWriteTextFormat`, `IDWriteTextFormat::GetTextAlignment`,
  `IDWriteTextRenderer`, `IDWriteRenderBitmapRenderTarget::DrawGlyphRun`.
- Fallback: `IDWriteFontFallback`, `IDWriteFontFallbackBuilder`, `MapCharacters`,
  `IDWriteFontFallback::MapCharacters`. Rendering parameters:
  `IDWriteRenderingParams`, `DWRITE_RENDERING_MODE`, `DWRITE_PIXEL_GEOMETRY`,
  `DWRITE_TEXT_ANTIALIAS_MODE`, `DWRITE_GRID_FIT_MODE`, `IDWriteFactory::CreateRenderingParams`,
  `IDWriteFactory::CreateCustomRenderingParams`, `IDWriteFactory::CreateGlyphRunAnalysis`,
  `IDWriteGlyphRunAnalysis`.
- Variable fonts: `IDWriteFontFace5::GetFontAxisValueCount`,
  `GetFontAxisValues`, `GetFontAxisRanges`, `DWRITE_FONT_AXIS_VALUE`,
  `DWRITE_FONT_AXIS_RANGE`, `DWRITE_FONT_AXIS_ATTRIBUTES`,
  `IDWriteTextFormat3`, `IDWriteFactory::CreateFontFaceReference`
  (**unverified** for exact interface names).

The verified Win32 migration page maps GDI calls onto DirectWrite equivalents,
e.g. `GetGlyphIndices` → `IDWriteFontFace::GetGlyphIndices`,
`GetGlyphOutline` → `IDWriteFontFace::GetGlyphRunOutline`,
`GetFontData` → `IDWriteFontFace::TryGetFontTable`, `GetKerningPairs` →
"DirectWrite does kerning itself", `GetCharABCWidths` →
`IDWriteFontFace::GetDesignGlyphMetrics`, `EnumFontFamiliesEx` →
`IDWriteFactory::GetSystemFontCollection` / `IDWriteFontCollection`, and
`DrawText` → `IDWriteTextLayout::Draw`.

**Coverage notes.** Broad: TTF, OTF/CFF, TTC, variable fonts, hinting, GPOS
kerning, full shaping, vertical writing, ClearType/LCD rendering, COLR colour
fonts, SVG glyph images, discovery and fallback. `P` for WOFF/WOFF2, bitmap
strikes, CFF2 and atlases; sbix support is **unverified**. `O` for SDF,
subsetting and writing.

**Out of scope and architectural stance.** Windows-only COM interfaces, opaque
objects, and a system-managed font collection; the client cannot see the
underlying bytes except through `TryGetFontTable`. DirectWrite performs shaping
internally and deliberately does not expose raw kerning pairs ("DirectWrite does
kerning itself"). It does I/O against the system font store. `O` for pure
computation: it is a platform service, not a portable library.

**Differential-test oracle suitability.** Poor for portable offline testing. It
needs Windows, a C++/COM toolchain and the fixture font registered with a font
collection (or a custom `IDWriteFontFileLoader`). Comparable outputs: glyph ids
(`GetGlyphIndices`), design metrics (`GetDesignGlyphMetrics`), face metrics
(`GetMetrics`), outline path commands (`GetGlyphRunOutline` into an
`IDWriteGeometrySink`), and shaped runs (`IDWriteTextAnalyzer::GetGlyphs`).
Tolerance issues: ClearType rendering, system rendering parameters and OS
version all affect output; reproducible comparisons require fixed
`IDWriteRenderingParams` and a fixed OS build.

**Worth stealing.** `TryGetFontTable(tag)` as the single escape hatch: the
platform owns parsing, but the client can still pull any raw OpenType table by
tag when it needs data the API does not model.

---

## 3. Rust libraries

### 3.1 ttf-parser — 0.25.1

- **Positioning:** a high-level, safe, zero-allocation font parser for TrueType,
  OpenType and AAT fonts; a pull parser with both a friendly `Face` API and
  low-level table access.
- **Licence:** MIT OR Apache-2.0.
- **Source:** `https://docs.rs/ttf-parser/latest/ttf_parser/`,
  `https://docs.rs/ttf-parser/latest/ttf_parser/struct.Face.html`,
  `https://github.com/harfbuzz/ttf-parser`, `https://crates.io/api/v1/crates/ttf-parser`.

**Public interface (exact identifiers)**

- Core: `Face`, `Face::parse`, `Face::from_slice` (deprecated),
  `Face::from_raw_tables`, `FaceTables`, `RawFace`, `RawFaceTables`,
  `RawFace::table`, `fonts_in_collection`, `FaceParsingError`, `Face<'a>`,
  `GlyphId`, `Tag`, `Fixed`, `Rect`, `RectF`, `PointF`, `Transform`,
  `RgbaColor`, `NormalizedCoordinate`, `Variation`, `VariationAxis`,
  `PhantomPoints`, `TableRecord`, `UnicodeRanges`, `LineMetrics`,
  `ScriptMetrics`, `LazyArray16`, `LazyArray32`, `LazyArrayIter16`,
  `LazyArrayIter32`, `RasterGlyphImage`, `RasterImageFormat`,
  `FaceParsingError`, `Permissions`, `Style`, `Weight`, `Width`, `PlatformId`,
  `Language`, `CFFError`, `FromData`, `OutlineBuilder`.
- `Face` methods (verified): `parse(data, index)`, `tables`, `raw_face`,
  `table_data` (deprecated), `is_italic`, `is_bold`, `is_oblique`, `style`,
  `is_monospaced`, `is_variable`, `weight`, `width`, `italic_angle`,
  `ascender`, `descender`, `height`, `line_gap`, `typographic_line_gap`,
  `vertical_ascender`, `vertical_descender`, `vertical_line_gap`,
  `units_per_em`, `underline_metrics`, `strikeout_metrics`,
  `subscript_metrics`, `superscript_metrics`, `permissions`,
  `is_subsetting_allowed`, `glyph_index`, `glyph_index_by_name`,
  `glyph_variation_index`, `glyph_hor_advance`, `glyph_ver_advance`,
  `glyph_hor_side_bearing`, `glyph_ver_side_bearing`, `glyph_name`,
  `outline_glyph`, `glyph_bounding_box`, `global_bounding_box`,
  `glyph_raster_image`, `glyph_svg_image`, `variation_axes`, `set_variation`,
  `variation_coordinates`. Note: **`FaceParsingContext` does not exist** in this
  crate; the related verified names are `FaceParsingError`, `RawFace`,
  `RawFaceTables` and `FaceTables`. The name `FaceParsingContext` is
  **unverified** and should not be used as a ttf-parser identifier.
- `OutlineBuilder` trait methods: `move_to`, `line_to`, `quad_to`, `curve_to`,
  `close`.
- Table modules (verified from the crate index): `ankr`, `apple_layout`, `avar`,
  `cbdt`, `cblc`, `cff`, `cff2`, `cmap`, `colr`, `cpal`, `feat`, `fvar`, `gdef`,
  `glyf`, `gpos`, `gsub`, `gvar`, `head`, `hhea`, `hmtx`, `hvar`, `kern`, `kerx`,
  `loca`, `math`, `maxp`, `morx`, `mvar`, `name`, `name_id`, `opentype_layout`,
  `os2`, `post`, `sbix`, `stat`, `svg`, `trak`, `vhea`, `vorg`, `vvar`.

**Coverage notes.** Exceptionally broad table coverage including CFF2, sbix,
CBDT/CBLC, COLR/CPAL, SVG, and the full variable-font table family
(`fvar`, `gvar`, `avar`, `hvar`, `vvar`, `mvar`, `stat`). Outline extraction
supports `gvar`, `glyf`, CFF and CFF2 in that order; `glyph_raster_image`
supports `sbix`, `bloc`+`bdat`, `EBLC`+`EBDT` and `CBLC`+`CBDT`; `set_variation`
is one of only two mutable methods. `P` for COLR (the `colr` module parses layer
data; full COLRv1 paint evaluation is **unverified**). `O` for shaping, hinting,
rasterisation, SDF, LCD, atlases, discovery, subsetting and writing — it is a
parser, not a renderer.

**Out of scope and architectural stance.** Zero heap allocations, zero `unsafe`,
zero dependencies, `no_std`/WASM compatible, no I/O, stateless (all parsing
methods immutable), and it must not panic on malformed input. `Face<'a>` borrows
the font bytes and does not own them ("Note that `Face` doesn't own the font data
and doesn't allocate anything in heap. Therefore you cannot 'store' it").
Recursive methods have depth limits and most arithmetic is checked. It is a pull
parser: `OutlineBuilder` emits segments even for partially malformed outlines, so
callers must check `outline_glyph`'s `Option<Rect>` result.

**Differential-test oracle suitability.** Excellent — arguably the best pure
parser oracle. Runs fully offline from a fixture `&[u8]` with a single Rust crate
and no dependencies; needs a Rust toolchain (cargo). Comparable outputs: glyph id
(`glyph_index`), advance (`glyph_hor_advance`), bounding box
(`glyph_bounding_box` / `outline_glyph`'s `Rect`), outline commands (record an
`OutlineBuilder`), variation axes (`variation_axes`), and encoded raster/SVG
images (`glyph_raster_image`, `glyph_svg_image`). Tolerance: it emits unhinted,
unhinted font-unit coordinates as integers/floats with no anti-aliasing, so
comparisons are exact — no tolerance needed for outlines, metrics or glyph ids.
It produces no coverage bitmap.

**Worth stealing.** The explicit safety contract stated as library policy (zero
allocations, zero `unsafe`, no panics, no I/O, stateless) — a newcomer can adopt
the same contract as a testable invariant, not just a marketing claim.

### 3.2 skrifa — 0.50.0 (classic API documented at 0.22.0)

- **Positioning:** the fontations mid-level library: ergonomic access to metadata,
  outlines, metrics, colour and bitmap glyphs, sitting above `read-fonts` and
  below a text layout engine.
- **Licence:** MIT OR Apache-2.0.
- **Source:** `https://docs.rs/skrifa/0.22.0/skrifa/`,
  `https://docs.rs/skrifa/latest/skrifa/`,
  `https://docs.rs/skrifa/latest/skrifa/font/index.html`,
  `https://github.com/googlefonts/fontations`, `https://crates.io/api/v1/crates/skrifa`.

**Public interface (exact identifiers)**

- Classic 0.22.0 top-level: modules `attribute`, `charmap`, `color`, `font`,
  `instance`, `metrics`, `outline`, `patchmap`, `prelude`, `setting`, `string`;
  structs `Axis`, `AxisCollection`, `FontRef`, `GlyphId`, `GlyphId16`,
  `NamedInstance`, `NamedInstanceCollection`, `OutlineGlyph`,
  `OutlineGlyphCollection`, `Tag`; trait `MetadataProvider`; re-export
  `pub extern crate read_fonts as raw`. The brief's named types map as
  `charmap::Charmap`, `outline::OutlinePen`, `instance::LocationRef`,
  `instance::Size`, `outline::DrawSettings`, `color::ColorGlyph`,
  `color::ColorPens`, `bitmap::BitmapStrikes` (`bitmap` is under `font` in the
  newer layout) — the module-qualified names are the exact ones.
  `MetadataProvider` supplies `charmaps`, `metrics`, `outline`, `color`,
  `bitmap`, `attributes`, `axes`, `named_instances`, `instance`, `location`,
  `size`, `glyph_metrics` (exact method spellings **unverified** at the level of
  each declaration).
- Current `latest` (0.50.0) top-level, a redesigned API: `Font`, `ScalerFont`,
  `ScalerOutline`, `ScalerSource`, `GlyphSourceOrder`, `GlyphSource`,
  `OutlineSource`, `HintOptions`, `HintEngine`, `RasterTarget`, `RasterPolicy`,
  `DrawMemory`, `DropoutControl`, `DrawnMetrics`, `ScaleError`, `PathSink`,
  `Tag`, `GlyphId`; the `font` module with `Font`, `InstanceBuilder`,
  `TableFunction`, `Tables`, `Variation`, `Blob`, `Error`, `Format`, `Kind`,
  `Source`, `NormalizedCoord`, and submodules `attribute`, `charmap`, `glyph`,
  `metrics`, `name`, `variation`. Representative usage:
  `Font::new(data, 0)` → `font.instance_builder().variations([("wght", 700.0)]).build()`
  → `bold.charmap().map_unicode('A')` →
  `ScalerFont::hinted(bold, 16.0, HintOptions::interpreter().with_target(RasterTarget::Lcd))`
  → `scaler.outline(glyph_id)` → `outline.draw(DrawMemory::Scratch, &mut path)`.
  `GlyphSourceOrder::DEFAULT` prefers `VARC` composites over `glyf`, `CFF2`,
  `CFF` or Type 1 charstrings.
- Companion crates: `read-fonts` (raw parsing), `write-fonts` (binary writing),
  `harfrust` (shaping), `klippa` (subsetting) — the project explicitly says
  shaping is done by HarfRust and that its `Font` can be shaped with HarfRust and
  drawn with `ScalerFont`.

**Coverage notes.** `Y` for TTF, OTF/CFF, CFF2, TTC, bitmap strikes, COLR/CPAL
(including COLRv1 paint), sbix, variable fonts, hinting (TrueType interpreter,
autohinter, PostScript hints, `RasterTarget::Lcd` subpixel targets) and vertical
metrics. `?` for SVG glyph images. `O` for shaping (delegated), discovery,
fallback, subsetting, writing and coverage rasterisation — skrifa draws outlines,
it does not produce a coverage bitmap.

**Out of scope and architectural stance.** "Mid level" by design: no rasteriser,
no shaping engine, no font database. It is built on `read-fonts` zero-copy views
and is safe Rust with explicit working-memory control (`DrawMemory::Scratch` or a
caller-supplied reusable buffer). The scaler reports which hinting engine ran and
which rasteriser settings the font requested, rather than silently choosing.
Pure computation, no I/O in the scaler.

**Differential-test oracle suitability.** Very strong, and Google's `fauntlet`
already uses skrifa against FreeType. Runs offline from fixture bytes; needs a
Rust toolchain. Comparable outputs: glyph ids (`Charmap::map_unicode`), advance
and bounds (`DrawnMetrics.h_advance`, metrics module), outline commands (record a
`PathSink`/`OutlinePen`), variation coordinates and hinted outlines. Tolerance:
hinting and the TrueType interpreter introduce version-dependent grid fitting, so
compare unhinted outlines at a fixed size, or compare hinted runs at a pinned
engine; outlines are otherwise exact. No coverage bitmap is emitted.

**Worth stealing.** Letting the scaler *report* its decisions (which outline
source was used, which hinting engine ran, which `RasterPolicy` the font requested)
instead of hiding them: invaluable for diagnosing differential-test mismatches.

### 3.3 read-fonts — 0.47.0

- **Positioning:** the low-level, DSL-derived, memory-safe, zero-allocation
  OpenType table reader at the base of fontations.
- **Licence:** MIT OR Apache-2.0.
- **Source:** `https://docs.rs/read-fonts/latest/read_fonts/`,
  `https://github.com/googlefonts/fontations`, `https://crates.io/api/v1/crates/read-fonts`.

**Public interface (exact identifiers)**

- Root: `FontRef`, `FontRef::new`, `FontRef::from_index` (referenced in docs),
  `FontData`, `FileRef`, `CollectionRef`, `TTCHeader`, `TableDirectory`,
  `TableRecord`, `ReadError`; traits `FontRead`, `FontReadAt`, `ReadArgs`,
  `ComputeSize`, `VarSize`, `TableProvider`, `TopLevelTable`, `MinByteRange`,
  `Offset`, `ResolveOffset`, `ResolveNullableOffset`; re-export
  `pub extern crate font_types as types`.
- Modules: `array`, `collections` (`IntSet`), `limits`, `mem`, `model`, `ps`,
  `tables`. `tables` contains a submodule per OpenType table, largely
  produced from a DSL, with items for each table, record, flagset and enum.
  Representative verified entries: `tables::cmap::Cmap::map_codepoint`,
  `tables::name::NameString`, `tables::head`, `tables::maxp`, `tables::hhea`,
  `tables::hmtx`, `tables::glyf`, `tables::loca`, `tables::fvar`, `tables::gvar`,
  `tables::colr`, `tables::cpal`, `tables::sbix`, `tables::cff`, `tables::cff2`,
  `tables::gpos`, `tables::gsub`, `tables::layout`, `tables::stat`, `tables::svg`,
  `tables::varc`, `tables::ift`, `tables::bitmap` (exact module list beyond
  those named in the docs **unverified**).
- `TableProvider` methods such as `head()`, `maxp()`, `cmap()`, `glyf()` return
  typed views; the documented example is
  `FontRef::new(&font_bytes)` → `font.head()` → `font.maxp()` →
  `head.font_revision()` → `maxp.num_glyphs()`.
- `FromObjRef` / `ToOwnedObj` conversions live in `write-fonts::from_obj`.

**Coverage notes.** Table-level `Y` for essentially every OpenType table including
CFF2, colour, bitmap, SVG, variation and incremental-font-transfer tables.
`P` for kerning/GPOS (parsed, not applied). `O` for shaping, hinting,
rasterisation, SDF, LCD, atlases, discovery, fallback, subsetting and writing —
the last is `write-fonts`' job.

**Out of scope and architectural stance.** "Unopinionated": it provides raw,
typed, zero-copy views into the underlying bytes as described by the OpenType
specification, plus reference implementations of algorithms needed to make data
useful (cmap mapping, name decoding). No I/O, no allocation, no unsafe parsing of
trust boundaries. Deriving the reader from a table DSL keeps it exhaustive and
consistent. `CollectionRef` handles TTC/OTC files.

**Differential-test oracle suitability.** Excellent for structural comparison.
Runs offline from fixture bytes with a Rust toolchain. Comparable outputs: table
directory/tags, individual table field values, cmap mappings, name strings,
glyph counts and units-per-em. Tolerance: none — it is exact typed parsing, so
it is ideal for verifying that a newcomer parsed the same bytes the same way.
It emits no outlines, metrics in scaled form, or bitmaps directly.

**Worth stealing.** Deriving both the parser and its types from a single table
definition DSL: exhaustive table coverage becomes a data problem rather than an
ever-growing hand-written switch statement.

### 3.4 write-fonts — 0.56.0

- **Positioning:** the fontations compiler: owned, mutable representations of
  OpenType tables plus serialisation into a font binary.
- **Licence:** MIT OR Apache-2.0.
- **Source:** `https://docs.rs/write-fonts/latest/write_fonts/`,
  `https://github.com/googlefonts/fontations`, `https://crates.io/api/v1/crates/write-fonts`.

**Public interface (exact identifiers)**

- Root: `FontBuilder`, `FontBuilder::new`, `FontBuilder::add_table`,
  `FontBuilder::copy_missing_tables`, `FontBuilder::build`, `TableWriter`,
  `OffsetMarker`, `NullableOffsetMarker`, `dump_table`; traits `FontWrite`,
  `OtRound`; re-exports `pub extern crate read_fonts as read` and
  `pub extern crate font_types as types`; `BuilderError`.
- Modules: `error`, `from_obj` (`FromTableRef`, `ToOwnedTable`, `ToOwnedObj`),
  `ps`, `tables`, `validate`. The `tables` module mirrors `read-fonts` but with
  owned structs (e.g. `tables::head::Head`, `tables::hhea::Hhea`,
  `tables::gpos::ValueRecord`), because "read" types borrow and "write" types
  own their data. A `pen` module with `Pen` / `BezPathPen` for converting outlines
  to `kurbo::BezPath` exists in the fontations ecosystem; its exact crate path is
  **unverified**.
- Documented example: read with `FontRef::new`, convert with `.to_owned_table()`,
  mutate `head.modified`, then
  `FontBuilder::new().add_table(&head).copy_missing_tables(font).build()`.
  Table packing at serialisation time follows the HarfBuzz `hb-repacker`
  algorithm.

**Coverage notes.** `Y` for writing font binaries; `P` for most table-specific
capabilities (it can represent them, but subsetting/fixing them up is the job of
the separate `klippa` crate). `O` for parsing-first concerns, hinting, shaping,
rasterisation, discovery, fallback, atlases.

**Out of scope and architectural stance.** It is a compiler, not a parser or
renderer. It deliberately separates read types (borrowed views) from write types
(owned structs), bridged by `ToOwnedTable` / `ToOwnedObj`. Table packing,
offset overflow handling and a validation pass are first-class. Pure computation
with `Vec<u8>` output; no I/O.

**Differential-test oracle suitability.** Useful as a round-trip oracle rather
than a glyph oracle. With a Rust toolchain it can parse, modify minimally and
re-emit a font, so a newcomer can verify byte-level table round trips, offset
packing and checksum behaviour. Comparable outputs: the emitted `Vec<u8>`, table
directory, checksums and lengths. Tolerance: none for structural comparison, but
byte-identical output requires matching table ordering and packing choices.

**Worth stealing.** The strict separation between borrowed read types and owned
write types with an explicit conversion trait: it prevents accidental mutation of
mapped font data and makes "read then write" a deliberate, visible step.

### 3.5 fontdue — 0.9.5

- **Positioning:** a `no_std` font parser, rasteriser and simple layout tool;
  deliberately small and dependency-light.
- **Licence:** MIT OR Apache-2.0 OR Zlib.
- **Source:** `https://docs.rs/fontdue/latest/fontdue/`,
  `https://docs.rs/fontdue/latest/fontdue/struct.Font.html`,
  `https://github.com/mooman219/fontdue`, `https://crates.io/api/v1/crates/fontdue`.

**Public interface (exact identifiers)**

- Root: `Font`, `FontSettings`, `Metrics`, `LineMetrics`, `OutlineBounds`,
  `FontResult` (alias for `Result<T, &'static str>`), module `layout`.
- `Font` methods (verified): `from_bytes`, `name`, `chars`,
  `horizontal_line_metrics`, `vertical_line_metrics`, `units_per_em`,
  `horizontal_kern`, `horizontal_kern_indexed`, `metrics`, `metrics_indexed`,
  `rasterize_config`, `rasterize`, `rasterize_config_subpixel`,
  `rasterize_subpixel`, `rasterize_indexed`, `rasterize_indexed_subpixel`,
  `lookup_glyph_index`, `glyph_count`. Note: `from_bytes_with_index`,
  `from_bytes_with_collection`, `file`, `kerning`, `has_kerning` and
  `ascent`/`descent`/`line_gap` are **not** exact names on the checked page; the
  real ones are `horizontal_kern` and `horizontal_line_metrics`.
- `layout` module (exact names **unverified** at declaration level): `Layout`,
  `LayoutSettings`, `TextStyle`, `GlyphRasterConfig`, `GlyphPosition`,
  `CoordinateSystem`, `HorizontalAlign`, `VerticalAlign`, `WrapStyle`.
  `GlyphRasterConfig` is used by `rasterize_config`.

`rasterize(character, px)` returns `(Metrics, Vec<u8>)` where the vector is an
8-bit coverage map starting at the top-left corner, 0 = empty and 255 = full.
`rasterize_subpixel` multiplies the width by three to produce swizzled RGB
coverage for LCD-style rendering.

**Coverage notes.** `Y` for TTF and OTF parsing, coverage rasterisation and
subpixel rasterisation; `N` for hinting; `P` for kerning (`kern` table only),
simple layout (no complex shaping), vertical metrics and atlas caching (the
`layout` module plus `GlyphRasterConfig` keys). `O` for CFF2, TTC, WOFF,
colour/bitmap/SVG glyphs, variable fonts, discovery, fallback, subsetting,
writing.

**Out of scope and architectural stance.** "Fontdue is a font parser,
rasterizer, and layout tool" with `no_std` (still needs `alloc`); `Font` is
immutable after creation and owns its own copy of the font data. Shaping is
explicitly out of scope. No I/O, no unsafe at the API boundary, no hinting by
design — which is exactly why its output is deterministic.

**Differential-test oracle suitability.** Excellent for pixel-level comparison.
Runs offline from fixture bytes with a Rust toolchain and no platform deps.
Comparable outputs: glyph id (`lookup_glyph_index`), `Metrics` (advance, bounds,
whitespace), line metrics, and the coverage `Vec<u8>` from `rasterize` /
`rasterize_indexed` / `rasterize_subpixel`. Tolerance: no hinting means no
interpreter drift, but fontdue's own antialiasing will not match FreeType; use a
per-pixel tolerance (or compare coverage histograms and bounding boxes), and pin
`px` exactly. It is the most convenient Rust coverage-bitmap oracle.

**Worth stealing.** Returning `(Metrics, Vec<u8>)` together from one call: the
caller never has to reconcile a separately measured advance with a separately
rendered bitmap, which removes a whole class of off-by-one bugs.

### 3.6 ab_glyph — 0.2.32

- **Positioning:** API for loading, scaling, positioning and rasterising OpenType
  glyphs; the successor to `rusttype`.
- **Licence:** Apache-2.0.
- **Source:** `https://docs.rs/ab_glyph/latest/ab_glyph/`,
  `https://github.com/alexheretic/ab-glyph`, `https://crates.io/api/v1/crates/ab_glyph`.

**Public interface (exact identifiers)**

- Traits: `Font`, `ScaleFont`, `VariableFont`.
- Concrete fonts: `FontVec`, `FontRef`, `FontArc`, `PxScaleFont`,
  `InvalidFont`, `CodepointIdIter`.
- Glyph and geometry: `Glyph`, `GlyphId`, `Outline`, `OutlinedGlyph`,
  `OutlineCurve`, `Point`, `Rect`, `PxScale`, `PxScaleFactor`, `GlyphImage`,
  `GlyphSvg`, `GlyphImageFormat`, `VariationAxis`, `point` (function), module
  `v2` (with `v2::GlyphImage`).
- Representative usage from the crate docs:
  `FontRef::try_from_slice(...)` → `font.glyph_id('q')` →
  `.with_scale_and_position(24.0, point(100.0, 0.0))` →
  `font.outline_glyph(q_glyph)` → `q.draw(|x, y, c| ...)`.
- `Font` trait methods (exact spellings **unverified** at declaration level):
  `glyph_id`, `outline`, `outline_glyph`, `h_metrics`, `h_advance`,
  `h_side_bearing`, `kern`, `units_per_em`, `glyph_count`, `glyph_bounds`,
  `glyph_raster_image`, `pt_to_px_scale`, `codepoint_ids`; `ScaleFont`:
  `scale`, `scaled`, `with_scale`, `into_scaled`.

**Coverage notes.** `Y` for TTF/OTF parsing, variable fonts (`VariableFont`,
`VariationAxis`), outline extraction and coverage rasterisation via
`OutlinedGlyph::draw`. `P` for SVG/bitmap glyph data (`GlyphSvg`,
`GlyphImage` — the latter deprecated in favour of `v2::GlyphImage`), `P` for
kerning. `O` for CFF2, TTC, WOFF, colour glyphs, hinting, LCD, atlases (those
belong to `glyph_brush`), discovery, fallback, subsetting, writing.

**Out of scope and architectural stance.** A focused glyph library: it does not
shape, does not lay out paragraphs, does not manage a texture atlas and does not
load system fonts. `FontRef` borrows, `FontVec` owns, `FontArc` wraps in an
`Arc`; `PxScaleFont` pairs a font with a pixel scale. Pure computation, no I/O
beyond the caller supplying bytes.

**Differential-test oracle suitability.** Good. Runs offline from fixture bytes
with a Rust toolchain. Comparable outputs: glyph ids, `Outline` curve sequences
(`OutlineCurve`), `OutlinedGlyph` drawn coverage values via `draw`, and
`PxScale`-scaled metrics. Tolerance: its rasteriser is its own, so compare
coverage with a tolerance; outlines and glyph ids are exact.

**Worth stealing.** The `Font` trait with three storage strategies (`FontRef`
borrowed, `FontVec` owned, `FontArc` shared) behind one interface: callers choose
ownership without changing any algorithm.

### 3.7 rusttype — 0.9.3

- **Positioning:** a pure-Rust alternative to FreeType for TrueType loading,
  querying, rasterising and GPU glyph caching; now deprecated/unmaintained in
  favour of `ab_glyph`.
- **Licence:** MIT / Apache-2.0.
- **Source:** `https://docs.rs/rusttype/latest/rusttype/`,
  `https://gitlab.redox-os.org/redox-os/rusttype`,
  `https://crates.io/api/v1/crates/rusttype`.

**Public interface (exact identifiers)**

- `Font` (an enum, not a struct — "A single font. This may or may not own the
  font data"), `Glyph`, `GlyphId`, `GlyphIter`, `HMetrics`, `VMetrics`,
  `LayoutIter`, `Point`, `Vector`, `Rect`, `Scale`, `ScaledGlyph`,
  `PositionedGlyph`, `SharedGlyphData`, `IntoGlyphId`, `OutlineBuilder`, `point`,
  `vector`, module `gpu_cache`.
- Documented chaining: `glyph.id()` → `glyph.scaled(Scale::uniform(10.0))` →
  `glyph.h_metrics()` → `glyph.positioned(point(5.0, 3.0))` → `glyph.draw(|x, y, v| {})`.
- `gpu_cache` module: `Cache`, `CacheBuilder`, `CachedGlyph?` (**unverified**),
  `Rectangle?` (**unverified**), queueing glyphs and uploading to a GPU texture.

**Coverage notes.** `Y` for TrueType and TTC parsing, coverage rasterisation,
kerning pairs and a GPU glyph cache. `P` for OTF (explicitly "a subset of `*.otf`
font files"; no cubic Bézier support — so `N` for real CFF outlines). `N` for
hinting, ligatures, RTL and vertical layout, all stated verbatim in the crate
docs under "Notable things that RustType does not support yet". `O` for variable
fonts, colour/bitmap/SVG, SDF, discovery, fallback, subsetting, writing.

**Out of scope and architectural stance.** The crate docs are unusually candid:
no font hinting, no ligatures, no right-to-left or vertical text, no cubic
Bézier curves. Rasterisation uses "an accurate analytical algorithm (not based on
sampling)" with sub-pixel positioning. Pure computation, no I/O.

**Differential-test oracle suitability.** Good but limited. Runs offline with a
Rust toolchain. Comparable outputs: glyph ids, `HMetrics`/`VMetrics`,
`PositionedGlyph::pixel_bounding_box`, and the analytical coverage values from
`draw`. Tolerance: no hinting (good), but a proprietary analytical rasteriser, so
coverage needs a tolerance. Its narrow format coverage makes it a secondary
oracle only.

**Worth stealing.** Publishing an explicit "does not support yet" list in the
crate documentation — an honest, machine-readable scope boundary that prevents
downstream users assuming features that are absent.

### 3.8 glyph_brush — 0.7.12

- **Positioning:** fast cached text rendering built on `ab_glyph`; manages glyph
  positioning caching, draw caching and an efficient GPU texture cache.
- **Licence:** Apache-2.0.
- **Source:** `https://docs.rs/glyph_brush/latest/glyph_brush/`,
  `https://github.com/alexheretic/glyph-brush`,
  `https://crates.io/api/v1/crates/glyph_brush`.

**Public interface (exact identifiers)**

- `GlyphBrush`, `GlyphBrushBuilder`, `GlyphCalculator`,
  `GlyphCalculatorBuilder`, `GlyphCalculatorGuard`, `GlyphVertex`, `Extra`,
  `FontId`, `OwnedSection`, `OwnedText`, `Rectangle`, `Section`, `SectionBuilder`,
  `SectionGeometry`, `SectionGlyph`, `SectionText`, `Text`, `Color`,
  `DefaultSectionHasher`, `SectionGlyphIter`, macro
  `delegate_glyph_brush_builder_fns`; re-export module `ab_glyph`, module
  `legacy`.
- Enums: `BrushAction`, `BrushError`, `BuiltInLineBreaker`, `GlyphChange`,
  `HorizontalAlign`, `VerticalAlign`, `Layout`, `LineBreak`.
- Traits: `GlyphCruncher`, `GlyphPositioner`, `LineBreaker`, `ToSectionText`.
- Documented flow: `GlyphBrushBuilder::using_font(dejavu).build()` →
  `queue(Section::default().add_text(Text::new("Hello glyph_brush")))` →
  `process_queued(|rect, tex_data| ..., |vertex_data| ...)` →
  `Ok(BrushAction::Draw(vertices))` / `Ok(BrushAction::ReDraw)` /
  `Err(BrushError::TextureTooSmall { suggested })`.

**Coverage notes.** `Y` for atlas caching, `P` for layout/line breaking and
kerning (inherited from `ab_glyph`). Parsing is delegated to `ab_glyph`, so all
format columns are `P`/`O`. No shaping, no discovery, no fallback, no writing.

**Out of scope and architectural stance.** A caching and batching layer, not a
font parser. It owns a texture-atlas model and emits vertices rather than pixels;
the caller supplies the texture upload and draw callbacks. `BrushError::TextureTooSmall`
exposes resize decisions explicitly.

**Differential-test oracle suitability.** Weak for glyph correctness, useful for
atlas behaviour. Needs a Rust toolchain and a GPU/texture harness. Comparable
outputs: `SectionGlyph` positions, `BrushAction::Draw` vertex arrays and
`Rectangle` atlas placements. Tolerance: floating-point positioning and
texture-size heuristics need tolerance; not a glyph oracle.

**Worth stealing.** `BrushAction::Draw` / `BrushAction::ReDraw`: an explicit "no
change, redraw last frame" signal that avoids recomputing and re-uploading an
atlas when nothing changed.

### 3.9 rustybuzz — 0.20.1

- **Positioning:** a complete HarfBuzz shaping algorithm port to Rust, built on
  `ttf-parser`.
- **Licence:** MIT.
- **Source:** `https://docs.rs/rustybuzz/latest/rustybuzz/`,
  `https://github.com/harfbuzz/rustybuzz`, `https://crates.io/api/v1/crates/rustybuzz`.

**Public interface (exact identifiers)**

- Re-export: `pub use ttf_parser;`. Module `script`.
- Structs: `Face`, `Feature`, `GlyphBuffer`, `GlyphInfo`, `GlyphPosition`,
  `Language`, `Script`, `SerializeFlags`, `ShapePlan`, `UnicodeBuffer`,
  `Variation`, `BufferFlags`.
- Enums: `BufferClusterLevel`, `Direction`.
- Functions: `shape`, `shape_with_plan`.
- Representative flow (exact method names on the types **unverified** at
  declaration level): `Face::from_slice`, `UnicodeBuffer::new`, `.push_str(...)`,
  `.guess_segment_properties()`, `shape(&face, &features, buffer)` →
  `GlyphBuffer::glyph_infos()`, `GlyphBuffer::glyph_positions()`.

**Coverage notes.** `Y` for TTF/OTF, TTC, GSUB/GPOS, shaping, variable fonts and
vertical directions. `P` for CFF2 (via `ttf-parser` outlines; shaping itself only
needs layout tables). `O` for hinting, rasterisation, colour/bitmap/SVG,
discovery, fallback, subsetting, writing.

**Out of scope and architectural stance.** A pure-Rust port with no unsafe FFI and
no C dependency; it reads fonts through `ttf-parser`. No rasterisation, no
hinting, no paragraph layout. Pure computation, no I/O.

**Differential-test oracle suitability.** Excellent for shaping comparison.
Runs offline from fixture bytes with a Rust toolchain. Comparable outputs:
`GlyphInfo` (glyph id, cluster), `GlyphPosition` (x/y advance and offset) for
shaped buffers. Tolerance: deterministic given pinned Unicode data, features,
direction, script and cluster level; no pixels, so no antialiasing tolerance.

**Worth stealing.** Re-exporting the parser (`pub use ttf_parser;`) so the
shaper's font model is not a second, divergent font implementation.

### 3.10 cosmic-text — 0.19.0

- **Positioning:** pure-Rust multi-line text handling: shaping, font discovery,
  font fallback, layout, rasterisation and editing.
- **Licence:** MIT OR Apache-2.0.
- **Source:** `https://docs.rs/cosmic-text/latest/cosmic_text/`,
  `https://github.com/pop-os/cosmic-text`, `https://crates.io/api/v1/crates/cosmic-text`.

**Public interface (exact identifiers)**

- Re-exports: `pub use skrifa;`, `pub use fontdb;`, `pub use harfrust;`.
- Module `fallback`.
- Core structs: `FontSystem`, `Font`, `Buffer`, `BufferLine`, `BorrowedWithFontSystem`,
  `SwashCache`, `SwashImage`, `SwashContent`, `CacheKey`, `CacheKeyFlags`,
  `CacheMetrics`, `LayoutGlyph`, `LayoutRun`, `LayoutRunIter`, `LayoutLine`,
  `LayoutCursor`, `ShapeGlyph`, `ShapeLine`, `ShapeSpan`, `ShapeWord`,
  `ShapeBuffer`, `ShapeRunCache`, `ShapeRunKey`, `PhysicalGlyph`, `Placement`,
  `Attrs`, `AttrsList`, `AttrsOwned`, `Color`, `Editor`, `SyntaxEditor`,
  `SyntaxSystem`, `SyntaxTheme`, `ViEditor`, `ViParser`, `Metrics`, `BidiParagraphs`,
  `Change`, `ChangeItem`, `Cursor`, `Scroll`, `DecorationMetrics`,
  `DecorationSpan`, `FontFeatures`, `FeatureTag`, `Feature`, `FontMatchAttrs`,
  `FontMatchKey`, `FontSystem`, `Angle`, `Transform`, `Weight`,
  `LetterSpacing`, `TextDecoration`, `GlyphDecorationData`, `LineIter`,
  `LegacyRenderer`.
- Enums: `Action`, `Affinity`, `Align`, `BufferRef`, `Cached`, `Command`,
  `Ellipsize`, `EllipsizeHeightLimit`, `Family`, `FamilyOwned`, `Hinting`,
  `LineEnding`, `Motion`, `Selection`, `Shaping`, `Stretch`, `Style`,
  `SubpixelBin`, `UnderlineStyle`, `ViMode`, `Wrap`; function `render_decoration`.
- Traits: `Edit`, `Fallback`, `Renderer`.
- Documented flow: `FontSystem::new()` + `SwashCache::new()` + `Metrics::new(14.0, 20.0)`
  → `Buffer::new(&mut font_system, metrics)` → `buffer.borrow_with(&mut font_system)`
  → `set_size` / `set_text("...", &attrs, Shaping::Advanced, None)` →
  `buffer.layout_runs()` → `run.glyphs` → `buffer.draw(&mut swash_cache, text_color, |x, y, w, h, color| ...)`.

**Coverage notes.** `Y` for shaping (HarfRust), discovery (`fontdb`), fallback
(`Fallback` trait, `fallback` module), variable fonts (via `skrifa`), atlas
caching (`SwashCache`, `CacheKey`), and bidi-aware multi-line layout. `P` for
hinting (`Hinting` enum), subpixel (`SubpixelBin`) and bitmap/colour glyphs (via
`swash`). COLR, sbix, SVG and CFF2/TTC specifics are **unverified**. `O` for SDF,
subsetting, writing.

**Out of scope and architectural stance.** A full text stack, deliberately
composed from specialist crates rather than reimplementing them: shaping is
provided by harfrust, font discovery by fontdb, and rasterisation is optional and
provided by swash, while the remaining features are developed within the library
itself. It does I/O for system font discovery, but `FontSystem` can be constructed
with a custom `fontdb::Database`.

**Differential-test oracle suitability.** Moderate, and higher-level than a
parser. With a Rust toolchain and a controlled `fontdb::Database` it runs offline
from fixture fonts. Comparable outputs: `ShapeGlyph`/`LayoutGlyph` positions,
`LayoutRun` geometry, `Metrics`, and `SwashImage` coverage. Tolerance: swash
rasterisation, hinting strategy and subpixel binning all need tolerance; shaping
and layout are deterministic given pinned attrs and fonts.

**Worth stealing.** Making font fallback a trait (`Fallback`) with a
`PlatformFallback` implementation, so a hermetic test configuration can swap the
system fallback list for a fixed one — essential for reproducible tests.

### 3.11 kurbo — 0.13.1

- **Positioning:** a 2D curves and geometry library; the "vocabulary" Bézier path
  type used across the fontations/druid ecosystem. It is not a font library.
- **Licence:** Apache-2.0 OR MIT.
- **Source:** `https://docs.rs/kurbo/latest/kurbo/`,
  `https://github.com/linebender/kurbo`, `https://crates.io/api/v1/crates/kurbo`.

**Public interface (exact identifiers)**

- `BezPath`, `PathEl`, `PathSeg`, `Shape`, `Rect`, `Point`, `Vec2`, `Affine`,
  `Size`, `Insets`, `Line`, `QuadBez`, `CubicBez`, `Arc`, `SvgArc`, `Circle`,
  `Ellipse`, `RoundedRect`, `Triangle`, `TranslateScale`, `Segments`,
  `ConstPoint`, `Moments`, `Nearest`, `MinDistance`, `Stroke`, `StrokeOpts`,
  `StrokeCtx`, `Dashes`; enums `Axis`, `Cap`, `Join`, `CuspType`,
  `StrokeOptLevel`, `SvgParseError`; traits `ParamCurve`, `ParamCurveArclen`,
  `ParamCurveArea`, `ParamCurveCurvature`, `ParamCurveDeriv`,
  `ParamCurveExtrema`, `ParamCurveFit`, `ParamCurveMoments`,
  `ParamCurveNearest`, `Shape`; functions `flatten`, `segments`, `stroke`,
  `stroke_with`, `dash`, `expand_path`, `fit_to_bezpath`, `fit_to_cubic`,
  `cubics_to_quadratic_splines`; constants `DEFAULT_ACCURACY`, `MAX_EXTREMA`;
  modules `common`, `offset`, `simplify`. `BezPath` has `move_to`, `line_to`,
  `quad_to`, `curve_to`, `close_path`, `elements`, `segments`, `to_path`,
  `apply_affine`, `bounding_box`; `PathEl` variants `MoveTo`, `LineTo`,
  `QuadTo`, `CurveTo`, `ClosePath`.

**Coverage notes.** All font-specific cells are `O` by design. Its relevance is
as a shared outline/path interchange type; the fontations `Pen` abstraction emits
into a `BezPath`.

**Out of scope and architectural stance.** Pure geometry, `no_std`-capable with
`libm`, needs `alloc`, no I/O, no font knowledge. Feature flags (`std`, `libm`,
`mint`, `euclid`, `serde`, `schemars`) keep it adaptable.

**Differential-test oracle suitability.** Not a font oracle, but a useful
normaliser: convert outline command streams from different libraries into
`PathEl` sequences and compare those, which removes per-library struct
differences. Needs a Rust toolchain. Tolerance: floating-point, so compare with
an epsilon.

**Worth stealing.** A single canonical path representation (`BezPath` + `PathEl`)
that every producer emits into and every consumer reads from — the outline
equivalent of an interchange format.

### 3.12 pathfinder

- **Positioning:** a modular, GPU-accelerated vector-graphics and font renderer
  (GL/Metal/WebGL backends), historically from the Servo project.
- **Licence:** dual Apache-2.0 / MIT (same terms as Rust).
- **Version:** **unverified** as a whole; `pathfinder_canvas` 0.5.0 and
  `pathfinder_renderer` 0.6.x appear in registry metadata.
- **Source:** `https://github.com/Veedrac/pathfinder`,
  `https://github.com/servo/pathfinder`,
  `https://www.crates.io/crates/pathfinder_canvas/dependencies`.

**Public interface (exact identifiers)**

- Crates: `pathfinder_geometry`, `pathfinder_content`, `pathfinder_color`,
  `pathfinder_simd`, `pathfinder_renderer`, `pathfinder_gpu`, `pathfinder_gl`,
  `pathfinder_metal`, `pathfinder_webgl`, `pathfinder_canvas`, `pathfinder_svg`,
  `pathfinder_text`, `pathfinder_c`.
- Content types: `Outline`, `Contour`, `Segment?` (**unverified**), `Scene`,
  `SceneBuilder`, `DrawPath`, `FillRule`, `PathCommand?` (**unverified**), `Transform2F`,
  `RectF`, `Vector2F`; canvas types `Canvas`, `CanvasRenderingContext2D`,
  `CanvasFontContext?` (**unverified**); renderer types `Renderer`, `Device`,
  `SceneProxy`, `RenderTarget?` (**unverified**); text integration via
  `font-kit`, `skribo`, `pathfinder_text`.

**Coverage notes.** It is a GPU rasteriser, not a font parser: all parsing
columns are `O`. `Y` for subpixel antialiasing, gamma correction and stem
darkening ("It can do stem darkening/font dilation like macOS and FreeType"),
`P` for slight hinting, `Y` for atlas/tile caching, `P` for SVG. The README states
exact fractional trapezoidal area coverage (effectively 256xAA) and that the
project is "under heavy development and is incomplete in various areas".

**Out of scope and architectural stance.** Modular crates so applications pick
only what they need; GPU tiling prepass with Rayon; OpenGL/Metal/WebGL backends;
a C API (`pathfinder_c`). It is explicitly incomplete and its exact public API is
the least stable in this survey. It needs a GPU context, so it is not a headless
pure-computation library.

**Differential-test oracle suitability.** Poor for offline testing. Needs a Rust
toolchain and a GPU/GL context. Comparable outputs: rendered pixels (with
tolerance), `Outline` contours and tile statistics. Tolerance: GPU-dependent
antialiasing and floating-point tile geometry make exact reproduction hard.

**Worth stealing.** Computing exact fractional trapezoidal area coverage
per pixel as a quality reference: a principled, documented antialiasing target
against which a simpler CPU rasteriser can be measured.

---

## 4. Go libraries

### 4.1 golang.org/x/image/font/sfnt — v0.48.0

- **Positioning:** a low-level, vector-only SFNT (TTF/OTF) decoder; no
  rasterisation, no I/O beyond the caller's byte source.
- **Licence:** BSD-3-Clause.
- **Source:** `https://pkg.go.dev/golang.org/x/image/font/sfnt`.

**Public interface (exact identifiers)**

- `Font`, `Buffer`, `Collection`, `GlyphIndex`, `Units`, `NameID`, `PostTable`,
  `LoadGlyphOptions`, `Segment`, `SegmentOp`, `Segments`, `ErrColoredGlyph`,
  `ErrNotFound`.
- Package functions: `Parse`, `ParseReaderAt`, `ParseCollection`,
  `ParseCollectionReaderAt`.
- `Collection` methods: `Font`, `NumFonts`.
- `Font` methods (verified declarations): `Bounds(b *Buffer, ppem fixed.Int26_6, h font.Hinting) (fixed.Rectangle26_6, error)`,
  `GlyphAdvance(b *Buffer, x GlyphIndex, ppem fixed.Int26_6, h font.Hinting) (fixed.Int26_6, error)`,
  `GlyphBounds(b *Buffer, x GlyphIndex, ppem fixed.Int26_6, h font.Hinting) (bounds fixed.Rectangle26_6, advance fixed.Int26_6, err error)`,
  `GlyphIndex(b *Buffer, r rune) (GlyphIndex, error)`,
  `GlyphName(b *Buffer, x GlyphIndex) (string, error)`,
  `Kern(b *Buffer, x0, x1 GlyphIndex, ppem fixed.Int26_6, h font.Hinting) (fixed.Int26_6, error)`,
  `LoadGlyph(b *Buffer, x GlyphIndex, ppem fixed.Int26_6, opts *LoadGlyphOptions) (Segments, error)`,
  `Metrics(b *Buffer, ppem fixed.Int26_6, h font.Hinting) (font.Metrics, error)`,
  `Name(b *Buffer, id NameID) (string, error)`, `NumGlyphs() int`,
  `PostTable() *PostTable`, `UnitsPerEm() Units`,
  `WriteSourceTo(b *Buffer, w io.Writer) (int64, error)`.
- `Segment` fields: `Op SegmentOp`, `Args [3]fixed.Point26_6`. `SegmentOp`
  constants: `SegmentOpMoveTo`, `SegmentOpLineTo`, `SegmentOpQuadTo`,
  `SegmentOpCubeTo`. `Segments.Bounds()`. `PostTable` fields: `Version`,
  `ItalicAngle`, `UnderlinePosition`, `UnderlineThickness`, `IsFixedPitch`.

**Coverage notes.** `Y` for TTF, OTF/CFF and TTC; `N` for CFF2, bitmap strikes,
COLR/CPAL, sbix, SVG and variable fonts — `LoadGlyph` returns `ErrColoredGlyph`
for colour glyphs and the package explicitly disclaims them. `P` for kerning
(`Kern` reads the `kern` table; GPOS is not exposed) and hinting
(`font.Hinting` quantisation, not a TrueType interpreter). `N` for writing:
"this package does not provide an encoder ... there is no API to build a
different TTF file, whether 'from scratch' or by modifying an existing one."

**Out of scope and architectural stance.** "Glyphs are represented as vectors,
not pixels"; no rasterisation, no shaping, no font discovery, no subsetting, no
writing. `Font` keeps a reference to the source `[]byte` or `io.ReaderAt` and
requires the caller not to modify or close it. `Buffer` is a reusable scratch
allocation that the caller may pass (or `nil` for a temporary). `Font` methods
are safe for concurrent use when each call gets its own `Buffer`. No I/O is
performed by the decoder itself beyond reading the supplied reader.

**Differential-test oracle suitability.** Excellent. Runs fully offline from a
fixture `[]byte` via `Parse`; needs only a Go toolchain and `golang.org/x/image`
(no C dependencies). Comparable outputs: glyph id (`GlyphIndex`), advance
(`GlyphAdvance`), bounding box (`GlyphBounds`, `Bounds`), outline commands
(`LoadGlyph` → `Segments` with `SegmentOp` verbs), metrics (`Metrics`), names
(`Name`, `PostTable`), and units-per-em. Tolerance: with
`font.HintingNone` and `ppem = fixed.Int26_6(f.UnitsPerEm())` the outputs are
exact font-unit integers — no antialiasing, no hinting drift, no tolerance
needed. It emits no coverage bitmap.

**Worth stealing.** The explicit `*Buffer` scratch parameter on every method: the
library performs no hidden allocation, the caller controls reuse, and concurrency
is documented in terms of "one buffer per call" rather than locks.

### 4.2 golang.org/x/image/font — v0.48.0

- **Positioning:** the interface contract for font faces in `x/image`; a small
  abstraction that rasterisers implement.
- **Licence:** BSD-3-Clause.
- **Source:** `https://pkg.go.dev/golang.org/x/image/font`.

**Public interface (exact identifiers)**

- `Face` interface: `io.Closer` plus `Glyph(dot fixed.Point26_6, r rune) (dr image.Rectangle, mask image.Image, maskp image.Point, advance fixed.Int26_6, ok bool)`,
  `GlyphBounds(r rune) (bounds fixed.Rectangle26_6, advance fixed.Int26_6, ok bool)`,
  `GlyphAdvance(r rune) (advance fixed.Int26_6, ok bool)`,
  `Kern(r0, r1 rune) fixed.Int26_6`, `Metrics() Metrics`, `Close() error`.
- `Drawer` struct: fields `Dst draw.Image`, `Src image.Image`, `Face Face`,
  `Dot fixed.Point26_6`; methods `DrawString`, `DrawBytes`, `BoundString`,
  `BoundBytes`, `MeasureString`, `MeasureBytes`.
- Package functions: `BoundString`, `BoundBytes`, `MeasureString`, `MeasureBytes`.
- `Metrics` struct: `Height`, `Ascent`, `Descent`, `XHeight`, `CapHeight`,
  `CaretSlope` (the last is `image.Point`, the rest `fixed.Int26_6`).
- `Hinting` with constants `HintingNone`, `HintingVertical`, `HintingFull`;
  `Stretch` with `StretchUltraCondensed` … `StretchUltraExpanded`; `Style`;
  `Weight`.
- Subpackages: `basicfont`, `gofont` (`goregular`, `gobold`, `goitalic`,
  `gomono`, `gosmallcaps`, etc.), `inconsolata`, `opentype`, `plan9font`, `sfnt`.

**Coverage notes.** Interface only: every format and feature cell is `O`. `P` for
hinting and kerning because those appear as interface vocabulary rather than
implementations.

**Out of scope and architectural stance.** A `Face` is defined as a font at a
specific size, style, weight and hinting — "the 12pt and 18pt versions of Comic
Sans are two different faces". A `Face` is explicitly not safe for concurrent
use, because implementations may reuse caches and mask buffers. The interface
returns glyph masks as `image.Image`, so rasterisation is delegated entirely.

**Differential-test oracle suitability.** Not an oracle itself, but a valuable
normalisation target: implement the `Face` interface over a newcomer's parser and
compare `GlyphBounds`, `GlyphAdvance` and `Metrics` against
`opentype.NewFace`. Needs a Go toolchain.

**Worth stealing.** Defining the public contract as a tiny interface (`Face`) with
six methods, then shipping several implementations behind it: it makes
differential testing a matter of swapping one value, not rewriting harnesses.

### 4.3 github.com/golang/freetype

- **Positioning:** a Go port of the FreeType rasteriser (not a binding to C
  FreeType): a convenient API to draw text onto an image.
- **Licence:** a BSD-style "Freetype" licence; the module README states that,
  unless otherwise noted, the Freetype-Go source files are distributed under the
  BSD-style licence reproduced in the LICENSE file.
- **Version:** `v0.0.0-20170609003504-e2365dfdc4a0` (pseudo-version, published
  9 June 2017) — effectively unmaintained.
- **Source:** `https://pkg.go.dev/github.com/golang/freetype`.

**Public interface (exact identifiers)**

- Package: `Context`, `NewContext`, `ParseFont`, `Pt`.
- `Context` methods (verified): `DrawString(s string, p fixed.Point26_6) (fixed.Point26_6, error)`,
  `PointToFixed(x float64) fixed.Int26_6`, `SetClip(clip image.Rectangle)`,
  `SetDPI(dpi float64)`, `SetDst(dst draw.Image)`,
  `SetFont(f *truetype.Font)`, `SetFontSize(fontSize float64)`,
  `SetHinting(hinting font.Hinting)`, `SetSrc(src image.Image)`.
- Subpackages: `raster` ("an anti-aliasing 2-D rasterizer",
  `raster.Rasterizer`, `raster.NewRasterizer`) and `truetype` ("a parser for the
  TTF and TTC file formats", `truetype.Font`, `truetype.Parse`,
  `truetype.Index`, `truetype.GlyphBuf`, `truetype.Hinter`,
  `truetype.Hinting`). Exact subpackage symbol lists are **unverified**.

The README states the limits plainly: "It is an incomplete port: It only supports
TrueType fonts, and not Type 1 fonts nor bitmap fonts. It only supports the
Unicode encoding." It also notes the implementation difference: "It uses a 26.6
fixed point co-ordinate system everywhere internally, as opposed to the original
Freetype's mix of 26.6 ... and 24.8 in the 'smooth' rasterizer."

**Coverage notes.** `Y` for TrueType and TTC parsing, hinting and coverage
rasterisation. `N` for OTF/CFF, CFF2, colour/bitmap/SVG, variable fonts, vertical
layout. `O` for shaping, SDF, LCD, discovery, fallback, subsetting, writing.

**Out of scope and architectural stance.** A pure-Go port with its own rasteriser
and hinter, no C dependency and no I/O beyond the caller's bytes. `Context` is
mutable state (DPI, font, size, clip, src, dst, hinting). It is explicitly an
incomplete port.

**Differential-test oracle suitability.** Moderate. Runs offline from fixture
bytes with a Go toolchain and no C dependency. Comparable outputs: glyph ids
(through `truetype`), advances, and the drawn pixels on the caller's
`draw.Image`. Tolerance: its own 26.6 rasteriser and hinter differ from C
FreeType, so pixel comparison needs a tolerance; pin `SetDPI`, `SetFontSize` and
`SetHinting`.

**Worth stealing.** The mutable `Context` accumulating render settings
(`SetDPI`, `SetFontSize`, `SetHinting`, `SetSrc`, `SetDst`, `SetClip`) with one
`DrawString` entry point — a very small surface for a text renderer.

### 4.4 golang.org/x/image/font/opentype — v0.48.0

- **Positioning:** a glyph rasteriser for TTF/OTF providing the high-level
  `font.Face` interface; the sibling of `sfnt`.
- **Licence:** BSD-3-Clause.
- **Source:** `https://pkg.go.dev/golang.org/x/image/font/opentype`.

**Public interface (exact identifiers)**

- `NewFace(f *Font, opts *FaceOptions) (font.Face, error)`.
- Type aliases: `type Font = sfnt.Font`, `type Collection = sfnt.Collection`.
- `Face` struct with methods `Close`, `Glyph`, `GlyphAdvance`, `GlyphBounds`,
  `Kern`, `Metrics` (implementing `font.Face`).
- `FaceOptions` struct fields: `Size float64`, `DPI float64`,
  `Hinting font.Hinting`.
- `Parse`, `ParseReaderAt`, `ParseCollection`, `ParseCollectionReaderAt`.

The overview states: "This package provides a high-level API, centered on the
NewFace function, implementing the golang.org/x/image/font.Face interface. The
sibling golang.org/x/image/font/sfnt package provides a low-level API." It also
carries a "Security Considerations" note: "This package is not hardened against
malicious inputs."

**Coverage notes.** Inherits `sfnt`'s format coverage (`Y` TTF/OTF/TTC, `N`
CFF2/colour/SVG/bitmap/variable), plus `Y` for coverage rasterisation via
`x/image/vector`. `P` for hinting (`FaceOptions.Hinting`) and a glyph mask cache.
`N` for writing.

**Out of scope and architectural stance.** Pure Go, no C dependency, no I/O,
caller-supplied bytes. `Face` is explicitly "not safe to use concurrently".
Rasterisation to an 8-bit alpha mask is delegated to the vector rasteriser.

**Differential-test oracle suitability.** Excellent for coverage-bitmap
comparison. Runs offline from fixture bytes with a Go toolchain. Comparable
outputs: `Face.Glyph` returns `(dr, mask, maskp, advance, ok)` — the alpha mask
is directly comparable, along with `GlyphBounds`, `GlyphAdvance` and `Metrics`.
Tolerance: antialiasing is its own; compare masks with a per-pixel tolerance and
pin `FaceOptions` exactly. `HintingNone` gives deterministic geometry.

**Worth stealing.** `FaceOptions` as a single, nil-able configuration struct with
documented sensible defaults — adding a new option later does not break callers.

### 4.5 gioui.org/font/opentype — v0.10.3

- **Positioning:** text layout and shaping for OpenType files in the Gio UI
  ecosystem; wraps the `go-text/typesetting` stack.
- **Licence:** MIT, Unlicense.
- **Source:** `https://pkg.go.dev/gioui.org/font/opentype`.

**Public interface (exact identifiers)**

- `Parse(src []byte) (Face, error)`,
  `ParseCollection(src []byte) ([]giofont.FontFace, error)`,
  `DescriptionToFont(md fontapi.Description) giofont.Font`,
  `FontToDescription(font giofont.Font) fontapi.Description`.
- `Face` struct (thread-safe) with methods `Face() *fontapi.Face` and
  `Font() giofont.Font`.
- Related namespaces from these declarations: `giofont.Font`, `giofont.FontFace`,
  `fontapi.Face`, `fontapi.Description`.

The overview notes: "the OpenType specification allows for fonts to include
bitmap images in a variety of formats. In the interest of small binary sizes, the
opentype package only automatically imports the PNG image decoder. If you have a
font with glyphs in JPEG or TIFF formats, register those decoders with the image
package". Two documented bugs note that "the only Variant that can be detected
automatically is 'Mono'".

**Coverage notes.** `Y` for TTF/OTF, TTC (`ParseCollection`), shaping and
kerning/GPOS (delegated to `go-text/typesetting`), `P` for bitmap glyphs (PNG
decoder registered), `P` for discovery/metadata (`fontapi.Description`), `P` for
variable fonts (**unverified** at API level). `O` for SDF, LCD, atlas, fallback,
subsetting, writing.

**Out of scope and architectural stance.** A thin, thread-safe adapter: "Face is
a thread-safe representation of a loaded font. For efficiency, applications
should construct a face for any given font file once, reusing it across different
text shapers." It produces a thread-unsafe `*fontapi.Face` per shaper. It is a
layout/shaping package, not a low-level parser.

**Differential-test oracle suitability.** Moderate. Needs a Go toolchain and the
Gio/go-text dependency set. Comparable outputs: shaped glyph runs and font
metadata (`fontapi.Description`). Tolerance: shaping is deterministic with pinned
inputs; no coverage bitmap is exposed by this package.

**Worth stealing.** A thread-safe immutable `Face` that mints cheap, thread-unsafe
per-shaper wrappers via `Face()`: a clean concurrency contract for a shared font
resource.

### 4.6 github.com/benoitkugler/textlayout — v0.3.2

- **Positioning:** a Go port of HarfBuzz (and Graphite) providing low-level font
  parsing, OpenType layout and shaping. Superseded by `go-text/typesetting`.
- **Licence:** MIT.
- **Source:** `https://pkg.go.dev/github.com/benoitkugler/textlayout`,
  `https://pkg.go.dev/github.com/benoitkugler/textlayout/harfbuzz`.

**Public interface (exact identifiers)**

- Module packages: `fonts`, `fonts/binaryreader`, `fonts/bitmap`,
  `fonts/glyphsnames`, `fonts/psinterpreter`, `fonts/simpleencodings`,
  `fonts/truetype`, `fonts/type1`, `fonts/type1C`, `graphite`, `harfbuzz`,
  `harfbuzz/langs`, `language`, `unicodedata`, `unicodedata/generate`.
- `harfbuzz` package (verified): `Face` (alias `= fonts.Face`), `Font`,
  `Buffer`, `Feature`, `Direction`, `SegmentProperties`, `GlyphInfo`,
  `GlyphPosition`, `GlyphExtents`, `GlyphMask`, `Position`, `ClusterLevel`,
  `FaceOpentype`, `ShappingOptions` (note the source spelling), `NewBuffer`,
  `NewFont`, `ParseFeature`, `ParseVariation`, `FindFeatureForLang`,
  `IsDefaultIgnorable`, `NewOTTagsFromScriptAndLanguage`, `SelectLanguage`,
  `SelectScript`, `UniscribeBugCompatible`; constants `FeatureGlobalStart`,
  `FeatureGlobalEnd`, `NoScriptIndex`, `NoFeatureIndex`,
  `DefaultLanguageIndex`, `MonotoneGraphemes`, `MonotoneCharacters`,
  `Characters`, `LeftToRight`, `RightToLeft`, `TopToBottom`, `BottomToTop`,
  `GlyphUnsafeToBreak`, `Bot`, `Eot`, `PreserveDefaultIgnorables`,
  `RemoveDefaultIgnorables`, `DoNotinsertDottedCircle`.
- `Buffer` methods/fields: `AddRune`, `AddRunes`, `Clear`, `Reverse`,
  `GuessSegmentProperties`, `Shape(font *Font, features []Feature)`, fields
  `Info []GlyphInfo`, `Pos []GlyphPosition`, `Props SegmentProperties`,
  `Invisible`, `NotFound`, `Flags ShappingOptions`, `ClusterLevel`.
- `Font` methods: `Face`, `ExtentsForDirection`, `GetOTGlyphClass`,
  `GetOTLayoutTables`, `GetOTLigatureCarets`, `GlyphAdvanceForDirection`,
  `GlyphExtents`, `GlyphHAdvance`, `LineMetric`, `SetVarCoordsDesign`; fields
  `Ptem`, `XScale`, `YScale`, `XPpem`, `YPpem`.
- `fonts` package identifiers seen from `harfbuzz`: `fonts.Face`,
  `fonts.GID`, `fonts.FontExtents`, `fonts.LineMetric`, `fonts.GlyphExtents`.

Notably **absent** from this port (do not invent them): `UnicodeBuffer`,
`GlyphBuffer`, `ShapePlan`, `NewFace`, `AddUTF8`, `AddCodepoints`,
`SetDirection`, `SetScript`, `SetLanguage`, `BufferFlags`, `Serialize`,
`FeatureFromString`, `GetGlyphInfos`, `GetGlyphPositions`. The real equivalents
are `Buffer` (both input and output), `ParseFeature`, `AddRunes`, direct field
assignment on `Buffer.Props`, `ShappingOptions`, `Buffer.Info` and `Buffer.Pos`.

The README states: "This module provides a chain of tools to layout text. It is
mainly a port of the C libraries harfbuzz and graphite" and, importantly,
"Project superseded — This project has been merged into go-text/typesetting and
this repository will not be maintained anymore ... All users should use go-text
instead, unless they require support for old Type1 or Linux Bitmap fonts."

**Coverage notes.** `Y` for TTF, OTF/CFF (via `psinterpreter`/`type1C`), bitmap
`.pcf` fonts, GSUB/GPOS, shaping, variable fonts (`SetVarCoordsDesign`,
`tt.Variation`), and vertical directions. `P` for TTC, `O` for CFF2, WOFF,
colour/SVG, hinting, SDF, LCD, atlas, discovery, fallback, subsetting, writing.

**Out of scope and architectural stance.** A direct algorithm port with no C
dependency. Explicitly a work in progress with breaking changes possible. No
rasterisation, no coverage bitmaps, no font discovery.

**Differential-test oracle suitability.** Good for shaping. Runs offline from
fixture bytes with a Go toolchain. Comparable outputs: `Buffer.Info` (glyph id,
cluster, mask) and `Buffer.Pos` (x/y advance and offset). Tolerance: deterministic
given pinned features, direction, script and language; no pixels. Its superseded
status argues for using `go-text/typesetting` instead for new work.

**Worth stealing.** Using exported struct fields (`Buffer.Props`, `Font.XScale`,
`Font.XPpem`) instead of a large family of setters: the shaping configuration is
one inspectable value, trivially serialisable into a test fixture.

---

## 5. Best-of-breed union

The capability checklist below is the union of everything the surveyed libraries
do well, with the strongest exemplar named for each. A newcomer should decide
explicitly, capability by capability, whether to include it or to declare it out
of scope.

1. **Container and table access.** Parse SFNT, TTC/OTC, TrueType, OpenType/CFF,
   and CFF2; expose every table by tag with typed, lazy, zero-copy views; support
   in-memory bytes, `ReaderAt`/streams and face indices. Exemplars: `read-fonts`
   (`FontRef`, `TableProvider`, `CollectionRef`, `FileRef`, DSL-derived
   `tables` modules) and `ttf-parser` (`RawFace`, `FaceTables`, `fonts_in_collection`).
   Decide deliberately about WOFF/WOFF2 decompression: only FreeType offers it
   natively here, and it is build-dependent.
2. **Character mapping.** All `cmap` formats (0, 4, 6, 12, 13 and format 14
   variation selectors), glyph-name lookup, Unicode variation sequences,
   multiple charmaps and charmap selection. Exemplars: `ttf-parser`
   (`glyph_index`, `glyph_variation_index`, `glyph_index_by_name`,
   `glyph_name`) and FreeType (`FT_Select_Charmap`, `FT_Get_Char_Index`,
   `FT_Face_GetCharVariantIndex`).
3. **Glyph outlines.** One canonical command stream (`move_to`, `line_to`,
   `quad_to`/`conic_to`, `curve_to`, `close`) emitted through a callback/pen
   trait, with support for `glyf` composites, CFF and CFF2 charstrings, `gvar`
   deltas and `VARC` composites; always return a tight bounding box and/or make
   the caller check for malformed partial output. Exemplars: `ttf-parser`
   (`OutlineBuilder`, `outline_glyph`), `skrifa` (`OutlinePen`, `PathSink`,
   `GlyphSourceOrder`), FreeType (`FT_Outline_Decompose`, `FT_Outline_Funcs`),
   and Go `sfnt` (`SegmentOp` verbs). Normalise everything to a shared path type
   in the spirit of `kurbo::BezPath`/`PathEl`.
4. **Metrics.** Units-per-em, ascender/descender/line gap, cap height, x-height,
   underline/strikeout metrics, per-glyph advance, side bearings and bounding
   boxes (horizontal and vertical), all variation-aware. Exemplars: `skrifa`
   (`metrics` module), `ttf-parser` (`glyph_hor_advance`,
   `glyph_bounding_box`, `vertical_ascender`), and Go `sfnt` (`Metrics`,
   `GlyphBounds`, `GlyphAdvance`).
5. **Variation and variable fonts.** `fvar`, `avar`, `gvar`, `HVAR`, `VVAR`,
   `MVAR`, `STAT`, named instances, axis normalisation, coordinate blending and
   instancing/axis pinning. Exemplars: HarfBuzz (`hb_ot_var_*`,
   `hb_font_set_variations`, `hb_subset_input_pin_axis_location`), FreeType
   (`FT_Set_Var_Design_Coordinates`, `FT_Get_MM_Var`), `skrifa`
   (`LocationRef`, `InstanceBuilder`) and `ttf-parser` (`set_variation`,
   `variation_axes`).
6. **Rasterisation.** Monochrome 1-bit, 8-bit grayscale coverage, LCD/subpixel,
   SDF and MSDF/MTSDF, bitmap strikes and embedded PNG/JPEG/TIFF glyphs, plus
   glyph names and SVG documents. Exemplars: FreeType (the broadest single
   renderer), `fontdue` (`rasterize` and `rasterize_subpixel` returning
   `(Metrics, Vec<u8>)`), `stb_truetype` (SDF and baked atlases), and `msdfgen`
   (`generateSDF`, `generateMSDF`, `generateMTSDF`).
7. **Colour and layered glyphs.** COLRv0 layers, COLRv1 paint graphs with
   gradients and transforms, CPAL palettes and palette selection, sbix/CBDT/EBDT
   bitmaps, and SVG glyph documents. Exemplars: FreeType
   (`FT_Get_Color_Glyph_Paint`, `FT_Palette_Select`, `FT_ColorLine`), HarfBuzz
   (`hb-ot-color.h`, `hb_paint_funcs_t`), `skrifa` (`color::ColorPens`) and
   `ttf-parser` (`colr`, `cpal`, `sbix`, `svg` modules).
8. **Layout and shaping.** GSUB/GPOS lookup application, script/language/feature
   selection, cluster levels, direction (including vertical), bidi run
   segmentation, ligature carets, mark attachment, baseline tables and optional
   user features. Exemplars: HarfBuzz (`hb_shape`, `hb-ot-layout.h`),
   `rustybuzz`, `benoitkugler/textlayout/harfbuzz`, and ICU (`UBiDi`) for the
   text-segmentation layer that must stay outside the font core.
9. **Caching and atlases.** Reusable scratch buffers, glyph-mask caches,
   reference-counted immutable font objects, texture-atlas packing and
   "no change, redraw" signals. Exemplars: Go `sfnt.Buffer`, FreeType's `FTC_*`
   caches, `glyph_brush` (`BrushAction::Draw`/`ReDraw`), `cosmic-text`
   (`SwashCache`, `CacheKey`) and `stb_truetype` (`stbtt_PackBegin`,
   `stbtt_PackFontRange`).
10. **Font discovery and fallback.** A pattern/property-bag query model,
    substitution pipelines, system font enumeration, per-character fallback, and
    a pluggable fallback trait so tests can be hermetic. Exemplars: `fontconfig`
    (`FcPattern`, `FcFontMatch`, `FcFontSort`, `FcFontList`), Skia
    (`SkFontMgr::matchFamilyStyleCharacter`), DirectWrite
    (`IDWriteFontFallback::MapCharacters`) and `cosmic-text` (`fontdb`,
    `Fallback` trait).
11. **Subsetting and writing fonts.** Glyph/unicode/feature/name-table set
    selection, table closure, CFF desubroutinisation, variable-font instancing,
    table packing with offset-overflow handling, and binary emission. Exemplars:
    HarfBuzz (`hb-subset.h`, `hb_subset_or_fail`,
    `HB_SUBSET_FLAGS_*`), `write-fonts` (`FontBuilder`, `dump_table`,
    `FontWrite`, hb-repacker packing) and the companion `klippa` subsetter.
12. **Cross-cutting engineering qualities.** Zero-copy borrowed views; zero heap
    allocation and `no_std` compatibility; no `unsafe`; no I/O in the core; no
    panics on malformed input with explicit depth/size limits; stateless immutable
    parsing; caller-owned buffers; a stable C ABI; and an explicit, published
    "out of scope" list. Exemplars: `ttf-parser` (states all of these as policy),
    `read-fonts`, `libschrift`, Go `sfnt`, and `rusttype`'s candid
    "does not support yet" list.
13. **Differential-test friendliness.** Deterministic, exact outputs for glyph
    ids, advances, boxes and outline commands; a documented "unhinted, font
    units" mode; an explicit indication of which hinting engine and outline
    source ran; and a serialisable outline/path representation. Exemplars: Go
    `sfnt` (`HintingNone` + `ppem = UnitsPerEm`), `ttf-parser` (integer font
    units), `skrifa` (engine reporting), and the `fauntlet` regularisation
    approach used in the fontations project.

The most valuable structural lesson is the stable seam that appears in all four
ecosystems: parsing, outlines and metrics belong to a pure-computation font
core; shaping, hinted rasterisation, atlasing, discovery and blending belong to
layers above it. Go's `sfnt` says "Glyphs are represented as vectors, not pixels"
and "this package does not provide an encoder"; HarfBuzz refuses to hint or
rasterise; `ttf-parser` refuses to allocate or do I/O; `read-fonts` and
`write-fonts` are deliberately split. A newcomer gains most by choosing that
seam consciously and making it testable.

### Differential-test oracles: practical ranking

Suitability here means: runs offline from a fixture font, needs a manageable
toolchain, and emits comparable, deterministic outputs (glyph id, advance width,
bounding box, outline commands, coverage bitmap).

1. **ttf-parser (Rust)** — best overall. Zero dependencies, zero allocation, zero
   `unsafe`, no I/O, `no_std`-capable; exact integer font-unit outputs for glyph
   ids, advances, bounding boxes and `OutlineBuilder` command streams. Needs only
   a Rust toolchain (cargo), which can be fully vendored. No tolerance needed for
   anything it emits, because it does no hinting and no antialiasing. Its only
   gap is that it emits no coverage bitmap.
2. **golang.org/x/image/font/sfnt (Go)** — best second oracle. Pure Go, no C
   dependency, no I/O, `Parse([]byte)` on a fixture. With `font.HintingNone` and
   `ppem = fixed.Int26_6(f.UnitsPerEm())`, `GlyphIndex`, `GlyphAdvance`,
   `GlyphBounds`, `Metrics` and `LoadGlyph` → `Segments` are exact font-unit
   values. Add `opentype.NewFace` over the same bytes when a coverage mask is
   needed. Needs only a Go toolchain. Its weakness is narrow format coverage (no
   CFF2, colour, SVG or variable fonts).
3. **FreeType (C)** — the industry reference and the broadest format oracle. Runs
   offline via `FT_New_Memory_Face`; needs a C toolchain and a small harness.
   `FT_Get_Char_Index`, `FT_Glyph_Metrics`, `FT_Outline_Decompose` and
   `FT_Render_Glyph` give glyph ids, advances, boxes, outline commands and
   coverage bitmaps across the widest set of formats. Tolerance issues are real:
   pin `FT_LOAD_NO_HINTING | FT_LOAD_NO_BITMAP`, a fixed render mode, a fixed
   interpreter version and fixed LCD/stem-darkening properties before comparing
   pixels.

Honourable mentions: **stb_truetype** is the lightest possible oracle (one
header, one C compiler, no build system) and is ideal for quick glyph-id/advance/
box/vertex/coverage comparisons, but its own antialiasing and lack of hinting
mean pixel comparisons need a tolerance and its format coverage is narrow.
**fontdue** is the most convenient Rust coverage-bitmap oracle (`rasterize`
returns `(Metrics, Vec<u8>)` with no hinting), valuable specifically for
validating a newcomer's rasteriser with a per-pixel tolerance. **skrifa** is the
best hinting-aware outline oracle, already used by Google's `fauntlet` against
FreeType, but needs a Rust toolchain and agrees only when the hinting engine and
size are pinned.

**Tolerance policy to pre-register before generating fixtures:** compare glyph
ids, advances, font-unit boxes and unhinted outline command sequences for exact
equality; compare coverage bitmaps with an explicit per-pixel tolerance and a
fixed rasterisation configuration; never compare hinted or LCD-filtered bitmaps
without pinning the interpreter version, render mode, LCD filter weights, stem
darkening and DPI; and normalise outline commands into one canonical path form
(such as `kurbo::PathEl` sequences) before comparison so that library-specific
struct differences do not produce false mismatches.

---

## 6. Unverified claims

The following could not be tied to a primary source during this survey and are
marked **unverified** rather than asserted:

- FreeType: exact WOFF/WOFF2 support and build-dependence; first-class CFF2
  outline support; the exact current stable version (the official API reference
  is labelled 2.14.3 while a sibling document cites 2.15.0).
- HarfBuzz: the exact current stable tag (15.0.0 from a secondary source; the
  headers checked are from `main`).
- stb_truetype: the exact current version (the header is v1.26; a sibling
  document cites 1.27); `stbtt_GetNumberOfFonts`, `stbtt_GetFontBoundingBox`,
  `stbtt_GetFontName`; the exact `stbtt_pack_*` symbol set beyond those listed.
  `stbtt_InitFontOffset` was checked and does **not** exist.
- libschrift: release version number.
- fontconfig: exact current stable release (official site says 2.18.2, developer
  reference says 2.15.0, other mirrors say 2.17.x); `FcConfigAddBlank`,
  `FcCharSetMerge`; the full `FcPattern*`/`FcObjectSet*` symbol list beyond the
  ones confirmed on official pages.
- msdfgen: version number; `distanceTransform`, `signedDistance`,
  `getFontMetrics`, `getGlyphShape`, `saveTga`, `saveBinary`; CFF2 handling;
  the exact `Pen`/`BezPathPen` crate path in the fontations ecosystem.
- Skia: version (rolling tree); exact COLRv1, CFF2 and sbix support extent;
  `SkFont::getSlant`; `SkParagraph` module symbol list.
- ICU: current ICU release version; `uloc_getScript`; exact ParagraphLayout
  (layoutex) class list.
- DirectWrite: `IDWriteFontFace1`..`IDWriteFontFace5` method placement,
  `DWRITE_GLYPH_IMAGE_FORMATS_*` constant set, `DWRITE_FONT_AXIS_*` interface
  placement, sbix support, discrete library version.
- ttf-parser: `FaceParsingContext` — checked and **not present**; exact COLRv1
  paint evaluation coverage.
- skrifa: SVG glyph-image support; exact `MetadataProvider` method declarations;
  the classic `bitmap`, `color`, `outline`, `instance` submodule symbol lists at
  0.22.0.
- read-fonts / write-fonts: the complete `tables::*` module list beyond those
  named in the crate documentation; `write-fonts::pen` module path.
- fontdue: exact `layout` module symbol list; `from_bytes_with_index`,
  `from_bytes_with_collection`, `file`, `kerning`, `has_kerning` (checked and
  **not** exact names on the `Font` page).
- ab_glyph: exact `Font`/`ScaleFont` trait method declaration list.
- rusttype: `gpu_cache` symbol list; `FontCollection` (not present on the
  checked root page — `Font` is an enum).
- rustybuzz: exact `Face`/`UnicodeBuffer`/`GlyphBuffer` method spellings at
  declaration level.
- cosmic-text: CFF2, TTC, COLR, sbix and SVG support extent; exact
  `FontSystem`/`Buffer` method list.
- pathfinder: exact public symbol list for `pathfinder_content` and
  `pathfinder_renderer`; whole-project version.
- golang/freetype: exact `truetype` and `raster` subpackage symbol lists.
- gioui.org/font/opentype: variable-font API extent.
- benoitkugler/textlayout: TTC parsing extent; exact `fonts` package symbol list.

---

## 7. Sources

All sources below were consulted as primary documentation, official repositories,
header files, or official package-registry API responses.

### C

- `https://freetype.org/freetype2/docs/reference/ft2-index.html`
- `https://freetype.org/license.html`
- `https://freetype.org/`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-buffer.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-font.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-face.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-shape.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-ot.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-ot-layout.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-ot-var.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-ot-color.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-subset.h`
- `https://github.com/harfbuzz/harfbuzz/blob/main/src/hb-cplusplus.hh`
- `https://harfbuzz.github.io/`
- `https://github.com/nothings/stb/blob/master/stb_truetype.h`
- `https://github.com/nothings/stb/blob/master/LICENSE`
- `https://nothings.org/stb/`
- `https://github.com/tomolt/libschrift`
- `https://raw.githubusercontent.com/tomolt/libschrift/master/schrift.h`
- `https://raw.githubusercontent.com/tomolt/libschrift/master/LICENSE`
- `https://www.freedesktop.org/software/fontconfig/fontconfig-devel/fcfontmatch.html`
- `https://www.freedesktop.org/software/fontconfig/fontconfig-devel/fcdefaultsubstitute.html`
- `https://www.freedesktop.org/software/fontconfig/fontconfig-devel/fcconfigparseandloadfrommemory.html`
- `https://www.freedesktop.org/software/fontconfig/fontconfig-devel/t1.html`
- `https://freedesktop.org/fontconfig/`
- `https://github.com/Chlumsky/msdfgen`
- `https://github.com/Chlumsky/msdfgen/blob/master/README.md`
- `https://github.com/Chlumsky/msdfgen/blob/master/LICENSE.txt`
- `https://github.com/Chlumsky/msdf-atlas-gen`

### C++

- `https://api.skia.org/classSkTypeface.html`
- `https://api.skia.org/classSkFont.html`
- `https://api.skia.org/classSkFontMgr.html`
- `https://api.skia.org/classSkTextBlobBuilder.html`
- `https://github.com/google/skia/blob/main/LICENSE`
- `https://skia.org/`
- `https://unicode-org.github.io/icu/userguide/layoutengine/`
- `https://unicode-org.github.io/icu/userguide/layoutengine/paragraph.html`
- `https://learn.microsoft.com/en-us/windows/win32/api/dwrite/nn-dwrite-idwritefontface`
- `https://learn.microsoft.com/en-us/Windows/Win32/directwrite/appendix--win32-migration`

### Rust

- `https://docs.rs/ttf-parser/latest/ttf_parser/`
- `https://docs.rs/ttf-parser/latest/ttf_parser/struct.Face.html`
- `https://github.com/harfbuzz/ttf-parser`
- `https://docs.rs/skrifa/0.22.0/skrifa/`
- `https://docs.rs/skrifa/latest/skrifa/`
- `https://docs.rs/skrifa/latest/skrifa/font/index.html`
- `https://github.com/googlefonts/fontations`
- `https://docs.rs/read-fonts/latest/read_fonts/`
- `https://docs.rs/write-fonts/latest/write_fonts/`
- `https://docs.rs/fontdue/latest/fontdue/`
- `https://docs.rs/fontdue/latest/fontdue/struct.Font.html`
- `https://github.com/mooman219/fontdue`
- `https://docs.rs/ab_glyph/latest/ab_glyph/`
- `https://github.com/alexheretic/ab-glyph`
- `https://docs.rs/rusttype/latest/rusttype/`
- `https://gitlab.redox-os.org/redox-os/rusttype`
- `https://docs.rs/glyph_brush/latest/glyph_brush/`
- `https://github.com/alexheretic/glyph-brush`
- `https://docs.rs/rustybuzz/latest/rustybuzz/`
- `https://github.com/harfbuzz/rustybuzz`
- `https://docs.rs/cosmic-text/latest/cosmic_text/`
- `https://github.com/pop-os/cosmic-text`
- `https://docs.rs/kurbo/latest/kurbo/`
- `https://github.com/linebender/kurbo`
- `https://github.com/Veedrac/pathfinder`
- `https://github.com/servo/pathfinder`
- `https://www.crates.io/crates/pathfinder_canvas/dependencies`
- `https://crates.io/api/v1/crates/ttf-parser`
- `https://crates.io/api/v1/crates/skrifa`
- `https://crates.io/api/v1/crates/read-fonts`
- `https://crates.io/api/v1/crates/write-fonts`
- `https://crates.io/api/v1/crates/fontdue`
- `https://crates.io/api/v1/crates/ab_glyph`
- `https://crates.io/api/v1/crates/rusttype`
- `https://crates.io/api/v1/crates/glyph_brush`
- `https://crates.io/api/v1/crates/rustybuzz`
- `https://crates.io/api/v1/crates/cosmic-text`
- `https://crates.io/api/v1/crates/kurbo`

### Go

- `https://pkg.go.dev/golang.org/x/image/font/sfnt`
- `https://pkg.go.dev/golang.org/x/image/font`
- `https://pkg.go.dev/golang.org/x/image/font/opentype`
- `https://pkg.go.dev/github.com/golang/freetype`
- `https://pkg.go.dev/gioui.org/font/opentype`
- `https://pkg.go.dev/github.com/benoitkugler/textlayout`
- `https://pkg.go.dev/github.com/benoitkugler/textlayout/harfbuzz`

### Secondary, used only where explicitly noted

- `https://www.wikiwand.com/en/HarfBuzz` (HarfBuzz version and history)
- `https://en.wikipedia.org/wiki/HarfBuzz` (HarfBuzz stable release)
- `https://en.wikipedia.org/wiki/Fontconfig` (fontconfig licence and release)
- `https://chromium.googlesource.com/chromium/deps/icu/+/refs/heads/chromium/59_ucharptr2/readme.html` (ICU 58 licence and LayoutEngine removal)
- `https://gitee.com/wangkunhg/fontconfig/blob/master/COPYING` (fontconfig COPYING text)
