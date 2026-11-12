# Hostile-input corpus

A collection of small font files, each of which damages exactly one declaration
in an otherwise valid, minimal TrueType-flavoured font. The corpus exists to
answer one question about the MoonBit reader: given bytes that no honest font
tool would produce, does it still stop cleanly with a named reason?

**The rule is absolute: the MoonBit reader must never panic and must always
name a reason.** Every file below must produce either a successful read or
exactly one `Refused` suberror. A panic, an uncaught exception, an infinite
loop, an out-of-bounds read, an integer wrap in an allocation size, or an
allocation proportional to a hostile declaration is a failure regardless of
which variant is returned. A refusal with the wrong variant is also a failure:
the caller needs a stable, documented vocabulary, not merely a stop. The
variant names come from `src/model/error.mbt` and are used here verbatim:

`Unknown`, `Unexpected`, `Unsupported`, `Truncated`, `OverLimit`, `Malformed`,
`MissingTable`, `MissingGlyph`, `Recursion`.

Some cases name checks that the v0.1.0 reader has not yet implemented, for
example `head.magicNumber`. They are part of the contract, not a description of
today's code: the reader must still refuse with the named variant and must
never panic. Where a reader has a legitimate choice between two variants, the
manifest records the one that follows from the declared contract; for example a
composite cycle is expected as `Recursion` because the documented ceiling is a
depth limit, and a reader that detects the cycle directly should still report
the same class of failure.

## Regenerating

The generator is self-contained, uses only the Python standard library, reads
no network resources and writes only into this directory:

```
python3 scripts/difftest/make_corpus.py
python3 scripts/difftest/make_corpus.py --check
```

The first command rebuilds every `*.ttf` and `*.bin` file and rewrites
`manifest.json`. The second regenerates every case in memory, verifies each
recorded SHA-256 against both the bytes rebuilt in memory and the bytes on disk,
reports unmanifested or missing files, and writes nothing. Run `--check` in CI
before any differential test that consumes the corpus; a failing check means a
fixture has been edited by hand or the generator has drifted.

Regeneration is deterministic. There are no timestamps, no random values and
no dependency on the host's installed fonts. `manifest.json` is canonical JSON
with sorted keys and a trailing newline, so an unchanged regeneration produces
no diff.

## The control font

`valid_minimal.ttf` is the unmodified starting point. It is built in-process,
not copied from a system font: nine tables (`cmap`, `glyf`, `head`, `hhea`,
`hmtx`, `loca`, `maxp`, `name`, `post`), three glyphs (a simple contoured
`.notdef`, an empty space, and one simple glyph), a three-segment cmap format 4
subtable, short `loca` offsets, `unitsPerEm` of 1000, and three horizontal
metrics. Per-table checksums and the font-wide `head.checkSumAdjustment` are
computed correctly, so the control is a genuinely valid sfnt file rather than
merely a shape the reader happens to accept.

Every other file is that font with one table removed, one declared field
changed, or one byte run cut short. **Checksums are deliberately left stale
after mutation.** A defensive parser must not use a checksum to decide whether
a structural declaration is honest: a hostile file can always recompute one.
Provenance is therefore simple — all corpus binaries are synthetic and carry no
third-party font licence obligations.

## Manifest schema

`manifest.json` maps each filename to one object:

| Field | Meaning |
|---|---|
| `variant` | The exact `Refused` suberror name expected, or `null` when the reader must accept the file. |
| `offset` | Absolute byte offset of the damaged field, or of the read that ran short, or `null` when the refusal concerns a whole table or a whole-file declaration with no single location. |
| `reason` | One line explaining why the file is hostile or unusual. |
| `sha256` | Lower-case hex SHA-256 of the file's bytes. |
| `legal_but_unusual` | `true` when the file is legal, or out of spec but tolerated, and must produce no refusal. |
| `ceiling` | Present on `OverLimit` and `Recursion` cases; names the field in `src/model/limits.mbt` that the case breaches. |
| `limits_profile` | Present only on `points_over_strict_limit.ttf`, with value `strict`. All other cases are specified against `Limits::default()`. |

The offset follows the reader's own reported position where it has one. For a
field-level mutation it is the first byte of that field; for a truncation it is
the offset of the read that ran out of bytes, not an index one past the end of
the file. A consumer asserting on the refusal message should compare against
`offset` and `variant` together.

## Ceilings

The `ceiling` field uses the exact field names from `src/model/limits.mbt`.
The values below are recorded for reference only; the reader owns the
authoritative numbers.

| Ceiling | `Limits::default()` | `Limits::strict()` | Exercised by |
|---|---|---|---|
| `file_bytes` | 268435456 | 16777216 | Not included: a file above this ceiling would be too large to commit. |
| `table_bytes` | 268435456 | 16777216 | `table_length_over_limit.ttf` |
| `glyphs` | 65536 | 65536 | `ttc_count_over_glyphs_ceiling.bin` |
| `points` | 65536 | 8192 | `points_over_strict_limit.ttf` |
| `contours` | 8192 | 1024 | `contours_over_limit.ttf` |
| `composites` | 1024 | 256 | `composites_over_limit.ttf` |
| `recursion` | 16 | 8 | `composite_self_reference.ttf`, `composite_nesting_beyond_recursion.ttf` |
| `mask_pixels` | 67108864 | 4194304 | Not included: this ceiling guards a rasteriser call, not a font declaration. |

Two ceilings are deliberately absent from the corpus. `file_bytes` would need a
file larger than 256 MiB to breach under default limits, which is not a small
fixture; `mask_pixels` is checked in `Limits::check_mask` when a caller asks for
a coverage mask, so it belongs to the rasteriser's own tests. Both are recorded
here so that the set of ceilings is complete.

`points_over_strict_limit.ttf` is the one case with a `limits_profile`. It
declares 8193 points in a single glyph with complete, consistent coordinate
data. Under `Limits::default()` (`points` 65536) the reader must accept it;
under `Limits::strict()` (`points` 8192) it must return `OverLimit`. A harness
running default limits should skip its refusal assertion and assert acceptance
instead. Note also that `maxp.numGlyphs` is a `u16`, so the `glyphs` ceiling is
breached here through a TTC face count rather than through `maxp`.

## Why each class of damage exists

- **Container and directory.** `Unknown` separates "this is not a font" from
  "this font is damaged", which matters to a caller deciding whether to retry
  with a different parser. `Truncated` at the directory is the cheapest place
  to stop: a hostile offset or length must be refused before any table cursor
  is created. `OverLimit` at a table length must fire *before* the EOF check,
  because a declaration of 256 MiB plus one byte must not trigger an allocation
  attempt. `Unsupported` names a well-formed container version the library
  declines to read rather than silently misreading it.
- **`head`.** `unitsPerEm` of zero would divide by zero in every later scale;
  values above 16384 break the TrueType range. `indexToLocFormat` determines the
  width of every `loca` entry, so an unknown value makes the glyph index
  unreadable. A wrong `magicNumber` is a clean example of `Unexpected`: the
  bytes are readable, they are simply not the ones allowed here.
- **`maxp`, `hhea` and `hmtx`.** `numGlyphs` governs the size of `loca`, `hmtx`
  and every glyph-id check. An unsupported `maxp` version is named rather than
  guessed at. `numberOfHMetrics` above `numGlyphs` is out of spec, but
  `Hmtx::parse` clamps it; the corpus records that tolerance explicitly so a
  future refactor does not turn a tolerated file into an over-allocation.
- **`loca`.** Offsets that go backwards, or a final offset past the end of
  `glyf`, are the classic route to reading one glyph's bytes as another's, or
  to reading outside the table entirely.
- **`cmap`.** A subtable offset outside the table tests that the charmap cursor
  is bounded to the `cmap` range. `startCode` above `endCode` in format 4 is a
  structurally impossible segment that a naive binary search would loop over.
- **`glyf` simple outlines.** Contour count above point count, a `REPEAT` flag
  that expands past `numPoints`, and a coordinate run cut short all test that
  declared counts are checked against the ceiling and against the bytes that
  actually remain before any array is grown. The contour and point ceiling
  cases test the ordering of that check: a reader must compare the declaration
  to the ceiling *before* walking the endpoint array.
- **Composite glyphs.** A self-referencing component and a chain deeper than
  the recursion ceiling test the depth guard. A component naming a glyph beyond
  `numGlyphs` tests `MissingGlyph`. A glyph with 1025 components tests the
  component ceiling without needing a large file.

## Case index

The `no refusal` rows are the control and the legal-but-unusual cases. Every
other row must produce the named variant.

| File | Expected | Why |
|---|---|---|
| `valid_minimal.ttf` | no refusal | The unmodified control font. |
| `units_per_em_at_16384.ttf` | no refusal | 16384 is the inclusive maximum; a boundary value must be accepted. |
| `long_loca_format.ttf` | no refusal | `indexToLocFormat` 1 (long offsets) is valid. |
| `hhea_number_of_h_metrics_above_num_glyphs.ttf` | no refusal | Out of spec, but `Hmtx::parse` clamps it; the reader must not over-allocate. |
| `extra_unknown_table.ttf` | no refusal | An unrecognised table tag is legal and must be ignored. |
| `truncated_file.bin` | `Truncated` | Cut at byte 40; the 144-byte directory read from 12 runs off the end. |
| `bad_signature.bin` | `Unknown` | A PNG magic number is not an sfnt scaler type. |
| `bad_sfnt_scaler.ttf` | `Unknown` | An unrecognised sfnt scaler type (0x00020000). |
| `zero_num_tables.ttf` | `Malformed` | A directory declaring zero tables is impossible. |
| `table_offset_past_eof.ttf` | `Truncated` | The `glyf` record points 4096 bytes past EOF. |
| `table_length_past_eof.ttf` | `Truncated` | The `head` record declares 1048576 bytes, past EOF. |
| `table_length_over_limit.ttf` | `OverLimit` | A length one byte above `table_bytes`, to be refused before allocation. |
| `ttc_count_over_glyphs_ceiling.bin` | `OverLimit` | A TTC declaring 65537 faces exceeds `glyphs`. |
| `unsupported_ttc_version.bin` | `Unsupported` | A TTC version the library does not read. |
| `missing_head.ttf` | `MissingTable` | `head` is required and absent. |
| `missing_maxp.ttf` | `MissingTable` | `maxp` is required and absent. |
| `missing_hhea.ttf` | `MissingTable` | `hhea` is required and absent. |
| `missing_hmtx.ttf` | `MissingTable` | `hmtx` is required and absent. |
| `missing_cmap.ttf` | `MissingTable` | `cmap` is required and absent. |
| `missing_loca.ttf` | `MissingTable` | `loca` is required and absent. |
| `missing_glyf.ttf` | `MissingTable` | `glyf` is required and absent. |
| `units_per_em_zero.ttf` | `Malformed` | `unitsPerEm` of 0 would divide by zero. |
| `units_per_em_above_16384.ttf` | `Malformed` | 16385 is one above the permitted maximum. |
| `bad_index_to_loc_format.ttf` | `Malformed` | `indexToLocFormat` must be 0 or 1. |
| `unexpected_head_magic.ttf` | `Unexpected` | `head.magicNumber` is not 0x5F0F3CF5. |
| `unsupported_maxp_version.ttf` | `Unsupported` | A well-formed `maxp` version the library does not read. |
| `loca_offsets_going_backwards.ttf` | `Malformed` | The third `loca` offset is below the second. |
| `loca_offset_past_glyf.ttf` | `Truncated` | The final `loca` offset points far beyond `glyf`. |
| `cmap_subtable_offset_outside_table.ttf` | `Truncated` | The encoding record points 64 bytes past the end of `cmap`. |
| `cmap_format4_start_above_end.ttf` | `Malformed` | `startCode[0]` (0x30) is above `endCode[0]` (0x20). |
| `glyf_contours_exceed_points.ttf` | `Malformed` | Five contours declared over three points. |
| `glyf_repeat_flag_overflow.ttf` | `Malformed` | A `REPEAT` flag declares 256 flags for a three-point glyph. |
| `glyf_truncated_coordinates.ttf` | `Truncated` | Six points declared but the y-coordinate run is cut short. |
| `contours_over_limit.ttf` | `OverLimit` | 32767 contours exceeds `contours` (8192). |
| `points_over_strict_limit.ttf` | `OverLimit` | 8193 points exceeds `points` under `Limits::strict()` only. |
| `composites_over_limit.ttf` | `OverLimit` | 1025 components exceeds `composites` (1024). |
| `composite_self_reference.ttf` | `Recursion` | A component references its own glyph. |
| `composite_nesting_beyond_recursion.ttf` | `Recursion` | A chain of 17 nested composites exceeds `recursion`. |
| `composite_bad_component_glyph_id.ttf` | `MissingGlyph` | A component names glyph 99 while `maxp` declares three glyphs. |

## Expected distribution

Thirty-four files must be refused and five must be accepted. Among the
refusals: `Malformed` 8, `MissingTable` 7, `Truncated` 6, `OverLimit` 5,
`Unknown` 2, `Unsupported` 2, `Recursion` 2, `Unexpected` 1, `MissingGlyph` 1.
All nine `Refused` variants are exercised. A change to these counts without a
corpus regeneration is a sign that a case has been dropped.
