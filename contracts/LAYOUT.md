# moonfont -- Repository Layout Contract

Version 1.0.0, covering `moonbitstack/moonfont` v0.1.0. en-GB throughout.

This document fixes the directory tree, the purpose of each directory, and the
dependency-direction rule. `contracts/LAYOUT.md` is the authority for where a
file belongs; `contracts/API.md` is the authority for what a package exposes;
`SPEC.md` section 3 is the authority for why the layers exist. A file in the wrong
directory is a layout defect even when it compiles.

---

## 1. The dependency-direction rule (binding)

Packages are numbered L0 (lowest) to L7 (highest), as in `SPEC.md` section 3.

- **A package may import only packages with a strictly lower layer number.**
  Importing a higher or equal-numbered sibling is forbidden.
- Siblings at the same layer never import one another. Shared vocabulary lives
  in L0 (`model`).
- L7 (`src/`, the facade) is the only package allowed to import all layers.
- Every `moon.pkg` import block is the machine-readable statement of the rule.
  A new import line is a design change, not an implementation convenience.
- Gate `LD-01`: `python3 scripts/gates/layer_direction.py` reads every
  `moon.pkg`, maps each imported path to its layer from the registry in section 3, and
  fails with `file:line` output on any upward or sideways import. The gate is
  mandatory in CI and must be run before a package is added.
- Gate `LD-02`: `moon info --target all && git diff --exit-code` proves that the
  committed `pkg.generated.mbti` files match the source. A new public type or
  function cannot land without its interface being reviewed.

Two facts make the rule cheap to check: there are eight packages, and no import
block in `src/` names a module outside `moonbitstack/moonfont/*`.

---

## 2. Directory tree

Paths marked `*` are required by this contract but not yet present in the working
tree; their absence is a known Phase 3 gap, not a licence to put the file
elsewhere. Paths without a mark are present.

```
moonfont/
|-- moon.mod                       Module manifest. Zero declared imports in v0.1.0.
|-- moon.work *                     Workspace linking the integration module by path.
|-- Makefile                        check / test / fmt / api / docs / site targets.
|-- LICENSE                         Apache-2.0.
|-- .gitignore                      Build artefacts, local scratch, editor files.
|-- .gitattributes *                Line-ending and binary-file rules.
|-- SPEC.md                         Authoritative technical specification.
|-- DECISIONS.md                    Decision ledger with options, deciders, door types.
|-- DESIGN.md                       Visual design of the documentation site.
|-- PROJECT_STATE.md                Phase, completed paths, in-flight work, next steps.
|-- README.md                       Short usage entry point (<= 120 lines).
|
|-- contracts/                      Binding contracts; only the architect signs these.
|   |-- API.md                      Public API: names, shapes, error cases, stability.
|   |-- DIFFTEST.md                 Fixture schema, tolerances, oracle pins.
|   |-- LAYOUT.md                   This file: tree and dependency direction.
|
|-- src/                            L7. The facade package `moonbitstack/moonfont`.
|   |-- moon.pkg                    Imports L0-L6; no other module.
|   |-- font.mbt                    decode, decode_all, Face methods, re-exports.
|   |-- font_test.mbt               Facade unit tests.
|   |-- corpus_test.mbt             Hostile-corpus replay tests.
|   |-- testdata_test.mbt           Embedded fixture byte literals.
|   |-- pkg.generated.mbti          Toolchain-written public interface. Never edited.
|   |
|   |-- model/                      L0. Contracts and domain model.
|   |   |-- moon.pkg                No authored imports.
|   |   |-- types.mbt               Bounds, Point, PathCommand, Outline, GlyphId,
|   |   |                           Scale, CoverageMask, metrics records.
|   |   |-- error.mbt               The single Refused suberror and its Show impl.
|   |   |-- limits.mbt              Limits record, default(), strict(), check_*.
|   |   |-- pkg.generated.mbti
|   |
|   |-- wire/                       L1. Byte source and random access.
|   |   |-- moon.pkg                Imports model only.
|   |   |-- cursor.mbt              Bounds-checked big-endian Cursor and windows.
|   |   |-- pkg.generated.mbti
|   |
|   |-- sfnt/                       L2. SFNT container and table directory.
|   |   |-- moon.pkg                Imports model, wire.
|   |   |-- directory.mbt           Signatures, TTC, Directory, TableRecord, tags.
|   |   |-- pkg.generated.mbti
|   |
|   |-- table/                      L3. Table decoders. One file per table family.
|   |   |-- moon.pkg                Imports model, wire.
|   |   |-- tables.mbt              Head, Hhea, Maxp, Hmtx, Loca, shared decoders.
|   |   |-- cmap.mbt                Cmap: formats 0/4/6/12, subtable selection.
|   |   |-- glyf.mbt                SimpleGlyph, CompositeGlyph, GlyphData.
|   |   |-- kern.mbt                Legacy kern pairs.
|   |   |-- os2.mbt                 OS/2 cap height, x-height, typographic metrics.
|   |   |-- pkg.generated.mbti
|   |
|   |-- outline/                    L4. Geometry, not pixels.
|   |   |-- moon.pkg                Imports model, table.
|   |   |-- build.mbt               GlyphSource, outline emission, composites.
|   |   |-- pkg.generated.mbti
|   |
|   |-- raster/                     L5. The only coverage producer.
|   |   |-- moon.pkg                Imports model ONLY. The seam is real.
|   |   |-- mask.mbt                Analytic area coverage in 26.6 fixed point.
|   |   |-- pkg.generated.mbti
|   |
|   |-- layout/                     L6. Measurement, not shaping.
|   |   |-- moon.pkg                Imports model, table.
|   |   |-- measure.mbt             Advance sums, kern pairs, letter spacing.
|   |   |-- pkg.generated.mbti
|   |
|   |-- cff/ *                      Reserved v0.2.0. CFF1/CFF2 outlines.
|   |-- woff/ *                     Reserved v0.2.0. WOFF/WOFF2; needs moonzip@0.3.8.
|   |-- variations/ *               Reserved v0.2.0. fvar/gvar/HVAR, VariationLocation.
|   |-- colour/ *                   Reserved v0.3.0. COLR/CPAL paint graph.
|   |-- subset/ *                   Reserved v0.3.0. Writer and Subsetter.
|
|-- integration/                    I/O boundary, outside the library module.
|   |-- difftest/                   Differential tests; replays committed fixtures.
|   |   |-- corpus/                 Synthetic hostile-input fonts (39 cases).
|   |   |   |-- README.md           Corpus provenance and regeneration notes.
|   |   |   |-- manifest.json       Exact expected variant, offset, reason, hash.
|   |   |   |-- *.ttf / *.bin       One damaged declaration or truncation each.
|   |   |-- fixtures/               Offline oracle parity goldens.
|   |   |   |-- README.md           Narrative explanation; subordinate to DIFFTEST.md.
|   |   |   |-- synthetic.ttf       Deterministic font under test.
|   |   |   |-- fixtures.json       Master canonical document.
|   |   |   |-- font/tables/cmap/metrics/outlines/coverage.json  Category files.
|   |   |   |-- *.sha256            One digest sidecar per font and JSON file.
|   |   |   |-- docs/difftest.json  Deterministic index and oracle pins.
|
|-- scripts/                        Offline tooling. Python 3, standard library.
|   |-- docs/
|   |   |-- gen_api.py              Reads every .mbti + /// comments; writes api.html.
|   |-- difftest/                   Fixture generation and verification.
|   |   |-- make_font.py            Builds synthetic.ttf with no clock reading.
|   |   |-- make_fixtures.py        Produces the parity goldens and sidecars.
|   |   |-- make_corpus.py          Builds or verifies the hostile-input corpus.
|   |   |-- verify_fixtures.py      Schema, canonical form, sidecar checks.
|   |   |-- index_fixtures.py       Rebuilds the deterministic docs index.
|   |   |-- embed_corpus.py         Emits MoonBit byte literals for the corpus.
|   |-- gates/ *
|   |   |-- layer_direction.py      LD-01: upward and sideways import check.
|   |-- check_snippets.py           Proves documented code compiles.
|
|-- docs/                           Static GitHub Pages root. No build step.
|   |-- api.html                    Derived from .mbti + /// comments. Deterministic.
|   |-- index.html *                Landing page.
|   |-- guide.html *                Usage guide.
|   |-- style.css / theme.js *      Presentation; one locked SVG icon set, no emoji.
|
|-- research/                       Survey briefs. Phase 1 inputs, read-only here.
|   |-- brief.md                    Consolidated research brief.
|   |-- systems-libraries.md        C, C++, Rust, Go survey.
|   |-- managed-libraries.md        JVM, .NET, JS, Python survey.
|   |-- longtail-and-architecture.md  Long-tail languages and synthesis.
|
|-- evidence/                       Verification evidence and gate verdicts.
|
|-- .github/workflows/              CI and Pages workflows.
|   |-- ci.yml                      Four-backend gates + Linux differential replay.
|   |-- docs.yml                    Interface check, --check, Pages artefact upload.
|
|-- .probe/                         Local scratch, ignored by git.
|-- _build/                         Toolchain artefacts, ignored by git.
```

### Purpose of each top-level directory, in one line

| Directory | Purpose |
| --- | --- |
| `contracts/` | The three binding contracts signed by the architect; the only place names, fixtures and layout are fixed. |
| `src/` | The library: eight public packages in eight layers, facade first. |
| `integration/` | The only place I/O and offline fixtures live, outside the library module so the library stays pure. |
| `scripts/` | Offline Python tooling that produces derived artefacts; no runtime dependency of the library. |
| `docs/` | Static, deterministic Pages root, derived from the interfaces and source comments. |
| `research/` | Phase 1 survey briefs from other languages; inputs, not deliverables. |
| `evidence/` | Verification evidence and gate verdicts, committed so a claim can be audited. |
| `.github/workflows/` | CI gates and the Pages artefact workflow; deployment is a later phase. |

---

## 3. Layer registry (input to gate LD-01)

The gate maps an imported package path to a number. An import whose number is not
strictly less than the importer's number is a failure.

| Layer | Package path | May import |
| --- | --- | --- |
| L0 | `moonbitstack/moonfont/model` | nothing |
| L1 | `moonbitstack/moonfont/wire` | `model` |
| L2 | `moonbitstack/moonfont/sfnt` | `model`, `wire` |
| L3 | `moonbitstack/moonfont/table` | `model`, `wire` |
| L4 | `moonbitstack/moonfont/outline` | `model`, `table` |
| L5 | `moonbitstack/moonfont/raster` | `model` |
| L6 | `moonbitstack/moonfont/layout` | `model`, `table` |
| L7 | `moonbitstack/moonfont` | `model`, `wire`, `sfnt`, `table`, `outline`, `raster`, `layout` |

Notable consequences, all intentional:

- `raster` imports `model` and nothing else. It cannot see SFNT, a table, a
  charmap or a glyph id. This is the proof that the parser has no raster concerns.
- `layout` imports `model` and `table` but not `outline` or `raster`. Measurement
  needs advances and kern data, never geometry.
- `outline` imports `table` for decoded glyph values, not `wire`: it never
  re-reads raw table bytes.
- `wire` and `sfnt` do not import `table`. A decoder cannot influence how the
  directory is read.
- No package imports the facade. Nothing below L7 knows a `Face` exists.
- A reserved subpackage (`cff`, `woff`, `variations`, `colour`, `subset`) takes
  its layer from the capability it implements and is added to this table in the
  same change that creates it. Until then it is not in the registry and any
  import of it fails LD-01.

---

## 4. Placement rules

1. A `.mbt` file that reads bytes belongs in `wire`; one that parses a table
   belongs in `table`; one that emits `PathCommand` belongs in `outline`; one
   that produces a sample belongs in `raster`. A file that does two of these is
   in the wrong place and must be split.
2. A single source file must not exceed 300 lines. Split by responsibility, not
   by line count alone.
3. Every public declaration carries a `///` doc comment and a `///|` separator.
   The docs generator reads those comments; a public item without one loses its
   prose on the site.
4. Test files live beside the code they test (`*_test.mbt`) or in
   `integration/difftest/`. A test that needs a font binary uses a byte literal
   emitted offline, never a file read: three of the four backends have no
   filesystem.
5. No `*_wasm.mbt`, `*_js.mbt` or `*_native.mbt` under `src/`. One source for
   four backends.
6. Derived artefacts are committed: `pkg.generated.mbti`, `docs/api.html`, the
   hostile corpus and `manifest.json`, `fixtures.json` with every category file
   and SHA-256 sidecar, `fixtures/docs/difftest.json`, and the embedded `.mbt`
   fixture literals.
   CI proves they are current; it does not regenerate them.
7. No file carries a byline, an attribution line or a licence trailer naming
   a contributor. The `LICENSE` file at the root is the only
   licence statement, and source-file headers carry the SPDX identifier alone.
8. Adding a package: create `src/<name>/moon.pkg` and its `.mbt` files, add its
   layer number to section 3, run `python3 scripts/gates/layer_direction.py`, then
   `moon info --target all`, then `python3 scripts/docs/gen_api.py`. The glob in
   the generator discovers the new `pkg.generated.mbti` without a list edit.

---

## 5. Verification

```
python3 scripts/gates/layer_direction.py
moon check --target all --deny-warn
moon info --target all && git diff --exit-code
python3 scripts/docs/gen_api.py --check
```

A clean run means the tree, the interfaces and the site agree. Any failure names
the file and line. There is no waiver for LD-01 or LD-02: an upward import or an
out-of-date interface is fixed, never exempted.
