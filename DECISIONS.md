# Decision Ledger: moonfont

Last updated: 2026-11-12. Phase 0-1 research. All entries are en-GB.

## How to read this ledger

Each entry records one decision, the options considered, a single RECOMMENDED
option, the rationale, who decides, the current status and the type of door.
A **one-way door** is costly or impossible to reverse later (public API shape,
scope boundary, oracle choice, licence). A **two-way door** can be changed
cheaply (an internal algorithm, a fixture field, a dependency added behind an
adapter). One-way doors are resolved before Phase 2 is frozen; two-way doors
may be resolved by the architect during implementation.

This document records recommendations only. It does not implement any of them.
Where a decision belongs to the user rather than to the team, it is marked
`Open - needs decision` and must be sent as a decision card, not settled here.
The research evidence behind every entry is in `research/brief.md`; facts are
not repeated here.

| Status | Meaning |
| --- | --- |
| `Fixed` | Set by the user's brief or by an existing project constraint; not open for renegotiation. |
| `Proposed` | A recommendation awaiting ratification by the named decider. |
| `Open - needs decision` | A genuine business or scope choice that requires the user. |

---

### D-01 - Format coverage for v0.1.0

- **Decision**: Which font containers, tables and glyph formats ship in the first release.
- **Options considered**: (A) SFNT with TrueType `glyf` outlines, TTC face index, `cmap` formats 0/4/6/12, required metric tables, and one 8-bit coverage rasteriser; (B) A plus CFF1, WOFF and WOFF2 in the same release; (C) A plus CFF1, CFF2, WOFF2, variations and colour glyphs in the same release.
- **RECOMMENDED**: A. One complete vertical slice from bytes to a coverage mask before widening.
- **Rationale**: B and C each add an independent interpreter or decompressor, which multiplies the difftest corpus and the hostile-input surface before a single glyph has been verified. `development-costs.md` section 10 puts "cut the maybe-later features" first. This matches `PROJECT_STATE.md` pending decision 1.
- **Who decides**: User, via team-lead.
- **Status**: `Proposed`.
- **Door**: One-way. Deferred formats remain reachable without an API break because they are new subpackages, not changes to the v0.1.0 types.

### D-02 - Whether rasterisation belongs inside moonfont

- **Decision**: Does the library emit an 8-bit coverage mask, or does it stop at outlines and let the consumer rasterise?
- **Options considered**: (A) moonfont rasterises; the consumer receives a mask plus metrics; (B) moonfont stops at outlines; the consumer rasterises via a canvas or GPU layer; (C) both, with rasterisation in an optional subpackage.
- **RECOMMENDED**: A, with C recorded as the fallback if the user prefers B. The task card explicitly names glyph rasterisation, and the consumer seam observed in `moonegui@0.1.0` and a third-party WGSL renderer is an alpha mask.
- **Rationale**: The disconfirming search found an independent public charter (`RFC 0004: mb-font Charter`) arguing the opposite: "the consumer rasterizes via mb-canvas", with pixel storage in `mb-image` and shaping in `mb-text`. Its provenance and authority relative to moonbitstack are unverified, but the disagreement is real and must not be assumed away. Option C is cheap insurance: an isolated `raster/` package can be consumed or ignored.
- **Who decides**: User, via team-lead. This is a scope and architecture boundary, not a technical detail.
- **Status**: `Decided - A`. The task card explicitly names glyph rasterisation, and the team-lead confirmed option A on the user's behalf; the implementation ships an 8-bit coverage mask plus metrics. D-02 is closed.
- **Door**: One-way. It determines the public API and which downstream package owns the pixel.

### D-03 - Outline representation

- **Decision**: What a glyph outline is in the public API.
- **Options considered**: (A) An owned value: contours of points with on-curve and off-curve flags, contour end indices, and a bounding box, with a pen or callback emitter on top; (B) A callback-only draw API with no iterable path; (C) A path object flattened to line segments at parse time.
- **RECOMMENDED**: A, with an optional pen emitter for consumers that want streaming output.
- **Rationale**: A is the intersection of FreeType's `FT_Outline` (points, contours, tags), Go `sfnt`'s `Segments`, HarfBuzz's `hb_draw_funcs_t` callbacks, and skrifa's pens. skrifa's documented weakness is that a callback-only representation makes a bounding box require a separate `ControlBoundsPen`; C loses quadratic curves and makes later SDF or hinting work lossy. Owned values also make golden comparison straightforward.
- **Who decides**: Architect.
- **Status**: `Proposed`.
- **Door**: One-way. It is the central public type and every downstream consumer depends on it.

### D-04 - Rasterisation algorithm for v0.1.0

- **Decision**: How an outline becomes an 8-bit coverage mask.
- **Options considered**: (A) Analytic area-coverage scanline accumulation in the style of FreeType `ftgrays`, at 1/256-pixel sub-pixel precision, with deterministic integer or fixed-point arithmetic; (B) N-times supersampling of a binary fill; (C) Signed-distance-field generation first, thresholded to a mask.
- **RECOMMENDED**: A, unhinted, single 8-bit grey channel, with a documented non-zero winding rule.
- **Rationale**: A is what the primary oracle produces, so tolerances in `research/brief.md` stay meaningful; it needs no supersampling buffer and gives identical output on wasm, wasm-gc, js and native. B is what stb_truetype does and produces systematically different edge values. C is a different product (SDF) deferred to v0.3.0. `msdfgen` and FreeType's `sdf` renderer show SDF belongs behind a second render-mode seam.
- **Who decides**: Architect, with the team-lead confirming the quality bar.
- **Status**: `Proposed`.
- **Door**: Two-way for the internal implementation, one-way for the mask format and winding rule.

### D-05 - Dependency set

- **Decision**: Which packages the library is allowed to import, and where.
- **Options considered**: (A) Zero external imports in the parser core; `moonbitstack/moonzip@0.3.8` reserved for a WOFF/WOFF2 adapter from v0.2.0; `moonbitstack/moonbase@0.4.5` used only in `integration/` for base16 fixture decoding; `moonbitstack/moonimage@0.1.4` and `moonbitstack/moonrgba@0.1.3` reserved for colour and bitmap glyph extraction from v0.3.0; `moonbitlang/core` as the only official package; (B) Add `moonbitstack/moonvar@0.2.2` to the core for big-endian reads; (C) Adopt one of the three third-party MoonBit font modules as a base.
- **RECOMMENDED**: A. This matches `PROJECT_STATE.md` pending decision 2.
- **Rationale**: B is tempting because `moonvar` supplies fixed-width big-endian reads, but moonfont's cursor must raise `Refused` carrying the byte offset and must keep a position relative to a table slice; a generic codec that returns `None` on a short view cannot supply that contract, so the ~170-line cursor is genuinely owned here. C is forbidden by the whitelist and, for `mizchi/font`, by the absence of a licence on the checked mirror. `moonucd@0.1.4` is deliberately excluded because shaping is out of scope (D-10); `moonmath`, `moonnum`, `moonstl`, `mooncrypt` and `moonbitlang/x` are excluded because nothing in the core needs them and `x` is documented as experimental and subject to frequent changes. The whitelist is a constraint, not a quota: adding a dependency is a one-way door that carries a transitive closure and four-backend verification cost.
- **Who decides**: Architect, within the fixed whitelist.
- **Status**: `Proposed` for the reservations; the whitelist itself is `Fixed`.
- **Door**: One-way for anything in a public package; two-way for adapter packages.

### D-06 - Error model

- **Decision**: How malformed, hostile and unsupported input is reported.
- **Options considered**: (A) A single `Refused` suberror type raised with `raise`, carrying byte offset and reason, plus a caller-supplied `Limits` record checked before every allocation; (B) `Result[T, E]` on every decode function; (C) Sentinel integer error codes.
- **RECOMMENDED**: A.
- **Rationale**: It is the established sibling style in `moonimage`, `moonzip` and `moonvar`, and it is already implemented in `src/model/error.mbt` with nine variants (`Unknown`, `Unexpected`, `Unsupported`, `Truncated`, `OverLimit`, `Malformed`, `MissingTable`, `MissingGlyph`, `Recursion`) and in `src/model/limits.mbt` with `default()` and `strict()` ceilings. B would infect every call site with error plumbing for untrusted input; C loses the offset that a bug report needs. `ttf-parser` independently documents "must not panic", bounded recursion and bounded total work for composite glyphs, COLRv1 paint graphs and CFF subroutines - the same hostile-input stance.
- **Who decides**: Fixed by the sibling style; architect confirms the variants.
- **Status**: `Fixed`.
- **Door**: One-way. A public suberror type is an API contract.

### D-07 - Target backends

- **Decision**: Which MoonBit compilation targets are supported and gated.
- **Options considered**: (A) wasm, wasm-gc, js and native, with one shared pure-computation core and no target-specific code; (B) wasm and native only; (C) A plus an optional native SIMD outline flattener behind a documented seam.
- **RECOMMENDED**: A for v0.1.0; C considered only after coverage and outline parity are proven.
- **Rationale**: It is fixed in the user's brief and `PROJECT_STATE.md`, and it is the gate chain documented for `moonvar@0.2.2`: `moon clean`, `moon fmt`, `moon check --target all --deny-warn`, `moon build --target all`, `moon test --target all`. Unhinted outlines are deterministic across targets, which is what makes one golden corpus usable on all four. B would exclude the browser consumers.
- **Who decides**: Fixed by the brief; architect owns the gate.
- **Status**: `Fixed`.
- **Door**: One-way for the portability promise, two-way for an optional acceleration adapter.

### D-08 - Primary difftest oracle

- **Decision**: Which external implementation generates the authoritative golden data.
- **Options considered**: (A) FreeType for outlines, metrics and coverage masks, with fontTools for table structure and cmap, plus Go `sfnt` and skrifa as secondary cross-checks; (B) HarfBuzz as the single oracle; (C) A MoonBit module such as `bikallem/freetype@0.5.3` as the oracle; (D) `SixLabors.Fonts` or SkiaSharp as the pixel oracle.
- **RECOMMENDED**: A.
- **Rationale**: FreeType is the reference that Google's `fauntlet` and `bikallem/freetype`'s 536 parity tests already compare against, and it is the only library in the survey that both parses and rasterises with published renderer semantics. fontTools is a neutral structural authority because it is not a rasteriser. B is wrong because HarfBuzz delegates rasterisation and does not implement hinting. C would be circular and would breach the dependency rule. D is constrained by a build-time licence key requirement from SixLabors.Fonts 2.2.0/3.0.0 and by SkiaSharp being a binding rather than an independent decoder. Oracle versions and load flags must be pinned because FreeType output changed in 2.14.2 and 2.15.0.
- **Who decides**: Architect, with the team-lead confirming that offline oracle execution is acceptable.
- **Status**: `Proposed`.
- **Door**: One-way. Changing oracle later invalidates every committed golden.

### D-09 - Fixture format, tolerances and regeneration

- **Decision**: What a golden fixture looks like, how much rasterisation divergence is allowed, and how goldens are regenerated.
- **Options considered**: (A) Plain JSON, TSV, fauntlet-shaped text and a base16 coverage string, committed to the repository, with pre-registered tolerances and a `--bump` regeneration script; (B) Binary PNG goldens compared pixel by pixel with zero tolerance; (C) Live oracle calls at test time through FFI or a local service.
- **RECOMMENDED**: A. Full detail, including the tolerance table, is in `research/brief.md` and has one home there.
- **Rationale**: B fails because anti-aliasing is not bit-identical across rasterisers and because FreeType output is version-dependent. C fails because it makes a third-party library a build-time dependency, which the brief forbids. A is the pattern used by fontations `font-test-data` and by `bikallem/freetype`'s Python golden generator. Tolerances are pre-registered before any fixture is generated and may not be relaxed to make a failing test pass.
- **Who decides**: Architect. One calibration round is permitted before enforcement.
- **Status**: `Proposed`.
- **Door**: Two-way for individual fields and thresholds; one-way for the fixture format once a corpus is committed.

### D-10 - Shaping and layout boundary

- **Decision**: Does moonfont shape text, and where do Unicode properties live?
- **Options considered**: (A) No shaping, no bidi, no line breaking, no grapheme segmentation; expose advances, bearings and optional legacy `kern` pair data only; (B) Basic kerning plus simple ligature substitution from `GSUB`; (C) Full shaping with GSUB/GPOS, bidi and itemisation.
- **RECOMMENDED**: A.
- **Rationale**: HarfBuzz owns shaping and explicitly delegates rasterisation; FreeType's FAQ excludes text layout; Go `sfnt` carries TODO comments for shaping and ligatures; fontdue calls shaping a non-goal; skrifa needs three more crates for a complete stack. This keeps `moonbitstack/moonucd@0.1.4` in the layout layer rather than in moonfont. The disconfirming evidence (`SixLabors.Fonts` and `mizchi/font` both ship layout) narrowed the recommendation rather than overturning it: simple horizontal advances and legacy `kern` pairs remain available as data.
- **Who decides**: Team-lead, with the architect. The user should confirm this if a consumer expects shaped text from moonfont.
- **Status**: `Decided - A`. The team-lead confirmed option A; moonfont exposes advances, bearings and optional legacy kern pair data only, with no shaping. D-10 is closed.
- **Door**: One-way. Adding shaping later would change the library's contract and dependency set.

### D-11 - Hinting and determinism

- **Decision**: Whether v0.1.0 executes TrueType hinting instructions or an autohinter.
- **Options considered**: (A) Unhinted outlines only, with hinting deferred to a gated later phase; (B) Embedded bytecode hinting in v0.1.0; (C) Autohinting in v0.1.0.
- **RECOMMENDED**: A.
- **Rationale**: Unhinted outlines guarantee that the same font and glyph id produce the same outline on every target, which is what makes one golden corpus valid across four backends. The `mb-font` charter found in the disconfirming search makes the same determinism argument. `fauntlet` currently excludes hinted glyphs; HarfBuzz does not implement hinting; `bikallem/freetype@0.5.3` needed roughly 160 opcodes plus a PostScript hinter and an autohinter, which is a tier-C cost. A v0.4.0 hinting phase would need its own golden set with hint mode recorded per fixture.
- **Who decides**: Architect; the team-lead confirms the quality trade-off at small sizes.
- **Status**: `Proposed`.
- **Door**: Two-way. An additive, explicitly requested render mode does not break the unhinted default.

### D-12 - Placement of sub-setting and colour/bitmap glyphs

- **Decision**: Where font writing and colour glyph extraction live.
- **Options considered**: (A) Both in separate subpackages from v0.3.0, with sub-setting as an encoder using symmetric `decode`/`encode` verbs and colour work as extraction only (no compositing); (B) Both in the core read path; (C) Dropped entirely.
- **RECOMMENDED**: A.
- **Rationale**: fontTools `subset`, `hb-subset` and `klippa` all treat writing as a distinct surface; Go `sfnt` states "this package does not provide an encoder"; skrifa exposes colour and bitmap glyphs as raw-table helpers rather than as pixels. Separation keeps the read path pure and keeps `moonimage@0.1.4` (which itself depends on `moonzip`) out of the core. C would omit two capabilities that the six-ecosystem survey shows are mature and that the named consumers may need for emoji.
- **Who decides**: Architect.
- **Status**: `Proposed`.
- **Door**: Two-way. Additive subpackages do not change the v0.1.0 API.

### D-13 - Language and attribution policy

- **Decision**: Writing standard and the absence of any attribution or signature.
- **Options considered**: (A) en-GB in every file, comment, document and commit message; no byline beyond the author's own sign-off; local development only, no remote, no push, no publish; (B) en-US; (C) en-GB with an extra byline in each file.
- **RECOMMENDED**: A, as a `Fixed` constraint.
- **Rationale**: Set by the user's brief and restated in `PROJECT_STATE.md`. B and C are not available options; they are listed so the choice is explicit rather than implicit. Spellings to hold: rasterisation, colour, behaviour, centre, normalise, analyse, licence (noun), grey, artefact. Code identifiers and direct quotations retain their source spelling.
- **Who decides**: Fixed by the user; no further decision.
- **Status**: `Fixed`.
- **Door**: One-way. Retroactive correction across a committed corpus is expensive.

### D-14 - Font corpus licence and redistribution

- **Decision**: Which font binaries may be committed to the fixture corpus.
- **Options considered**: (A) Only freely redistributable fonts (OFL, Apache-2.0, BSD), each with source URL, licence and SHA-256 in `manifest.json`; (B) Any convenient system font; (C) Synthetic fonts only.
- **RECOMMENDED**: A.
- **Rationale**: fontations `font-test-data` documents provenance and licence for every test font and supplies a rebuild script. `bikallem/freetype`'s parity corpus uses DejaVu Sans, Roboto, Source Code Pro and Noto Sans JP under open licences. B is a licence violation risk for a public repository; C alone cannot expose real-world cmap, composite glyph and CFF edge cases.
- **Who decides**: Team-lead, with the architect recording provenance.
- **Status**: `Proposed`.
- **Door**: One-way. A corpus with unclear licence terms cannot be published later.

---

## Technical Delegation Register

Technical choices are made by the architect, not by the product owner. This
table exists so the cost of each choice is visible in plain language. It is a
summary, not a second source of truth; the full entries are above.

| Choice | What was chosen | Why, in one line | Cost of changing it |
| --- | --- | --- | --- |
| Binary reads | An owned bounds-checked cursor over `BytesView` | A font is untrusted input and every failure must carry a byte offset | Low: internal to `wire/`, no public type changes |
| Outline type | Owned contours of points plus optional pen emitter | Comparable to FreeType, Go `sfnt` and HarfBuzz without losing quadratic curves | High: every consumer depends on this type |
| Rasterisation | Analytic area coverage, unhinted, 8-bit grey | Matches the primary oracle and is deterministic on all four backends | Medium: mask format is public, algorithm is not |
| Dependencies | Zero external imports in the core | Keeps four-backend portability and avoids a licence or churn liability | Low for adapters, high for anything public |
| Errors | One raised `Refused` with `Limits` | One handler for any table, with an offset for bug reports | High: public suberror type |
| Golden data | Plain text and hex committed offline | No third-party code enters the build | Medium: a committed corpus must be regenerated |
| Login, storage, network | Not applicable | The library performs pure computation over bytes | Not applicable |

## Open Items Requiring a Decision Card

Both entries below were settled during delivery and are recorded as decided:

1. **D-02**: rasterisation stays inside moonfont (option A). Confirmed by the team-lead on the user's behalf; the task card names glyph rasterisation.
2. **D-10**: no shaping (option A). Confirmed by the team-lead; moonfont exposes advances, bearings and legacy kern data only.

All other entries are recommendations for the named decider to ratify. No
implementation work, no version pinning in `moon.mod`, and no repository
operation has been performed as part of this ledger.
