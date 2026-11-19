# moonfont

Font parsing and glyph rasterisation for MoonBit.

One import, one door: hand over font bytes and get a face. No I/O, no platform
font discovery, no C binding, no floating point. The same bytes produce the same
coverage mask on wasm, wasm-gc, js and native.

## What 0.1.0 reads

| In | Out, deliberately |
| :-- | :-- |
| SFNT, TrueType `glyf`, TrueType collections | CFF and CFF2 outlines |
| `cmap` 0, 4, 6, 12 | GSUB and GPOS shaping |
| `head`, `hhea`, `maxp`, `hmtx`, `loca`, `OS/2`, legacy `kern` | Bidi, line break, hyphenation |
| Simple and composite glyphs | Point-matching composite components |
| Quadratic and cubic path commands | WOFF and WOFF2 containers |
| Eight-bit coverage masks, non-zero winding | Hinting, LCD subpixel, SDF |

Each exclusion is a separate concern with its own owner, not a gap to paper over.

## From bytes to a mask

```moonbit
fn draw_a(font_bytes : Bytes) -> Unit raise {
  let face = @moonfont.decode(font_bytes, limits=@moonfont.Limits::strict())
  guard face.glyph_index(65) is Some(glyph) else { return }
  let outline = face.outline(glyph)
  let mask = face.rasterise(glyph, 16)
  let measured = face.measure("Hello", 16)
  ignore((outline, mask, measured))
}
```

`decode_all` reads every face in a collection. `Face::metrics` gives advance and
bearing in font units; `Face::scale` is shared by measurement and rasterisation.

## Why integers

Rasterisation is 26.6 fixed point throughout: eight vertical subsamples per
pixel row, exact horizontal area between non-zero-winding crossings, then an
integer scale to 0..255. A `Float` rasteriser would disagree across backends;
integer arithmetic makes the mask a pure function of the input.

## Defensive reading

Every declared length is checked against `Limits` before the allocation it
guards. A damaged or hostile file ends in one `Refused`, naming the byte offset:
`Unknown`, `Unexpected`, `Unsupported`, `Truncated`, `OverLimit`, `Malformed`,
`MissingTable`, `MissingGlyph`, `Recursion`. `Limits::strict()` is for untrusted
uploads; `Limits::default()` is for an app's own assets.

## Development

```bash
moon check --target all --deny-warn
moon test --target all
moon fmt
moon info --target all
```

The library is pure computation; it runs on wasm, wasm-gc, js and native.

Differential fixtures are produced offline by C, C++, C#, Python, Rust and Go
oracles in `scripts/difftest/` and replayed by the MoonBit tests; no third-party
MoonBit module is ever a dependency.

## Licence

Apache-2.0. See `LICENSE`.
