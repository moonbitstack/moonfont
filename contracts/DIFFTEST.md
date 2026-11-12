# moonfont -- Differential-Test Contract

Version 1.0.0, covering `moonbitstack/moonfont` v0.1.0. en-GB throughout.

This document fixes the fixture schema, field names, comparison rules,
per-category tolerances, oracle versions and the regeneration script interface.
`SPEC.md` section 11 states the architecture; `integration/difftest/fixtures/README.md`
is the narrative explanation and is subordinate to this contract. Where the two
disagree, this file wins and the README is corrected. Tolerances are
**pre-registered before any golden is consumed** and may not be relaxed to make
a failing test pass (`DECISIONS.md` D-09). One calibration round is permitted
before enforcement; it must be recorded as a dated entry in this file.

---

## 1. Governing rule

Fixtures are produced **offline** by reference implementations written in other
languages, committed to the repository as plain data, and replayed by MoonBit
tests. At test time there is no oracle process, no FFI, no network, no Python
package beyond the standard library, and **no third-party MoonBit module**. The
MoonBit test suite resolves only `moonbitlang/core` and this module's own
packages. CI replays committed fixtures; it never calls an oracle.

Two corpora, both offline, both committed:

| Corpus | Producer | Purpose | State |
| --- | --- | --- | --- |
| `integration/difftest/corpus/` | `scripts/difftest/make_corpus.py`, Python standard library only, synthetic bytes | Hostile-input and legal-but-unusual behaviour: asserts exact `Refused` variants and offsets | Present, 39 cases |
| `integration/difftest/fixtures/` | `scripts/difftest/make_font.py` + `make_fixtures.py`, offline Python oracles | Parity of font structure, tables, charmap, metrics, outlines and coverage | Present, master document plus six category files |

The hostile corpus is a deterministic byte constructor, not an oracle; its
authority is the specification. The parity corpus is where an independent
implementation supplies the expected answer. Neither corpus may call a MoonBit
module.

## 2. Language-neutral fixture format

| Encoding | Used for | Rules |
| --- | --- | --- |
| Raw bytes | `corpus/*.ttf`, `corpus/*.bin`, `fixtures/synthetic.ttf` | Unmodified file bytes, SHA-256 identified. |
| JSON | `corpus/manifest.json`, `fixtures/*.json`, `fixtures/docs/difftest.json` | UTF-8, LF endings, `sort_keys=True`, `indent=2`, `ensure_ascii=True`, one trailing newline. Integer values stay integers. `ink_coverage` is the only floating value and is rounded to six decimal places before emission. |
| SHA-256 sidecars | `fixtures/*.sha256` | One line: `<lowercase hex digest>  <filename>`. One sidecar per font and per JSON file. |
| base16 | Reserved | Per-pixel coverage masks are **not** stored in v0.1.0. Coverage is compared as a summary because anti-aliasing is not portable bit for bit. See section 8. |

No fixture may contain a timestamp, an absolute path, a hostname, a build date
or an unordered map. Object keys are sorted, arrays are emitted in glyph-id
order, and codepoint keys are four upper-case hexadecimal digits (`"0041"`) so
lexicographic order matches numeric order. Regeneration on two machines with the
same pinned oracle versions must produce byte-identical files.
`verify_fixtures.py` rejects any JSON file whose bytes differ from a fresh
canonical re-serialisation.

## 3. Hostile-input manifest -- exact schema

File: `integration/difftest/corpus/manifest.json`. A single JSON object keyed by
filename. Keys are sorted. Each value has these fields:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `variant` | string or `null` | yes | Exact `Refused` variant name expected, or `null` when the file must be accepted. Must be one of the nine names in `contracts/API.md` section 4. |
| `offset` | integer or `null` | yes | Absolute byte offset of the damaged field, or `null` when no single offset applies. When non-null the reader's `Refused.at` must match. |
| `reason` | string | yes | One line, en-GB, stating what is damaged and why the reader must behave as it does. Never empty. |
| `legal_but_unusual` | boolean | yes | `true` means the file is out of the ordinary but must be accepted; such a case has `variant: null`. |
| `sha256` | string | yes | Lower-case SHA-256 hex digest of the exact file bytes. |
| `ceiling` | string | no | Which `Limits` field the case breaches: `file_bytes`, `table_bytes`, `glyphs`, `points`, `contours`, `composites`, `recursion`, `mask_pixels`. Present only on ceiling cases. |
| `limits_profile` | string | no | `default` or `strict`; which `Limits` to use. Absent means `default`. A case that passes under `default` and fails under `strict` must be replayed under both. |

Field names are frozen. Adding a field is additive and requires a version bump
of this file; renaming one invalidates every fixture. The corpus has 39 cases:
34 refusals carrying a named variant, and 5 acceptances with `variant: null`
(one unmodified control plus four `legal_but_unusual` files). Every one of the
nine `Refused` variants is exercised.

Statutory checks (`make_corpus.py --check` and `verify_fixtures.py`):

1. Every `*.ttf` / `*.bin` in the directory has a manifest entry; every entry
   has a file. No stray binaries.
2. Every file's SHA-256 matches `sha256`.
3. Every `variant` is a legal variant name; `legal_but_unusual: true` implies
   `variant: null`.
4. Every `ceiling` names a real `Limits` field; every `limits_profile` is
   `default` or `strict`.
5. Regenerating in memory reproduces every entry and hash without writing.

## 4. Parity master document -- exact schema

Root: `integration/difftest/fixtures/`. Master file `fixtures.json` has schema
`moonfont.difftest/1`; the docs index `fixtures/docs/difftest.json` has schema
`moonfont.difftest.index/1`. The master has **exactly** these top-level keys, no
more and no fewer:

`schema`, `categories`, `tolerances`, `font`, `oracle`, `tables`, `cmap`,
`metrics`, `outlines`, `coverage`.

- `categories` is the fixed array `["font", "tables", "cmap", "metrics",
  "outlines", "coverage"]`. Each name is also emitted as its own category file
  (`font.json`, `tables.json`, `cmap.json`, `metrics.json`, `outlines.json`,
  `coverage.json`) with a SHA-256 sidecar.
- `tolerances` maps each category name to a fixed human-readable rule string.
  The exact strings are owned by `make_fixtures.TOLERANCES` and reproduced in
  section 6; a change to any string requires a version of this file.
- `font`: `file`, `sha256`, `sfnt_version`, `num_tables`, `table_tags`,
  `units_per_em`, `num_glyphs`, `index_to_loc_format`. Version-like values are
  `"0x..."` strings. `table_tags` is sorted.
- `oracle`: `name`, `version`, `providers`, `raster_algorithm`, `raster_grid`,
  `raster_samples_per_axis`, `raster_y_axis`, `moonbit_raster_algorithm`,
  `library_versions`. `providers` maps every category to the producer label
  that actually made it, so no section is silently self-referential.
- `tables`: an object with `head`, `hhea`, `maxp`. `head` fields: `version`,
  `font_revision`, `check_sum_adjustment`, `magic_number`, `flags`,
  `units_per_em`, `created`, `modified`, `x_min`, `y_min`, `x_max`, `y_max`,
  `mac_style`, `lowest_rec_ppem`, `font_direction_hint`,
  `index_to_loc_format`, `glyph_data_format`. `hhea` fields: `version`,
  `ascender`, `descender`, `line_gap`, `advance_width_max`,
  `min_left_side_bearing`, `min_right_side_bearing`, `x_max_extent`,
  `caret_slope_rise`, `caret_slope_run`, `caret_offset`, `metric_data_format`,
  `number_of_h_metrics`. `maxp` fields: `version`, `num_glyphs`, `max_points`,
  `max_contours`, `max_composite_points`, `max_composite_contours`,
  `max_zones`, `max_twilight_points`, `max_storage`, `max_function_defs`,
  `max_instruction_defs`, `max_stack_elements`, `max_size_of_instructions`,
  `max_component_elements`, `max_component_depth`.
- `cmap`: an object mapping four-digit upper-case hex codepoint strings to
  integer glyph ids. The `0xFFFF` sentinel is excluded.
- `metrics`: an array in ascending glyph-id order. Each object has `glyph_id`,
  `advance`, `lsb`, `bounds` (`[x_min, y_min, x_max, y_max]` in font units) and
  `scaled_bounds` (the same box scaled to a 64-pixel em square with
  `round(v * 64 / unitsPerEm)`).
- `outlines`: an array in ascending glyph-id order. Each object has `glyph_id`
  and `commands`. A command is an array whose first element is `"move"`,
  `"line"`, `"quad"` or `"close"`: `["move", x, y]`, `["line", x, y]`,
  `["quad", cx, cy, x, y]`, `["close"]`. All coordinates are integer font
  units, y up. A contour begins with `move` and ends with `close`; the closing
  segment back to the start is emitted explicitly. Consecutive off-curve points
  are resolved into implied on-curve midpoints. Composite glyphs are
  decomposed into concatenated component streams with component offsets added.
  Empty glyphs have an empty command list.
- `coverage`: an array in ascending glyph-id order. Each object has `glyph_id`,
  `ink_coverage` and `ink_bbox`. `ink_coverage` is summed subpixel coverage
  over a 64 by 64 pixel em square, divided by 4096, as a percentage in
  `[0, 100]`, rounded to six decimal places. `ink_bbox` is
  `[min_x, min_y, max_x, max_y]`, the inclusive pixel indices with non-zero
  coverage in a y-up frame whose origin is the bottom-left of the em square,
  or `null` for an empty glyph. **Only the summary is stored, never a raw
  bitmap.**

The font under test, `synthetic.ttf`, is built by `make_font.py` with no clock
reading: `created` and `modified` are zero, `head.checkSumAdjustment` is
computed, table offsets are four-byte aligned and `loca` is monotonic. It has
nine tables, `unitsPerEm = 1000`, `indexToLocFormat = 1`, six glyphs, a single
Windows Unicode BMP `cmap` format 4 subtable and a composite glyph with two
components. Its SHA-256 is recorded in `font.sha256` and in the sidecar.

## 5. Oracle assignment and exact version pins

The default and committed oracle is `reference`: an independent pure-standard-
library SFNT parser and an 8 by 8 uniform-grid supersampling rasteriser with a
non-zero winding test on flattened quadratic edges (32 segments per curve). It
is independent of the MoonBit implementation in two ways -- a separate parser
and a two-dimensional sample-counting fill rather than the exact-horizontal-area
vertical subsampling in `src/raster/mask.mbt`. No third-party package is needed
to regenerate the committed goldens.

| Oracle | Language | Pinned version | Provider | Authoritative for |
| --- | --- | --- | --- | --- |
| `reference` | Python | `1.0.0` (`make_fixtures.ORACLE_VERSION`) | Independent standard-library parser and supersampler | Every category; committed goldens |
| `fonttools` | Python | `4.47.2` | fontTools for table fields, cmap, metrics, outlines; the independent supersampler for coverage | Secondary cross-check |
| `pillow` | Python | `10.1.0` (binding FreeType `2.15.0`) | Independent parser for structure; `ImageFont.getmask2` for coverage | Secondary cross-check |
| Python interpreter | -- | `3.11+` | All three | Rounding and float formatting are explicit so the interpreter cannot silently change a committed number |

`make_fixtures.ORACLE_PINS` holds these exact pins and `index_fixtures.py`
reports them in `docs/difftest.json` under `oracle_versions.pins`, together with
the toolchain version and any version detected at generation time under
`oracle_versions.recorded`. A consumer can therefore tell which environment
produced a given set of numbers.

Rules:

- If `fonttools` or `pillow` is requested but not installed, `make_fixtures.py`
  exits with a clear error and writes nothing. It never falls back to
  `reference` data while labelling the output as a third-party oracle.
- Changing `ORACLE_VERSION`, the font builder, the parser, the rasteriser, the
  grid size or the sample count requires incrementing the constant and
  regenerating **every** golden in one commit.
- FreeType output changed in 2.14.2 and 2.15.0. A FreeType version bump is a
  one-way door: it invalidates every coverage golden and requires a full,
  reviewed re-baseline.
- Load flags are fixed by construction. The synthetic font carries no hinting
  instructions, no embedded bitmaps and no variation data, so there is no
  hinting mode, stem darkening, LCD filter or gamma to configure. Both
  rasterisers operate unhinted on the same unscaled outlines. **Hinting is
  excluded from the corpus entirely.**
- Floating to `latest` is forbidden. The pins above are the contract; a
  substitution must be recorded and the corpus re-baselined.

**Reserved cross-language oracles.** The Phase 1 survey covers C FreeType,
HarfBuzz, stb_truetype, libschrift, fontconfig and msdfgen; C++ Skia and
DirectWrite; Rust skrifa, read-fonts, ttf-parser, fontdue, ab_glyph and
rustybuzz; Go `x/image/font/sfnt` and `golang-freetype`; JS opentype.js,
fontkit and Typr; Python fontTools and freetype-py; C# SixLabors.Fonts; Java
FontBox and PDFBox; Swift CoreText; Ruby TTFunk; PHP php-font-lib; Kotlin
Android Typeface; Haskell FontyFruity. These are design references and
secondary cross-checks, not active golden producers in v0.1.0. Wiring any of
them in requires a new version of this file with exact pins, and a corpus
re-baseline. SixLabors.Fonts is excluded from consideration because releases
2.2.0/3.0.0 require a build-time licence key; SkiaSharp is a binding rather
than an independent decoder. Every third-party **MoonBit** font module
(`mizchi/font`, `bikallem/freetype`, `Milky2018/moon_skrifa`) is excluded
absolutely: it would be circular and would breach the dependency rule.

## 6. Comparison rules and per-category tolerances

### Universal rules

- Compare variant names and field labels exactly, before comparing values.
- A missing field is a failure, never a default.
- A test may not weaken a tolerance locally. Changing a tolerance means a new
  version of this file, a corpus re-baseline and a recorded reason.
- Every case is replayed on all four backends. A divergence between backends is
  a failure even when both pass against the oracle (INV-08).
- Anti-aliasing and hinting are **not bit-identical** across rasterisers.
  Hinted glyphs are excluded; the coverage comparison is therefore a summary,
  never a per-pixel bitmap comparison.
- Structural integers are compared exactly. No rounding is permitted on font
  units, table fields, glyph ids or codepoint mappings.
- The `reference` and `fonttools` coverage values come from the independent
  8x8 supersampler; the `pillow` values come from FreeType's 8-bit grey
  rasteriser converted to the same y-up em-square frame. Different algorithms
  are the point, not a defect.

### Per-category table

| Category | Compared | Tolerance | Additional rule |
| --- | --- | --- | --- |
| `font` | every field including `sha256` and sorted `table_tags` | `"exact"` | Version-like strings are compared as strings. |
| `tables` | every `head`, `hhea` and `maxp` field | `"exact"` | All values are unscaled integers or version strings. |
| `cmap` | full codepoint-to-glyph-id mapping | `"exact"` | Sentinel `0xFFFF` excluded; unmapped codepoints must be absent, and a missing glyph must be `None` in the reader. |
| `metrics` | `advance`, `lsb`, `bounds` | `"exact"` | Integer font units. |
| `metrics` | `scaled_bounds` | `"one_pixel"` | At most 1 pixel on any side, because engines round scaled boxes differently. |
| `outlines` | command verb sequence and every integer coordinate | `"exact"` | Exact **after** canonicalisation, which is limited to removing degenerate closing segments and inserting implied on-curve midpoints. No other geometry may be rewritten. Quadratic curves must remain quadratic. |
| `coverage` | `ink_coverage` | `"five_percent"` | Agree within 5 per cent of the oracle value. |
| `coverage` | `ink_bbox` | `"one_pixel"` | May differ by at most 1 pixel on each side; `null` must match `null`. |
| error variants | variant name, `at` where non-null | `"exact"` | `Show` prose is not compared; only variant, labels and values. |
| `limits` | `variant`, `ceiling`, `limit`, `got`, `at` | `"exact"` | Replayed under both `default` and `strict` where the manifest says so. |

The contract names these rules `exact`, `one_pixel` and `five_percent`. The
exact strings stored in `make_fixtures.TOLERANCES` are:

| Category | Stored string |
| --- | --- |
| `font` | `exact` |
| `tables` | `exact` |
| `cmap` | `exact` |
| `metrics` | `advance, lsb and bounds exact; scaled_bounds within 1 pixel` |
| `outlines` | `exact after canonicalisation` |
| `coverage` | `ink_coverage within 5 per cent; ink_bbox within 1 pixel` |

They are pre-registered, reported in `docs/difftest.json` and fixed by this
contract. A tolerance may never be widened in the same change that fixes a
failing test.

## 7. Regeneration script interface

All scripts are Python 3, standard library only except where a named oracle is
explicitly requested. Every script accepts `--help`. Every script that writes
also has a `--check` mode that rebuilds in memory, compares byte-for-byte with
the committed files, prints a `path:line` diff on a mismatch and exits non-zero
**without writing anything**.

| Script | Invocation | Contract |
| --- | --- | --- |
| `scripts/difftest/make_font.py` | `python3 scripts/difftest/make_font.py [--check]` | Builds `fixtures/synthetic.ttf`. `--check` rebuilds twice in memory, compares the two digests and the committed font, writes nothing. No clock, no network. |
| `scripts/difftest/make_fixtures.py` | `python3 scripts/difftest/make_fixtures.py --oracle reference [--check]` | Produces `fixtures.json`, the six category files, all sidecars and the docs index. `--oracle` accepts `reference`, `fonttools` or `pillow`; a missing third-party package is a loud failure. The committed goldens use `reference`. |
| `scripts/difftest/make_corpus.py` | `python3 scripts/difftest/make_corpus.py [--check] [--out DIR]` | Builds or verifies the 39 hostile-input fonts and `manifest.json`. Write mode prints per-variant counts. |
| `scripts/difftest/verify_fixtures.py` | `python3 scripts/difftest/verify_fixtures.py [--check]` | Validates schema, canonical JSON form, SHA-256 sidecars, required fields, internal consistency and the structural invariants of `synthetic.ttf`. `--check` additionally rebuilds the master document in memory and compares its canonical bytes. |
| `scripts/difftest/index_fixtures.py` | `python3 scripts/difftest/index_fixtures.py [--check] [--output PATH]` | Rebuilds `fixtures/docs/difftest.json` deterministically and reports the oracle pins. `--output` can place the identical payload in the repository-level `docs/` directory later. |
| `scripts/difftest/embed_corpus.py` | `python3 scripts/difftest/embed_corpus.py [--check]` | Emits MoonBit source literals for the hostile corpus so the tests need no filesystem. Escapes every byte outside printable ASCII; LF endings; UTF-8; no attribution line. |
| `scripts/docs/gen_api.py` | `python3 scripts/docs/gen_api.py [--check]` | Interface-to-HTML pipeline; see `SPEC.md` section 12. |
| `scripts/check_snippets.py` | `python3 scripts/check_snippets.py` | Proves documented code compiles. |
| `scripts/gates/layer_direction.py` | `python3 scripts/gates/layer_direction.py` | Reads every `moon.pkg` and asserts the rule in `contracts/LAYOUT.md`. `*` marks a script required by this contract but not yet present. |

### Full regeneration recipe (offline, maintainer-initiated)

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

To regenerate with a third-party oracle, replace the third command with
`--oracle fonttools` or `--oracle pillow`. That changes `oracle.providers` and
the `coverage` values, so `fixtures.json` and every sidecar must be regenerated
and reviewed together as one change.

### CI shape

`.github/workflows/ci.yml` has two jobs. `build` runs on three operating systems
with the four-backend gate chain: `moon check --target all --deny-warn`,
`moon build --target all`, `moon test --target all`, `moon fmt && git diff
--exit-code`, `moon info --target all && git diff --exit-code`,
`python3 scripts/docs/gen_api.py --check`, and
`python3 scripts/check_snippets.py`. `difftest` runs on Linux only:
`python3 scripts/difftest/verify_fixtures.py` then
`moon test --target all integration/difftest`.

CI never installs fontTools, Pillow, FreeType, Go, Rust or any MoonBit module
from outside this repository. It never calls `make_fixtures.py`. Oracle drift is
caught by the committed sidecars and by `--check` during offline regeneration,
not in CI.

## 8. Reserved extensions (not contracted in v0.1.0)

Two capabilities are deliberately not opened. Both require a new version of
this file and a corpus re-baseline, and neither may be added as a stub.

- **Per-pixel coverage masks in base16.** Storing a full 64 by 64 mask and
  comparing it with per-sample tolerances (for example `<= 32` on a 0-255
  scale for 99 per cent of samples, ink mass within 2 per cent, exact interior
  and exterior samples) is a valid design but would tie the goldens to one
  rasteriser's anti-aliasing. The summary comparison in section 4 is the v0.1.0
  answer. A later release may add masks **alongside** the summary, never in
  place of it.
- **Additional cross-language oracles.** The languages listed at the end of
  section 5 may be wired in as secondary cross-checks. Each addition pins exact
  versions, records its producer in `oracle.providers`, and leaves the
  `reference` goldens unchanged.

## 9. Regeneration is a reviewed act

Changing an oracle version, a tolerance, a fixture field name, the schema
string or the corpus format is a one-way door. Each such change requires: a
dated entry in this file stating the old value, the new value and the reason; a
full regeneration; an incremented `ORACLE_VERSION` where the reference
implementation changed; fresh sidecars; a regenerated `docs/api.html` where the
public surface changed; and a note in `DECISIONS.md` for the corresponding
decision. A tolerance may never be widened in the same change that fixes a
failing test.
