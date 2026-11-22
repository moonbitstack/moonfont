<p align="center">
  <a href="https://moonbitstack.github.io/moonfont/">Specimen</a> ·
  <a href="https://moonbitstack.github.io/moonfont/guide.html">Guide</a> ·
  <a href="https://moonbitstack.github.io/moonfont/api.html">Reference</a> ·
  <a href="https://mooncakes.io/docs/moonbitstack/moonfont">mooncakes</a>
</p>

# moonfont

Font parsing and glyph rasterisation for MoonBit.

One import, one door: hand over font bytes and get a face. No I/O, no platform
font discovery, no C binding, no floating point. The same bytes produce the same
coverage mask on wasm, wasm-gc, js and native.

## What it reads

| In | Out |
| :-- | :-- |
| SFNT, TrueType collections, WOFF, WOFF2 (single or collection) | one face per font, over one buffer |
| TrueType `glyf`, simple and composite | `MoveTo`, `LineTo`, `QuadTo`, `CubicTo`, `Close` |
| `CFF` and `CFF2`, Type 2 charstrings | the same command stream, cubic curves kept cubic |
| `fvar`, `avar`, `gvar`, `HVAR`, `VVAR` | one outline and one advance per location |
| `MVAR`, `cvar` over `cvt ` | the face's own measurements and control values at a location |
| `cmap` 0, 4, 6, 12 | a glyph id, or nothing |
| `head`, `hhea`, `vhea`, `maxp`, `hmtx`, `vmtx`, `loca`, `OS/2`, legacy `kern` | metrics in font units, horizontal and vertical |
| Eight-bit coverage, non-zero winding, 26.6 fixed point | a mask with its own origin |

A container is an interface, not a branch: `Container` claims a signature and
returns the faces it finds, and `TableSource` is a face seen as named byte ranges.
`decode_from` builds a face from any table source — a memory map, a file handle, a
fetch that returns one table at a time.

Not read, by design: `GSUB` and `GPOS` shaping, bidirectional text and line
breaking. Those belong to a text layout library that consumes this one; the
positions it computes are the positions a rasteriser fills.

## From bytes to a mask

```moonbit
fn draw_a(font_bytes : Bytes) -> Unit raise {
  let face = @moonfont.decode(font_bytes, limits=@moonfont.limits)
  guard face.glyph_index(65) is Some(glyph) else { return }
  let outline = face.outline(glyph)
  let mask = face.rasterise(glyph, 16)
  let measured = face.measure("Hello", 16)
  ignore((outline, mask, measured))
}
```

`decode` reads a plain font, a collection, a WOFF file or a WOFF2 file without
being told which. `decode_all` returns every face in a collection.

A face is either quadratic (through `glyf`) or cubic (through `CFF` or `CFF2`),
and `is_postscript` says which without making a caller branch on it.

## A variable font

```moonbit
fn heavy(font_bytes : Bytes) -> Unit raise {
  let face = @moonfont.decode(font_bytes)
  if face.is_variable() {
    let at = face.at([(0x77676874, 700 * 65_536)])
    let glyph = @moonfont.GlyphId::of(1)
    let outline = face.outline(glyph, location=at)
    let metrics = face.metrics(glyph, location=at)
    ignore((outline, metrics))
  }
}
```

`face.at` takes axis values in 16.16 fixed point, keyed by the four-character
tag. `face.axes()` lists what a font offers and `face.location()` is the default
instance. The deltas are interpolated in integers, and the points a tuple does
not name are inferred from their neighbours inside the same contour, so a sparse
delta set still moves a smooth outline.

## Why integers

Rasterisation is 26.6 fixed point throughout: eight vertical subsamples per
pixel row, exact horizontal area between non-zero-winding crossings, then an
integer scale to 0..255. A `Float` rasteriser would disagree across backends;
integer arithmetic makes the mask a pure function of the input.

The same holds for interpolation: a normalised coordinate is F2Dot14, a
variation scalar is 16.16, and a point is a whole font unit. Coverage is
therefore identical on every target, which is what lets a differential test say
what the right answer is.

## Defensive reading

Every declared length is checked against `Limits` before the allocation it
guards. A damaged or hostile file ends in one `Refused`, naming the byte offset:
`Unknown`, `Unexpected`, `Unsupported`, `Truncated`, `OverLimit`, `Malformed`,
`MissingTable`, `MissingGlyph`, `Recursion`.

```moonbit
fn refuse_gently(font_bytes : Bytes) -> Int {
  let outcome = try {
    let face = @moonfont.decode(font_bytes, limits=@moonfont.limits_strict)
    face.num_glyphs()
  } catch {
    _ => 0
  }
  outcome
}
```

`limits_strict` is for bytes from somewhere else: a sixteenth of the file
ceiling and an eighth of the points. `limits` is for an application's own
assets. `Limits::new` changes one ceiling and keeps the rest at their defaults.

## Development

```bash
moon check --target all --deny-warn
moon test --target all
moon fmt
moon info --target all
```

The chores that need a script are in `scripts/dev.py`: `api` regenerates the
reference page from the interfaces, `embed` rebuilds the corpus literals, and
`formats` rebuilds the differential fixtures and the test that replays them.

Differential fixtures are produced offline by fontTools and FreeType and
replayed by the MoonBit tests; no third-party MoonBit module is a dependency.

The documentation site is built rather than assembled: `scripts/build_site.py`
compiles this library to JavaScript, compiles the tray on the homepage, and
writes the counts the page quotes. The tray is TypeScript (`site/src/tray.ts`)
and is the only part of the site with a Node toolchain — `npm ci --prefix site`
installs it. It collides the castings with matter-js, vendored under
`docs/vendor/` at the pinned version, so a page that promises to make no request
it does not serve itself keeps that promise.

The compiled tray is committed, because Pages serves `docs/` as it stands; CI
recompiles it and refuses a copy that no longer matches its source or its pin.

## Licence

Apache-2.0. See `LICENSE`.
