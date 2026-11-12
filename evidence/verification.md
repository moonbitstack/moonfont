# Verification record

Recorded on 2026-11-12 against `moon 0.1.20261104 (940aa18 2026-11-04)` with
feature flags `rr_moon_mod, rr_moon_pkg`. Every command below was run from the
repository root with no network access required. Exit codes are those of the
command, not of a pipe.

| Command | Result | Exit |
| :-- | :-- | --: |
| `moon check --target all --deny-warn` | 32 tasks, no warnings, no errors | 0 |
| `moon build --target all` | 32 tasks, up to date | 0 |
| `moon test --target all` | 13 passed, 0 failed on each of wasm, wasm-gc, js, native | 0 |
| `moon fmt` then `git diff --exit-code` | no source change | 0 |
| `moon info --target all` then `git diff --exit-code` | 8 `pkg.generated.mbti` files, no change | 0 |
| `python3 scripts/check_snippets.py` | `README.md: 1 all blocks compile` | 0 |
| `python3 scripts/docs/gen_api.py --check` | `docs/api.html is current: 153180 bytes, no differences` | 0 |
| `python3 scripts/difftest/verify_fixtures.py --check` | `OK (470 checks)` | 0 |
| `python3 scripts/difftest/make_corpus.py --check` | `39 corpus files match the manifest` | 0 |
| `python3 scripts/difftest/embed_corpus.py --check` | `src/testdata_test.mbt is current` | 0 |

The generator was also run twice in write mode and produced a byte-identical
`docs/api.html` (SHA-256 `ae717f599621fe10155823909ce65f67cc9bf494c693fda62813b075a030c217`,
8 packages, 161 declarations), which is the determinism requirement.

## What the thirteen tests cover

| Test | Property |
| :-- | :-- |
| `big-endian reads and signed values` | u8/i8/u16/u32 against known bytes |
| `a read past the end is refused at the offset` | bounded reads raise rather than wrap |
| `a window cannot walk outside its own bytes` | a table cursor cannot read another table |
| `26.6 scaling stays exact in integers` | `Scale::of(16, 1000).apply(1000) == 1024` |
| `bounds, limits and the strict preset` | geometry helpers and the two presets |
| `a square outline fills its interior` | 16 by 16 mask, centre coverage 255, outside 0 |
| `an empty outline produces an empty mask` | zero-sized result, not an error |
| `the embedded font decodes from bytes to a mask` | full slice: decode, cmap, outline, rasterise, measure |
| `the whole hostile corpus is safe to read` | no trap over thirteen embedded malformed fonts |
| `the clearly malformed fonts are refused with a reason` | five definite refusals |
| `the valid fixture is not refused` | the legal font is accepted end to end |
| `each corpus case yields its contracted refusal` | all 39 cases: exact `Refused` variant or acceptance |
| `every refusal name in the corpus is a declared variant` | `Refused::name()` never invents text |

## Determinism evidence

The rasteriser uses 26.6 fixed point throughout and performs no floating-point
operation. All four backends produce the same 13 passing results from the same
embedded bytes. `verify_fixtures.py` confirms canonical JSON and SHA-256
sidecars for 470 individual checks, and `make_corpus.py --check` confirms all 39
corpus files still match their manifest hashes. The embedded corpus is checked
by a content checksum (`embed_corpus.py --check`), so a stale or drifted
in-source font is caught before the suite runs.
