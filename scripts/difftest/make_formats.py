#!/usr/bin/env python3
# Copyright 2026 Leo Cheng
# SPDX-License-Identifier: Apache-2.0
"""Generate the format fixtures and the MoonBit test that replays them.

The fonts here are built for this library and for nobody else: a variable
TrueType font with two axes, the same font inside a WOFF and a WOFF2 container,
a hand-assembled CFF whose charstrings use the operators a reader has to get
exactly right (flex, subroutine calls, hint masks, a glyph width), and a CFF2
font that blends its outlines along an axis.

The expected outlines come from fontTools, an independent implementation, and
are cross-checked against FreeType before anything is written. The expected ink
comes from FreeType's rasteriser with hinting off, which is the only mode this
library draws in.

Usage:
    python3 scripts/difftest/make_formats.py            # write the fixtures
    python3 scripts/difftest/make_formats.py --check    # compare, never write
"""

from __future__ import annotations

import hashlib
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FORMATS = ROOT / "integration" / "difftest" / "formats"
OUT = ROOT / "src" / "formats_test.mbt"

# The TrueType and CFF 1 fonts share a glyph order; the CFF 2 font has its own.
GLYPHS = [".notdef", "space", "A", "axe", "subr", "o", "hinted"]
CFF2_GLYPHS = [".notdef", "A", "o"]
CMAP = {0x20: "space", 0x41: "A", 0x42: "axe", 0x6F: "o", 0x48: "hinted"}

# ---------------------------------------------------------------------------
# TrueType masters and the variable font built from them
# ---------------------------------------------------------------------------


def build_master(path: Path, weight_delta: int, width_delta: int) -> None:
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.ttGlyphPen import TTGlyphPen

    def pen(glyph_set=None) -> TTGlyphPen:
        return TTGlyphPen(glyph_set)

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(GLYPHS)
    fb.setupCharacterMap(CMAP)
    glyphs = {}

    p = pen()
    p.moveTo((50, 0)); p.lineTo((50, 700)); p.lineTo((450, 700)); p.lineTo((450, 0)); p.closePath()
    p.moveTo((100, 50)); p.lineTo((400, 50)); p.lineTo((400, 650)); p.lineTo((100, 650)); p.closePath()
    glyphs[".notdef"] = p.glyph()
    glyphs["space"] = pen().glyph()

    p = pen()
    p.moveTo((0, 0)); p.lineTo((250, 700)); p.lineTo((500 + weight_delta, 700)); p.lineTo((750, 0)); p.closePath()
    p.moveTo((180, 100)); p.qCurveTo((250, 320), (320 + width_delta, 100)); p.closePath()
    glyphs["A"] = p.glyph()

    p = pen()
    p.moveTo((60, 700)); p.lineTo((160, 900)); p.lineTo((240, 900)); p.lineTo((160, 700)); p.closePath()
    glyphs["subr"] = p.glyph()

    p = pen()
    p.moveTo((100, 350)); p.qCurveTo((100, 700), (350, 700)); p.qCurveTo((600, 700), (600, 350))
    p.qCurveTo((600, 0), (350, 0)); p.qCurveTo((100, 0), (100, 350)); p.closePath()
    glyphs["o"] = p.glyph()

    p = pen()
    p.moveTo((0, 0)); p.lineTo((0, 300)); p.lineTo((80 + weight_delta, 300))
    p.qCurveTo((160 + weight_delta, 300), (160 + weight_delta, 200))
    p.qCurveTo((160 + weight_delta, 0), (80 + weight_delta, 0)); p.closePath()
    glyphs["hinted"] = p.glyph()

    p = pen(glyphs)
    p.addComponent("A", (1, 0, 0, 1, 0, 0))
    p.addComponent("hinted", (1, 0, 0, 1, 200, 60))
    glyphs["axe"] = p.glyph()

    fb.setupGlyf(glyphs)
    metrics = {
        ".notdef": (500, 50),
        "space": (250, 0),
        "A": (750 + width_delta, 0),
        "axe": (750 + width_delta, 0),
        "subr": (300, 20),
        "o": (700 + width_delta, 100),
        "hinted": (200 + weight_delta, 0),
    }
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=800, descent=-200)
    fb.setupNameTable({"familyName": "Moon Sample", "styleName": "Regular"})
    fb.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=900, usWinDescent=250)
    fb.setupPost()
    fb.save(str(path))


def build_variable_font(path: Path, work: Path) -> None:
    from fontTools.designspaceLib import (
        AxisDescriptor,
        DesignSpaceDocument,
        SourceDescriptor,
    )
    from fontTools.varLib import build as varlib_build

    regular = work / "master-regular.ttf"
    heavy = work / "master-heavy.ttf"
    build_master(regular, 0, 0)
    build_master(heavy, 120, 60)

    doc = DesignSpaceDocument()
    weight = AxisDescriptor()
    weight.name, weight.tag = "Weight", "wght"
    weight.minimum, weight.default, weight.maximum = 400, 400, 900
    width = AxisDescriptor()
    width.name, width.tag = "Width", "wdth"
    width.minimum, width.default, width.maximum = 75, 100, 100
    doc.addAxis(weight)
    doc.addAxis(width)
    for source_path, location in [
        (regular, {"Weight": 400, "Width": 100}),
        (heavy, {"Weight": 900, "Width": 100}),
    ]:
        source = SourceDescriptor()
        source.path = str(source_path)
        source.location = location
        if location["Weight"] == 400:
            source.copyLib = True
            source.copyInfo = True
            source.copyFeatures = True
        doc.addSource(source)
    variable, _, _ = varlib_build(doc)
    variable.save(str(path))


# ---------------------------------------------------------------------------
# A CFF 1 table assembled byte by byte
# ---------------------------------------------------------------------------


def cff_num(value: int) -> bytes:
    """One CFF operand, always the shortest legal encoding."""
    if -107 <= value <= 107:
        return bytes([value + 139])
    if 108 <= value <= 1131:
        delta = value - 108
        return bytes([247 + delta // 256, delta % 256])
    if -1131 <= value <= -108:
        delta = -108 - value
        return bytes([251 + delta // 256, delta % 256])
    if -32768 <= value <= 32767:
        return b"\x1c" + struct.pack(">h", value)
    return b"\x1d" + struct.pack(">i", value)


def cff_fixed(value: int) -> bytes:
    """A five-byte operand, so an offset can be patched without moving bytes."""
    return b"\x1d" + struct.pack(">i", value)


def cff_index(items: list[bytes]) -> bytes:
    count = struct.pack(">H", len(items))
    if not items:
        return count
    offsets = [1]
    for item in items:
        offsets.append(offsets[-1] + len(item))
    total = offsets[-1]
    if total < 0x100:
        size, pack = 1, ">B"
    elif total < 0x10000:
        size, pack = 2, ">H"
    else:
        size, pack = 4, ">I"
    body = b"".join(struct.pack(pack, value)[-size:] for value in offsets)
    return count + bytes([size]) + body + b"".join(items)


def tt_charstrings() -> dict[str, bytes]:
    """One charstring per glyph, written operator by operator."""

    def push(*values: int) -> bytes:
        return b"".join(cff_num(value) for value in values)

    return {
        ".notdef": push(50, 0) + b"\x15" + b"\x0e",
        "space": b"\x0e",
        "A": push(0, 0) + b"\x15"
        + push(400, 0) + b"\x05"
        + push(0, 600) + b"\x05"
        + push(-400, 0) + b"\x05"
        + b"\x0e",
        # A glyph width in front of the first stack-clearing operator, then an
        # hflex: two curves that share an end tangent.
        "axe": push(500, 100, 100) + b"\x15"
        + push(50, 60, 80, 40, 50, 40, 50) + b"\x0c\x22"
        + b"\x0e",
        # A global and a local subroutine, each drawing one line.
        "subr": push(50, 50) + b"\x15"
        + push(-107) + b"\x1d"
        + push(-107) + b"\x0a"
        + b"\x0e",
        # Two cubic segments, so the third-order path is exercised.
        "o": push(100, 0) + b"\x15"
        + push(300, 100, 200, 0, 300, 0) + b"\x08"
        + push(-200, 0, -100, -200, -300, 100) + b"\x08"
        + b"\x0e",
        # Two stems, a hint mask with one byte, then a rectangle.
        "hinted": push(0, 20) + b"\x01"
        + push(0, 20) + b"\x03"
        + b"\x13\xff"
        + push(0, 0) + b"\x15"
        + push(120, 0) + b"\x05"
        + push(0, 120) + b"\x05"
        + push(-120, 0) + b"\x05"
        + b"\x0e",
    }


def cff_top_dict(charstrings: int, private_size: int, private_at: int, charset: int) -> bytes:
    out = cff_fixed(charstrings) + b"\x11"
    out += cff_fixed(private_size) + cff_fixed(private_at) + b"\x12"
    out += cff_fixed(charset) + b"\x0f"
    return out


# Standard string ids for the names this font borrows; anything else goes into
# the string index and takes the next free id.
STANDARD_SIDS = {".notdef": 0, "space": 1, "A": 34, "o": 80}


def build_cff_table() -> bytes:
    charstrings = tt_charstrings()
    items = [charstrings[name] for name in GLYPHS]
    global_subrs = [cff_num(120) + cff_num(0) + b"\x05" + b"\x0b"]
    local_subrs = [cff_num(0) + cff_num(120) + b"\x05" + b"\x0b"]
    # Subrs is an offset inside the private dict, relative to its start, so it
    # points just past the six-byte operand that states it.
    private_body = cff_fixed(6) + b"\x13"

    custom = [name for name in GLYPHS if name not in STANDARD_SIDS]
    sids = {name: 391 + index for index, name in enumerate(custom)}

    def sid_of(name: str) -> int:
        return STANDARD_SIDS[name] if name in STANDARD_SIDS else sids[name]

    charset = bytes([0]) + b"".join(
        struct.pack(">H", sid_of(name)) for name in GLYPHS[1:]
    )
    header = bytes([1, 0, 4, 4])
    name_index = cff_index([b"MoonSample"])
    string_index = cff_index([name.encode("latin-1") for name in custom])
    gsubrs = cff_index(global_subrs)
    charstrings_index = cff_index(items)
    placeholder = cff_top_dict(0, 0, 0, 0)
    head = header + name_index + cff_index([placeholder]) + string_index + gsubrs
    charset_at = len(head)
    charstrings_at = charset_at + len(charset)
    private_at = charstrings_at + len(charstrings_index)
    top = cff_top_dict(charstrings_at, len(private_body), private_at, charset_at)
    head = header + name_index + cff_index([top]) + string_index + gsubrs
    data = head + charset + charstrings_index + private_body
    data += cff_index(local_subrs)
    return data


def checksum(data: bytes) -> int:
    padded = data + b"\x00" * ((-len(data)) % 4)
    total = 0
    for i in range(0, len(padded), 4):
        total = (total + struct.unpack(">I", padded[i : i + 4])[0]) & 0xFFFFFFFF
    return total


def splice_table(font_bytes: bytes, replacements: dict[str, bytes | None]) -> bytes:
    """Replace, remove or insert tables in an sfnt and rebuild the directory."""
    (flavor,) = struct.unpack(">I", font_bytes[0:4])
    (count,) = struct.unpack(">H", font_bytes[4:6])
    tables: dict[str, bytes] = {}
    for i in range(count):
        at = 12 + i * 16
        tag = font_bytes[at : at + 4].decode("latin-1")
        (offset, length) = struct.unpack(">II", font_bytes[at + 8 : at + 16])
        tables[tag] = font_bytes[offset : offset + length]
    for tag, data in replacements.items():
        if data is None:
            tables.pop(tag, None)
        else:
            tables[tag] = data
    ordered = sorted(tables)
    count = len(ordered)
    power = 1
    selector = 0
    while power * 2 <= count:
        power *= 2
        selector += 1
    out = bytearray()
    out += struct.pack(">IHHHH", flavor, count, power * 16, selector, count * 16 - power * 16)
    cursor = 12 + 16 * count
    bodies = bytearray()
    for tag in ordered:
        data = tables[tag]
        out += tag.encode("latin-1")[:4].ljust(4, b" ")
        out += struct.pack(">III", checksum(data), cursor, len(data))
        bodies += data
        padding = (-len(data)) % 4
        bodies += b"\x00" * padding
        cursor += len(data) + padding
    return bytes(out + bodies)


def build_postscript_font(path: Path, work: Path) -> None:
    """An OTTO font whose outline table is the hand-assembled one."""
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.t2CharStringPen import T2CharStringPen

    fb = FontBuilder(1000, isTTF=False)
    fb.setupGlyphOrder(GLYPHS)
    fb.setupCharacterMap(CMAP)
    charstrings = {}
    for name in GLYPHS:
        pen = T2CharStringPen(600, None)
        if name != "space":
            pen.moveTo((0, 0))
            pen.lineTo((0, 300))
            pen.lineTo((300, 300))
            pen.closePath()
        charstrings[name] = pen.getCharString()
    fb.setupCFF("MoonSample", {"FullName": "Moon Sample"}, charstrings, {})
    metrics = {
        ".notdef": (500, 50),
        "space": (250, 0),
        "A": (750, 0),
        "axe": (750, 50),
        "subr": (300, 50),
        "o": (700, 100),
        "hinted": (200, 0),
    }
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=800, descent=-200)
    fb.setupNameTable({"familyName": "Moon Sample", "styleName": "Regular"})
    fb.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=900, usWinDescent=250)
    fb.setupPost()
    placeholder = work / "placeholder-cff.otf"
    fb.save(str(placeholder))
    path.write_bytes(splice_table(placeholder.read_bytes(), {"CFF ": build_cff_table()}))


def build_cff2_font(path: Path, work: Path) -> None:
    """A CFF 2 variable font: one axis, outlines that blend."""
    from fontTools.designspaceLib import (
        AxisDescriptor,
        DesignSpaceDocument,
        SourceDescriptor,
    )
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.t2CharStringPen import T2CharStringPen
    from fontTools.varLib import build as varlib_build

    def master(at: Path, delta: int) -> None:
        fb = FontBuilder(1000, isTTF=False)
        fb.setupGlyphOrder(CFF2_GLYPHS)
        fb.setupCharacterMap({0x41: "A", 0x6F: "o"})
        charstrings = {}
        for name in CFF2_GLYPHS:
            pen = T2CharStringPen(600, None)
            if name != ".notdef":
                pen.moveTo((100, 0))
                pen.lineTo((100 + delta, 700))
                pen.lineTo((600, 700))
                pen.curveTo((700, 500), (700, 200), (600, 0))
                pen.closePath()
            charstrings[name] = pen.getCharString()
        fb.setupCFF("MoonBlend", {"FullName": "Moon Blend"}, charstrings, {})
        fb.setupHorizontalMetrics(
            {name: (700 + delta // 2, 100) for name in CFF2_GLYPHS}
        )
        fb.setupHorizontalHeader(ascent=800, descent=-200)
        fb.setupNameTable({"familyName": "Moon Blend", "styleName": "Regular"})
        fb.setupOS2(sTypoAscender=800, sTypoDescender=-200)
        fb.setupPost()
        fb.save(str(at))

    master(work / "cff2-regular.otf", 0)
    master(work / "cff2-heavy.otf", 200)
    doc = DesignSpaceDocument()
    axis = AxisDescriptor()
    axis.name, axis.tag = "Weight", "wght"
    axis.minimum, axis.default, axis.maximum = 400, 400, 900
    doc.addAxis(axis)
    for at, location, copy in [
        (work / "cff2-regular.otf", {"Weight": 400}, True),
        (work / "cff2-heavy.otf", {"Weight": 900}, False),
    ]:
        source = SourceDescriptor()
        source.path = str(at)
        source.location = location
        if copy:
            source.copyLib = True
            source.copyInfo = True
            source.copyFeatures = True
        doc.addSource(source)
    variable, _, _ = varlib_build(doc)
    variable.save(str(path))


# ---------------------------------------------------------------------------
# Oracle: outlines from fontTools, ink from FreeType
# ---------------------------------------------------------------------------

OP_MOVE, OP_LINE, OP_QUAD, OP_CUBIC, OP_CLOSE = 0, 1, 2, 3, 4


def canonical(record, shift: int) -> list[int]:
    """A fontTools recording as the flat op stream the MoonBit test compares.

    A CFF 2 blend can land between two font units, so every coordinate is
    rounded the way a rasteriser would round it.
    """

    def at(point) -> tuple[int, int]:
        return (int(round(point[0])) + shift, int(round(point[1])))

    ops: list[int] = []
    for name, args in record:
        if name == "moveTo":
            (point,) = args
            x, y = at(point)
            ops += [OP_MOVE, x, y]
        elif name == "lineTo":
            (point,) = args
            x, y = at(point)
            ops += [OP_LINE, x, y]
        elif name == "curveTo":
            flat: list[int] = []
            for point in args:
                x, y = at(point)
                flat += [x, y]
            ops += [OP_CUBIC] + flat
        elif name == "qCurveTo":
            points = list(args)
            end = points.pop()
            control = None
            for point in points:
                if point is None:
                    continue
                if control is not None:
                    mid = ((control[0] + point[0]) / 2, (control[1] + point[1]) / 2)
                    cx, cy = at(control)
                    mx, my = at(mid)
                    ops += [OP_QUAD, cx, cy, mx, my]
                control = point
            cx, cy = at(control)
            ex, ey = at(end)
            ops += [OP_QUAD, cx, cy, ex, ey]
        elif name == "closePath":
            ops += [OP_CLOSE]
        else:
            raise SystemExit(f"unexpected pen call {name}")
    return ops


def metrics_at(path: Path, order, location, name: str) -> tuple[int, int]:
    """The advance and side bearing at a location, from the instancer."""
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    font = TTFont(str(path), lazy=True)
    font.setGlyphOrder(order)
    if location:
        font = instantiateVariableFont(font, location, inplace=False, optimize=False)
    return font["hmtx"][name]


def load_with_order(path: Path):
    """A font whose glyph order is stated before any table is decompiled.

    A CFF 2 table carries no glyph names at all, so the order has to come from
    somewhere; this generator wrote it, and says what it is.
    """
    from fontTools.ttLib import TTFont

    font = TTFont(str(path), lazy=True)
    font.setGlyphOrder(CFF2_GLYPHS if "cff2" in path.name else GLYPHS)
    return font


def outline_ops(font, name: str, location: dict[str, float] | None = None) -> list[int]:
    """The outline in the coordinates the font stores, at a location.

    fontTools draws a TrueType glyph shifted by its left side bearing, so that
    shift is undone here; a PostScript glyph is drawn as stored.
    """
    from fontTools.pens.recordingPen import DecomposingRecordingPen

    # The glyph set normalises user coordinates through `fvar` and `avar`
    # itself, so the location goes in as the design states it.
    glyph_set = font.getGlyphSet(location=location) if location else font.getGlyphSet()
    shift = 0
    if "glyf" in font:
        _, offset = glyph_set[name]._getGlyphAndOffset()
        shift = -offset
    pen = DecomposingRecordingPen(glyph_set)
    glyph_set[name].draw(pen)
    return canonical(pen.value, shift)


def point_set(ops: list[int]) -> list[tuple[int, int]]:
    arity = {OP_MOVE: 2, OP_LINE: 2, OP_QUAD: 4, OP_CUBIC: 6, OP_CLOSE: 0}
    points = []
    at = 0
    while at < len(ops):
        op = ops[at]
        at += 1
        for _ in range(arity[op] // 2):
            points.append((ops[at], ops[at + 1]))
            at += 2
    return points


def freetype_face(path: Path, location: dict[str, float] | None):
    import freetype

    face = freetype.Face(str(path))
    if location:
        tags = ["wght", "wdth"]
        face.set_var_design_coords([location.get(tag, 0) for tag in tags])
    return face


def freetype_points(path: Path, gid: int, location: dict[str, float] | None):
    import freetype

    face = freetype_face(path, location)
    face.load_glyph(gid, freetype.FT_LOAD_NO_SCALE | freetype.FT_LOAD_NO_HINTING)
    return [(point[0], point[1]) for point in face.glyph.outline.points]


def ink(path: Path, gid: int, ppem: int) -> tuple[int, int, int, int, int]:
    """Coverage of one glyph, in whole pixels of ink and in the box that ink
    occupies. FreeType sizes a bitmap from the control box, so the bitmap's own
    dimensions say nothing about where the ink is; the box of the non-zero
    samples does.
    """
    import freetype

    face = freetype_face(path, None)
    face.set_pixel_sizes(0, ppem)
    face.load_glyph(gid, freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_HINTING)
    bitmap = face.glyph.bitmap
    total = 0
    min_col, max_col = bitmap.width, -1
    min_row, max_row = bitmap.rows, -1
    for row in range(bitmap.rows):
        line = bitmap.buffer[row * bitmap.pitch : row * bitmap.pitch + bitmap.width]
        total += sum(line)
        for col, value in enumerate(line):
            if value:
                min_col = min(min_col, col)
                max_col = max(max_col, col)
                min_row = min(min_row, row)
                max_row = max(max_row, row)
    if max_col < 0:
        return (0, 0, 0, 0, 0)
    return (
        round(total / 255),
        face.glyph.bitmap_left + min_col,
        face.glyph.bitmap_top - max_row - 1,
        face.glyph.bitmap_left + max_col + 1,
        face.glyph.bitmap_top - min_row,
    )


def check_outline(path: Path, name: str, location, tolerance: int) -> None:
    """fontTools and FreeType must describe the same points before either is
    written down as the expected answer."""
    font = load_with_order(path)
    order = font.getGlyphOrder()
    gid = order.index(name)
    expected = outline_ops(font, name, location)
    points = freetype_points(path, gid, location)
    if not points:
        raise SystemExit(f"FreeType gave no outline for {path.name} {name}")
    for point in point_set(expected):
        if not any(
            abs(point[0] - other[0]) <= tolerance and abs(point[1] - other[1]) <= tolerance
            for other in points
        ):
            raise SystemExit(
                f"FreeType and fontTools disagree on {path.name} {name} at {location}: {point}"
            )


# ---------------------------------------------------------------------------
# Emission
# ---------------------------------------------------------------------------


def byte_literal(data: bytes, indent: str = "") -> str:
    chunks = []
    for start in range(0, len(data), 512):
        chunk = data[start : start + 512]
        chunks.append('b"' + "".join(f"\\x{value:02X}" for value in chunk) + '"')
    if not chunks:
        return 'b""'
    return (" +\n" + indent).join(chunks)


def ints(values: list[int]) -> str:
    if not values:
        return "[]"
    return "[" + ", ".join(str(value) for value in values) + "]"


def coords_literal(values: list[tuple[int, int]]) -> str:
    if not values:
        return "[]"
    return "[" + ", ".join(f"({a}, {b})" for a, b in values) + "]"


def coords_of(location: dict[str, float] | None) -> list[tuple[int, int]]:
    if not location:
        return []
    tags = {"wght": 0x77676874, "wdth": 0x77647468}
    return [(tags[key], int(round(value * 65536))) for key, value in location.items()]


def build() -> tuple[dict[str, bytes], str]:
    import tempfile

    from fontTools.ttLib import TTFont

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        build_variable_font(work / "sample-var.ttf", work)
        build_postscript_font(work / "sample-cff.otf", work)
        build_cff2_font(work / "sample-cff2.otf", work)

        def converted(source: Path, flavor: str, name: str) -> Path:
            font = TTFont(str(source))
            font.flavor = flavor
            font.save(str(work / name))
            return work / name

        converted(work / "sample-var.ttf", "woff", "sample-woff.woff")
        converted(work / "sample-var.ttf", "woff2", "sample-woff2.woff2")
        converted(work / "sample-cff.otf", "woff2", "sample-cff-woff2.woff2")

        files = {
            "sample_var": (work / "sample-var.ttf").read_bytes(),
            "sample_woff": (work / "sample-woff.woff").read_bytes(),
            "sample_woff2": (work / "sample-woff2.woff2").read_bytes(),
            "sample_cff": (work / "sample-cff.otf").read_bytes(),
            "sample_cff2": (work / "sample-cff2.otf").read_bytes(),
            "sample_cff_woff2": (work / "sample-cff-woff2.woff2").read_bytes(),
        }

        cases: list[tuple[str, str, int, list[tuple[int, int]], list[int], int, int, int]] = []
        inks: list[tuple[str, str, int, int, int, int, int, int, int]] = []

        # The variable font is the oracle for its containers too: unpacking a
        # WOFF or WOFF2 must give the same glyphs as the plain file.
        plain = load_with_order(work / "sample-var.ttf")
        order = plain.getGlyphOrder()
        for label, location, tolerance in [
            ("default", None, 0),
            ("wght700", {"wght": 700}, 1),
            ("wght900_wdth75", {"wght": 900, "wdth": 75}, 1),
        ]:
            for name in ["A", "axe", "o", ".notdef"]:
                gid = order.index(name)
                ops = outline_ops(plain, name, location)
                advance, lsb = metrics_at(
                    work / "sample-var.ttf", order, location, name
                )
                for font_name in ["sample_var", "sample_woff", "sample_woff2"]:
                    cases.append(
                        (
                            font_name,
                            f"{label}/{name}",
                            gid,
                            coords_of(location),
                            ops,
                            advance,
                            lsb,
                            tolerance,
                        )
                    )

        # The PostScript pair. The CFF 2 font blends, so its cases come in
        # pairs: the default instance exactly, the moved one within a unit.
        for font_name, path_name, names, locations in [
            (
                "sample_cff",
                "sample-cff.otf",
                ["A", "axe", "subr", "o", "hinted"],
                [("default", None, 0)],
            ),
            (
                "sample_cff2",
                "sample-cff2.otf",
                ["A", "o"],
                [("default", None, 0), ("wght900", {"wght": 900}, 1)],
            ),
            (
                "sample_cff_woff2",
                "sample-cff-woff2.woff2",
                ["A", "o"],
                [("default", None, 0)],
            ),
        ]:
            font = load_with_order(work / path_name)
            order = font.getGlyphOrder()
            for label, location, tolerance in locations:
                for name in names:
                    gid = order.index(name)
                    ops = outline_ops(font, name, location)
                    advance, lsb = metrics_at(work / path_name, order, location, name)
                    cases.append(
                        (
                            font_name,
                            f"{label}/{name}",
                            gid,
                            coords_of(location),
                            ops,
                            advance,
                            lsb,
                            tolerance,
                        )
                    )

        for font_name, path_name, names in [
            ("sample_var", "sample-var.ttf", ["A", "o"]),
            ("sample_cff", "sample-cff.otf", ["A", "o"]),
            ("sample_cff2", "sample-cff2.otf", ["A"]),
        ]:
            font = load_with_order(work / path_name)
            order = font.getGlyphOrder()
            for name in names:
                gid = order.index(name)
                for ppem in [16, 32]:
                    total, width, height, left, top = ink(work / path_name, gid, ppem)
                    inks.append(
                        (font_name, name, gid, ppem, total, width, height, left, top)
                    )

        # Every expected outline is checked against FreeType before it is used.
        for name in ["A", "o", "axe", ".notdef"]:
            check_outline(work / "sample-var.ttf", name, None, 0)
            check_outline(work / "sample-var.ttf", name, {"wght": 900}, 1)
        for name in ["A", "o", "axe", "subr", "hinted"]:
            check_outline(work / "sample-cff.otf", name, None, 0)
        for name in ["A", "o"]:
            check_outline(work / "sample-cff2.otf", name, None, 0)
            check_outline(work / "sample-cff2.otf", name, {"wght": 900}, 1)

    return files, render(files, cases, inks)


def render(files: dict[str, bytes], cases, inks) -> str:
    out = []
    out.append("// Copyright 2026 Leo Cheng")
    out.append("// SPDX-License-Identifier: Apache-2.0")
    digest = hashlib.sha256()
    for name in sorted(files):
        digest.update(files[name])
    out.append(f"// formats-checksum: {digest.hexdigest()}")
    out.append("")
    out.append("// Generated by scripts/difftest/make_formats.py. Do not edit by hand.")
    out.append("// The fonts are built for this test, the expected outlines come from")
    out.append("// fontTools and the expected ink from FreeType with hinting off.")
    out.append("")
    for name in sorted(files):
        out.append("///|")
        out.append(f"let {name} : Bytes = " + byte_literal(files[name]))
        out.append("")
    out.append("///|")
    out.append("priv struct OutlineCase {")
    out.append("  font : Bytes")
    out.append("  label : String")
    out.append("  glyph : Int32")
    out.append("  coords : Array[(Int32, Int32)]")
    out.append("  ops : Array[Int32]")
    out.append("  advance : Int32")
    out.append("  lsb : Int32")
    out.append("  tolerance : Int32")
    out.append("}")
    out.append("")
    out.append("///|")
    out.append("let outline_cases : Array[OutlineCase] = [")
    for font_name, label, glyph, coords, ops, advance, lsb, tolerance in cases:
        out.append("  {")
        out.append(f"    font: {font_name},")
        out.append(f'    label: "{label}",')
        out.append(f"    glyph: {glyph},")
        out.append(f"    coords: {coords_literal(coords)},")
        out.append(f"    ops: {ints(ops)},")
        out.append(f"    advance: {advance},")
        out.append(f"    lsb: {lsb},")
        out.append(f"    tolerance: {tolerance},")
        out.append("  },")
    out.append("]")
    out.append("")
    out.append("///|")
    out.append("priv struct InkCase {")
    out.append("  font : Bytes")
    out.append("  label : String")
    out.append("  glyph : Int32")
    out.append("  ppem : Int32")
    out.append("  ink : Int32")
    out.append("  left : Int32")
    out.append("  bottom : Int32")
    out.append("  right : Int32")
    out.append("  top : Int32")
    out.append("}")
    out.append("")
    out.append("///|")
    out.append("let ink_cases : Array[InkCase] = [")
    for font_name, name, glyph, ppem, total, left, bottom, right, top in inks:
        out.append("  {")
        out.append(f"    font: {font_name},")
        out.append(f'    label: "{name}@{ppem}",')
        out.append(f"    glyph: {glyph},")
        out.append(f"    ppem: {ppem},")
        out.append(f"    ink: {total},")
        out.append(f"    left: {left},")
        out.append(f"    bottom: {bottom},")
        out.append(f"    right: {right},")
        out.append(f"    top: {top},")
        out.append("  },")
    out.append("]")
    out.append("")
    return "\n".join(out)


def literal_bytes(text: str, name: str) -> bytes:
    """The bytes of one generated literal, read back from the test source."""
    start = text.index(f"let {name} : Bytes = ")
    at = start + len(f"let {name} : Bytes = ")
    out = bytearray()
    while at < len(text):
        while at < len(text) and text[at] in " \n\r\t":
            at += 1
        if text.startswith("b\"", at):
            at += 2
            while text[at] != '"':
                if text[at] == "\\":
                    out.append(int(text[at + 2 : at + 4], 16))
                    at += 4
                else:
                    out.append(ord(text[at]))
                    at += 1
            at += 1
        elif text.startswith("+", at):
            at += 1
        else:
            break
    return bytes(out)


def check() -> int:
    """Verify the committed fixtures without the reference libraries.

    Regenerating needs fontTools and FreeType; this job only proves that the
    fonts on disk are the ones the test file carries and that the checksum in
    its header matches them, which is what a stale fixture would break.
    """
    if not OUT.exists():
        print("src/formats_test.mbt is missing", file=sys.stderr)
        return 1
    text = OUT.read_text(encoding="utf-8")
    names = {
        "sample_var": "sample-var.ttf",
        "sample_woff": "sample-woff.woff",
        "sample_woff2": "sample-woff2.woff2",
        "sample_cff": "sample-cff.otf",
        "sample_cff2": "sample-cff2.otf",
        "sample_cff_woff2": "sample-cff-woff2.woff2",
    }
    digest = hashlib.sha256()
    for name in sorted(names):
        path = FORMATS / names[name]
        if not path.exists():
            print(f"{names[name]} is missing", file=sys.stderr)
            return 1
        on_disk = path.read_bytes()
        digest.update(on_disk)
        if literal_bytes(text, name) != on_disk:
            print(f"{names[name]} differs from its literal", file=sys.stderr)
            return 1
    recorded = ""
    for line in text.splitlines():
        if line.startswith("// formats-checksum: "):
            recorded = line.split(": ", 1)[1]
    if recorded != digest.hexdigest():
        print("the checksum line does not match the fonts", file=sys.stderr)
        return 1
    print("format fixtures are current")
    return 0


def main() -> int:
    if "--check" in sys.argv[1:]:
        return check()
    files, text = build()
    FORMATS.mkdir(parents=True, exist_ok=True)
    names = {
        "sample_var": "sample-var.ttf",
        "sample_woff": "sample-woff.woff",
        "sample_woff2": "sample-woff2.woff2",
        "sample_cff": "sample-cff.otf",
        "sample_cff2": "sample-cff2.otf",
        "sample_cff_woff2": "sample-cff-woff2.woff2",
    }
    if check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != text:
            print("src/formats_test.mbt is stale; run make_formats.py", file=sys.stderr)
            return 1
        for name, filename in names.items():
            on_disk = (FORMATS / filename).read_bytes() if (FORMATS / filename).exists() else b""
            if on_disk != files[name]:
                print(f"{filename} is stale; run make_formats.py", file=sys.stderr)
                return 1
        print("format fixtures are current")
        return 0
    OUT.write_text(text, encoding="utf-8", newline="\n")
    for name, filename in names.items():
        (FORMATS / filename).write_bytes(files[name])
    print(f"wrote {len(files)} fonts and {len(text)} bytes of test data")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
