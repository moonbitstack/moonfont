// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// A browser-facing surface for moonfont. The compiled JS or WASM module that
// `moon build --target js` / `--target wasm-gc` emits exposes exactly these
// top-level functions; everything else in the library stays behind them. A
// caller decodes a font once, keeps the returned face, and asks it for masks,
// metrics and SVG outlines as the interface needs them.
//
// The wrappers that can fail (decode, rasterise, outline) carry
// `raise @moonfont.Refused` so the library's Refused error propagates to the
// host as a thrown exception, which is the natural error model for a browser
// caller.

/// Decode a font from its bytes. Raises on input the library refuses.
#export_name("decode")
pub fn decode(bytes : Bytes) -> @moonfont.Face raise @moonfont.Refused {
  @moonfont.decode(bytes)
}

/// The number of glyphs in the face.
#export_name("num_glyphs")
pub fn num_glyphs(face : @moonfont.Face) -> Int32 {
  face.num_glyphs()
}

/// The font's units-per-em, in font units.
#export_name("units_per_em")
pub fn units_per_em(face : @moonfont.Face) -> Int32 {
  face.units_per_em()
}

/// The glyph id for a Unicode codepoint, or -1 when the font has no glyph.
#export_name("glyph_index")
pub fn glyph_index(face : @moonfont.Face, codepoint : Int32) -> Int32 {
  match face.glyph_index(codepoint) {
    Some(glyph) => glyph.to_int()
    None => -1
  }
}

/// Eight-bit coverage of one glyph at a pixel size. `samples` is a Uint8Array
/// of length `width * height`, row-major and top-down, values 0..255.
#export_name("rasterise")
pub fn rasterise(
  face : @moonfont.Face,
  glyph : Int32,
  pixels_per_em : Int32,
) -> @moonfont.CoverageMask raise @moonfont.Refused {
  face.rasterise(@moonfont.GlyphId::of(glyph), pixels_per_em)
}

/// Font-wide metrics as plain integers, in font units.
#export_name("font_metrics")
pub fn font_metrics(face : @moonfont.Face) -> @moonfont.FontMetrics {
  face.font_metrics()
}

/// One glyph's outline as an SVG path in font units, with y flipped so it draws
/// correctly in SVG space. Used for vector display and for 3D extrusion.
#export_name("outline_svg")
pub fn outline_svg(face : @moonfont.Face, glyph : Int32) -> String raise @moonfont.Refused {
  build_path(face.outline(@moonfont.GlyphId::of(glyph)))
}

fn build_path(outline : @moonfont.Outline) -> String {
  let commands = outline.commands()
  let parts : Array[String] = []
  for i in 0..<commands.length() {
    match commands[i] {
      @moonfont.PathCommand::MoveTo(p) => parts.push("M \{p.x} \{-p.y}")
      @moonfont.PathCommand::LineTo(p) => parts.push("L \{p.x} \{-p.y}")
      @moonfont.PathCommand::QuadTo(control, end) =>
        parts.push("Q \{control.x} \{-control.y} \{end.x} \{-end.y}")
      @moonfont.PathCommand::CubicTo(c1, c2, end) =>
        parts.push(
          "C \{c1.x} \{-c1.y} \{c2.x} \{-c2.y} \{end.x} \{-end.y}",
        )
      @moonfont.PathCommand::Close => parts.push("Z")
    }
  }
  parts.join(" ")
}
