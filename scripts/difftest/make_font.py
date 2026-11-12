#!/usr/bin/env python3
"""Build a minimal, deterministic TrueType font for differential testing.

Pure Python standard library only. The output is a genuinely valid SFNT with
head, hhea, maxp, hmtx, cmap (format 4), loca (long format), glyf, name and
post. Every byte is a pure function of the constants below: no timestamps, no
randomness and no filesystem-dependent ordering are used.
"""

import argparse
import hashlib
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "integration" / "difftest" / "fixtures"
OUT = FIXTURES / "synthetic.ttf"
SIDECAR = FIXTURES / "synthetic.ttf.sha256"

UNITS_PER_EM = 1000
ASCENDER = 800
DESCENDER = -200
ON = 1
OFF = 0

# Glyph order is fixed. Each contour is a list of (x, y, on_curve) points in
# font units, y up. Coordinates are chosen so that every implied on-curve
# midpoint (the midpoint between two consecutive off-curve points) is integral.
GLYPHS = [
    {
        "name": ".notdef",
        "advance": 500,
        "lsb": 0,
        "contours": [],
    },
    {
        "name": "space",
        "advance": 250,
        "lsb": 0,
        "contours": [],
    },
    {
        "name": "A",
        "advance": 600,
        "lsb": 0,
        "contours": [
            [
                (100, 0, ON),
                (500, 0, ON),
                (600, 300, OFF),
                (400, 700, OFF),
                (200, 700, ON),
                (0, 300, OFF),
            ]
        ],
    },
    {
        "name": "B",
        "advance": 500,
        "lsb": 50,
        "contours": [
            [
                (50, 0, ON),
                (450, 0, ON),
                (450, 700, ON),
                (50, 700, ON),
            ]
        ],
    },
    {
        "name": "a",
        "advance": 450,
        "lsb": 50,
        "contours": [
            [
                (50, 0, ON),
                (300, 0, ON),
                (400, 250, OFF),
                (200, 500, ON),
                (50, 500, ON),
            ]
        ],
    },
]

# The sixth glyph is a composite: it references glyph 2 ("A") with a non-zero
# x/y offset and adds a second component (glyph 3, "B") at another offset.
COMPOSITE = {
    "name": "Aacute",
    "advance": 700,
    "lsb": 40,
    "components": [(2, 40, 20), (3, 10, 10)],
}

# Codepoint -> glyph id. All values are inside the BMP so cmap format 4 suffices.
CMAP = {
    0x0020: 1,   # space
    0x0041: 2,   # A
    0x0042: 3,   # B
    0x0061: 4,   # a
    0x00C1: 5,   # composite
}

NAME_STRINGS = [
    (1, "Moonfont Synthetic"),
    (2, "Regular"),
    (4, "Moonfont Synthetic Regular"),
    (6, "MoonfontSynthetic-Regular"),
]


def u16(v):
    return struct.pack(">H", v)


def i16(v):
    return struct.pack(">h", v)


def u32(v):
    return struct.pack(">I", v)


def to_i16(u):
    """Reinterpret an unsigned 16-bit delta as a signed short."""
    return u - 0x10000 if u >= 0x8000 else u


def glyph_bbox(contours):
    pts = [p for c in contours for p in c]
    if not pts:
        return (0, 0, 0, 0)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


def simple_glyph_data(contours):
    """Encode one simple glyph using uncompressed int16 coordinate deltas."""
    pts = [p for c in contours for p in c]
    if not pts:
        return b""
    n_contours = len(contours)
    x_min, y_min, x_max, y_max = glyph_bbox(contours)
    out = struct.pack(">hhhhh", n_contours, x_min, y_min, x_max, y_max)

    end_pts = []
    acc = 0
    for c in contours:
        acc += len(c)
        end_pts.append(acc - 1)
    out += b"".join(u16(e) for e in end_pts)
    out += u16(0)  # instructionLength

    # Flag byte per point: 0x01 = on curve, 0x00 = off curve. No short vectors,
    # no same-value flags and no repeat compression, so every coordinate is an
    # explicit two-byte signed delta.
    out += bytes(0x01 if p[2] else 0x00 for p in pts)

    prev = 0
    for p in pts:
        out += i16(p[0] - prev)
        prev = p[0]
    prev = 0
    for p in pts:
        out += i16(p[1] - prev)
        prev = p[1]
    return out


def composite_glyph_data(bboxes, components):
    xmins, ymins, xmaxs, ymaxs = [], [], [], []
    for gid, dx, dy in components:
        bx0, by0, bx1, by1 = bboxes[gid]
        xmins.append(bx0 + dx)
        ymins.append(by0 + dy)
        xmaxs.append(bx1 + dx)
        ymaxs.append(by1 + dy)
    bbox = (min(xmins), min(ymins), max(xmaxs), max(ymaxs))
    out = struct.pack(">hhhhh", -1, *bbox)
    for index, (gid, dx, dy) in enumerate(components):
        # ARG_1_AND_2_ARE_WORDS | ARGS_ARE_XY_VALUES, plus MORE_COMPONENTS on
        # every record except the last.
        flags = 0x0001 | 0x0002
        if index < len(components) - 1:
            flags |= 0x0020
        out += struct.pack(">HHhh", flags, gid, dx, dy)
    return out, bbox


def build_cmap_table():
    codes = sorted(CMAP)
    segments = []
    i = 0
    while i < len(codes):
        start = codes[i]
        delta = (CMAP[start] - start) & 0xFFFF
        j = i + 1
        while (
            j < len(codes)
            and codes[j] == codes[j - 1] + 1
            and ((CMAP[codes[j]] - codes[j]) & 0xFFFF) == delta
        ):
            j += 1
        segments.append((start, codes[j - 1], delta))
        i = j
    # The mandatory sentinel segment maps 0xFFFF to glyph 0.
    segments.append((0xFFFF, 0xFFFF, 1))

    seg_count = len(segments)
    seg_count_x2 = 2 * seg_count
    entry_selector = seg_count.bit_length() - 1
    search_range = 2 * (2 ** entry_selector)
    range_shift = seg_count_x2 - search_range

    end_codes = b"".join(u16(s[1]) for s in segments)
    start_codes = b"".join(u16(s[0]) for s in segments)
    deltas = b"".join(i16(to_i16(s[2])) for s in segments)
    range_offsets = b"\x00\x00" * seg_count

    body = end_codes + b"\x00\x00" + start_codes + deltas + range_offsets
    length = 14 + len(body)
    subtable = struct.pack(
        ">HHHHHHH",
        4,
        length,
        0,  # language
        seg_count_x2,
        search_range,
        entry_selector,
        range_shift,
    ) + body

    # One encoding record: Windows, Unicode BMP, offset 12 from cmap start.
    header = struct.pack(">HHHHI", 0, 1, 3, 1, 12)
    return header + subtable


def build_name_table():
    count = len(NAME_STRINGS)
    string_offset = 6 + 12 * count
    records = b""
    storage = b""
    for name_id, value in NAME_STRINGS:
        encoded = value.encode("utf-16-be")
        records += struct.pack(
            ">HHHHHH", 3, 1, 0x0409, name_id, len(encoded), len(storage)
        )
        storage += encoded
    return struct.pack(">HHH", 0, count, string_offset) + records + storage


def build_post_table():
    # post format 3.0: no glyph names, 32 bytes, fully deterministic.
    return struct.pack(">IihhIIIII", 0x00030000, 0, -100, 50, 0, 0, 0, 0, 0)


def table_checksum(data):
    """Checksum of a table already padded to a four-byte boundary."""
    total = 0
    for i in range(0, len(data), 4):
        total = (total + struct.unpack_from(">I", data, i)[0]) & 0xFFFFFFFF
    return total


def font_checksum(font_bytes):
    total = 0
    for i in range(0, len(font_bytes), 4):
        total = (total + struct.unpack_from(">I", font_bytes, i)[0]) & 0xFFFFFFFF
    return total


def build():
    """Return the complete font as bytes."""
    bboxes = [glyph_bbox(g["contours"]) for g in GLYPHS]
    glyph_data = [simple_glyph_data(g["contours"]) for g in GLYPHS]
    composite_data, composite_bbox = composite_glyph_data(
        bboxes, COMPOSITE["components"]
    )
    glyph_data.append(composite_data)
    bboxes.append(composite_bbox)

    all_glyphs = GLYPHS + [COMPOSITE]
    num_glyphs = len(all_glyphs)

    # glyf and long loca. Each glyph is padded to a four-byte boundary so the
    # table directory and loca offsets stay aligned; padding bytes sit in the
    # gap between glyphs and are ignored by a structural decoder.
    glyf = b""
    loca = [0]
    for data in glyph_data:
        glyf += data
        glyf += b"\x00" * ((-len(data)) % 4)
        loca.append(len(glyf))
    loca_data = b"".join(u32(v) for v in loca)

    advances = [g["advance"] for g in all_glyphs]
    lsbs = [g["lsb"] for g in all_glyphs]
    hmtx_data = b"".join(u16(a) + i16(l) for a, l in zip(advances, lsbs))

    x_min = min(b[0] for b in bboxes)
    y_min = min(b[1] for b in bboxes)
    x_max = max(b[2] for b in bboxes)
    y_max = max(b[3] for b in bboxes)

    head_data = struct.pack(
        ">IIIIHHqqhhhhHHhhh",
        0x00010000,      # version
        0x00010000,      # fontRevision
        0,               # checkSumAdjustment, patched below
        0x5F0F3CF5,      # magicNumber
        0x000B,          # flags
        UNITS_PER_EM,
        0,               # created
        0,               # modified
        x_min, y_min, x_max, y_max,
        0,               # macStyle
        8,               # lowestRecPPEM
        2,               # fontDirectionHint
        1,               # indexToLocFormat (long)
        0,               # glyphDataFormat
    )

    advance_width_max = max(advances)
    min_lsb = min(lsbs)
    min_rsb = min(a - (l + (b[2] - b[0])) for a, l, b in zip(advances, lsbs, bboxes))
    x_max_extent = max(l + (b[2] - b[0]) for l, b in zip(lsbs, bboxes))
    hhea_data = struct.pack(
        ">IhhhHhhhhhhhhhhhH",
        0x00010000,
        ASCENDER, DESCENDER, 0,
        advance_width_max, min_lsb, min_rsb, x_max_extent,
        1, 0, 0,
        0, 0, 0, 0,
        0,
        num_glyphs,      # numberOfHMetrics
    )

    max_points = max(len([p for c in g["contours"] for p in c]) for g in GLYPHS)
    max_contours = max(len(g["contours"]) for g in GLYPHS)
    composite_points = sum(
        len([p for c in GLYPHS[gid]["contours"] for p in c])
        for gid, _, _ in COMPOSITE["components"]
    )
    composite_contours = sum(
        len(GLYPHS[gid]["contours"]) for gid, _, _ in COMPOSITE["components"]
    )
    maxp_data = struct.pack(
        ">I" + "H" * 14,
        0x00010000,
        num_glyphs,
        max_points,
        max_contours,
        composite_points,
        composite_contours,
        2,   # maxZones
        0,   # maxTwilightPoints
        0,   # maxStorage
        0,   # maxFunctionDefs
        0,   # maxInstructionDefs
        0,   # maxStackElements
        0,   # maxSizeOfInstructions
        len(COMPOSITE["components"]),  # maxComponentElements
        1,   # maxComponentDepth
    )

    tables = {
        "cmap": build_cmap_table(),
        "glyf": glyf,
        "head": head_data,
        "hhea": hhea_data,
        "hmtx": hmtx_data,
        "loca": loca_data,
        "maxp": maxp_data,
        "name": build_name_table(),
        "post": build_post_table(),
    }

    tags = sorted(tables)
    num_tables = len(tags)
    entry_selector = num_tables.bit_length() - 1
    search_range = 16 * (2 ** entry_selector)
    range_shift = num_tables * 16 - search_range
    offset_table = struct.pack(
        ">IHHHH", 0x00010000, num_tables, search_range, entry_selector, range_shift
    )

    offset = 12 + 16 * num_tables
    directory = b""
    body = b""
    head_offset = None
    for tag in tags:
        data = tables[tag]
        padded = data + b"\x00" * ((-len(data)) % 4)
        checksum = table_checksum(padded)
        directory += tag.encode("ascii") + u32(checksum) + u32(offset) + u32(len(data))
        if tag == "head":
            head_offset = offset
        body += padded
        offset += len(padded)

    font_bytes = bytearray(offset_table + directory + body)

    # checkSumAdjustment is computed with the field set to zero; the head table
    # checksum in the directory is deliberately left as computed above.
    adjustment = (0xB1B0AFBA - font_checksum(bytes(font_bytes))) & 0xFFFFFFFF
    struct.pack_into(">I", font_bytes, head_offset + 8, adjustment)
    return bytes(font_bytes)


def sha256_hex(data):
    return hashlib.sha256(data).hexdigest()


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Build the synthetic TrueType test font."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="rebuild twice in memory, compare SHA-256 values and write nothing",
    )
    args = parser.parse_args(argv)

    first = build()
    digest = sha256_hex(first)

    if args.check:
        second = build()
        if sha256_hex(second) != digest:
            print("FAIL: in-memory rebuild is not deterministic", file=sys.stderr)
            return 1
        if OUT.exists():
            on_disk = OUT.read_bytes()
            if sha256_hex(on_disk) != digest:
                print(
                    "FAIL: {} does not match the in-memory build".format(OUT.name),
                    file=sys.stderr,
                )
                print("  expected " + digest, file=sys.stderr)
                print("  found    " + sha256_hex(on_disk), file=sys.stderr)
                return 1
        print("{}  synthetic.ttf".format(digest))
        return 0

    FIXTURES.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(first)
    SIDECAR.write_text("{}  synthetic.ttf\n".format(digest), encoding="utf-8")
    print("{}  synthetic.ttf".format(digest))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
