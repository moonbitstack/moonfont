# moonfont — Public API Contract

Version 1.0.0, covering `moonbitstack/moonfont` v0.1.0. en-GB throughout.

This document is the **sole signer** of the public contract. It fixes package
paths, type names, function names, parameter shapes, error cases and stability.
The implementation may append an "Implementation notes" section; it may not
change a field, a name or a signature listed here. A contract change requires a
new version of this file, a regenerated `pkg.generated.mbti`, a regenerated
`docs/api.html` and, where the change touches behaviour, a re-baselined
differential corpus. Frontend and backend consumers treat this file as the only
description of the surface; neither keeps a private copy.

Authority order when two artefacts disagree: this file > `pkg.generated.mbti` >
`docs/api.html` > source comments. A disagreement is a defect to be repaired in
that order, not an invitation to reinterpret.

---

## 1. Package paths

| Path | Role | Public |
| --- | --- | --- |
| `moonbitstack/moonfont` | Façade. `decode`, `decode_all`, `Face`, re-exports. | Yes |
| `moonbitstack/moonfont/model` | Domain vocabulary, `Refused`, `Limits`, `PathCommand`, `Outline`, `CoverageMask`, metrics. | Yes |
| `moonbitstack/moonfont/wire` | Bounds-checked big-endian `Cursor`. | Yes |
| `moonbitstack/moonfont/sfnt` | Container signatures, `Directory`, `TableRecord`, tag helpers. | Yes |
| `moonbitstack/moonfont/table` | Table decoders. | Yes |
| `moonbitstack/moonfont/outline` | `GlyphSource`, outline emission. | Yes |
| `moonbitstack/moonfont/raster` | `rasterise` into a coverage mask. | Yes |
| `moonbitstack/moonfont/layout` | `measure`. | Yes |

Every package is public. A caller that imports only the façade gets the whole
vertical slice; a caller that imports only `raster` or only `table` does not load
the rest. No package outside this table is part of the contract.

## 2. The façade re-export list

The façade re-exports exactly these twelve types with `pub using @model { ... }`.
The list is closed for 0.1.x. Adding a type is additive and requires only a
regenerated interface; removing one is breaking.

`Bounds`, `CoverageMask`, `FontMetrics`, `GlyphId`, `GlyphMetrics`, `Limits`,
`Outline`, `PathCommand`, `Point`, `Refused`, `Scale`, `TextMetrics`.

## 3. Exact façade signatures

Parameter names are part of the contract because labelled arguments use them.

```
version() -> String

decode(bytes : BytesView, limits? : @model.Limits) -> Face raise @model.Refused

decode_all(bytes : BytesView, limits? : @model.Limits) -> Array[Face] raise @model.Refused

Face::num_glyphs(self : Face) -> Int32
Face::units_per_em(self : Face) -> Int32
Face::font_metrics(self : Face) -> @model.FontMetrics
Face::scale(self : Face, pixels_per_em : Int32) -> @model.Scale
Face::glyph_index(self : Face, codepoint : Int32) -> @model.GlyphId?
Face::glyph_for(self : Face, character : Char) -> @model.GlyphId?
Face::outline(self : Face, glyph : @model.GlyphId) -> @model.Outline raise @model.Refused
Face::metrics(self : Face, glyph : @model.GlyphId) -> @model.GlyphMetrics raise @model.Refused
Face::rasterise(self : Face, glyph : @model.GlyphId, pixels_per_em : Int32) -> @model.CoverageMask raise @model.Refused
Face::kern_between(self : Face, left : @model.GlyphId, right : @model.GlyphId) -> Int32
Face::measure(self : Face, text : String, pixels_per_em : Int32, letter_spacing? : Int32) -> @model.TextMetrics
```

### Preconditions, postconditions and failure

| Function | Precondition | Postcondition | Fails with |
| --- | --- | --- | --- |
| `version` | none | Returns `"0.1.0"`. | never |
| `decode` | `bytes` is a complete file held by the caller; kept alive and unchanged for the face's life. | Returns the first `Face`. Reads the directory and nine small tables only; outlines remain lazy. | `Unknown`, `Malformed`, `Truncated`, `OverLimit`, `Unsupported`, `MissingTable`, `Unexpected` |
| `decode_all` | as `decode`. | Returns one `Face` per collection face; a plain font returns exactly one. Never empty: an empty collection raises `Malformed`. | as `decode` |
| `Face::num_glyphs` | face is valid. | `maxp.numGlyphs`. | never |
| `Face::units_per_em` | face is valid. | A value in `[16, 16384]`, enforced at `decode`. | never |
| `Face::font_metrics` | face is valid. | Font units, not pixels. | never |
| `Face::scale` | `pixels_per_em > 0`. | A `Scale` shared by `measure` and `rasterise`. | never (a non-positive value is a caller error, not file data) |
| `Face::glyph_index` | face is valid. | `Some(GlyphId)` or `None`. `None` is not an error. | never |
| `Face::glyph_for` | face is valid. | As `glyph_index`, using `Char::to_int`. | never |
| `Face::outline` | `glyph` is in range. | A complete `Outline` in font units with quadratic curves preserved. No partial outline. | `MissingGlyph`, `Truncated`, `Malformed`, `OverLimit`, `Recursion` |
| `Face::metrics` | `glyph` is in range. | `GlyphMetrics` in font units, `bounds` from the outline. | `MissingGlyph`, plus every `outline` failure |
| `Face::rasterise` | `glyph` in range, `pixels_per_em > 0`. | Eight-bit grey `CoverageMask`, non-zero winding, unhinted, with its own origin. | every `outline` failure, plus `OverLimit` on `mask_pixels` |
| `Face::kern_between` | face is valid. | Legacy `kern` adjustment in font units; `0` when the table is absent. | never |
| `Face::measure` | face is valid. | `TextMetrics`; unmapped codepoints are skipped, so `glyphs ≤ text.length()`. | never |

`Face` is opaque. Its nine private fields (`head`, `hhea`, `maxp`, `hmtx`,
`cmap`, `kern`, `os2`, `source`, `limits`) appear in `pkg.generated.mbti` as
private implementation detail and are **not** part of this contract. A caller
must not construct a `Face` directly; `decode` and `decode_all` are the only
constructors.

## 4. Exact model types

All coordinates, advances and metrics are `Int32` in font units unless named
otherwise. `Scale::apply` returns 26.6 fixed-point pixel units. No public type
contains a `Double` or `Float`.

```
pub(all) suberror Refused {
  Unknown(at~ : Int32, got~ : String)
  Unexpected(at~ : Int32, got~ : String, want~ : String)
  Unsupported(at~ : Int32, got~ : String)
  Truncated(at~ : Int32, want~ : Int32)
  OverLimit(limit~ : Int32, got~ : Int32)
  Malformed(at~ : Int32, got~ : String)
  MissingTable(tag~ : String)
  MissingGlyph(glyph~ : Int32)
  Recursion(depth~ : Int32)
}

pub(all) struct Bounds { x_min : Int32; y_min : Int32; x_max : Int32; y_max : Int32 }
  Bounds::empty() -> Bounds
  Bounds::width(self) -> Int32
  Bounds::height(self) -> Int32
  Bounds::is_empty(self) -> Bool

pub(all) struct Point { x : Int32; y : Int32 }
  Point::of(x : Int32, y : Int32) -> Point

pub(all) enum PathCommand {
  MoveTo(Point)
  LineTo(Point)
  QuadTo(Point, Point)
  CubicTo(Point, Point, Point)
  Close
}

pub(all) struct Outline { commands : Array[PathCommand]; bounds : Bounds }
  Outline::of(Array[PathCommand], Bounds) -> Outline
  Outline::commands(self) -> Array[PathCommand]
  Outline::bounds(self) -> Bounds
  Outline::is_empty(self) -> Bool

pub(all) struct GlyphId { index : Int32 }
  GlyphId::of(Int32) -> GlyphId
  GlyphId::to_int(self) -> Int32

pub(all) struct Scale { ppem : Int32; units_per_em : Int32 }
  Scale::of(Int32, Int32) -> Scale
  Scale::ppem(self) -> Int32
  Scale::apply(self, Int32) -> Int32

pub(all) struct CoverageMask {
  width : Int32; height : Int32; left : Int32; top : Int32;
  samples : FixedArray[Byte]
}
  CoverageMask::of(Int32, Int32, Int32, Int32, FixedArray[Byte]) -> CoverageMask
  CoverageMask::at(self, Int32, Int32) -> Int32

pub(all) struct FontMetrics {
  units_per_em : Int32; ascent : Int32; descent : Int32; line_gap : Int32;
  cap_height : Int32; x_height : Int32; num_glyphs : Int32;
  bounding_box : Bounds
}

pub(all) struct GlyphMetrics {
  advance : Int32; left_side_bearing : Int32; bounds : Bounds
}

pub(all) struct TextMetrics {
  advance : Int32; ascent : Int32; descent : Int32; line_gap : Int32;
  glyphs : Int32
}

pub(all) struct Limits {
  file_bytes : Int32; table_bytes : Int32; glyphs : Int32; points : Int32;
  contours : Int32; composites : Int32; recursion : Int32; mask_pixels : Int32
}
  Limits::default() -> Limits
  Limits::strict() -> Limits
  Limits::check_file(self, Int32) -> Unit raise Refused
  Limits::check_table(self, Int32) -> Unit raise Refused
  Limits::check_glyphs(self, Int32) -> Unit raise Refused
  Limits::check_outline(self, Int32, Int32) -> Unit raise Refused
  Limits::check_composites(self, Int32) -> Unit raise Refused
  Limits::check_depth(self, Int32) -> Unit raise Refused
  Limits::check_mask(self, Int32, Int32) -> Unit raise Refused
```

### Field semantics that a caller may rely on

- `CoverageMask.left` and `CoverageMask.top` are the mask origin in 26.6 pixel
  units relative to the pen. `samples` is row-major, `width * height` bytes, each
  in `[0, 255]`. `at(x, y)` returns the sample, or `0` outside the mask.
- `Scale::apply(v)` computes `v * ppem * 64 / units_per_em` in integer
  arithmetic with a 64-bit intermediate; the result is 26.6 fixed point.
- `Refused` derives `Eq` and `Debug` and implements `Show`. Variant names, field
  labels and `Show` text are stable. `Refused::to_string` names the offset and
  the two values.
- `Limits::default()` and `Limits::strict()` values are fixed in `SPEC.md` §6.
  Every ceiling is checked before its allocation. A caller supplying its own
  `Limits` record is responsible for positive ceilings.

## 5. Exact lower-package surfaces

These are public and binding. Signatures use the parameter-free form that
`moon info` emits; the authored names are in the source comments.

**`wire`**

```
Cursor::new(BytesView) -> Cursor
Cursor::at(BytesView, Int32) -> Cursor raise @model.Refused
Cursor::window(self, Int32, Int32) -> Cursor raise @model.Refused
Cursor::position(self) -> Int32; Cursor::length(self) -> Int32
Cursor::left(self) -> Int32; Cursor::rest(self) -> BytesView
Cursor::all(self) -> BytesView
Cursor::seek(self, Int32) -> Unit raise @model.Refused
Cursor::skip(self, Int32) -> Unit raise @model.Refused
Cursor::bytes(self, Int32) -> BytesView raise @model.Refused
Cursor::u8 / i8 / u16 / i16 / u24 / u32 / tag (self) -> Int32 raise @model.Refused
Cursor::u16_at / i16_at / u32_at / tag_at (self, Int32) -> Int32 raise @model.Refused
```

A `Cursor` returned by `window` cannot read outside its parent range. All
integer reads are big-endian. `tag` reads four ASCII bytes as an `Int32` word.

**`sfnt`**

```
read(BytesView, @model.Limits) -> Array[Directory] raise @model.Refused
tag_head/hhea/maxp/hmtx/cmap/loca/glyf/kern/name/post/os2 () -> Int32
tag_string(Int32) -> String
Directory::find(self, Int32) -> TableRecord?
Directory::has(self, Int32) -> Bool
Directory::require(self, Int32) -> TableRecord raise @model.Refused
Directory::table(self, BytesView, Int32, @model.Limits) -> @wire.Cursor raise @model.Refused
pub(all) struct TableRecord { tag : Int32; checksum : Int32; offset : Int32; length : Int32 }
pub(all) struct Directory { scaler : Int32; records : Array[TableRecord] }
```

Accepted scaler words: `0x00010000`, `0x4F54544F` (`OTTO`), `0x74727565`
(`true`). Accepted collection tag: `0x74746366` (`ttcf`), versions `0x00010000`
and `0x00020000`. Any other signature raises `Unknown`; any other collection
version raises `Unsupported`. Note that `OTTO` is accepted at the container layer
but a font with CFF outlines has no `glyf` table and therefore raises
`MissingTable` in `decode`; this is the correct v0.1.0 answer.

**`table`**

```
Head::parse(@wire.Cursor) -> Head raise @model.Refused
Hhea::parse(@wire.Cursor) -> Hhea raise @model.Refused
Maxp::parse(@wire.Cursor, @model.Limits) -> Maxp raise @model.Refused
Hmtx::parse(@wire.Cursor, Int32, Int32, @model.Limits) -> Hmtx raise @model.Refused
Cmap::parse(@wire.Cursor, @model.Limits) -> Cmap raise @model.Refused
Loca::parse(@wire.Cursor, Int32, Int32, @model.Limits) -> Loca raise @model.Refused
Kern::parse(@wire.Cursor, @model.Limits) -> Kern raise @model.Refused
Os2::parse(@wire.Cursor) -> Os2 raise @model.Refused
GlyphData::parse(BytesView, @model.Limits) -> GlyphData raise @model.Refused
Cmap::format(self) -> Int32
Cmap::glyph_index(self, Int32) -> @model.GlyphId?
Hmtx::metrics(self, Int32) -> (Int32, Int32)
Loca::range(self, Int32) -> (Int32, Int32)?
Loca::count(self) -> Int32
Kern::between(self, Int32, Int32) -> Int32
Kern::count(self) -> Int32; Kern::empty() -> Kern
Os2::empty() -> Os2
pub(all) enum GlyphData { Empty; Simple(SimpleGlyph); Composite(CompositeGlyph) }
```

Required tags: `head`, `hhea`, `maxp`, `hmtx`, `cmap`, `loca`, `glyf`. Optional:
`kern`, `OS/2`, `name`, `post`. Unknown tags are ignored. `cmap` formats 0, 4,
6 and 12 are supported; other formats raise `Unsupported`.

**`outline`**

```
GlyphSource::of(BytesView, @table.Loca, @model.Limits) -> GlyphSource
GlyphSource::outline(self, @model.GlyphId, depth? : Int32) -> @model.Outline raise @model.Refused
simple_outline(@table.SimpleGlyph) -> @model.Outline
```

**`raster`**

```
rasterise(@model.Outline, @model.Scale, @model.Limits) -> @model.CoverageMask raise @model.Refused
```

**`layout`**

```
measure(Array[@model.GlyphId], @table.Hmtx, @model.FontMetrics, @model.Scale,
        @table.Kern, letter_spacing? : Int32) -> @model.TextMetrics
```

## 6. Error-case catalogue

Every case below is exercised by a named fixture in
`integration/difftest/corpus/manifest.json`; the `variant` field asserts the
exact `Refused` variant.

| Case | Expected |
| --- | --- |
| Non-font signature, unrecognised scaler word | `Unknown(at=0, ...)` |
| Zero tables, empty collection, impossible `cmap` segment, bad `loca` order, invalid `unitsPerEm`, invalid `indexToLocFormat`, impossible contour count, `REPEAT` overflow | `Malformed` |
| Truncated file, table offset or length past EOF, subtable offset outside its table, `loca` past `glyf`, truncated coordinate run | `Truncated` |
| Declaration above a `Limits` ceiling | `OverLimit(limit=..., got=...)` |
| Unsupported `maxp` version, unsupported TTC version | `Unsupported` |
| A required table absent | `MissingTable(tag=...)` with the four-character tag string |
| Out-of-range glyph id or composite component id | `MissingGlyph(glyph=...)` |
| Composite nesting past `Limits.recursion`, including self-reference | `Recursion(depth=...)` |
| `head.magicNumber` wrong | `Unexpected(at=..., got=..., want=...)` |
| Legal but unusual: `unitsPerEm == 16384`, long `loca`, `numberOfHMetrics > numGlyphs`, unknown table tag, unmodified control | No refusal |

No public function panics, loops without a bound, or returns a partial value.
A caller needs exactly one `try`/`raise` handler for the whole library.

## 7. Stability guarantees

- **0.1.x (patch).** Additive only: new optional parameters, new functions, new
  types, new `cmap` formats, new optional tables. No existing name, field,
  variant, field label, re-export or `Show` string changes. `pkg.generated.mbti`
  may grow; a diff that changes an existing line is a break.
- **0.2.0 (minor).** May add subpackages (`cff`, `woff`, `variations`) and
  additive functions. Changing a façade signature, removing a re-export,
  changing a `Refused` field label or changing `CoverageMask` semantics requires
  a minor version **and** a migration note, **and** a regenerated differential
  corpus.
- **Breaking changes.** A new major version only. Consumers are entitled to a
  six-month overlap during which the old surface is still documented.
- **Interface as contract.** `moon info --target all` writes one
  `pkg.generated.mbti` per package. CI runs `moon info --target all && git diff
  --exit-code`, so a signature cannot change without the interface being
  reviewed and committed. `docs/api.html` is derived from those interfaces and
  from the `///` comments; `python3 scripts/docs/gen_api.py --check` enforces it.
- **Determinism is part of the contract.** For fixed `(bytes, glyph, ppem,
  limits)`, `outline`, `metrics`, `rasterise` and `measure` return identical
  values on wasm, wasm-gc, js and native. An implementation that introduces
  floating point into that path has broken the contract even if the tests pass.
- **Pure computation is part of the contract.** No function under `src/` may
  perform I/O, consult a clock, read an environment variable, or depend on map
  iteration order.
- **No bylines.** No file in this repository carries a byline beyond the
  copyright and licence headers, and no commit carries anything beyond the
  author's own sign-off. This is a fixed constraint, not a convention that a
  future change may relax.

## 8. Explicitly not contracted

The following are implementation detail and may change within a patch release:
the nine private fields of `Face`; the set of `tag_*` helper functions; private
structs in `raster`; the order of `Directory.records`; the exact `Show` wording
of `Refused` beyond the variant name and the values it prints; the rasteriser's
internal subsample count; and which `cmap` subtable wins when several are
equally eligible (the result must be deterministic and must satisfy the pinned
goldens).

The following are not part of the surface at all and must not be inferred from a
`pkg.generated.mbti` that happens to mention them: `Source`, `Reader`,
`TableDirectory`, `Collection`, `Charmap`, `OutlineSink`, `RasterTarget`,
`ColourPainter`, `LayoutEngine`, `VariationLocation` and `Writer` as **named
traits or types**. They are convergent abstractions documented in `SPEC.md` §4,
realised by concrete MoonBit values or deliberately not opened. Introducing any
of them as a public trait is an additive API change requiring a version of this
file.
