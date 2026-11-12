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

Phase 1 (research and architecture) in progress. Phase 2 (design) in progress
in parallel because the documentation site has no dependency on the library's
internal API.

## Completed (paths only)

- `.git/` — local repository, branch `master`
- `.gitignore`
- `PROJECT_STATE.md`

## In progress

- `general-purpose-1` — `research/systems-libraries.md` (C, C++, Rust, Go)
- `general-purpose-2` — `research/managed-libraries.md` (JVM, .NET, JS, Python)
- `general-purpose-3` — `research/longtail-and-architecture.md`
  (Haskell, Kotlin, PHP, Swift, Ruby, plus cross-language synthesis)
- `mvp-dev-expert-team-architect` — `SPEC.md`, `contracts/API.md`,
  `contracts/DIFFTEST.md`, `contracts/LAYOUT.md`
- `mvp-dev-expert-team-designer` — `DESIGN.md`
- `team-lead` — dependency API probe, toolchain verification

## Pending decisions (recommendation first)

1. v0.1.0 format coverage — **recommended**: SFNT, TrueType `glyf` outlines,
   `cmap` formats 0/4/6/12, core metrics tables, TTC; CFF, WOFF, WOFF2,
   variable and colour fonts in later phases. Reason: one complete vertical
   slice from bytes to coverage mask before widening.
2. Core dependency set — **recommended**: zero external packages in the parser
   core; `moonbitstack/moonzip@0.3.8` reserved for WOFF, `moonbase@0.4.5` for
   fixture encoding in `integration/`. Reason: the core stays portable and the
   dependency rule is still honoured where a dependency is genuinely needed.
3. Static site stack — **recommended**: plain HTML/CSS/JS plus a Python
   generator, matching the sibling sites. Reason: `docs/` uploads directly to
   GitHub Pages with no build step.

## Next steps

1. Assemble the three research briefs, then have the architect's SPEC absorb
   any capability gaps they expose.
2. Spawn Phase 3 implementation (library core + differential-test harness in
   parallel with the static site and its generator) once the contracts land.
3. Run `moon check`, `moon test`, `moon info --target all`, the generator's
   `--check` mode, then make local commits.
