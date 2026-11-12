# Corpus conformance: expected versus actual refusals

A case-by-case comparison of the 39 hostile-input fonts in
`integration/difftest/corpus/manifest.json` against the reader currently in
`src/`. The manifest is the contract: it names the `Refused` suberror each file
must produce, or `null` for the files that must be accepted. This report asks
what the code in the tree actually does.

## Scope and method

The following were read in full: `src/model/error.mbt`, `src/model/limits.mbt`,
`src/model/types.mbt`, `src/wire/cursor.mbt`, `src/sfnt/directory.mbt`,
`src/table/tables.mbt`, `src/table/cmap.mbt`, `src/table/glyf.mbt`,
`src/table/kern.mbt`, `src/table/os2.mbt`, `src/outline/build.mbt`,
`src/raster/mask.mbt`, `src/layout/measure.mbt`, `src/font.mbt`,
`src/font_test.mbt`, `src/corpus_test.mbt` and `src/testdata_test.mbt`.

**Evaluation path.** `Face::decode()` is lazy: `src/font.mbt::build` parses the
directory, `head`, `maxp`, `hhea`, `hmtx`, `loca`, `cmap`, the optional `kern`
and `OS/2`, and takes a view of `glyf`, but it does not decode a single glyph
outline. Outlines are decoded on demand by `Face::outline()` ->
`GlyphSource::outline()`. The corpus contract therefore has to be read against
the full path used by `src/corpus_test.mbt::refusal_name` and
`src/font_test.mbt::refused_by`: decode, then call `outline()` for every glyph
in `0..<num_glyphs()`. That is the path modelled here. Nine of the 39 cases
change outcome depending on whether that walk happens; see "Residual
observations" below.

**Limits policy.** Each case is evaluated under the limits its manifest entry
declares: `Limits::default()` for 38 cases, `Limits::strict()` for the single
entry carrying `limits_profile: "strict"` (`points_over_strict_limit.ttf`). The
project's own `refusal_name()` uses `Limits::strict()` for every case; that
difference is discussed below and does not change any outcome today.

**Three independent checks.** (1) Line-by-line tracing of the decode and
outline path. (2) A standard-library Python model of that path, run over all 39
corpus files, reproducing the current `Cursor`, `Limits`, `Cmap::parse`,
`Head::parse`, `GlyphData::parse`, `read_flags` and `GlyphSource::outline`
behaviour. (3) `moon test`, which reports `Total tests: 13, passed: 13, failed:
0` and includes `src/corpus_test.mbt`'s assertion that every embedded case
yields its contracted refusal. All three agree.

**Snapshot caveat.** The implementation was edited while this analysis was in
progress. At the start of the analysis six cases did not match the manifest.
By the final read all six had been closed by changes to the tree. Both states
are recorded below: the main table is the current state, and the section
"Gaps identified against the earlier snapshot" documents the six, their
reasons, and the exact changes that closed them. No code, manifest, corpus file
or `*.mbt` file was modified in producing this report.

## Result

**Current mismatch count: 0 of 39.** Every case produces exactly the variant
its manifest entry names, or is accepted when the entry says `null`. All nine
`Refused` variants are now constructed somewhere in the reader, including
`Unexpected`, which previously appeared only in `error.mbt`'s declaration.

| Outcome | Count |
|---|---|
| Match | 39 |
| Mismatch | 0 |
| Accepted as contracted (`null` variant) | 5 |
| Refused as contracted | 34 |

Distribution of actual variants: `Malformed` 8, `MissingTable` 7,
`Truncated` 6, `OverLimit` 5, `Unknown` 2, `Unsupported` 2, `Recursion` 2,
`Unexpected` 1, `MissingGlyph` 1, no refusal 5.

## Full conformance table

`Actual` is the variant the current code produces. `Note` gives a one-line
reason for the six historical mismatches; for the remaining cases it records
where the refusal originates, or is blank.

| Filename | Expected | Actual | Result | Note |
|---|---|---|---|---|
| `bad_index_to_loc_format.ttf` | `Malformed` | `Malformed` | match | `Head::parse`, indexToLocFormat check |
| `bad_sfnt_scaler.ttf` | `Unknown` | `Unknown` | match | `parse_directory` scaler check |
| `bad_signature.bin` | `Unknown` | `Unknown` | match | `parse_directory` scaler check |
| `cmap_format4_start_above_end.ttf` | `Malformed` | `Malformed` | match | Historical mismatch: the format 4 segment arrays were never validated, so the reader accepted the file. Now refused by `Cmap::parse` |
| `cmap_subtable_offset_outside_table.ttf` | `Truncated` | `Truncated` | match | Historical mismatch: an out-of-range encoding-record offset was silently skipped and the file fell through to `Unsupported`. Now refused by `Cmap::parse` |
| `composite_bad_component_glyph_id.ttf` | `MissingGlyph` | `MissingGlyph` | match | `GlyphSource::outline`, `Loca::range` |
| `composite_nesting_beyond_recursion.ttf` | `Recursion` | `Recursion` | match | `Limits::check_depth` |
| `composite_self_reference.ttf` | `Recursion` | `Recursion` | match | `Limits::check_depth` on the cycle |
| `composites_over_limit.ttf` | `OverLimit` | `OverLimit` | match | `Limits::check_composites` |
| `contours_over_limit.ttf` | `OverLimit` | `OverLimit` | match | Historical mismatch: the endpoint array was read before the contour ceiling was checked, so the file died as `Truncated`. Now checked first in `GlyphData::parse` |
| `extra_unknown_table.ttf` | no refusal | no refusal | match | Unknown tags are ignored by `parse_directory` |
| `glyf_contours_exceed_points.ttf` | `Malformed` | `Malformed` | match | Historical mismatch: five contours over three points were accepted with no validation. Now refused by `GlyphData::parse` |
| `glyf_repeat_flag_overflow.ttf` | `Malformed` | `Malformed` | match | Historical mismatch: the REPEAT expansion was clipped, so the run ended as a `Truncated` coordinate read. Now refused by `read_flags` |
| `glyf_truncated_coordinates.ttf` | `Truncated` | `Truncated` | match | `Cursor::u8` in `read_coords` |
| `hhea_number_of_h_metrics_above_num_glyphs.ttf` | no refusal | no refusal | match | `Hmtx::parse` clamps to `numGlyphs` |
| `loca_offset_past_glyf.ttf` | `Truncated` | `Truncated` | match | `GlyphSource::outline` range check |
| `loca_offsets_going_backwards.ttf` | `Malformed` | `Malformed` | match | `Loca::parse` |
| `long_loca_format.ttf` | no refusal | no refusal | match | `Loca::parse` long form |
| `missing_cmap.ttf` | `MissingTable` | `MissingTable` | match | `Directory::require` |
| `missing_glyf.ttf` | `MissingTable` | `MissingTable` | match | `Directory::require` in `build` |
| `missing_head.ttf` | `MissingTable` | `MissingTable` | match | `Directory::require` in `build` |
| `missing_hhea.ttf` | `MissingTable` | `MissingTable` | match | `Directory::require` in `build` |
| `missing_hmtx.ttf` | `MissingTable` | `MissingTable` | match | `Directory::require` in `build` |
| `missing_loca.ttf` | `MissingTable` | `MissingTable` | match | `Directory::require` in `build` |
| `missing_maxp.ttf` | `MissingTable` | `MissingTable` | match | `Directory::require` in `build` |
| `points_over_strict_limit.ttf` | `OverLimit` | `OverLimit` | match | `Limits::check_outline` under `Limits::strict()` |
| `table_length_over_limit.ttf` | `OverLimit` | `OverLimit` | match | `Limits::check_table` in `parse_directory` |
| `table_length_past_eof.ttf` | `Truncated` | `Truncated` | match | `parse_directory` range check |
| `table_offset_past_eof.ttf` | `Truncated` | `Truncated` | match | `parse_directory` range check |
| `truncated_file.bin` | `Truncated` | `Truncated` | match | `Cursor::window` on the directory entries |
| `ttc_count_over_glyphs_ceiling.bin` | `OverLimit` | `OverLimit` | match | `sfnt::read`, `Limits::check_glyphs` |
| `unexpected_head_magic.ttf` | `Unexpected` | `Unexpected` | match | Historical mismatch: `Head::parse` did not read `magicNumber`, so the file was accepted. Now refused by `Head::parse` |
| `units_per_em_above_16384.ttf` | `Malformed` | `Malformed` | match | `Head::parse` |
| `units_per_em_at_16384.ttf` | no refusal | no refusal | match | Boundary value accepted by `Head::parse` |
| `units_per_em_zero.ttf` | `Malformed` | `Malformed` | match | `Head::parse` |
| `unsupported_maxp_version.ttf` | `Unsupported` | `Unsupported` | match | `Maxp::parse` |
| `unsupported_ttc_version.bin` | `Unsupported` | `Unsupported` | match | `sfnt::read` |
| `valid_minimal.ttf` | no refusal | no refusal | match | Control font |
| `zero_num_tables.ttf` | `Malformed` | `Malformed` | match | `parse_directory` |

## Gaps identified against the earlier snapshot

The following six mismatches were present at the start of the analysis and are
now closed. They are recorded because the request was for a prioritised change
list, and because three of them were cases where the reader **accepted hostile
input without any refusal at all** — the most serious class of defect for a
defensive parser.

| Priority | Case | Expected | Actual then | Reason |
|---|---|---|---|---|
| P1 | `unexpected_head_magic.ttf` | `Unexpected` | no refusal | `Head::parse` sought straight to offset 18 and never read `magicNumber` at offset 12, so a zeroed magic field passed silently. |
| P1 | `cmap_format4_start_above_end.ttf` | `Malformed` | no refusal | `Cmap::parse` checked only `segCountX2`; it never compared `startCode` with `endCode`. `format4()` merely returned `None` at lookup time, so decode accepted the file. |
| P1 | `glyf_contours_exceed_points.ttf` | `Malformed` | no refusal | `GlyphData::parse` computed `point_count` from the last endpoint but never required endpoints to increase or contours not to exceed the point count; `simple_outline` then silently broke out of its contour loop. |
| P2 | `cmap_subtable_offset_outside_table.ttf` | `Truncated` | `Unsupported` | `Cmap::parse` skipped any encoding record whose offset lay outside the table, by design ("a corrupt range offset must yield no glyph, never a trap"), so `chosen` stayed at -1 and the refusal was `Unsupported`. |
| P2 | `glyf_repeat_flag_overflow.ttf` | `Malformed` | `Truncated` | `read_flags` clipped an overlong REPEAT expansion to `count` rather than refusing it; the resulting flag bytes then drove a coordinate read past the end of the glyph range. |
| P2 | `contours_over_limit.ttf` | `OverLimit` | `Truncated` | `GlyphData::parse` read all 32767 endpoint words before calling `Limits::check_outline`, so the ceiling was never reached and the short glyph range produced `Truncated` instead. |

P1 cases are silent acceptance: the reader returned a `Face` for bytes the
contract says it must refuse. P2 cases are safe but misnamed: the reader did
refuse with a declared variant, so no panic occurred, but a caller matching on
the variant would take the wrong branch.

## Prioritised list of code changes

Every change below is already present in the current tree. The list is ordered
by the severity of the defect it closes and names the exact source file and
function for each. It should be read as the specification of what must remain
in place; removing any one of these reopens the corresponding row above.

### P1 — prevent silent acceptance

1. **`src/table/tables.mbt`, `Head::parse` (lines 19–52).** Read
   `head.magicNumber` at offset 12 and raise
   `Unexpected(at=12, got=..., want="0x5F0F3CF5")` when it is not
   `0x5F0F3CF5`. The check sits before the `unitsPerEm` read so the refusal
   names the damaged field. Closes `unexpected_head_magic.ttf`.

2. **`src/table/cmap.mbt`, `Cmap::parse` (lines 72–136).** For a chosen
   format 4 subtable, walk all `segments` and raise
   `Malformed(at=start_base + i*2, got=...)` when `startCode[i] > endCode[i]`.
   Validation belongs in `parse`, not in `Cmap::format4`, so the refusal is
   deterministic at decode time rather than dependent on which codepoint a
   caller asks for. Closes `cmap_format4_start_above_end.ttf`.

3. **`src/table/glyf.mbt`, `GlyphData::parse` (lines 159–222).** After reading
   `end_points`, require them to be strictly increasing and raise
   `Malformed(at=10 + i*2, got="contour endpoints that do not increase")`
   otherwise. This also enforces, indirectly, that the contour count cannot
   exceed the point count. Closes `glyf_contours_exceed_points.ttf`.

### P2 — name the right variant

4. **`src/table/cmap.mbt`, `Cmap::parse` (lines 84–108).** Track a
   `broken_offset` when an encoding record's declared offset is outside the
   `cmap` table, and when no readable subtable was chosen raise
   `Truncated(at=broken_offset, want=2)` in preference to `Unsupported`.
   `Unsupported` remains correct only when every record is readable but none
   ranks above zero. This deliberately narrows the earlier "corrupt offset
   yields no glyph" policy for the *encoding record* itself, while the bounded
   helpers `byte_at`, `u16_at` and `u32_at` (lines 14–30) keep per-lookup
   reads trap-free. Closes `cmap_subtable_offset_outside_table.ttf`.

5. **`src/table/glyf.mbt`, `read_flags` (lines 48–70).** Before expanding a
   REPEAT flag, test `flags.length() + repeats > count` and raise
   `Malformed(at=cursor.position(), got="a repeat flag past the declared point
   count")`. Returning `flags` unclipped is then safe because the loop can only
   end at exactly `count`. This preserves the no-panic property that the old
   clipping provided while naming the correct variant. Closes
   `glyf_repeat_flag_overflow.ttf`.

6. **`src/table/glyf.mbt`, `GlyphData::parse` (line 182).** Call
   `limits.check_outline(0, contours)` **before** the `end_points` loop, so a
   declaration above `Limits.contours` produces `OverLimit` rather than a
   truncated read partway through the endpoint array. The later
   `limits.check_outline(point_count, contours)` at line 188 still guards the
   point count. Closes `contours_over_limit.ttf`. This is the ordering rule the
   corpus README states explicitly: a reader must compare a declaration to its
   ceiling before walking the array that declaration sizes.

### P3 — hardening and test scaffolding already in place

7. **`src/table/glyf.mbt`, `GlyphData::parse` (lines 204–211).** Additional
   `if point_count > cursor.left() { raise Malformed(...) }` guard. Not tied to
   a single corpus case, but it turns several potential `Truncated` outcomes
   into a clearer structural refusal and short-circuits a hostile point count
   before any flag or coordinate array is grown.

8. **`src/model/error.mbt`, `Refused::name()` (lines 65–77).** A stable variant
   name for the differential harness to record instead of a rendered message.
   Without it `src/corpus_test.mbt` could not compare against the manifest's
   `variant` field.

9. **`src/corpus_test.mbt` and `src/testdata_test.mbt`.** The conformance test
   and the 39 embedded byte literals with their expected variant names. The
   embedded expectations were checked against `manifest.json`: all 39 filenames
   are present, all expected names agree, and there is no drift.

## Contractual versus implemented expectations

A **contractual** expectation is one that states what the reader *should* do
with hostile bytes, whether or not a check exists yet. The manifest is written
as a contract, not as a description of the reader: its own `README.md` says
that some cases name checks the v0.1.0 reader had not implemented, giving
`head.magicNumber` as the example. At the start of this analysis that was
literally true for three cases and effectively true for three more.

- **Contractual and previously unimplemented (silent acceptance):**
  `unexpected_head_magic.ttf` (`Unexpected`),
  `cmap_format4_start_above_end.ttf` (`Malformed`) and
  `glyf_contours_exceed_points.ttf` (`Malformed`). These are the P1 rows. The
  contract required a refusal; the code returned a `Face`.

- **Contractual but previously implemented under a different variant:**
  `cmap_subtable_offset_outside_table.ttf` (`Truncated`),
  `glyf_repeat_flag_overflow.ttf` (`Malformed`) and
  `contours_over_limit.ttf` (`OverLimit`). These are the P2 rows. The code did
  refuse, but the vocabulary a caller branches on was wrong.

- **Contractual and implemented from the outset:** the remaining 33 rows.
  Notably `MissingTable` (`Directory::require`), `Unknown`
  (`parse_directory`), `Unsupported` (`sfnt::read`, `Maxp::parse`,
  `Cmap::parse`, `parse_composite`), `Truncated` (`Cursor` and
  `GlyphSource::outline`), `OverLimit` (`Limits::over` and its callers),
  `Malformed` (`Head::parse`, `Hhea::parse`, `Loca::parse`), `MissingGlyph`
  (`Face::metrics`, `GlyphSource::outline`) and `Recursion`
  (`Limits::check_depth`).

- **Contractual by profile:** `points_over_strict_limit.ttf` is the one
  expectation that is only a refusal under `Limits::strict()`. Under
  `Limits::default()` the same 8193-point glyph is legal and the manifest says
  the reader must accept it. This is an explicit part of the contract, not a
  gap.

Two documentation consequences follow. First, the corpus `README.md` statement
that some checks are "part of the contract, not a description of today's code"
is now stale with respect to `head.magicNumber` and should be revised when that
file is next edited. Second, `Unexpected` is no longer a dormant variant: it is
now raised by `Head::parse` (line 23), so all nine declared variants are
reachable from real inputs.

## Residual observations (not mismatches)

These do not change any row of the table but matter for anyone consuming the
corpus or maintaining the reader.

1. **Lazy outlines.** `Face::decode()` alone refuses only 30 of the 39 cases.
   Nine cases produce their refusal only when `outline()` is called for every
   glyph: `composite_bad_component_glyph_id.ttf`, `composite_nesting_beyond_recursion.ttf`,
   `composite_self_reference.ttf`, `composites_over_limit.ttf`,
   `contours_over_limit.ttf`, `glyf_repeat_flag_overflow.ttf`,
   `glyf_truncated_coordinates.ttf`, `loca_offset_past_glyf.ttf` and
   `points_over_strict_limit.ttf`. A harness that calls only `decode()` would
   report "no refusal" for all nine. `src/corpus_test.mbt::refusal_name` and
   `src/font_test.mbt::refused_by` both do the walk; any new harness must too.

2. **Limits profile divergence.** `src/corpus_test.mbt::refusal_name` calls
   `decode(bytes, limits=Limits::strict())` for all 39 cases, whereas the
   manifest declares `Limits::default()` for 38 of them. Today this is
   harmless: every case produces the same variant under both presets, because
   the values that breach a ceiling are far above the strict value as well.
   The one genuinely profile-sensitive case is `points_over_strict_limit.ttf`,
   which the manifest marks `strict` and which would be accepted under
   `default()`. A future case placed near a strict-only boundary would make the
   harness and the manifest disagree. Either the harness should use the
   per-case profile from the manifest, or the manifest should declare `strict`
   uniformly; both are coherent, but the current mixture should be made
   explicit.

3. **Offset coordinate spaces.** The manifest records absolute byte offsets in
   the file. Several reader refusals carry window-relative `at` values:
   `Cmap::parse` reports `Truncated(at=broken_offset, ...)` where
   `broken_offset = 4 + i*8` is relative to the start of `cmap`, and
   `GlyphData::parse` reports `Malformed(at=10 + i*2, ...)` relative to the
   start of the glyph view. The variants match, but a harness comparing the
   `at` field against the manifest's `offset` will see different numbers.
   `src/corpus_test.mbt` correctly compares variant names only.

4. **`Cmap::parse` mixed records.** The `broken_offset` refusal fires only when
   `chosen < 0`. A font with one readable subtable and one out-of-range record
   is still accepted, with the broken record ignored. No corpus case covers
   that mixture; a case for it would be a useful addition.

5. **`parse_composite` comment placement.** In
   `src/table/glyf.mbt::parse_composite` (lines 118–127) the comment about
   point-matching components being refused sits in the `is_xy` **true** branch,
   which is the branch that proceeds. The logic is correct — `Unsupported` is
   raised when `ARGS_ARE_XY_VALUES` is clear, i.e. for point-matching — but the
   comment is misleading to a reader of the code.

6. **`simple_outline` still breaks silently.** `src/outline/build.mbt::simple_outline`
   (lines 76–88) contains `if to > glyph.points.length() { break }`. The new
   endpoint validation in `GlyphData::parse` means a simple glyph should no
   longer reach that branch with inconsistent endpoints, but the outline layer
   still tolerates a malformed `SimpleGlyph` if one is constructed directly. It
   is a defensive backstop, not a corpus gap.

7. **Checksums.** The control font has correct per-table checksums and a correct
   font-wide `head.checkSumAdjustment`; the mutated files deliberately leave
   them stale. No reader path consults a checksum, which is the correct
   behaviour — a hostile file can always recompute one. This was verified and
   is not a gap.

8. **Tolerated out-of-spec input.** `hhea_number_of_h_metrics_above_num_glyphs.ttf`
   is genuinely accepted because `Hmtx::parse` clamps `numberOfHMetrics` to
   `numGlyphs` (lines 138–142). The manifest records this as legal-but-unusual
   with a `null` variant. It is a deliberate contract, not an oversight.

## Verification summary

| Check | Result |
|---|---|
| Manifest entries | 39 |
| Embedded `corpus_cases` filenames | 39, identical set, no drift in expected names |
| Python model of current decode + outline path | 39 match, 0 mismatch |
| `moon test` | 13 tests, 13 passed, 0 failed |
| Earlier snapshot | 33 match, 6 mismatch (3 silent acceptance, 3 wrong variant) |
| Current snapshot | 39 match, 0 mismatch |

The six earlier gaps were closed by edits to `src/table/tables.mbt`,
`src/table/cmap.mbt`, `src/table/glyf.mbt` and `src/model/error.mbt`, plus the
addition of `src/corpus_test.mbt` and the expansion of
`src/testdata_test.mbt`. No further code changes are required to make the
reader conform to the corpus as it stands.
