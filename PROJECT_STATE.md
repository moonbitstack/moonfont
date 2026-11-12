# moonfont — project state

Last updated: 2026-11-12

## Goal

A pure MoonBit font library: font binary parsing, glyph outline extraction and
glyph rasterisation, shared by moonegui, moongfx, moonplot and moongame. A
latecomer design: derive the abstractions that mature ecosystems converge on,
then expose the smallest orthogonal surface, with cross-language differential
tests as the correctness oracle.

## Constraints (fixed, not negotiable)

- en-GB in every file, document, comment and commit message.
- No byline beyond the author's own sign-off. Commits use `-s` only.
- Local development only. `git init` has been done locally on branch `master`.
  No remote, no push, no publish.
- Dependencies: `moonbitstack/*` first, `moonbitlang/*` as the only fallback.
  Third-party MoonBit font modules are references and differential-test
  oracles, never dependencies.
- Pure computation in the library: no I/O, all four backends
  (wasm, wasm-gc, js, native).
- `moon info` -> `.mbti` -> `scripts/docs/gen_api.py` -> `docs/api.html`,
  deterministic and CI-checkable; `docs/` is the future GitHub Pages root.

## Phase

v0.1.0 vertical slice delivered. The library core, the differential-test
harness and the documentation site are all in place and pass every gate.
Deferred capabilities (CFF, WOFF, WOFF2, variable fonts, colour/bitmap glyphs,
subsetting, hinting) are scoped in `SPEC.md` and not part of v0.1.0.

## Delivered (paths only)

- `src/` — the library: `model`, `wire`, `sfnt`, `table`, `outline`, `raster`,
  `layout` and the `src/` façade. Zero external dependencies in the core.
- `src/testdata_test.mbt`, `src/font_test.mbt`, `src/corpus_test.mbt` — unit,
  end-to-end and hostile-corpus tests.
- `scripts/docs/gen_api.py` — the interface-export to static-page generator.
- `docs/` — `api.html`, `index.html`, `guide.html`, `showcase.html`,
  `difftest.html`, `style.css`, `site.js`, `theme.js`, `favicon.svg`,
  `difftest.json`.
- `scripts/difftest/` — `make_font.py`, `make_fixtures.py`, `verify_fixtures.py`,
  `index_fixtures.py`, `make_corpus.py`, `embed_corpus.py`.
- `integration/difftest/` — the corpus (39 cases) and the offline fixtures
  (6 categories, 470 checks).
- `research/` — `brief.md`, `systems-libraries.md`, `managed-libraries.md`,
  `longtail-and-architecture.md`, `corpus-conformance.md`.
- `SPEC.md`, `DESIGN.md`, `DECISIONS.md`, `contracts/` (API, DIFFTEST, LAYOUT),
  `evidence/` (verification, quality-gates, verdict).
- `README.md`, `Makefile`, `.github/workflows/` (ci, docs).

## Decisions

- D-02 — rasterisation stays inside moonfont (option A). Decided. The task card
  names glyph rasterisation; the library ships an 8-bit coverage mask.
- D-10 — no shaping (option A). Decided. moonfont exposes advances, bearings and
  optional legacy kern pair data only.
- Core dependency set — zero external packages in the parser core; reserved
  dependencies are documented in `SPEC.md` and `DECISIONS.md`.
- Static site stack — plain HTML/CSS/JS plus a Python generator, matching the
  sibling sites; `docs/` uploads directly to GitHub Pages with no build step.

## Gate status

All ten gates pass on every push to `master` (CI). Locally verified on
2026-11-12: `moon check --target all --deny-warn` clean, `moon test --target
all` 13/13 on wasm, wasm-gc, js and native, `moon fmt` clean, `moon info`
current, `gen_api.py --check` current, `embed_corpus.py --check` current,
`verify_fixtures.py --check` OK (470), `make_corpus.py --check` OK (39),
`check_snippets.py` clean. See `evidence/`.

## Next steps (deferred, not v0.1.0)

1. CFF1/CFF2 outlines and the OpenType `CFF`/`CFF2` tables.
2. WOFF/WOFF2 container adapters behind the reserved `moonzip` dependency.
3. Variable fonts: `fvar`/`avar`/`gvar`/`HVAR` instances and instancing.
4. Colour and bitmap glyphs (`COLR`/`CPAL`, `sbix`, `CBDT`) as extraction only.
5. Subsetting and symmetric `decode`/`encode` writing.
6. Optional `SDF`/`MSDF` render mode behind a second render-mode seam.
