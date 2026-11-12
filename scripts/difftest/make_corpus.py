#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Build the hostile-input corpus for the moonfont reader.

The corpus starts from one valid, minimal TrueType-flavoured font assembled in
this process. Every other file is that font with one declaration damaged, one
table removed, or one byte run cut short. Nothing here is imported from another
script and nothing is fetched from the network: the only dependency is the
Python standard library.

Each corpus file is accompanied by an entry in manifest.json naming the exact
Refused suberror variant the reader is expected to raise, the absolute byte
offset of the damaged field where one exists, a one-line reason, and the
SHA-256 of the file. Cases that are legal but unusual carry a null variant and
must be accepted without a refusal.

Regenerate:

    python3 scripts/difftest/make_corpus.py
    python3 scripts/difftest/make_corpus.py --check

The second form regenerates every case in memory and verifies the recorded
hashes and the files on disk without writing anything.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CORPUS_DIR = REPO_ROOT / "integration" / "difftest" / "corpus"
MANIFEST_NAME = "manifest.json"

# The four sfnt scaler types and the collection tag, as integer words.
SFNT_TRUE = 0x00010000
SFNT_OTTO = 0x4F54544F
SFNT_APPLE = 0x74727565
TTCF = 0x74746366

HEAD_MAGIC = 0x5F0F3CF5
CHECKSUM_MAGIC = 0xB1B0AFBA

# Ceilings from src/model/limits.mbt, Limits::default(). They are recorded here
# only so that reasons can name the ceiling a case breaches; the reader owns the
# authoritative values.
DEFAULT_CEILINGS = {
    "file_bytes": 268_435_456,
    "table_bytes": 268_435_456,
    "glyphs": 65_536,
    "points": 65_536,
    "contours": 8_192,
    "composites": 1_024,
    "recursion": 16,
    "mask_pixels": 67_108_864,
}

# The exact suberror variant names from src/model/error.mbt.
VARIANTS = (
    "Unknown",
    "Unexpected",
    "Unsupported",
    "Truncated",
    "OverLimit",
    "Malformed",
    "MissingTable",
    "MissingGlyph",
    "Recursion",
)


# ---------------------------------------------------------------------------
# Big-endian primitives
# ---------------------------------------------------------------------------


def u16(value: int) -> bytes:
    return struct.pack(">H", value & 0xFFFF)


def i16(value: int) -> bytes:
    return struct.pack(">h", value)


def u32(value: int) -> bytes:
    return struct.pack(">I", value & 0xFFFFFFFF)


def pad4(data: bytes) -> bytes:
    return data + b"\x00" * (-len(data) % 4)


def checksum(data: bytes) -> int:
    total = 0
    for (word,) in struct.iter_unpack(">I", pad4(data)):
        total = (total + word) & 0xFFFFFFFF
    return total


def patch(data: bytes, at: int, raw: bytes) -> bytes:
    out = bytearray(data)
    out[at : at + len(raw)] = raw
    return bytes(out)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# ---------------------------------------------------------------------------
# Table builders. All layouts follow the OpenType/TrueType fixed fields, with
# offsets chosen so that the reader's cursor seeks land on the right bytes.
# ---------------------------------------------------------------------------


def head_table(units: int = 1000, index_to_loc: int = 0,
               magic: int = HEAD_MAGIC) -> bytes:
    # version, fontRevision, checkSumAdjustment, magicNumber, flags, unitsPerEm,
    # created (8), modified (8), bbox (8), macStyle, lowestRecPPEM,
    # fontDirectionHint, indexToLocFormat, glyphDataFormat. 54 bytes total.
    return b"".join((
        u32(0x00010000), u32(0x00010000), u32(0), u32(magic),
        u16(0), u16(units),
        u32(0), u32(0), u32(0), u32(0),
        i16(0), i16(0), i16(1000), i16(1000),
        u16(0), u16(8), i16(2), i16(index_to_loc), i16(0),
    ))


def hhea_table(number_of_h_metrics: int) -> bytes:
    # version, ascender, descender, lineGap, advanceWidthMax, three bearings,
    # three caret values, four reserved words, metricDataFormat,
    # numberOfHMetrics. 36 bytes total; numberOfHMetrics sits at offset 34.
    return b"".join((
        u32(0x00010000), i16(800), i16(-200), i16(0),
        u16(1000), i16(0), i16(0), i16(1000),
        i16(1), i16(0), i16(0),
        i16(0), i16(0), i16(0), i16(0),
        i16(0), u16(number_of_h_metrics),
    ))


def maxp_table(num_glyphs: int, version: int = 0x00010000) -> bytes:
    # version 1.0: 32 bytes. numGlyphs sits at offset 4.
    return b"".join((
        u32(version), u16(num_glyphs),
        u16(3), u16(1), u16(0), u16(0),
        u16(2), u16(0), u16(0), u16(0), u16(0),
        u16(0), u16(0), u16(0), u16(0),
    ))


def hmtx_table(num_glyphs: int) -> bytes:
    return b"".join(u16(500) + i16(0) for _ in range(num_glyphs))


def name_table() -> bytes:
    # Format 0 with no name records is still a well-formed name table.
    return u16(0) + u16(0) + u16(6)


def post_table() -> bytes:
    # Version 3.0 carries no glyph names. 32 bytes.
    return b"".join((
        u32(0x00030000), u32(0), i16(0), i16(0),
        u32(0), u32(0), u32(0), u32(0), u32(0),
    ))


BASE_SEGMENTS = (
    (0x20, 0x20, -31, 0),      # U+0020 space to glyph 1
    (0x41, 0x41, -63, 0),      # U+0041 A to glyph 2
    (0xFFFF, 0xFFFF, 1, 0),    # the mandatory sentinel segment
)


def cmap_format4_table(segments=BASE_SEGMENTS, subtable_offset: int = 12,
                       fmt: int = 4) -> bytes:
    # One encoding record (platform 3, encoding 1) followed by a format 4
    # subtable. The subtable offset field is at cmap+8; with three segments
    # startCode[0] is at cmap+34.
    seg = len(segments)
    seg_x2 = seg * 2
    power = 1 << (seg.bit_length() - 1)
    search_range = 2 * power
    entry_selector = power.bit_length() - 1
    range_shift = seg_x2 - search_range

    sub = bytearray()
    sub += u16(fmt) + u16(0) + u16(0)  # format, length, language
    sub += u16(seg_x2) + u16(search_range) + u16(entry_selector)
    sub += u16(range_shift)
    for (start, end, delta, roff) in segments:
        sub += u16(end)
    sub += u16(0)  # reservedPad
    for (start, end, delta, roff) in segments:
        sub += u16(start)
    for (start, end, delta, roff) in segments:
        sub += i16(delta)
    for (start, end, delta, roff) in segments:
        sub += u16(roff)
    sub[2:4] = u16(len(sub))

    out = bytearray()
    out += u16(0) + u16(1)  # version, numTables
    out += u16(3) + u16(1) + u32(subtable_offset)
    out += sub
    return bytes(out)


ON_CURVE_XY_SHORT = 0x01 | 0x02 | 0x04 | 0x10 | 0x20  # 0x37
REPEAT_FLAG = 0x08


def simple_glyph(contours: int = 1, end_pts=(2,), flags=None,
                 xs=None, ys=None) -> bytes:
    if flags is None:
        flags = (ON_CURVE_XY_SHORT,) * 3
    if xs is None:
        xs = (0, 100, 50)
    if ys is None:
        ys = (0, 100, 50)
    out = bytearray()
    out += i16(contours) + i16(0) + i16(0) + i16(150) + i16(150)
    for end in end_pts:
        out += u16(end)
    out += u16(0)  # instructionLength, no instructions
    for flag in flags:
        out.append(flag & 0xFF)
    for delta in xs:
        out.append(delta & 0xFF)
    for delta in ys:
        out.append(delta & 0xFF)
    if len(out) % 2:
        out.append(0)
    return bytes(out)


def composite_glyph(components) -> bytes:
    # Each component is (glyphIndex, arg1, arg2) with flags fixed at 0x0003:
    # ARG_1_AND_2_ARE_WORDS and ARGS_ARE_XY_VALUES. MORE_COMPONENTS (0x0020)
    # is set on all but the last component.
    out = bytearray()
    out += i16(-1) + i16(0) + i16(0) + i16(150) + i16(150)
    for index, (gid, arg1, arg2) in enumerate(components):
        flags = 0x0003 | (0x0020 if index < len(components) - 1 else 0)
        out += u16(flags) + u16(gid) + i16(arg1) + i16(arg2)
    if len(out) % 2:
        out.append(0)
    return bytes(out)


def build_glyf(glyphs):
    offsets = [0]
    data = bytearray()
    for glyph in glyphs:
        data += glyph
        offsets.append(len(data))
    return bytes(data), offsets


def loca_table(offsets, long_format: bool = False) -> bytes:
    if long_format:
        return b"".join(u32(value) for value in offsets)
    return b"".join(u16(value // 2) for value in offsets)


# ---------------------------------------------------------------------------
# Font assembly
# ---------------------------------------------------------------------------


class Layout:
    """Absolute byte offsets of table bodies and of directory records."""

    def __init__(self, tables, records, count):
        self.tables = tables
        self.records = records
        self.count = count


class Font:
    """A minimal font held as a mutable table dictionary."""

    def __init__(self, num_glyphs: int = 3, glyphs=None, index_to_loc: int = 0,
                 scaler: int = SFNT_TRUE, units: int = 1000,
                 maxp_version: int = 0x00010000, number_of_h_metrics=None,
                 head_magic: int = HEAD_MAGIC):
        if glyphs is None:
            glyphs = [simple_glyph(), b"", simple_glyph()]
        glyf, glyph_offsets = build_glyf(glyphs)
        metrics = num_glyphs if number_of_h_metrics is None else number_of_h_metrics
        self.tables = {
            "cmap": cmap_format4_table(),
            "glyf": glyf,
            "head": head_table(units=units, index_to_loc=index_to_loc,
                               magic=head_magic),
            "hhea": hhea_table(metrics),
            "hmtx": hmtx_table(num_glyphs),
            "loca": loca_table(glyph_offsets,
                               long_format=(index_to_loc == 1)),
            "maxp": maxp_table(num_glyphs, version=maxp_version),
            "name": name_table(),
            "post": post_table(),
        }
        self.glyph_offsets = glyph_offsets
        self.scaler = scaler
        self.num_glyphs = num_glyphs

    def build(self):
        return assemble(self.tables, self.scaler)


def assemble(tables, scaler: int = SFNT_TRUE):
    """Assemble a sorted, checksummed sfnt file and return (bytes, Layout)."""
    tags = sorted(tables)
    count = len(tags)
    power = 1 << (count.bit_length() - 1)
    search_range = 16 * power
    entry_selector = power.bit_length() - 1
    range_shift = 16 * count - search_range
    header = (u32(scaler) + u16(count) + u16(search_range)
              + u16(entry_selector) + u16(range_shift))

    # The head table's checkSumAdjustment is zero while checksums are computed.
    bodies = {}
    for tag in tags:
        body = tables[tag]
        if tag == "head":
            body = body[:8] + b"\x00\x00\x00\x00" + body[12:]
        bodies[tag] = body

    cursor = 12 + 16 * count
    table_offsets = {}
    for tag in tags:
        table_offsets[tag] = cursor
        cursor += len(pad4(bodies[tag]))

    records = bytearray()
    record_offsets = {}
    for tag in tags:
        record_offsets[tag] = 12 + len(records)
        records += (tag.encode("ascii")
                    + u32(checksum(bodies[tag]))
                    + u32(table_offsets[tag])
                    + u32(len(bodies[tag])))

    data = bytearray(header + records)
    for tag in tags:
        data += pad4(bodies[tag])

    # A corpus case may remove head; without it there is no field to adjust.
    if "head" in table_offsets:
        whole = checksum(bytes(data))
        adjustment = (CHECKSUM_MAGIC - whole) & 0xFFFFFFFF
        at = table_offsets["head"] + 8
        data[at : at + 4] = u32(adjustment)

    return bytes(data), Layout(table_offsets, record_offsets, count)


# ---------------------------------------------------------------------------
# Case construction
# ---------------------------------------------------------------------------


class Case:
    def __init__(self, filename, data, variant, offset, reason, *,
                 legal_but_unusual=False, ceiling=None, limits_profile=None):
        if variant is not None and variant not in VARIANTS:
            raise ValueError("unknown Refused variant: " + variant)
        self.filename = filename
        self.data = data
        self.entry = {
            "variant": variant,
            "offset": offset,
            "reason": reason,
            "legal_but_unusual": legal_but_unusual,
            "sha256": sha256(data),
        }
        if ceiling is not None:
            self.entry["ceiling"] = ceiling
        if limits_profile is not None:
            self.entry["limits_profile"] = limits_profile


def build_all_cases():
    cases = []
    emit = lambda case: cases.append(case)

    def control():
        font = Font()
        data, layout = font.build()
        return font, data, layout

    base_font, base_data, base_layout = control()

    def glyph_at(font, layout, index, within=0):
        return layout.tables["glyf"] + font.glyph_offsets[index] + within

    # -- The control and the legal-but-unusual cases -------------------------

    emit(Case(
        "valid_minimal.ttf", base_data, None, None,
        "The unmodified control font; the reader must accept it with no refusal.",
    ))

    f = Font(units=16384)
    data, layout = f.build()
    emit(Case(
        "units_per_em_at_16384.ttf", data, None,
        layout.tables["head"] + 18,
        "16384 is the inclusive maximum Head::parse permits; a boundary value must be accepted.",
        legal_but_unusual=True,
    ))

    f = Font(index_to_loc=1)
    data, layout = f.build()
    emit(Case(
        "long_loca_format.ttf", data, None,
        layout.tables["head"] + 50,
        "indexToLocFormat 1 (long offsets) is valid; the control uses short offsets.",
        legal_but_unusual=True,
    ))

    f = Font(number_of_h_metrics=100)
    data, layout = f.build()
    emit(Case(
        "hhea_number_of_h_metrics_above_num_glyphs.ttf", data, None,
        layout.tables["hhea"] + 34,
        "Out of spec, but Hmtx::parse clamps numberOfHMetrics to numGlyphs; the reader must accept it without over-allocating.",
        legal_but_unusual=True,
    ))

    f = Font()
    f.tables["ZZZZ"] = b"\x00" * 8
    data, layout = f.build()
    emit(Case(
        "extra_unknown_table.ttf", data, None, None,
        "An unrecognised table tag is legal; the directory reader must ignore it, not refuse.",
        legal_but_unusual=True,
    ))

    # -- Container-level damage ---------------------------------------------

    emit(Case(
        "truncated_file.bin", base_data[:40], "Truncated", 12,
        "The file is cut at byte 40, so the 144-byte directory read starting at 12 runs off the end.",
    ))

    emit(Case(
        "bad_signature.bin", patch(base_data, 0, b"\x89PNG"), "Unknown", 0,
        "A PNG magic number is not an sfnt scaler type; the file is not a font this library reads.",
    ))

    f = Font(scaler=0x00020000)
    data, layout = f.build()
    emit(Case(
        "bad_sfnt_scaler.ttf", data, "Unknown", 0,
        "An unrecognised sfnt scaler type (0x00020000) must be refused before any table is read.",
    ))

    emit(Case(
        "zero_num_tables.ttf", patch(base_data, 4, u16(0)), "Malformed", 4,
        "A table directory declaring zero tables is structurally impossible.",
    ))

    at = base_layout.records["glyf"] + 8
    emit(Case(
        "table_offset_past_eof.ttf",
        patch(base_data, at, u32(len(base_data) + 4096)),
        "Truncated", at,
        "The glyf record points 4096 bytes past EOF; the directory must refuse the range before slicing.",
    ))

    at = base_layout.records["head"] + 12
    emit(Case(
        "table_length_past_eof.ttf",
        patch(base_data, at, u32(0x00100000)), "Truncated", at,
        "The head record declares 1048576 bytes, well past EOF; the range must be refused.",
    ))

    at = base_layout.records["head"] + 12
    emit(Case(
        "table_length_over_limit.ttf",
        patch(base_data, at, u32(DEFAULT_CEILINGS["table_bytes"] + 1)),
        "OverLimit", at,
        "A table length one byte above Limits.default().table_bytes must be refused before allocation.",
        ceiling="table_bytes",
    ))

    ttc = u32(TTCF) + u32(0x00010000) + u32(DEFAULT_CEILINGS["glyphs"] + 1)
    emit(Case(
        "ttc_count_over_glyphs_ceiling.bin", ttc, "OverLimit", 8,
        "A TTC declaring 65537 faces exceeds Limits.default().glyphs before any face offset is read.",
        ceiling="glyphs",
    ))

    ttc = u32(TTCF) + u32(0x00030000) + u32(1) + u32(12)
    emit(Case(
        "unsupported_ttc_version.bin", ttc, "Unsupported", 4,
        "A TTC version this library does not read must be named as unsupported, not parsed anyway.",
    ))

    # -- Missing required tables ---------------------------------------------

    for tag in ("head", "maxp", "hhea", "hmtx", "cmap", "loca", "glyf"):
        f = Font()
        del f.tables[tag]
        data, layout = f.build()
        emit(Case(
            "missing_" + tag + ".ttf", data, "MissingTable", None,
            "The " + tag + " table is required and absent from the directory.",
        ))

    # -- head damage ---------------------------------------------------------

    at = base_layout.tables["head"] + 18
    emit(Case(
        "units_per_em_zero.ttf", patch(base_data, at, u16(0)),
        "Malformed", at,
        "unitsPerEm of 0 makes every later scale divide by zero; it is below the permitted minimum of 16.",
    ))

    at = base_layout.tables["head"] + 18
    emit(Case(
        "units_per_em_above_16384.ttf", patch(base_data, at, u16(16385)),
        "Malformed", at,
        "unitsPerEm of 16385 is one above the maximum Head::parse permits.",
    ))

    at = base_layout.tables["head"] + 50
    emit(Case(
        "bad_index_to_loc_format.ttf", patch(base_data, at, i16(2)),
        "Malformed", at,
        "indexToLocFormat must be 0 or 1; any other value makes loca widths unknowable.",
    ))

    at = base_layout.tables["head"] + 12
    emit(Case(
        "unexpected_head_magic.ttf", patch(base_data, at, u32(0)),
        "Unexpected", at,
        "head.magicNumber is not 0x5F0F3CF5; the reader must name the expected value.",
    ))

    # -- maxp damage ---------------------------------------------------------

    f = Font(maxp_version=0x00020000)
    data, layout = f.build()
    emit(Case(
        "unsupported_maxp_version.ttf", data, "Unsupported",
        layout.tables["maxp"],
        "A well-formed maxp version this library does not read must be named as unsupported.",
    ))

    # -- loca damage ---------------------------------------------------------

    at = base_layout.tables["loca"] + 4
    emit(Case(
        "loca_offsets_going_backwards.ttf", patch(base_data, at, u16(8)),
        "Malformed", at,
        "The third loca offset is below the second; glyph ranges must be monotonically non-decreasing.",
    ))

    at = base_layout.tables["loca"] + 6
    emit(Case(
        "loca_offset_past_glyf.ttf", patch(base_data, at, u16(60000)),
        "Truncated", at,
        "The final loca offset points far beyond the glyf table; reading that glyph range must be refused.",
    ))

    # -- cmap damage ---------------------------------------------------------

    at = base_layout.tables["cmap"] + 8
    emit(Case(
        "cmap_subtable_offset_outside_table.ttf",
        patch(base_data, at, u32(len(base_font.tables["cmap"]) + 64)),
        "Truncated", at,
        "The encoding record points 64 bytes past the end of cmap; the subtable window must be refused.",
    ))

    at = base_layout.tables["cmap"] + 34
    emit(Case(
        "cmap_format4_start_above_end.ttf", patch(base_data, at, u16(0x30)),
        "Malformed", at,
        "cmap format 4 startCode[0] (0x30) is above endCode[0] (0x20); the segment is impossible.",
    ))

    # -- glyf damage ---------------------------------------------------------

    f = Font()
    f.tables["glyf"], offsets = build_glyf([
        simple_glyph(), b"",
        simple_glyph(contours=5, end_pts=(0, 0, 0, 0, 2)),
    ])
    f.glyph_offsets = offsets
    f.tables["loca"] = loca_table(offsets)
    data, layout = f.build()
    emit(Case(
        "glyf_contours_exceed_points.ttf", data, "Malformed",
        glyph_at(f, layout, 2),
        "Five contours are declared over only three points; each contour needs at least one endpoint.",
    ))

    f = Font()
    f.tables["glyf"], offsets = build_glyf([
        simple_glyph(), b"",
        simple_glyph(contours=1, end_pts=(2,),
                     flags=(0x01 | REPEAT_FLAG, 0xFF),
                     xs=(0, 100, 50), ys=(0, 100, 50)),
    ])
    f.glyph_offsets = offsets
    f.tables["loca"] = loca_table(offsets)
    data, layout = f.build()
    emit(Case(
        "glyf_repeat_flag_overflow.ttf", data, "Malformed",
        glyph_at(f, layout, 2, within=15),
        "A REPEAT flag declares 256 flags for a three-point glyph; expansion must be capped at numPoints.",
    ))

    f = Font()
    full = simple_glyph(contours=1, end_pts=(8192,),
                        flags=(ON_CURVE_XY_SHORT,) * 8193,
                        xs=(0,) * 8193, ys=(0,) * 8193)
    f.tables["glyf"], offsets = build_glyf([simple_glyph(), b"", full])
    f.glyph_offsets = offsets
    f.tables["loca"] = loca_table(offsets)
    data, layout = f.build()
    emit(Case(
        "points_over_strict_limit.ttf", data, "OverLimit",
        glyph_at(f, layout, 2),
        "A glyph declaring 8193 points exceeds Limits.strict().points (8192); under default limits it must be accepted.",
        ceiling="points", limits_profile="strict",
    ))

    f = Font()
    f.tables["glyf"], offsets = build_glyf([
        simple_glyph(), b"",
        simple_glyph(contours=1, end_pts=(5,),
                     flags=(ON_CURVE_XY_SHORT,) * 6,
                     xs=(0,) * 6, ys=(0,) * 6)[:-6],
    ])
    f.glyph_offsets = offsets
    f.tables["loca"] = loca_table(offsets)
    data, layout = f.build()
    emit(Case(
        "glyf_truncated_coordinates.ttf", data, "Truncated",
        glyph_at(f, layout, 2, within=26),
        "Six points are declared but the y-coordinate run is cut short; the read must stop at the range end.",
    ))

    f = Font()
    f.tables["glyf"], offsets = build_glyf([
        simple_glyph(), b"",
        simple_glyph(contours=32767, end_pts=(2,)),
    ])
    f.glyph_offsets = offsets
    f.tables["loca"] = loca_table(offsets)
    data, layout = f.build()
    emit(Case(
        "contours_over_limit.ttf", data, "OverLimit",
        glyph_at(f, layout, 2),
        "32767 contours exceeds Limits.default().contours (8192); the count must be checked before the endpoint array is read.",
        ceiling="contours",
    ))

    # -- composite glyph damage ---------------------------------------------

    f = Font()
    f.tables["glyf"], offsets = build_glyf([
        simple_glyph(), b"", composite_glyph([(2, 0, 0)]),
    ])
    f.glyph_offsets = offsets
    f.tables["loca"] = loca_table(offsets)
    data, layout = f.build()
    emit(Case(
        "composite_self_reference.ttf", data, "Recursion",
        glyph_at(f, layout, 2, within=12),
        "A composite glyph whose component is itself must be refused at the recursion ceiling, not followed forever.",
        ceiling="recursion",
    ))

    f = Font()
    f.tables["glyf"], offsets = build_glyf([
        simple_glyph(), b"", composite_glyph([(99, 0, 0)]),
    ])
    f.glyph_offsets = offsets
    f.tables["loca"] = loca_table(offsets)
    data, layout = f.build()
    emit(Case(
        "composite_bad_component_glyph_id.ttf", data, "MissingGlyph",
        glyph_at(f, layout, 2, within=12),
        "A composite component names glyph 99 while maxp declares three glyphs.",
    ))

    chain = [simple_glyph()]
    chain += [composite_glyph([(index - 1, 0, 0)]) for index in range(1, 18)]
    f = Font(num_glyphs=18, glyphs=chain)
    data, layout = f.build()
    emit(Case(
        "composite_nesting_beyond_recursion.ttf", data, "Recursion",
        glyph_at(f, layout, 1, within=12),
        "A chain of 17 nested composites exceeds Limits.default().recursion (16) and Limits.strict().recursion (8).",
        ceiling="recursion",
    ))

    f = Font()
    f.tables["glyf"], offsets = build_glyf([
        simple_glyph(), b"",
        composite_glyph([(0, 0, 0)] * (DEFAULT_CEILINGS["composites"] + 1)),
    ])
    f.glyph_offsets = offsets
    f.tables["loca"] = loca_table(offsets)
    data, layout = f.build()
    emit(Case(
        "composites_over_limit.ttf", data, "OverLimit",
        glyph_at(f, layout, 2, within=12),
        "1025 components exceeds Limits.default().composites (1024); the count must be checked before the glyph is walked.",
        ceiling="composites",
    ))

    seen = set()
    for case in cases:
        if case.filename in seen:
            raise ValueError("duplicate corpus filename: " + case.filename)
        seen.add(case.filename)
    return cases


# ---------------------------------------------------------------------------
# Manifest, writing and checking
# ---------------------------------------------------------------------------


def canonical_manifest(cases) -> str:
    mapping = {case.filename: case.entry for case in cases}
    return json.dumps(mapping, sort_keys=True, indent=2, ensure_ascii=True) + "\n"


def write_corpus(cases, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for case in cases:
        (out_dir / case.filename).write_bytes(case.data)
    (out_dir / MANIFEST_NAME).write_bytes(
        canonical_manifest(cases).encode("utf-8")
    )


def check_corpus(cases, out_dir: Path) -> int:
    recorded_path = out_dir / MANIFEST_NAME
    failures = []
    if not recorded_path.is_file():
        print("missing " + str(recorded_path), file=sys.stderr)
        return 1
    recorded = json.loads(recorded_path.read_text(encoding="utf-8"))
    computed = {case.filename: case.entry for case in cases}

    extra = sorted(set(recorded) - set(computed))
    missing = sorted(set(computed) - set(recorded))
    for name in extra:
        failures.append("manifest has an unknown entry: " + name)
    for name in missing:
        failures.append("manifest is missing an entry: " + name)

    for name in sorted(set(recorded) & set(computed)):
        if recorded[name] != computed[name]:
            failures.append("manifest entry differs from regeneration: " + name)
        path = out_dir / name
        if not path.is_file():
            failures.append("corpus file is missing: " + name)
            continue
        actual = sha256(path.read_bytes())
        if actual != computed[name]["sha256"]:
            failures.append("corpus file hash differs: " + name)

    stray = sorted(
        path.name for path in out_dir.glob("*")
        if path.is_file()
        and path.suffix in (".ttf", ".bin")
        and path.name not in computed
    )
    for name in stray:
        failures.append("unmanifested corpus file: " + name)

    for failure in failures:
        print(failure, file=sys.stderr)
    if failures:
        print("check failed: " + str(len(failures)) + " problem(s)",
              file=sys.stderr)
        return 1
    print("check ok: " + str(len(cases)) + " corpus files match the manifest")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Build or verify the moonfont hostile-input corpus.",
    )
    parser.add_argument(
        "--check", action="store_true",
        help="regenerate in memory and verify manifest hashes without writing",
    )
    parser.add_argument(
        "--out", type=Path, default=CORPUS_DIR,
        help="corpus directory (default: integration/difftest/corpus)",
    )
    args = parser.parse_args(argv)

    cases = build_all_cases()
    if args.check:
        return check_corpus(cases, args.out)

    write_corpus(cases, args.out)
    variants = {}
    for case in cases:
        name = case.entry["variant"] or "no refusal"
        variants[name] = variants.get(name, 0) + 1
    print("wrote " + str(len(cases)) + " corpus files to " + str(args.out))
    for name in sorted(variants):
        print("  " + name + ": " + str(variants[name]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
