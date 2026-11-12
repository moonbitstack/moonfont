# Quality gates

A gate is a command with a fixed exit code, not an opinion. A change that turns
any gate red does not ship.

| Gate | Command | Fails when |
| :-- | :-- | :-- |
| G01 types | `moon check --target all --deny-warn` | any warning or error on any backend |
| G02 build | `moon build --target all` | any backend fails to build |
| G03 behaviour | `moon test --target all` | any test fails on any backend |
| G04 formatting | `moon fmt && git diff --exit-code` | a source file was not formatted |
| G05 interface | `moon info --target all && git diff --exit-code` | a public signature changed without its `.mbti` |
| G06 documentation | `python3 scripts/check_snippets.py` | a MoonBit block in the README no longer compiles |
| G07 API page | `python3 scripts/docs/gen_api.py --check` | `docs/api.html` no longer matches the interfaces |
| G08 fixtures | `python3 scripts/difftest/verify_fixtures.py --check` | schema, canonical form or a SHA-256 sidecar changed |
| G09 corpus | `python3 scripts/difftest/make_corpus.py --check` | a malformed font no longer matches the manifest |
| G10 embedded data | `python3 scripts/difftest/embed_corpus.py --check` | the compiled-in fonts are stale |

All ten gates were run and passed on 2026-11-12; see `verification.md`. CI runs
them on every push to `master`. G07 checks the generated page in read-only
mode; `make api` is the write path that regenerates it after a signature change.

## Backend matrix

| Backend | check | build | test |
| :-- | :-- | :-- | :-- |
| wasm | pass | pass | 13/13 |
| wasm-gc | pass | pass | 13/13 |
| js | pass | pass | 13/13 |
| native | pass | pass | 13/13 |

## Defensive invariants

- No function under `src/` performs I/O. Fonts reach the library as `BytesView`.
- Every declared length is checked by `Limits` before the allocation it guards.
- A damaged font raises one `Refused` naming a byte offset; it never traps.
- Composite glyph recursion is bounded by `Limits::recursion`.
- Curve flattening is bounded by a segment ceiling.
- The parser core resolves no external packages, so the gates need no network.
