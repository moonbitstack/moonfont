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

`fixtures.json` has schema `moonfont.difftest/1`. `docs/difftest.json` has schema
`moonfont.difftest.index/1`. The master document has exactly these top-level
keys:

`schema`, `categories`, `tolerances`, `font`, `oracle`, `tables`, `cmap`,
`metrics`, `outlines`, `coverage`.

- `categories` is the fixed array `["font", "tables", "cmap", "metrics",
  "outlines", "coverage"]`. Each name is also emitted as its own category file
  listed above.
- `tolerances` maps each category name to its rule, as given in the tolerance
  table below.

### `font`

`file`, `sha256`, `sfnt_version`, `num_tables`, `table_tags`, `units_per_em`,
`num_glyphs`, `index_to_loc_format`. Version-like values are `"0x..."` strings.

### `oracle`

`name`, `version`, `providers`, `raster_algorithm`, `raster_grid`,
`raster_samples_per_axis`, `raster_y_axis`, `moonbit_raster_algorithm`,
`library_versions`. `providers` maps every category name to a producer label, so
no section is ever silently self-referential.

### `tables`

An object with `head`, `hhea` and `maxp`.

- `head`: `version`, `font_revision`, `check_sum_adjustment`, `magic_number`,
  `flags`, `units_per_em`, `created`, `modified`, `x_min`, `y_min`, `x_max`,
  `y_max`, `mac_style`, `lowest_rec_ppem`, `font_direction_hint`,
  `index_to_loc_format`, `glyph_data_format`.
- `hhea`: `version`, `ascender`, `descender`, `line_gap`, `advance_width_max`,
  `min_left_side_bearing`, `min_right_side_bearing`, `x_max_extent`,
  `caret_slope_rise`, `caret_slope_run`, `caret_offset`, `metric_data_format`,
  `number_of_h_metrics`.
- `maxp`: `version`, `num_glyphs`, `max_points`, `max_contours`,
  `max_composite_points`, `max_composite_contours`, `max_zones`,
  `max_twilight_points`, `max_storage`, `max_function_defs`,
  `max_instruction_defs`, `max_stack_elements`, `max_size_of_instructions`,
  `max_component_elements`, `max_component_depth`.

### `cmap`

An object mapping four-digit upper-case hex codepoint strings to integer glyph
ids. The sentinel `0xFFFF` is excluded.

### `metrics`

An array with one object per glyph id, in ascending order. Each object has
`glyph_id`, `advance`, `lsb`, `bounds` and `scaled_bounds`. `bounds` is
`[x_min, y_min, x_max, y_max]` in font units, taken from the `glyf` header;
empty glyphs report `[0, 0, 0, 0]`. `scaled_bounds` is the same box scaled to
the 64-pixel em square with `round(v * 64 / unitsPerEm)`.

### `outlines`

An array with one object per glyph id. Each object has `glyph_id` and
`commands`. A command is an array whose first element is one of `"move"`,
`"line"`, `"quad"` or `"close"`:

- `["move", x, y]`
- `["line", x, y]`
- `["quad", cx, cy, x, y]` (a quadratic Bezier from the current point with
  control `(cx, cy)` to `(x, y)`)
- `["close"]`

All coordinates are integer font units with y up. A contour begins with `move`
and ends with `close`; the closing segment back to the start point is emitted
explicitly before `close`. Consecutive off-curve points are resolved into
implied on-curve midpoints, so the stream contains only explicit quadratic
segments. Composite glyphs are decomposed: their commands are the concatenated
component streams with the component offsets added. Empty glyphs have an empty
command list.

### `coverage`

An array with one object per glyph id. Each object has `glyph_id`,
`ink_coverage` and `ink_bbox`. Only a summary is stored, never a raw bitmap,
because cross-engine anti-aliasing is not bit-identical.

- `ink_coverage` is the summed subpixel coverage over a 64 by 64 pixel em
  square, divided by `64 * 64`, expressed as a percentage in `[0, 100]`.
- `ink_bbox` is `[min_x, min_y, max_x, max_y]`, the inclusive pixel indices of
  pixels with non-zero coverage in a y-up coordinate system whose origin is the
  bottom-left of the em square, or `null` for an empty glyph.

For the `reference` and `fonttools` oracles the summarised mask comes from an
independent rasteriser: 8 by 8 uniform-grid supersampling, with every subpixel
sample classified by a non-zero winding count of flattened quadratic edges
crossing its sub-scanline. Thirty-two line segments approximate each quadratic.
This is deliberately a different algorithm from the MoonBit rasteriser, which
uses eight-times vertical subsampling with exact horizontal area in 26.6 fixed
point. For the `pillow` oracle the mask comes from `ImageFont.getmask2`, which
is FreeType's 8-bit grey rasteriser, and is converted to the same y-up em-square
coordinate frame using the reported ascent and mask offset.

## Oracles

| Name | Provider | Rasteriser |
| --- | --- | --- |
| `reference` | Independent standard-library SFNT parser in `make_fixtures.py` | Independent 8x8 uniform-grid supersampling with non-zero winding |
| `fonttools` | `fontTools` for table fields, cmap, metrics and outlines | Independent reference supersampler |
| `pillow` | Independent reference parser for structure, cmap, metrics and outlines | Pillow / FreeType `getmask2` |

The `reference` oracle is the default and needs only the Python standard
library. It is independent of the MoonBit implementation in two ways: its
parser is a separate SFNT decoder, and its coverage algorithm is a two-dimensional
sample-counting fill rather than the exact-horizontal-area vertical subsampling
used by MoonBit.

If `fonttools` or `pillow` is requested but the corresponding package is not
installed, `make_fixtures.py` exits with a clear error and writes nothing. It
never falls back to reference data while labelling the output as a third-party
oracle. The `oracle.providers` map records the real producer of every category.

## Tolerance rules

Tolerances are pre-registered before any fixture is consumed. They may not be
relaxed afterwards to make a failing test pass.

| Category | Rule |
| --- | --- |
| `font` | Exact. Every field, including the SHA-256 and the sorted `table_tags`, must match. |
| `tables` | Exact for every `head`, `hhea` and `maxp` field. All values are unscaled integers or version strings. |
| `cmap` | Exact for the full codepoint-to-glyph-id mapping and for glyph ids in general. |
| `metrics` | `advance`, `lsb` and `bounds` are exact in font units. `scaled_bounds` may differ by at most 1 pixel because engines round scaled boxes differently. |
| `outlines` | Exact after canonicalisation. Canonicalisation is limited to the removal of degenerate closing segments and the insertion of implied on-curve midpoints; no other geometry may be rewritten. |
| `coverage` | `ink_coverage` must agree within 5 per cent. `ink_bbox` may differ by at most 1 pixel on each side. |

The outline rule is exact because outline coordinates are integers in font
units; only the rasterised coverage is a floating measurement. The coverage rule
is a summary comparison rather than a per-pixel comparison precisely because
anti-aliasing is not portable bit for bit.

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
