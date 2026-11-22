import type * as MoonBit from "./moonbit.d.ts";

export function outline_svg(face: any,
                            glyph: MoonBit.Int): MoonBit.Result<MoonBit.String, any>;

export function font_metrics(face: any): any;

export function metrics(face: any,
                        glyph: MoonBit.Int): MoonBit.Result<any, any>;

export function scale_value(face: any,
                            value: MoonBit.Int,
                            pixels_per_em: MoonBit.Int): MoonBit.Int;

export function rasterise(face: any,
                          glyph: MoonBit.Int,
                          pixels_per_em: MoonBit.Int): MoonBit.Result<any, any>;

export function glyph_index(face: any,
                            codepoint: MoonBit.Int): MoonBit.Int;

export function units_per_em(face: any): MoonBit.Int;

export function num_glyphs(face: any): MoonBit.Int;

export function decode(bytes: MoonBit.Bytes): MoonBit.Result<any, any>;
