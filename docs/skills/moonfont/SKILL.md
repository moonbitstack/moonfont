---
name: moonfont
description: "Font parsing and glyph rasterisation for MoonBit — TrueType, CFF, CFF2, WOFF, WOFF2 and variable fonts in; glyph outlines, coverage masks, metrics and text measurement out, in integer arithmetic so every backend draws the same pixels. Not released yet; reach for it once a version is published on mooncakes."
---

# moonfont

Hand the library a font's bytes and it gives back a face: no file I/O, no system
font lookup, no C binding, no floating point. The same bytes give the same mask on
wasm, wasm-gc, js and native.

## Read a font and draw a glyph

```moonbit
fn draw_a(font_bytes : Bytes) -> Unit raise {
  let face = @moonfont.decode(font_bytes, limits=@moonfont.limits_strict)
  guard face.glyph_index(65) is Some(glyph) else { return }
  let outline = face.outline(glyph)
  let mask = face.rasterise(glyph, 16)
  let measured = face.measure("Hello", 16)
  ignore((outline, mask, measured))
}
```

`decode` takes a plain font, a TrueType collection, a WOFF file or a WOFF2 file
without being told which; `decode_all` reads every face of a collection.
`Face::metrics` gives advance and bearing in font units, and `Face::scale` is the
one conversion that measuring and rasterising share.

## Set a variable font to an instance

```moonbit
fn at_weight(font_bytes : Bytes) -> Unit raise {
  let face = @moonfont.decode(font_bytes)
  let at = face.at([(0x77676874, 700 * 65_536)])
  let glyph = @moonfont.GlyphId::of(1)
  let outline = face.outline(glyph, location=at)
  let advance = face.advance(glyph, location=at)
  ignore((outline, advance))
}
```

Axis values are 16.16 fixed point under the four-character tag, so `700` is
`700 * 65_536`. `face.axes()` lists the axes a font has, `face.location()` is the
default instance, and a font without axes ignores a location entirely. Ask
`face.is_variable()` before showing a user any controls.

## Vertical text and the face's own measurements

```moonbit
fn column(font_bytes : Bytes) -> Unit raise {
  let face = @moonfont.decode(font_bytes)
  let at = face.at([(0x77676874, 900 * 65_536)])
  let glyph = @moonfont.GlyphId::of(1)
  let column_ascent = face.vertical_metrics(location=at).ascent
  let step = face.advance_height(glyph, location=at)
  let bearings = face.top_side_bearing(glyph, location=at)
  let wide = face.font_metrics(location=at).ascent
  ignore((column_ascent, step, bearings, wide))
}
```

`vhea` and `vmtx` are read when a font has them; without them the vertical calls
report the horizontal measurements and the advance height is the em, so a vertical
layout never branches. `MVAR` moves the face's own measurements at a location, and
`face.cvt()` reads the control values a hinting program would snap to, with `cvar`
applied.

## Rules that catch people out

- A font from outside the program is decoded with limits_strict; `limits` is for the program's own assets. A damaged or hostile file ends in one `Refused` that names the byte offset.
- Outlines are `glyf` (quadratic) or `CFF`/`CFF2` (cubic), and `is_postscript` says which. Shaping (GSUB, GPOS), bidi and line breaking are out of scope: this library measures and fills, it does not reorder.
- Masks are eight-bit coverage under the non-zero winding rule, computed in 26.6 fixed point, and `left`/`top` are whole pixels. Do not convert to `Float` to post-process a mask and expect the same bytes on every backend.
- `decode` allocates: the tables of a WOFF or WOFF2 file are decompressed into one buffer before any table is read, and a collection's faces share that buffer. Pass the bytes of one font once and keep the face.
