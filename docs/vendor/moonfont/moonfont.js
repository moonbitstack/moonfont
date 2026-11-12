// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// Browser loader for the compiled moonfont/web module.
//
// The MoonBit JS backend emits top-level named exports. The functions that can
// fail return a MoonBit Result object: on success it is `{ $tag: 1, _0: value }`
// and on failure `{ $tag: 0, _0: error }`. unwrap() normalises that into a plain
// `{ ok, value, error }` so callers never touch the `$tag` convention.
//
// CoverageMask is `{ width, height, samples }` where `samples` is a Uint8Array of
// length width*height, row-major and top-down, values 0..255. FontMetrics is a
// plain record with fields units_per_em, ascent, descent, line_gap, cap_height,
// x_height, num_glyphs, bounding_box.

import * as mf from "./web.js";

function unwrap(result) {
  if (result && result.$tag === 1) {
    return { ok: true, value: result._0 }
  }
  return { ok: false, error: result ? result._0 : null }
}

export function decode(bytes) {
  return unwrap(mf.decode(bytes))
}

export function decodeBytes(arrayBuffer) {
  return decode(new Uint8Array(arrayBuffer))
}

export function numGlyphs(face) {
  return mf.num_glyphs(face)
}

export function unitsPerEm(face) {
  return mf.units_per_em(face)
}

export function glyphIndex(face, codepoint) {
  return mf.glyph_index(face, codepoint)
}

export function rasterise(face, glyph, ppem) {
  return unwrap(mf.rasterise(face, glyph, ppem))
}

export function fontMetrics(face) {
  return mf.font_metrics(face)
}

export function outlineSvg(face, glyph) {
  return unwrap(mf.outline_svg(face, glyph))
}
