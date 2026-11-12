# Differential-test fixtures

This directory holds the offline golden data used to compare the MoonBit font
reader and coverage rasteriser against independent oracles. Everything here is
plain data: JSON, SHA-256 sidecars and one TrueType font. No network access, no
FFI, no third-party MoonBit module and no live oracle call is needed to consume
it.

The data is en-GB throughout, contains no timestamps and is reproducible byte
for byte. Regeneration is a pure function of `scripts/difftest/make_font.py` and
`scripts/difftest/make_fixtures.py`.

## Files

| File | Purpose |
| --- | --- |
| `synthetic.ttf` | The minimal, deterministic TrueType font under test. |
| `synthetic.ttf.sha256` | SHA-256 sidecar for the font. |
| `fixtures.json` | The master canonical document, containing every section below. |
| `fixtures.json.sha256` | SHA-256 sidecar for the master document. |
| `font.json` | The `font` category. |
| `tables.json` | The `tables` category. |
| `cmap.json` | The `cmap` category. |
| `metrics.json` | The `metrics` category. |
| `outlines.json` | The `outlines` category. |
| `coverage.json` | The `coverage` category. |
| `*.json.sha256` | One SHA-256 sidecar per JSON file. |
| `docs/difftest.json` | Deterministic index for the future documentation site. |
| `docs/difftest.json.sha256` | SHA-256 sidecar for the index. |

`index_fixtures.py` resolves `docs/difftest.json` relative to this fixtures
directory, so the generated file is `integration/difftest/fixtures/docs/difftest.json`.
Pass `--output` to that script to place the identical payload in a
repository-level `docs/` directory later.

A sidecar is one line of the form `<lowercase hex SHA-256>  <filename>`.

## The synthetic font

`synthetic.ttf` is a valid SFNT (`0x00010000`) with nine tables in sorted
directory order: `cmap`, `glyf`, `head`, `hhea`, `hmtx`, `loca`, `maxp`, `name`
and `post`. `head.indexToLocFormat` is `1` (long `loca`), `unitsPerEm` is 1000,
the ascender is 800 and the descender is -200. `created` and `modified` are zero
so no clock reading enters the bytes. Table offsets are four-byte aligned,
`loca` is monotonic, and `head.checkSumAdjustment` is computed correctly.

`cmap` is a single Windows Unicode BMP format 4 subtable. `post` is format 3.0
(no glyph names) and `name` carries four English name records. There are six
glyphs:

| Glyph id | Codepoint | Shape |
| --- | --- | --- |
| 0 | none | `.notdef`, empty outline. |
| 1 | `U+0020` | `space`, empty outline. |
| 2 | `U+0041` | `A`, one contour with on-curve points, quadratic curves and one implied on-curve midpoint. |
| 3 | `U+0042` | `B`, a rectangle of four on-curve points. |
| 4 | `U+0061` | `a`, one contour containing a quadratic curve. |
| 5 | `U+00C1` | A composite glyph: glyph 2 at offset (40, 20) and glyph 3 at offset (10, 10). |

Every implied midpoint has integer coordinates because the control points are
chosen with even coordinate sums. The composite references `A` with a non-zero
x and y offset and adds a second component, so both component decomposition and
offset application are exercised. The trailing `0xFFFF` cmap sentinel segment is
excluded from the mapping because it is not a character.

## Canonical JSON

Every JSON file is produced with `json.dumps(obj, sort_keys=True, indent=2,
ensure_ascii=True)` followed by a single newline. Object keys are therefore
sorted, arrays are emitted in glyph-id order, no timestamp or absolute path is
stored, and no filesystem walk influences ordering. Floating-point values are
rounded before emission: `ink_coverage` to six decimal places. `verify_fixtures.py`
rejects any file whose bytes differ from a fresh canonical re-serialisation.

Codepoint keys are four upper-case hexadecimal digits, for example `"0041"`, so
lexicographic key order matches numeric codepoint order.

## Schema and exact field names

The authoritative schema, exact field names and tolerance rules live in
`contracts/DIFFTEST.md`; this file only records the local fixture files and the
regeneration recipe. In brief: `fixtures.json` carries schema
`moonfont.difftest/1` with the top-level keys `schema`, `categories`,
`tolerances`, `font`, `oracle`, `tables`, `cmap`, `metrics`, `outlines` and
`coverage`; `docs/difftest.json` carries schema `moonfont.difftest.index/1`.

The field-by-field layout of every category, the oracle matrix and the
per-category tolerance rules are specified once in `contracts/DIFFTEST.md`; this
file does not restate them.

## Regeneration recipe

From the repository root, in this order:

```
python scripts/difftest/make_font.py
python scripts/difftest/make_font.py --check
python scripts/difftest/make_fixtures.py --oracle reference
python scripts/difftest/verify_fixtures.py
python scripts/difftest/verify_fixtures.py --check
python scripts/difftest/index_fixtures.py
python scripts/difftest/index_fixtures.py --check
```

`make_font.py --check` rebuilds the font twice in memory, compares the two
SHA-256 values and compares the result with the committed font, writing nothing.
`verify_fixtures.py --check` additionally rebuilds `fixtures.json` in memory and
compares its canonical bytes, again writing nothing. `index_fixtures.py --check`
does the same for the docs index. All three exit non-zero on any mismatch.

To regenerate with a third-party oracle, replace the third command with
`--oracle fonttools` or `--oracle pillow`. The committed goldens are produced
with `--oracle reference`; a different oracle changes `oracle.providers` and the
`coverage` values, so `fixtures.json` and its sidecars must be regenerated and
reviewed together.

## Oracle version pinning

FreeType output changed in 2.14.2 and 2.15.0, so a golden corpus is only
meaningful while the oracle versions and load flags are pinned. The toolchain
records the recommended pins in `make_fixtures.ORACLE_PINS` and reports them in
`docs/difftest.json` under `oracle_versions.pins`. Install them explicitly:

```
python -m pip install fonttools==4.47.2
python -m pip install Pillow==10.1.0
```

The `reference` oracle has no third-party dependency: it is versioned by the
toolchain constant `make_fixtures.ORACLE_VERSION`, currently `1.0.0`. Whenever
that constant, the font builder, the parser, the rasteriser, the grid size or
the sample count changes, increment it and regenerate every golden in one
commit. `docs/difftest.json` records the pins, the toolchain version and any
version detected at generation time in `oracle_versions.recorded`, so a consumer
can tell which environment produced a given set of numbers.

Load flags are fixed by construction. The font carries no hinting instructions,
no embedded bitmaps and no variation data, so there is no hinting mode, no stem
darkening, no LCD filter and no gamma to configure. Both rasterisers operate
unhinted on the same unscaled outlines and report a single 8-bit grey coverage
summary. Pin the Python minor version as well: the toolchain targets Python
3.11 or later and uses only the standard library, but rounding and float
formatting are kept explicit so that a different interpreter cannot silently
change a committed number.
