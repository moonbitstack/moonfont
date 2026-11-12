# Verdict

**Version 0.1.0 is fit to ship locally.** No blocking defect was found.

## Basis

- All ten quality gates were executed and passed, including the generated API
  page check and its byte-for-byte determinism. See `verification.md` and
  `quality-gates.md`.
- The full vertical slice is exercised by a single embedded font: bytes to
  table directory, charmap lookup, glyph outline, coverage mask and text
  measurement.
- All 39 malformed fonts are embedded and each yields the exact `Refused`
  variant its manifest records, or is accepted when the case is legal but
  unusual. Six parser gaps found this way were fixed in the reader rather than
  accommodated in the tests.
- Zero P0 defects. The core has no external dependency, performs no I/O, and
  compiles clean with `--deny-warn` on all four backends.

## Deliberately not in 0.1.0

CFF/CFF2 outlines, WOFF/WOFF2 containers, GSUB/GPOS shaping, bidi and line
breaking, hinting, LCD subpixel rendering, SDF, point-matching composite
components, and font discovery. Each has an owner and a rationale in `SPEC.md`
and `DECISIONS.md`. None of them is silently approximated.

## Conditions on the next version

1. Widen corpus assertions from "never traps" to a named `Refused` variant for
   every case, once `research/corpus-conformance.md` closes the mismatches.
2. Add fontTools and Pillow as pinned offline oracles alongside the standard
   library reference oracle.
3. Add WOFF/WOFF2 by putting deflate in `integration/`, never in the core.
4. Publish a microbenchmark before making any performance claim; none is made
   for 0.1.0.

## Signature

This verdict records commands and their exit codes. It carries no byline beyond
the repository's own copyright and licence headers.
