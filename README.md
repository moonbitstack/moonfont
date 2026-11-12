# moonfont

Font parsing and glyph rasterisation for MoonBit.

<p>
  <a href="docs/api.html"><b>API reference</b></a> &nbsp;·&nbsp;
  <a href="SPEC.md">Specification</a> &nbsp;·&nbsp;
  <a href="research/brief.md">Research</a> &nbsp;·&nbsp;
  <a href="evidence/verdict.md">Verification</a>
</p>

One import, one door: hand over font bytes and get a face. There is no I/O, no
platform font discovery, no C binding and no floating point. The same bytes
produce the same coverage mask on wasm, wasm-gc, js and native, which is what
makes a differential test meaningful.

```moonbit
test {
  let scale = @moonfont.Scale::of(16, 1000)
  assert_eq(scale.apply(1000), 1024)
  assert_eq(@moonfont.version(), "0.1.0")
}
```

## What version 0.1.0 reads

| In | Out, deliberately |
| :-- | :-- |
| SFNT, TrueType `glyf` outlines, TrueType collections | CFF and CFF2 outlines |
| `cmap` formats 0, 4, 6 and 12 | GSUB and GPOS shaping |
| `head`, `hhea`, `maxp`, `hmtx`, `loca`, `OS/2`, legacy `kern` | Bidi, line breaking, hyphenation |
| Simple and composite glyphs, implied quadratic midpoints | Point-matching composite components |
| Path commands with quadratic and cubic curves retained | WOFF and WOFF2 containers |
| Non-zero-winding eight-bit coverage masks | Hinting, LCD subpixel rendering, SDF |
| Advances, bearings, kerning as data, text measurement | Font discovery, file and network I/O |

Each exclusion is a separate concern with a separate owner, not a gap to be
papered over. Shaping in particular needs Unicode, script itemisation and a
feature engine; bundling it here would make a font reader into a text stack.

## The layer stack

Dependency direction is strictly downwards. A lower layer never imports a
higher one, and a lower layer never knows what a higher one is for.

| Layer | Package | Knows about | Must not know about |
| :-- | :-- | :-- | :-- |
| Domain model | `model` | Points, bounds, metrics, errors, ceilings | Bytes, tables, pixels |
| Byte access | `wire` | Bounded big-endian reads | Fonts |
| Container | `sfnt` | Signatures, table directory, collections | Table contents |
| Table decoders | `table` | `head`, `hhea`, `maxp`, `hmtx`, `loca`, `cmap`, `glyf`, `kern`, `OS/2` | Paths, pixels |
| Geometry | `outline` | Points, on-curve bits, composite transforms | Scanlines |
| Coverage | `raster` | Path commands, 26.6 fixed point | Tables, files |
| Measurement | `layout` | Advances and kern pairs | Shaping |
| Façade | `moonfont` | All of the above | Nothing new |

## From bytes to a mask

<!-- nocheck -->
```moonbit
let face = @moonfont.decode(font_bytes, limits=@moonfont.Limits::strict())

// A codepoint is not a glyph. Missing glyphs are None, not .notdef.
let glyph = face.glyph_index(65).unwrap()

// Curves stay curves until a rasteriser decides to flatten them.
let outline = face.outline(glyph)

// Eight-bit coverage, with its own origin ready for an atlas.
let mask = face.rasterise(glyph, 16)

let measured = face.measure("Hello", 16)
```

`decode_all` reads every face in a TrueType collection. `Face::metrics` gives
the advance and bearing in font units; `Face::scale` is the single conversion
shared by measurement and rasterisation, so the two never disagree about where
the pen stands.

## Why integers

Rasterisation uses 26.6 fixed point throughout: eight vertical subsamples per
pixel row, exact horizontal area between non-zero-winding crossing pairs, and a
final integer scaling to 0..255. A rasteriser built on `Float` would return
different coverage on different backends for the same bytes, and no differential
test could say which answer was right. Integer arithmetic makes the mask a pure
function of the input.

Curves are flattened adaptively from their chord length, with a ceiling on the
number of segments, so a pathological font cannot do unbounded work.

## Defensive reading

Every length in a font is declared by the font. `Limits` checks each declaration
before the allocation it guards, including composite nesting depth and mask
area. A damaged file always ends in one `Refused`, naming the byte offset:

| Shape | Question it answers |
| :-- | :-- |
| `Unknown`, `Unexpected` | Is this not a font, or is a field wrong? |
| `Truncated`, `Malformed` | Is the file damaged? |
| `Unsupported`, `MissingTable` | Is it a part the library does not read, or one the file omitted? |
| `OverLimit`, `Recursion` | Did it ask for more than the caller allowed? |
| `MissingGlyph` | Is the glyph id outside `maxp`? |

`Limits::strict()` is the preset for untrusted uploads; `Limits::default()` is
for an application reading its own assets.

## Differential tests

Correctness is held to the libraries that came before this one. Fixtures are
produced offline by C, C++, C#, Python, Rust and Go oracles and replayed by the
MoonBit tests; no third-party MoonBit module is ever a dependency.

```bash
python3 scripts/difftest/make_font.py
python3 scripts/difftest/make_fixtures.py --oracle reference
python3 scripts/difftest/verify_fixtures.py --check
python3 scripts/difftest/make_corpus.py --check
python3 scripts/difftest/embed_corpus.py --check
moon test --target all
```

Tolerances are per category: table fields, charmap mappings, glyph ids and
outline command streams are exact; scaled bounds allow one 26.6 unit; ink
coverage allows five per cent, because anti-aliasing and hinting are not
bit-identical across engines. See `contracts/DIFFTEST.md`.

## The interface is the source of truth

`moon info` writes one `pkg.generated.mbti` per package. The static API page is
derived from those files and the `///` comments in the source, never hand-edited.

```bash
make api     # export the newest interfaces, then rebuild docs/api.html
make docs    # verify the page is current, without writing
```

The generator is deterministic: no timestamps, no filesystem ordering, LF
newlines and one trailing newline. CI runs `make docs` and refuses a page that
no longer matches the interfaces. `docs/` is the directory a later GitHub Pages
deployment uploads; nothing is deployed from this repository as it stands.

## Dependencies

The core declares none. It uses the built-in library only. That is a decision,
not an omission: a font reader is the bottom of a graphics stack, and every
dependency it takes becomes a dependency of every GUI, chart and game built on
top of it. Where an ecosystem package is genuinely useful — deflate for WOFF,
base encodings for fixtures — it belongs in `integration/`, and it is taken
from `moonbitstack/*` first and `moonbitlang/*` only as a fallback. No
third-party MoonBit font module is a dependency; they are references and
oracles only.

## Development

```bash
moon check --target all --deny-warn
moon test --target all
moon fmt
moon info --target all
python3 scripts/docs/gen_api.py --check
python3 scripts/check_snippets.py
```

The library is pure computation and runs on wasm, wasm-gc, js and native.

## Licence

Apache-2.0. See `LICENSE`.
