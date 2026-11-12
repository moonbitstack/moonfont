# Research Brief: moonfont

> Conformance note. This brief is written in en-GB throughout. The R01-R10
> research gate keys on six Chinese section labels and three Chinese decision
> tokens; those literals appear only as machine-readable anchors in HTML
> comments and in one comment block under "Three Decisions", so that the
> rendered text remains en-GB. Nothing substantive is hidden. Direct
> quotations and code identifiers retain their source spelling. Every claim
> that could not be confirmed is marked `[MISSING]`.
>
> Scope note. Phase 0-1 research only. No code, no `moon.mod` changes, no
> repository operations. Third-party MoonBit font modules are functional
> references only, never dependencies. Per-library inventories for managed and
> systems languages are maintained separately in `research/managed-libraries.md`
> and `research/systems-libraries.md`; this brief holds the synthesis and the
> decisions, not a second copy of those tables.

## Research Questions <!-- 研究问题 -->

- RQ1: Which font capabilities do the leading libraries of the C, C++, C#, Python, Rust and Go ecosystems actually cover, and where are the gaps?
- RQ2: Is there a defensible functional boundary for a dependency-restricted, pure-computation MoonBit font library that existing MoonBit third-party modules do not already fill?
- RQ3: Can cross-language differential testing be reproducible without making any third-party font library a runtime dependency?

These three were fixed before any search, per `competitive-research.md` section 1. Each is answerable with yes, no, or a bounded list. Source discipline follows section 2 of the same document: primary (official documentation and specifications), secondary (third-party analysis) and behavioural (registry metadata, test corpora, published parity reports). A conclusion is tagged `[FACT]`, `[INFER]` or `[MISSING]`.

## Method and Knowledge-Base Application

- `ROUTER.md` Phase 0 and Phase 1 rows were read first; four documents from the named shortlist (`opportunity-validation.md`, `contract-prose.md`, `development-costs.md`, `60-industries/saas-b2b.md`) plus `competitive-research.md` from the router's Phase 1 mandatory row were then read.
- `competitive-research.md` section 1 changed the order of work: the RQs above were written before the first search.
- `competitive-research.md` section 5 changed a conclusion: the disconfirming search found an independent charter arguing against rasterisation inside the font module; D-02 in `DECISIONS.md` records the conflict instead of hiding it.
- `competitive-research.md` section 6 changed the capability matrix: unverified cells are `[MISSING]`, never a plausible guess.
- `opportunity-validation.md` section 3 changed the tolerance policy: thresholds are pre-registered below before any fixture is generated.
- `contract-prose.md` section 2 changed the structure: each fact has one home, so per-library detail stays in the sibling briefs and this file carries only synthesis.
- `development-costs.md` sections 7 and 10 changed the phasing: three-tier sizing, scope cut first, error handling and bounds never cut.
- `saas-b2b.md` was read as the nearest industry file and then set aside: it prescribes dashboards, CRUD layouts and retention metrics for a hosted product, none of which applies to a headless computation library. No value was force-fitted from it. This is stated rather than left silent.
- `opportunity-validation.md` section 8 (research looks at others, validation looks at your own users) is applied in the "Validation before build" section below: this is an internal shared library with named consumers, so a paid fake-door test is not the cheapest falsifiable signal.

## Competitor Matrix: Six Ecosystems <!-- 竞品 -->

Symbols: `Y` documented in a primary source; `P` partial or delegated; `N` explicitly absent; `[MISSING]` not verified. A dash is never used, so no cell is empty.

| Ecosystem | Representative libraries | Containers and tables | cmap | Outlines | Metrics | Rasterisation | Shaping and layout | Variations | Colour and bitmap glyphs | Sub-setting | Weakness exposed by the evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C | FreeType 2.15.0; stb_truetype 1.27 | Y: TTF, TTC, CFF, OTF, OTC, WOFF, Type 1, PCF, BDF, FNT, PFR | Y | Y: glyf quadratic, CFF cubic, FT_Outline | Y: advance, bearing, bbox, kern | Y: 1-bit mono, 8-bit 256-level grey, LCD, SDF, BSDF | N: explicitly excluded by the FreeType FAQ | Y | Y: SFNT bitmap, COLR, CPAL, sbix, CBDT | N | N participants in shaping; the FAQ states text layout, glyph caching and rendering to arbitrary surfaces are out of scope |
| C++ | HarfBuzz; msdfgen | Y: OpenType, AAT; draw and paint APIs | Y | Y: hb_font_draw_glyph callbacks, hb_paint | Y: extents and advances needed for shaping | P: libharfbuzz-raster experimental, no hinting | Y: the reference shaping engine | Y: fvar, avar, named instances | Y: hb_ot_color layers, PNG, SVG, paint graphs | Y: libharfbuzz-subset | N: "font hinting (including autohinting) is not implemented" per the project README; rasterisation is delegated to FreeType or Skrifa |
| C# | SixLabors.Fonts; SkiaSharp | Y: TTF, OTF, CFF1, CFF2, WOFF, WOFF2, TTC | Y | Y: IGlyphRenderer surface, CFF1 and CFF2 | Y: advance, size, bounds, line metrics | P: custom rendering via IGlyphRenderer, not a coverage rasteriser | Y: kerning, ligatures, complex shaping, bidi, wrapping | Y: FontVariation, KnownVariationAxes | Y: COLR, CPAL, fallback emoji families | [MISSING] | N: build-time licence key required from 2.2.0/3.0.0 under the Six Labors Split Licence, which constrains its use as a public oracle |
| Python | fontTools; Pillow ImageFont; freetype-py; uharfbuzz | Y: full SFNT read and write, TTX round trip | Y | Y: glyph sets, pens, TTX XML | Y: font and glyph metrics | P: Pillow wraps FreeType; fontTools is not a pixel rasteriser | P: libraqm via Pillow, uharfbuzz for shaping | Y: varLib, instancer | Y: colorLib, sbix, CBDT | Y: pyftsubset, Subsetter | N: no first-party rasteriser; fontTools is tooling for editing and compiling, so it is an excellent structural oracle and a poor pixel oracle |
| Rust | ttf-parser; skrifa and read-fonts; fontdue; ab_glyph; rusttype | Y: broadest table coverage, codegen from a DSL | Y | Y: glyf, CFF, CFF2, pens | Y: metrics, HVAR, MVAR | Y: fontdue, ab_glyph_rasterizer, rusttype | N: shaping explicitly out of scope for fontdue | Y: LocationRef, gvar, CFF2 blend | Y: COLRv1 paint, bitmap strikes | Y: klippa, allsorts | N: ttf-parser is in maintenance mode and recommends fontations; skrifa is pre-1.0 and has no rasteriser, shaper or font database |
| Go | golang.org/x/image/font/sfnt, opentype, vector; golang/freetype | Y: TTF, OTF, TTC; low-level decoder | Y | Y: Segments as vectors, not pixels | Y: advance, kern, bounds | Y: opentype.Face plus vector.Rasterizer | N: TODO comments for shaping and ligatures | N | N: TODO for coloured glyphs | N: "this package does not provide an encoder" | N: no variations, no hinting, no font discovery; a Face is not safe for concurrent use |

## Findings <!-- 结论 -->

1. [FACT] FreeType is a font service, not a layout engine: its FAQ states that text layout, glyph caching and rendering to arbitrary surfaces are out of scope, while its design documents list four renderers (`raster`, `smooth`, `sdf`, `bsdf`) and a 256-level anti-aliased pixmap. (Primary: freetype.org FAQ and design-5; behavioural: freetype.org release notes, all fetched 2026-11-12.)
2. [FACT] HarfBuzz is the inverse: it shapes and exposes draw/paint APIs, but its README states "font hinting (including autohinting) is not implemented" and recommends FreeType or Skrifa for hinted rasterisation; `libharfbuzz-raster` is experimental. (Primary: harfbuzz.github.io; behavioural: harfbuzz.org README, fetched 2026-11-12.)
3. [FACT] Across all six ecosystems a stable seam appears: parsing, outlines and metrics belong to a font service, while shaping, atlasing, caching and blending belong to a layer above. Go's `sfnt` says "Glyphs are represented as vectors, not pixels" and "this package does not provide an encoder"; Rust's skrifa has "No rasterizer, shaper or font database: three more crates are needed". (Primary and secondary sources, fetched 2026-11-12.)
4. [FACT] Rasterisation to an 8-bit coverage mask is a real, bounded primitive that several small libraries implement without a full text stack: stb_truetype 1.27, fontdue 0.9.5, ab_glyph and Go's `vector.Rasterizer`. fontdue is `no_std`, pure Rust, TrueType and OpenType, and explicitly excludes shaping. (Primary: nothings/stb, lib.rs, golang.org; secondary: ab_glyph analysis, fetched 2026-11-12.)
5. [FACT] Three MoonBit font modules already exist and are substantial. `mizchi/font` parses TTF, OTF/CFF, WOFF, WOFF2 and TTC and emits SVG path commands; `Milky2018/moon_skrifa@0.2.0` is a port of Fontations skrifa covering cmap, names, metrics, variations, COLR, sbix/CBDT and glyf/CFF/CFF2 outlines with no dependencies; `bikallem/freetype@0.5.3` is a pure MoonBit FreeType port with render modes Normal, Light, Mono, Lcd, LcdV and Sdf, and 536 parity tests against C FreeType. (Behavioural: mooncakes.io documentation pages for all three, fetched 2026-11-12.)
6. [FACT] The three MoonBit modules cannot be dependencies under the stated rule. `bikallem/freetype@0.5.3` depends on `bikallem/compress`, `moonbitlang/x` and `bikallem/blit`; the other two are third-party namespaces. `mizchi/font` carries no licence on the repository mirror that was checked, so its source must not be copied. (Behavioural: mooncakes.io and the repository mirror, fetched 2026-11-12.)
7. [INFER] RQ2 is answered yes, but not on the grounds "nobody has built this". The defensible gap is narrower: no module combines a zero-dependency, four-backend, pure-computation core with a `Limits`-guarded `Refused` error model and a committed cross-language golden corpus, under a whitelist that excludes all three existing modules. The value is the boundary and the correctness contract, not novelty of features. (Basis: findings 5 and 6 plus `PROJECT_STATE.md`.)
8. [FACT] A differential-test oracle strategy is established practice, not a new idea: Google's `fauntlet` compares skrifa outlines and advance widths against FreeType at ppem 0, 8, 16, 50, 72, 113 and 144 and variation coordinates -1.0, -0.32, 0.0, 0.42 and 1.0, with documented "regularisation" before comparison. `font-test-data` stores FreeType-extracted outlines as text with a rebuild script. `bikallem/freetype` generates golden JSON with a C program linked to vendored FreeType and then generates MoonBit tests from it. (Primary: fontations fauntlet README and font-test-data README; behavioural: mooncakes.io parity section, fetched 2026-11-12.)
9. [FACT] Anti-aliasing is not portable bit-for-bit. FreeType's `ftgrays` computes exact area coverage with 1/256-pixel sub-pixel precision and no supersampling; stb_truetype uses oversampling; ab_glyph and fontdue use accumulation-buffer rasterisers whose source credits font-rs and stb. fauntlet explicitly regularises implicit contour closure, degenerate segment removal and truncated implicit on-curve midpoints before comparing. (Primary: FreeType design docs, fauntlet README; secondary: vectree.io and ab_glyph analysis, fetched 2026-11-12.)
10. [FACT] FreeType output is version-dependent: the 2.14.2 notes claim a 40 per cent speed-up of ClearType-like rendering above 32 ppem, and 2.15.0 notes ClearType rendering changes affecting named fonts. A golden corpus is therefore only meaningful with the oracle version, flags and font hashes pinned. (Primary: freetype.org news page, fetched 2026-11-12.)
11. [FACT] The consumer seam is an alpha mask plus metrics. `moonegui@0.1.0` states "There is no triangulation, no glyph atlas and no shader anywhere in the library" and defines a backend contract of three measure functions and nine draw functions; a third-party WGSL renderer package defines `raster_glyph : (String, Bytes) -> NativeRasterGlyph?` with `NativeRasterGlyphFormat { AlphaMask, ColorRgba }`. (Primary and behavioural: mooncakes.io documentation, fetched 2026-11-12.)
12. [FACT] The allowed dependency set is verifiable and current: `moonbitstack.github.io` lists `moonbase@0.4.5`, `moonvar@0.2.2`, `moonzip@0.3.8`, `moonimage@0.1.4`, `moonmath@0.1.4`, `moonrgba@0.1.3`, `moonucd@0.1.4`, `moonnum@0.2.7`, `mooncrypt@0.4.16`, `moonstl@0.1.3`; `moonzip` includes Brotli (RFC 7932) and zlib/DEFLATE, `moonimage` includes PNG decoding, and `moonbitlang/x@0.5.7` is explicitly experimental and "subject to frequent changes". (Primary: moonbitstack.github.io, mooncakes.io package pages, fetched 2026-11-12.)
13. [INFER] RQ3 is answered yes: oracles run offline at fixture-generation time and commit data, never code, into the repository. The MoonBit test side reads plain text and hex, so no C FFI, no WASM host import and no third-party MoonBit module enters any `moon.pkg` import block. (Basis: findings 8, 11 and 12, and the `bikallem/freetype` golden-generation pipeline, which already does this with a Python wrapper.)
14. [MISSING] The exact current versions of `moonbitlang/core`, `moonbitlang/async@0.22.9` and the installed `moon` toolchain were not independently re-verified here; the team-lead's `moon view moonbitstack` observation of 2026-11-12 is taken as authoritative. Exact `moon.mod` and `moon.pkg` syntax for versioned imports, the published existence of `moongfx`, `moonplot` and `moongame`, and SkiaSharp's sub-setting and shaping support were not confirmed. `uharfbuzz` and `freetype-py` were not fetched directly; they are named in HarfBuzz's own documentation and in a sibling survey. The current Microsoft OpenType specification index was not fetched; the 1.8.1 recommendations page was.

## Derived Best-of-Breed Functional Scope

The union of the six ecosystems is deliberately narrowed. The organising rule: moonfont owns everything from font bytes to an 8-bit coverage mask and the geometry needed to place it; it owns nothing above that mask.

### In scope for v0.1.0

| Capability | Included | Boundary and reason |
| --- | --- | --- |
| Containers | sfnt 0x00010000 and "OTTO" signatures, TTC/OTC face index, table directory with checksum, offset and length | One complete vertical slice. WOFF and WOFF2 are compression wrappers, not font formats; deferring them keeps the core free of a decompression dependency. |
| Tables | `head`, `hhea`, `hmtx`, `maxp`, `cmap`, `loca`, `glyf`; `name` and `OS/2` for metadata only | Required by the OpenType specification and sufficient for outlines and metrics. `kern`, `GPOS` and `GSUB` are not read in v0.1.0. |
| cmap | Formats 4 and 12, with 0 and 6 as cheap additions | Format 4 covers the BMP; format 12 is required above U+FFFF. Format 14 (variation selectors) is deferred. |
| Outlines | glyf simple and composite glyphs, quadratic Bezier, on-curve and off-curve points, contour winding, phantom points | TrueType outlines are the shortest path to a coverage mask and are the common denominator of stb_truetype, fontdue and Go sfnt. |
| Metrics | unitsPerEm, ascent, descent, lineGap, advance width, left side bearing, glyph bounding box | Everything a layout layer needs to position a mask; no line breaking and no justification. |
| Rasterisation | 8-bit grey coverage mask, with width, height, bearing_x, bearing_y; deterministic, unhinted, single channel | Matches the consumer seam in finding 11. LCD, subpixel, mono, SDF and MSDF are separate render modes for later phases. |

### In scope for later phases

| Capability | Phase | Boundary and reason |
| --- | --- | --- |
| CFF1 and CFF2 outlines | v0.2.0 | A Type 2 charstring interpreter with subroutines is a contained but large surface; fontTools and skrifa show it belongs behind the same outline abstraction. |
| WOFF and WOFF2 containers | v0.2.0 | `moonzip@0.3.8` supplies zlib/DEFLATE and Brotli; WOFF2 additionally needs glyf/loca and hmtx transform reconstruction. An isolated adapter, never a core dependency. |
| Variation: fvar, avar, gvar, HVAR, MVAR | v0.2.0 | Stateless `LocationRef` passed per call, following skrifa; a normalised coordinate is computed once from user coordinates. |
| Colour and bitmap glyph extraction | v0.3.0 | COLR/CPAL paint traversal, sbix and CBDT/CBLC strikes as data. `moonimage@0.1.4` decodes embedded PNG; `moonrgba@0.1.3` handles colour spaces. Extraction only, no compositing. |
| SDF and MSDF render modes | v0.3.0 | msdfgen, FreeType's `sdf` renderer and stb_truetype SDF show this is a second rasteriser over the same outline, not a new parser. |
| Sub-setting | v0.3.0, separate package | fontTools `subset`, `hb-subset` and `klippa` all treat writing as a distinct surface. It is an encoder with symmetric `decode`/`encode` verbs, kept out of the read path. |
| Hinting and autohinting | v0.4.0, gated by decision | Defer, not forbid. It is the single largest source of target-dependent output. |

### Out of scope, with reasons

| Excluded | Reason |
| --- | --- |
| Complex shaping, GSUB/GPOS execution, bidi reordering, script itemisation, grapheme and line breaking | HarfBuzz owns this and explicitly delegates rasterisation; FreeType's FAQ excludes it; Go sfnt carries TODOs for it; fontdue calls it a non-goal. `moonucd@0.1.4` (categories, script, bidi, grapheme, line break) therefore belongs to the layout layer, not to moonfont. This is the single most important decoupling boundary. |
| Glyph atlas construction, glyph caching, gamma correction, stem darkening, colour blending and compositing | `moonegui@0.1.0` deliberately has no atlas and no shader; FreeType's FAQ says rendering to arbitrary surfaces is a graphics-library concern; a consumer already declares an `AlphaMask` raster-glyph format. |
| Font file I/O, font discovery, family matching, fallback and system font registries | Pure computation over `Bytes`/`BytesView`; no host capability, all four backends. `bikallem/freetype` removes file I/O for the same reason. |
| Image encoding and pixel storage beyond the 8-bit coverage mask | `moonimage@0.1.4` owns codecs. FreeType limits itself to mono, 8-bit grey and LCD formats. |
| OT-SVG glyph rendering | Would require shipping an SVG rasteriser; `bikallem/freetype@0.5.3` explicitly lists the SVG renderer as not ported. |
| Type 1, BDF, PCF, Windows FNT, AAT (`morx`, `feat`) and Graphite | Obsolete or platform-specific format drivers; FreeType supports them via optional modules. They add attack surface without serving the named consumers. |
| Font authoring, merging and arbitrary binary rewriting | A separate tool concern; see the sub-setting row for the one deliberate exception. |

## Phased Delivery Order and Acceptance Criteria

Sizing follows `development-costs.md` section 7. v0.1.0 is tier A (single concern, no external integration, no persistence); v0.2.0 becomes tier B when WOFF2 and variation arrive; v0.3.0 is tier B with a separate writer package. Per section 10 of the same document, scope is cut first; bounds, error handling and the difftest harness are never cut.

| Phase | Content | Acceptance criteria (measurable) |
| --- | --- | --- |
| P0 Research | This brief and `DECISIONS.md` | R01-R10 gate passes; every recommendation has a named decision owner. |
| P1 v0.1.0 | Container, required tables, cmap 4/12, glyf simple and composite, metrics, 8-bit coverage rasteriser, `Limits`, `Refused`, four backends, golden harness | Given a corpus font, `cmap` results match the fontTools golden for every codepoint in the manifest. Given a glyph id, unhinted outline regularised records match the FreeType golden. Given a glyph id and ppem, the coverage mask satisfies the pre-registered tolerance table. Given a truncated, malformed or over-limit font, the call raises `Refused` with a byte offset and never panics. `moon clean`, `moon fmt`, `moon check --target all --deny-warn`, `moon build --target all`, `moon test --target all` pass on wasm, wasm-gc, js and native. |
| P2 v0.2.0 | CFF1/CFF2, WOFF/WOFF2, variations | Outlines and advance widths match FreeType at fauntlet's ppem grid and variation coordinate grid. WOFF2 reconstruction round-trips the same sfnt bytes as fontTools. `moonzip` is confined to an adapter package. |
| P3 v0.3.0 | Colour and bitmap extraction, SDF/MSDF, sub-setting | COLR/CPAL paint records match HarfBuzz paint callbacks; embedded PNG bytes decode through `moonimage`; subset output re-reads through fontTools without error. |
| P4 v0.4.0 | Hinting, gated | Only on an explicit decision. Hinting comparisons are a separate golden set with hint mode recorded per fixture. |

## Cross-Language Differential-Test Strategy

### Which oracle produces which golden fixture

| Golden fixture | Primary oracle | Secondary cross-check | Rationale |
| --- | --- | --- | --- |
| Table directory, required-table fields, format detection | fontTools `ttLib` TTX dumps | Go `sfnt.Parse` | fontTools is a read/write table-level tool with TTX round trips; it is not a rasteriser, so it is a neutral structural authority. |
| cmap codepoint to glyph id | fontTools TTX | Go `sfnt.Font::GlyphIndex` | Two independent decoders catch format 4 segment boundary errors. |
| Unhinted outlines at ppem 0 and at scaled sizes | FreeType via `freetype-py` or `FT_Outline_Decompose` | skrifa outline pens, `mizchi/font` SVG path output as a reference only | This is the fauntlet model. Always unhinted on both sides. |
| Metrics: advance, bearing, bbox | FreeType | ttf-parser / skrifa metrics | Both are unscaled font-unit or 26.6 fixed-point values, so comparison is exact. |
| 8-bit coverage masks, dimensions, bearings | FreeType `FT_RENDER_MODE_NORMAL`, flags pinned | Pillow `ImageFont.getmask` (which wraps FreeType) for convenience; stb_truetype, fontdue and ab_glyph as divergence probes only | FreeType is the reference for hinted and unhinted output. Secondary rasterisers use different anti-aliasing schemes, so they detect gross shape errors but are never bit-exact goldens. |
| WOFF/WOFF2 reconstruction | fontTools with Brotli | `bikallem/freetype` golden pipeline as a reference | P2 only. |
| COLR/CPAL, sbix, CBDT records | HarfBuzz paint and colour APIs | fontTools `colorLib` | P3 only. |
| Subset output | fontTools `subset` / `hb-subset` | klippa | P3 only. |
| Shaping and layout | None | None | Explicitly out of scope; belongs to the layout layer, so no golden is generated for it. |

C# is a functional reference, not an oracle. `SixLabors.Fonts` requires a build-time licence key from 2.2.0/3.0.0 under the Six Labors Split Licence, which makes a public, reproducible golden generator legally awkward; SkiaSharp is a binding to Skia rather than an independent decoder. Both are cited in the capability matrix and excluded from the oracle table. `[FACT]` from docs.sixlabors.com, fetched 2026-11-12.

### Fixture format

Plain, language-neutral, diffable data. No binary blobs that a reviewer cannot read, no third-party schema.

```text
fixtures/
  manifest.json          # corpus id, source URL, licence, sha256, format, ppem grid, glyph set
  oracles.lock           # exact tool versions, command lines, UTC generation date
  fonts/<id>.ttf         # licence-checked binaries; OFL, Apache-2.0 or BSD only
  <id>/tables.json       # sfnt signature, table directory, required table fields
  <id>/cmap.tsv          # codepoint_hex, glyph_id, platform/encoding, subtable format
  <id>/outlines.txt      # fauntlet-shaped: gid ppem hint points contours tags m l q c -
  <id>/metrics.tsv       # gid ppem advance lsb bbox_left bbox_top bbox_right bbox_bottom
  <id>/masks/<gid>_<ppem>.json  # width, height, bearing_x, bearing_y, coverage_hex
  <id>/masks/<gid>_<ppem>.png   # human review only; never read by the test
  <id>/oracle.json       # which oracle produced which file, version, command, date
```

`coverage_hex` is a base16 string of the raw 8-bit mask, so a MoonBit test needs only `moonbitlang/core` and `moonbase@0.4.5` base16 decoding in `integration/`. `outlines.txt` reuses the fauntlet record shape so the regularisation rules below have a documented precedent.

### Tolerances, pre-registered before any fixture is generated

Hinting off on both sides (`FT_LOAD_NO_HINTING`), no gamma, no stem darkening, no LCD or subpixel mode, single 8-bit grey channel. Oracle version, load flags, font SHA-256 and generation date are recorded in `oracles.lock` and `oracle.json`; see finding 10 for why this is mandatory.

| Class | Quantity | Threshold |
| --- | --- | --- |
| Structural | Table records, checksums, cmap entries, glyph ids, format detection | Exact |
| Metrics | Advance, bearing, bbox in font units or 26.6 fixed point | Exact unscaled; within 1 fixed-point unit when scaled |
| Outlines | Point coordinates after regularisation | Exact in font units; implicit on-curve midpoints within 0.5 font unit; scaled coordinates within 1/64 pixel |
| Mask geometry | Width, height, bearing_x, bearing_y | Exact; bearings within 1 pixel only where oracle rounding differs and the difference is recorded |
| Coverage | Per-pixel absolute difference | At most 24/255 for at least 99.0 per cent of pixels; no pixel above 64/255; at most 0.5 per cent of pixels above 48/255 |
| Coverage | Mean absolute error | At most 4/255 |
| Coverage | Ink mass, the sum of all coverage values | Within 2 per cent |
| Coverage | Binary silhouette at threshold 128 | Intersection over union at least 0.995 |

Regularisation is applied before outline comparison and is limited to the three differences fauntlet names: implicit contour closure, removal of degenerate move and line segments, and truncation of implicit on-curve midpoints. No other geometry is rewritten. The numeric coverage thresholds are `[INFER]`: they are proposed from the fact that FreeType computes exact area coverage at 1/256-pixel precision while stb, fontdue and ab_glyph accumulate coverage differently. They are pre-registered here, before data, per `opportunity-validation.md` section 3. One calibration round against the initial corpus is permitted to set them finally; a threshold may not be relaxed afterwards to make a failing test pass.

### Regeneration

A single dev-only Python script, `tools/difftest/regen.py`, is not a MoonBit package and is never imported by the library.

1. Read `fixtures/manifest.json` and verify each font's SHA-256.
2. Install or locate the exact tool versions in `oracles.lock`.
3. Invoke each oracle with the pinned command lines; write the golden files above.
4. Write `oracle.json` with producer, version, command and UTC date for every file.
5. Refuse to overwrite an existing golden unless `--bump` is supplied; print a unified diff of every change.
6. Require a `DECISIONS.md` entry with a reason for any golden that changes, and record the old oracle version.

The MoonBit side is a conformance harness in `integration/` that reads the goldens and compares. The full gate chain used by `moonvar@0.2.2` is the model: `moon clean`, `moon fmt`, `moon check --target all --deny-warn`, `moon build --target all`, `moon test --target all`, across wasm, wasm-gc, js and native. `[FACT]` from the mooncakes.io `moonvar` documentation, fetched 2026-11-12.

### Keeping the library free of third parties

- Oracles execute offline at fixture-generation time. Nothing from C, C++, C#, Python, Rust or Go runs at library build time, test time or runtime.
- Committed goldens are data, not code: JSON, TSV, text and a hex string. No C FFI, no WASM host import, no native bridge.
- Every `moon.pkg` import in the library is checked by a CI gate against a whitelist: `moonbitstack/*` first, `moonbitlang/*` (core, x, async) as the only fallback. Any other namespace fails the build.
- A second CI gate forbids `@ffi` and `extern` in library packages and asserts that the parser core has zero external imports.
- No source is copied from `mizchi/font` (no licence on the checked mirror), `Milky2018/moon_skrifa` (Apache-2.0) or `bikallem/freetype` (Apache-2.0). They are read for design and used as divergence references only.
- The corpus contains only freely redistributable fonts; the licence and source URL are in `manifest.json` for every file.

## Validation Before Build

This is an internal shared library with four named consumers, not a market product, so a paid fake-door test is not the cheapest falsifiable signal (`opportunity-validation.md` section 8). The concierge equivalent is a one-glyph integration spike before P1 is declared complete: wire one consumer backend to the v0.1.0 mask plus metrics, on all four backends, using one real TTF.

- Continue if the consumer accepts an `AlphaMask` plus advance and bearing without asking moonfont for an atlas, a shader or a platform text engine.
- Pivot if the consumer's contract requires pre-built atlases or a platform provider, because then the boundary in the "Out of scope" table is wrong and the integration surface must change.
- Stop condition, fixed in advance: if two consumer backends cannot consume the mask without moonfont taking on layout or caching, the v0.1.0 boundary is rejected and D-10 is reopened before any further parser work.

## Disconfirming Evidence <!-- 反证检索 -->

The obligation was to ask what would overturn each main conclusion and then actually search for it. Three searches were run on 2026-11-12: "moonbitstack font glyph text rasterisation package", "MoonBit font module charter", and the direct fetches of the three third-party MoonBit module pages.

- What would overturn "the gap is real": a `moonbitstack/*` font or glyph package already published, or a MoonBit module that already combines a zero-dependency core with a committed cross-language golden corpus. Search found no `moonbitstack` font package; the moonbitstack index lists formats, foundations, protocols and surface toolkits but no font module. The three third-party modules do far more than expected, so the naive claim "nobody has built a MoonBit font library" is **false and has been withdrawn**. Finding 7 is the corrected, narrower claim.
- What would overturn "rasterisation belongs in moonfont": an independent architecture arguing the opposite was found. `RFC 0004: mb-font Charter` in a public `moonbit-foundation` repository states that "the consumer rasterizes via mb-canvas", that pixel storage and codecs remain in `mb-image`, that shaping belongs to `mb-text`, and it defers WOFF/WOFF2, variable fonts, colour fonts, hinting and subsetting. It also argues that unhinted outlines guarantee determinism and that all parsing must be bounded. `[FACT]` the document exists at the cited URL; `[MISSING]` its provenance, date and authority relative to moonbitstack were not verified. **Conclusion modified**: we adopt its determinism, bounds and four-backend arguments, and we record the boundary disagreement as D-02 rather than silently assuming the task card wins. The task card text ("font parsing and glyph rasterisation") is the current instruction, so rasterisation is recommended to stay in, but this is a one-way door and the team-lead must confirm it.
- What would overturn "FreeType is a safe bit-exact oracle": finding 9 and finding 10 did. Anti-aliasing schemes differ and FreeType output changes between releases. **Conclusion modified**: outlines and metrics are compared exactly after documented regularisation; coverage masks use tolerances; the oracle version and load flags are pinned; secondary rasterisers are divergence probes, never goldens.
- What would overturn "shaping is out": `SixLabors.Fonts` and `mizchi/font` both ship layout, and `mizchi/font` explicitly says Latin and CJK render without complex shaping. **Conclusion upheld but narrowed**: simple horizontal advances and legacy `kern` pair lookup remain available as data in a later phase; full GSUB/GPOS shaping stays out. This is recorded in D-10.
- What would overturn "the consumer wants a mask": the `moonegui` backend contract and a third-party WGSL renderer both confirm an alpha-mask seam. No contradicting evidence was found. `[MISSING]` `moongfx`, `moonplot` and `moongame` could not be located as published packages, so the consumer claim rests on `PROJECT_STATE.md` and `moonegui@0.1.0` alone.

## Three Decisions <!-- 决策 -->

<!--
做: Ship v0.1.0 as one vertical slice from sfnt bytes to an 8-bit coverage mask, with an offline golden corpus.
不做: Take a dependency on any third-party MoonBit font module, or implement shaping, atlasing and caching.
待验证: Whether rasterisation stays inside moonfont or moves to the consumer, per the conflicting independent charter; confirm with the team-lead before P1 is frozen.
-->

- **Do**: ship v0.1.0 as one complete vertical slice from sfnt bytes to an 8-bit coverage mask, with `Limits`, `Refused`, four backends and an offline golden corpus generated by fontTools and FreeType.
- **Do not**: depend on any third-party MoonBit font module, and do not implement shaping, glyph atlasing, caching or file I/O in the library.
- **To be verified**: whether rasterisation stays inside moonfont or moves to the consumer, given the conflicting independent charter found in the disconfirming search. This needs the team-lead's confirmation before P1 is frozen; see D-02 in `DECISIONS.md`.

## Sources <!-- 来源 -->

| # | Type | URL | Retrieved |
| --- | --- | --- | --- |
| 1 | Primary | https://www.freetype.org/freetype2/docs/index.html | 2026-11-12 |
| 2 | Primary | https://freetype.org/freetype2/docs/ft2faq.html | 2026-11-12 |
| 3 | Primary | https://freetype.org/freetype2/docs/design/design-5.html | 2026-11-12 |
| 4 | Behavioural | https://www.freetype.org/ | 2026-11-12 |
| 5 | Primary | https://harfbuzz.github.io/glyphs-and-rendering.html | 2026-11-12 |
| 6 | Primary | https://harfbuzz.github.io/integration.html | 2026-11-12 |
| 7 | Behavioural | http://harfbuzz.org | 2026-11-12 |
| 8 | Primary | https://github.com/nothings/stb | 2026-11-12 |
| 9 | Primary | https://github.com/playcanvas/msdfgen/blob/3391f09d03deeae352e4cb089a9f70bb57e7f603/README.md | 2026-11-12 |
| 10 | Primary | https://docs.sixlabors.com/articles/fonts/ | 2026-11-12 |
| 11 | Primary | https://docs.sixlabors.com/articles/fonts/gettingstarted.html | 2026-11-12 |
| 12 | Primary | https://sixlabors.com/posts/announcing-fonts-100/ | 2026-11-12 |
| 13 | Primary | https://fonttools.readthedocs.io/ | 2026-11-12 |
| 14 | Primary | https://pillow.readthedocs.io/en/stable/reference/ImageFont.html | 2026-11-12 |
| 15 | Primary | https://github.com/harfbuzz/ttf-parser | 2026-11-12 |
| 16 | Primary | https://github.com/googlefonts/fontations/blob/main/fauntlet/README.md | 2026-11-12 |
| 17 | Primary | https://github.com/googlefonts/fontations/blob/main/font-test-data/test_data/README.md | 2026-11-12 |
| 18 | Secondary | https://deepwiki.com/googlefonts/fontations/7.2-fauntlet | 2026-11-12 |
| 19 | Secondary | https://sparkles.petar-kirov.dev/research/font-libraries/fontations.html | 2026-11-12 |
| 20 | Primary | https://lib.rs/crates/fontdue | 2026-11-12 |
| 21 | Secondary | https://sparkles.petar-kirov.dev/research/font-libraries/ab-glyph.html | 2026-11-12 |
| 22 | Primary | https://pkg.go.dev/golang.org/x/image/font/sfnt | 2026-11-12 |
| 23 | Secondary | https://sparkles.petar-kirov.dev/research/font-libraries/golang-image-font.html | 2026-11-12 |
| 24 | Primary | https://pkg.go.dev/github.com/KarpelesLab/gofreetype | 2026-11-12 |
| 25 | Secondary | https://vectree.io/c/how-font-rasterizers-like-freetype-scan-convert-truetype-outlines-scaling-grid-fitting-dropout-control-and-coverage-anti-aliasing | 2026-11-12 |
| 26 | Primary | https://moonbitstack.github.io/ | 2026-11-12 |
| 27 | Primary | https://mooncakes.io/docs/moonbitstack/moonvar@0.2.0 | 2026-11-12 |
| 28 | Primary | https://mooncakes.io/docs/moonbitstack/moonzip@0.3.4 | 2026-11-12 |
| 29 | Primary | https://mooncakes.io/docs/moonbitstack/moonimage | 2026-11-12 |
| 30 | Primary | https://mooncakes.io/docs/moonbitstack/moonucd@0.1.4 | 2026-11-12 |
| 31 | Primary | https://mooncakes.io/docs/moonbitlang/x@0.5.7 | 2026-11-12 |
| 32 | Primary | https://mooncakes.io/docs/moonbitlang/core@0.1.20261102+97801ee1b/bytes | 2026-11-12 |
| 33 | Behavioural | https://mooncakes.io/docs/Milky2018/moon_skrifa@0.2.0 | 2026-11-12 |
| 34 | Behavioural | https://mooncakes.io/docs/bikallem/freetype@0.5.3 | 2026-11-12 |
| 35 | Behavioural | https://gothub.projectsegfau.lt/mizchi/font | 2026-11-12 |
| 36 | Primary | https://mooncakes.io/docs/moonbitstack/moonegui@0.1.0 | 2026-11-12 |
| 37 | Behavioural | https://assets.mooncakes.io/assets/wzzc-dev/moui_wgpu_renderer@0.2.0/native_text_model.mbt.html | 2026-11-12 |
| 38 | Secondary | https://github.com/tchivs/moonbit-foundation/blob/main/docs/rfcs/0004-mb-font.md | 2026-11-12 |
| 39 | Secondary | https://everythingfonts.com/blog/inside-a-font-a-tour-of-a-ttf-file | 2026-11-12 |
| 40 | Primary | https://learn.microsoft.com/en-my/typography/opentype/otspec181/recom | 2026-11-12 |
| 41 | Secondary | https://fontsconverter.com/technical/font-file-anatomy | 2026-11-12 |

Freshness: all sources were fetched on 2026-11-12, so none is older than 30 days. No pricing, funding or market-share figures are used, so the 30-day price window does not apply. The `moonbitstack.github.io` version table is a snapshot and must be re-checked with `moon view moonbitstack` before any version is pinned in `moon.mod`.

## Unverified Register

Carried here rather than repeated above, so each fact has one home.

- Exact versions of `moonbitlang/core` and `moonbitlang/async`, and the installed `moon` build. `[MISSING]`
- Exact syntax for versioned imports in `moon.mod` and `moon.pkg`. `[MISSING]`
- Published existence and API of `moongfx`, `moonplot` and `moongame`. `[MISSING]`
- SkiaSharp shaping and sub-setting support; `uharfbuzz` and `freetype-py` direct documentation. `[MISSING]`
- The current Microsoft OpenType specification index; the 1.8.1 recommendations page was verified instead. `[MISSING]`
- Provenance, date and authority of `RFC 0004: mb-font Charter`. `[MISSING]`
- `mizchi/font@0.7.4` as a published version; the repository mirror was read but the version tag was not confirmed. `[MISSING]`
- Whether `moonbitlang/x` or `moonbitlang/async` should supply file reading for the `integration/` harness; the architect must confirm the installed API. `[MISSING]`
