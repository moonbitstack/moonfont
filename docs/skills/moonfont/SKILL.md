---
name: moonfont
description: Font parsing and glyph rasterisation for MoonBit — TrueType and TrueType collections in, glyph outlines, coverage masks and text measurement out, in integer arithmetic so every backend draws the same pixels. Not released yet; reach for it once a version is published on mooncakes.
---

# moonfont

Hand the library a font's bytes and it gives back a face: no file I/O, no system
font lookup, no C binding, no floating point. The same bytes give the same mask on
wasm, wasm-gc, js and native.

## Read a font and draw a glyph

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

`decode_all` reads every face of a collection. `Face::metrics` gives advance and
bearing in font units, and `Face::scale` is the one conversion that measuring and
rasterising share.

## Rules that catch people out

- A font from outside the program is decoded with `Limits::strict()`; `Limits::default()` is for the program's own assets. A damaged or hostile file ends in one `Refused` that names the byte offset.
- Read only: `glyf` outlines, `cmap` 0, 4, 6 and 12, the metric tables and legacy `kern`. CFF outlines, shaping (GSUB, GPOS), WOFF containers and hinting are out of scope, so a font that needs them is refused rather than drawn wrong.
- Masks are eight-bit coverage under the non-zero winding rule, computed in 26.6 fixed point. Do not convert to `Float` to post-process a mask and expect the same bytes on every backend.
