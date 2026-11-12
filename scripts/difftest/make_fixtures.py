#!/usr/bin/env python3
"""Generate canonical differential-test fixtures from synthetic.ttf.

The default oracle, ``reference``, is an independent pure-standard-library
implementation. Its parser is written here rather than imported from any font
library, and its rasteriser uses 8x8 uniform-grid supersampling with a non-zero
winding test on flattened quadratic outlines. That is deliberately a different
algorithm from the MoonBit rasteriser, which uses eight-times vertical
subsampling with exact horizontal area in 26.6 fixed point.

The other oracles are optional third-party providers. If one is requested but
not installed, this script fails loudly rather than silently substituting the
reference data.
"""

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "integration" / "difftest" / "fixtures"
FONT_PATH = FIXTURES / "synthetic.ttf"
FONT_SIDECAR = FIXTURES / "synthetic.ttf.sha256"
MASTER = FIXTURES / "fixtures.json"
DOC_INDEX = FIXTURES / "docs" / "difftest.json"

SCHEMA = "moonfont.difftest/1"
CATEGORIES = ["font", "tables", "cmap", "metrics", "outlines", "coverage"]
CATEGORY_FILES = {
    "font": "font.json",
    "tables": "tables.json",
    "cmap": "cmap.json",
    "metrics": "metrics.json",
    "outlines": "outlines.json",
    "coverage": "coverage.json",
}

GRID = 64
SAMPLES_PER_AXIS = 8
FLATTEN_STEPS = 32
ORACLE_VERSION = "1.0.0"

# Recommended pins. These are documented in fixtures/README.md and reported by
# index_fixtures.py. They are records, not runtime probes, so the emitted JSON
# stays deterministic across machines.
ORACLE_PINS = {
    "python": "3.11+",
    "fonttools": "4.47.2",
    "pillow": "10.1.0",
    "freetype": "2.15.0",
}

# Pre-registered tolerances, one entry per category. Reported in the docs index
# and spelled out in fixtures/README.md.
TOLERANCES = {
    "font": "exact",
    "tables": "exact",
    "cmap": "exact",
    "metrics": "advance, lsb and bounds exact; scaled_bounds within 1 pixel",
    "outlines": "exact after canonicalisation",
    "coverage": "ink_coverage within 5 per cent; ink_bbox within 1 pixel",
}

VALID_ORACLES = ("reference", "fonttools", "pillow")


def canonical_bytes(obj):
    """Deterministic, timestamp-free, filesystem-independent JSON bytes."""
    text = json.dumps(obj, sort_keys=True, indent=2, ensure_ascii=True) + "\n"
    return text.encode("utf-8")


def sha256_hex(data):
    return hashlib.sha256(data).hexdigest()


def write_with_sidecar(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    sidecar = path.with_name(path.name + ".sha256")
    sidecar.write_text(
        "{}  {}\n".format(sha256_hex(data), path.name), encoding="utf-8"
    )


def hex32(value):
    return "0x{:08X}".format(value & 0xFFFFFFFF)


def require_module(module_name, oracle, install_hint):
    """Import a third-party module or exit with a clear, non-silent failure."""
    try:
        return __import__(module_name, fromlist=["*"])
    except ImportError as exc:
        raise SystemExit(
            "ERROR: --oracle {} requires {}, which is not installed.\n"
            "       No fallback data was written: fixtures must never be "
            "silently self-referential.\n"
            "       Install it with: {}".format(oracle, module_name, install_hint)
        ) from exc


def scaled(value, units_per_em):
    return int(round(value * GRID / units_per_em))


# ---------------------------------------------------------------------------
# Independent SFNT parser (pure standard library)
# ---------------------------------------------------------------------------


class ReferenceParser:
    """A small, self-contained TrueType reader used only as an oracle."""

    def __init__(self, data):
        self.data = data
        (sfnt_version, num_tables, _, _, _) = struct.unpack_from(">IHHHH", data, 0)
        self.sfnt_version = sfnt_version
        self.num_tables = num_tables
        self.tables = {}
        raw_tags = []
        for i in range(num_tables):
            off = 12 + 16 * i
            tag, checksum, toff, tlen = struct.unpack_from(">4sIII", data, off)
            name = tag.decode("latin-1")
            raw_tags.append(name)
            self.tables[name] = {"offset": toff, "length": tlen, "checksum": checksum}
        self.table_tags = sorted(self.tables)
        self._parse_head()
        self._parse_hhea()
        self._parse_maxp()
        self._parse_hmtx()
        self._parse_loca()
        self._parse_cmap()
        self._parse_glyf()

    def _slice(self, tag):
        t = self.tables[tag]
        return self.data[t["offset"]:t["offset"] + t["length"]]

    def _parse_head(self):
        v = struct.unpack_from(">IIIIHHqqhhhhHHhhh", self.data, self.tables["head"]["offset"])
        self.head = {
            "version": hex32(v[0]),
            "font_revision": hex32(v[1]),
            "check_sum_adjustment": v[2],
            "magic_number": hex32(v[3]),
            "flags": v[4],
            "units_per_em": v[5],
            "created": v[6],
            "modified": v[7],
            "x_min": v[8],
            "y_min": v[9],
            "x_max": v[10],
            "y_max": v[11],
            "mac_style": v[12],
            "lowest_rec_ppem": v[13],
            "font_direction_hint": v[14],
            "index_to_loc_format": v[15],
            "glyph_data_format": v[16],
        }
        self.units_per_em = v[5]
        self.index_to_loc_format = v[15]

    def _parse_hhea(self):
        v = struct.unpack_from(">IhhhHhhhhhhhhhhhH", self.data, self.tables["hhea"]["offset"])
        self.hhea = {
            "version": hex32(v[0]),
            "ascender": v[1],
            "descender": v[2],
            "line_gap": v[3],
            "advance_width_max": v[4],
            "min_left_side_bearing": v[5],
            "min_right_side_bearing": v[6],
            "x_max_extent": v[7],
            "caret_slope_rise": v[8],
            "caret_slope_run": v[9],
            "caret_offset": v[10],
            "metric_data_format": v[15],
            "number_of_h_metrics": v[16],
        }

    def _parse_maxp(self):
        v = struct.unpack_from(">I" + "H" * 14, self.data, self.tables["maxp"]["offset"])
        keys = [
            "num_glyphs", "max_points", "max_contours", "max_composite_points",
            "max_composite_contours", "max_zones", "max_twilight_points",
            "max_storage", "max_function_defs", "max_instruction_defs",
            "max_stack_elements", "max_size_of_instructions",
            "max_component_elements", "max_component_depth",
        ]
        self.maxp = {"version": hex32(v[0])}
        for key, value in zip(keys, v[1:]):
            self.maxp[key] = value
        self.num_glyphs = v[1]

    def _parse_hmtx(self):
        off = self.tables["hmtx"]["offset"]
        n = self.hhea["number_of_h_metrics"]
        metrics = []
        for i in range(n):
            advance, lsb = struct.unpack_from(">Hh", self.data, off + 4 * i)
            metrics.append((advance, lsb))
        last_advance = metrics[-1][0] if metrics else 0
        for i in range(n, self.num_glyphs):
            lsb = struct.unpack_from(">h", self.data, off + 4 * n + 2 * (i - n))[0]
            metrics.append((last_advance, lsb))
        self.metrics = metrics

    def _parse_loca(self):
        off = self.tables["loca"]["offset"]
        count = self.num_glyphs + 1
        if self.index_to_loc_format == 1:
            self.loca = list(struct.unpack_from(">{}I".format(count), self.data, off))
        else:
            self.loca = [
                v * 2 for v in struct.unpack_from(">{}H".format(count), self.data, off)
            ]

    def _parse_cmap(self):
        off = self.tables["cmap"]["offset"]
        _, num_subtables = struct.unpack_from(">HH", self.data, off)
        chosen = None
        fallback = None
        for i in range(num_subtables):
            platform, encoding, sub_off = struct.unpack_from(
                ">HHI", self.data, off + 4 + 8 * i
            )
            if fallback is None:
                fallback = off + sub_off
            if platform == 3 and encoding in (1, 10):
                chosen = off + sub_off
                break
            if platform == 0 and chosen is None:
                chosen = off + sub_off
        if chosen is None:
            chosen = fallback
        fmt = struct.unpack_from(">H", self.data, chosen)[0]
        if fmt != 4:
            raise ValueError("reference parser only handles cmap format 4, got {}".format(fmt))
        _, _, _, seg_count_x2 = struct.unpack_from(">HHHH", self.data, chosen)
        seg_count = seg_count_x2 // 2
        base = chosen + 14
        end_codes = struct.unpack_from(">{}H".format(seg_count), self.data, base)
        start_codes = struct.unpack_from(
            ">{}H".format(seg_count), self.data, base + 2 * seg_count + 2
        )
        deltas = struct.unpack_from(
            ">{}h".format(seg_count), self.data, base + 4 * seg_count + 2
        )
        range_offsets_base = base + 6 * seg_count + 2
        range_offsets = struct.unpack_from(
            ">{}H".format(seg_count), self.data, range_offsets_base
        )
        cmap = {}
        for i in range(seg_count):
            start, end, delta, ro = (
                start_codes[i], end_codes[i], deltas[i], range_offsets[i]
            )
            if start == 0xFFFF:
                continue  # sentinel segment, not a character
            for code in range(start, end + 1):
                if ro == 0:
                    glyph_id = (code + delta) & 0xFFFF
                else:
                    addr = range_offsets_base + 2 * i + ro + 2 * (code - start)
                    raw = struct.unpack_from(">H", self.data, addr)[0]
                    glyph_id = (raw + delta) & 0xFFFF if raw else 0
                cmap[code] = glyph_id
        self.cmap = cmap

    def _parse_glyf(self):
        off = self.tables["glyf"]["offset"]
        self.glyphs = []
        for gid in range(self.num_glyphs):
            start, end = self.loca[gid], self.loca[gid + 1]
            if start >= end:
                self.glyphs.append({"bbox": (0, 0, 0, 0), "contours": [], "components": []})
                continue
            pos = off + start
            number_of_contours = struct.unpack_from(">h", self.data, pos)[0]
            bbox = struct.unpack_from(">hhhh", self.data, pos + 2)
            if number_of_contours >= 0:
                self.glyphs.append(
                    self._simple_glyph(pos, number_of_contours, bbox)
                )
            else:
                self.glyphs.append(self._composite_glyph(pos, bbox))

    def _simple_glyph(self, pos, number_of_contours, bbox):
        end_pts = struct.unpack_from(
            ">{}H".format(number_of_contours), self.data, pos + 10
        )
        n_points = end_pts[-1] + 1 if number_of_contours else 0
        p = pos + 10 + 2 * number_of_contours
        instruction_length = struct.unpack_from(">H", self.data, p)[0]
        p += 2 + instruction_length

        flags = []
        while len(flags) < n_points:
            flag = self.data[p]
            p += 1
            flags.append(flag)
            if flag & 0x08:  # REPEAT_FLAG
                repeats = self.data[p]
                p += 1
                flags.extend([flag] * repeats)
        flags = flags[:n_points]

        xs = []
        x = 0
        for flag in flags:
            if flag & 0x02:  # X_SHORT_VECTOR
                delta = self.data[p]
                p += 1
                x += delta if (flag & 0x10) else -delta
            elif not (flag & 0x10):
                delta = struct.unpack_from(">h", self.data, p)[0]
                p += 2
                x += delta
            xs.append(x)

        ys = []
        y = 0
        for flag in flags:
            if flag & 0x04:  # Y_SHORT_VECTOR
                delta = self.data[p]
                p += 1
                y += delta if (flag & 0x20) else -delta
            elif not (flag & 0x20):
                delta = struct.unpack_from(">h", self.data, p)[0]
                p += 2
                y += delta
            ys.append(y)

        points = [
            (xs[i], ys[i], bool(flags[i] & 0x01)) for i in range(n_points)
        ]
        contours = []
        previous = 0
        for end in end_pts:
            contours.append(points[previous:end + 1])
            previous = end + 1
        return {"bbox": bbox, "contours": contours, "components": []}

    def _composite_glyph(self, pos, bbox):
        p = pos + 10
        components = []
        more = True
        while more:
            flags, glyph_index = struct.unpack_from(">HH", self.data, p)
            p += 4
            if flags & 0x0001:  # ARG_1_AND_2_ARE_WORDS
                arg1, arg2 = struct.unpack_from(">hh", self.data, p)
                p += 4
            else:
                arg1, arg2 = struct.unpack_from(">bb", self.data, p)
                p += 2
            if flags & 0x0008:  # WE_HAVE_A_SCALE
                p += 2
            elif flags & 0x0040:  # X_AND_Y_SCALE
                p += 4
            elif flags & 0x0080:  # WE_HAVE_A_TWO_BY_TWO
                p += 8
            if not (flags & 0x0002):
                raise ValueError("point-matching composite components are not supported")
            components.append({"glyph_id": glyph_index, "dx": arg1, "dy": arg2})
            more = bool(flags & 0x0020)  # MORE_COMPONENTS
        return {"bbox": bbox, "contours": [], "components": components}


# ---------------------------------------------------------------------------
# Outline canonicalisation (TrueType points -> move/line/quad/close commands)
# ---------------------------------------------------------------------------


def contour_commands(points, dx=0, dy=0):
    """Convert one contour of (x, y, on_curve) points into canonical commands.

    Consecutive off-curve points produce an implied on-curve midpoint. The font
    is designed so all such midpoints are integral; floor division is used
    defensively and is documented in fixtures/README.md.
    """
    pts = [(x + dx, y + dy, bool(on)) for x, y, on in points]
    if not pts:
        return []
    on_indices = [i for i, p in enumerate(pts) if p[2]]
    if on_indices:
        k = on_indices[0]
        rotated = pts[k:] + pts[:k]
        start = (rotated[0][0], rotated[0][1])
        sequence = rotated[1:] + [rotated[0]]
    else:
        sx = (pts[-1][0] + pts[0][0]) // 2
        sy = (pts[-1][1] + pts[0][1]) // 2
        start = (sx, sy)
        sequence = list(pts) + [(sx, sy, True)]

    commands = [["move", start[0], start[1]]]
    pending = None
    for x, y, on in sequence:
        if on:
            if pending is None:
                commands.append(["line", x, y])
            else:
                commands.append(["quad", pending[0], pending[1], x, y])
                pending = None
        else:
            if pending is None:
                pending = (x, y)
            else:
                mx = (pending[0] + x) // 2
                my = (pending[1] + y) // 2
                commands.append(["quad", pending[0], pending[1], mx, my])
                pending = (x, y)
    if pending is not None:
        commands.append(["quad", pending[0], pending[1], start[0], start[1]])
    commands.append(["close"])
    return commands


def glyph_commands(parser, glyph_id, dx=0, dy=0, depth=0):
    """Commands for one glyph, decomposing composite components recursively."""
    if depth > 8:
        raise ValueError("composite nesting exceeds the reference recursion ceiling")
    glyph = parser.glyphs[glyph_id]
    commands = []
    for contour in glyph["contours"]:
        commands.extend(contour_commands(contour, dx, dy))
    for component in glyph["components"]:
        commands.extend(
            glyph_commands(
                parser,
                component["glyph_id"],
                dx + component["dx"],
                dy + component["dy"],
                depth + 1,
            )
        )
    return commands


# ---------------------------------------------------------------------------
# Independent rasteriser: 8x8 uniform-grid supersampling, non-zero winding
# ---------------------------------------------------------------------------


def flatten_commands(commands, steps=FLATTEN_STEPS):
    """Turn canonical commands into closed polygons in font-unit coordinates."""
    polygons = []
    current = None
    point = None
    for command in commands:
        op = command[0]
        if op == "move":
            if current:
                polygons.append(current)
            point = (command[1], command[2])
            current = [point]
        elif op == "line":
            point = (command[1], command[2])
            current.append(point)
        elif op == "quad":
            cx, cy, ex, ey = command[1], command[2], command[3], command[4]
            p0 = point
            for i in range(1, steps + 1):
                t = i / steps
                mt = 1.0 - t
                x = mt * mt * p0[0] + 2 * mt * t * cx + t * t * ex
                y = mt * mt * p0[1] + 2 * mt * t * cy + t * t * ey
                current.append((x, y))
            point = (ex, ey)
        elif op == "close":
            if current:
                polygons.append(current)
            current = None
    if current:
        polygons.append(current)
    return polygons


def rasterise(commands, units_per_em, grid=GRID, samples=SAMPLES_PER_AXIS):
    """Return (ink_coverage_percentage, ink_bbox) for one glyph.

    A different algorithm from the 26.6 fixed-point vertical-subsampling
    rasteriser in MoonBit: here each pixel is sampled on an NxN uniform grid of
    subpixel points, and inside/outside is decided by a non-zero winding count
    of flattened outline edges crossing the sub-scanline to the left of the
    sample. Coverage is the fraction of inside samples. Only a summary is kept
    because cross-engine anti-aliasing is not bit-identical.
    """
    polygons = flatten_commands(commands)
    if not polygons:
        return 0.0, None
    scale = grid / units_per_em
    transformed = [
        [(x * scale, y * scale) for x, y in polygon] for polygon in polygons
    ]
    edges = []
    for polygon in transformed:
        n = len(polygon)
        for i in range(n):
            x1, y1 = polygon[i]
            x2, y2 = polygon[(i + 1) % n]
            if y1 != y2:
                edges.append((x1, y1, x2, y2))

    total = 0.0
    min_x = min_y = grid + 1
    max_x = max_y = -1
    rows = grid * samples
    for row in range(rows):
        y = (row + 0.5) / samples
        crossings = []
        for x1, y1, x2, y2 in edges:
            if (y1 <= y < y2) or (y2 <= y < y1):
                x_cross = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
                direction = 1 if y1 < y2 else -1
                crossings.append((x_cross, direction))
        crossings.sort()
        xs = [c[0] for c in crossings]
        prefix = [0]
        for _, direction in crossings:
            prefix.append(prefix[-1] + direction)

        import bisect

        for pixel_x in range(grid):
            hits = 0
            for sub in range(samples):
                x = pixel_x + (sub + 0.5) / samples
                winding = prefix[bisect.bisect_left(xs, x)]
                if winding != 0:
                    hits += 1
            if hits:
                pixel_y = row // samples
                total += hits / (samples * samples)
                if pixel_x < min_x:
                    min_x = pixel_x
                if pixel_x > max_x:
                    max_x = pixel_x
                if pixel_y < min_y:
                    min_y = pixel_y
                if pixel_y > max_y:
                    max_y = pixel_y
    ink_coverage = round(total / (grid * grid) * 100.0, 6)
    ink_bbox = [min_x, min_y, max_x, max_y] if max_x >= 0 else None
    return ink_coverage, ink_bbox


# ---------------------------------------------------------------------------
# Oracle adapters
# ---------------------------------------------------------------------------


def reference_data(font_bytes):
    parser = ReferenceParser(font_bytes)
    font = {
        "file": FONT_PATH.name,
        "sha256": sha256_hex(font_bytes),
        "sfnt_version": hex32(parser.sfnt_version),
        "num_tables": parser.num_tables,
        "table_tags": parser.table_tags,
        "units_per_em": parser.units_per_em,
        "num_glyphs": parser.num_glyphs,
        "index_to_loc_format": parser.index_to_loc_format,
    }
    tables = {
        "head": parser.head,
        "hhea": parser.hhea,
        "maxp": parser.maxp,
    }
    cmap = {"{:04X}".format(code): gid for code, gid in parser.cmap.items()}
    metrics = []
    outlines = []
    coverage = []
    for gid in range(parser.num_glyphs):
        advance, lsb = parser.metrics[gid]
        bbox = list(parser.glyphs[gid]["bbox"])
        metrics.append({
            "glyph_id": gid,
            "advance": advance,
            "lsb": lsb,
            "bounds": bbox,
            "scaled_bounds": [scaled(v, parser.units_per_em) for v in bbox],
        })
        commands = glyph_commands(parser, gid)
        outlines.append({"glyph_id": gid, "commands": commands})
        ink_coverage, ink_bbox = rasterise(commands, parser.units_per_em)
        coverage.append({
            "glyph_id": gid,
            "ink_coverage": ink_coverage,
            "ink_bbox": ink_bbox,
        })
    return {
        "font": font,
        "tables": tables,
        "cmap": cmap,
        "metrics": metrics,
        "outlines": outlines,
        "coverage": coverage,
        "units_per_em": parser.units_per_em,
        "num_glyphs": parser.num_glyphs,
    }


def fonttools_data(font_bytes):
    """Use fontTools as the structural and outline oracle."""
    require_module(
        "fontTools",
        "fonttools",
        "python -m pip install fonttools=={}".format(ORACLE_PINS["fonttools"]),
    )
    import io
    from fontTools.ttLib import TTFont
    from fontTools.pens.recordingPen import DecomposingRecordingPen

    reference = reference_data(font_bytes)
    font = TTFont(io.BytesIO(font_bytes))
    head = font["head"]
    hhea = font["hhea"]
    maxp = font["maxp"]
    glyph_order = font.getGlyphOrder()
    glyph_set = font.getGlyphSet()
    units_per_em = head.unitsPerEm

    def fixed_hex(value):
        return hex32(int(round(value * 65536)))

    tables = {
        "head": {
            "version": fixed_hex(head.version),
            "font_revision": fixed_hex(head.fontRevision),
            "check_sum_adjustment": head.checkSumAdjustment,
            "magic_number": hex32(head.magicNumber),
            "flags": head.flags,
            "units_per_em": units_per_em,
            "created": head.created,
            "modified": head.modified,
            "x_min": head.xMin,
            "y_min": head.yMin,
            "x_max": head.xMax,
            "y_max": head.yMax,
            "mac_style": head.macStyle,
            "lowest_rec_ppem": head.lowestRecPPEM,
            "font_direction_hint": head.fontDirectionHint,
            "index_to_loc_format": head.indexToLocFormat,
            "glyph_data_format": head.glyphDataFormat,
        },
        "hhea": {
            "version": fixed_hex(hhea.version),
            "ascender": hhea.ascent,
            "descender": hhea.descent,
            "line_gap": hhea.lineGap,
            "advance_width_max": hhea.advanceWidthMax,
            "min_left_side_bearing": hhea.minLeftSideBearing,
            "min_right_side_bearing": hhea.minRightSideBearing,
            "x_max_extent": hhea.xMaxExtent,
            "caret_slope_rise": hhea.caretSlopeRise,
            "caret_slope_run": hhea.caretSlopeRun,
            "caret_offset": hhea.caretOffset,
            "metric_data_format": hhea.metricDataFormat,
            "number_of_h_metrics": hhea.numberOfHMetrics,
        },
        "maxp": {
            "version": fixed_hex(maxp.version),
            "num_glyphs": maxp.numGlyphs,
            "max_points": maxp.maxPoints,
            "max_contours": maxp.maxContours,
            "max_composite_points": maxp.maxCompositePoints,
            "max_composite_contours": maxp.maxCompositeContours,
            "max_zones": maxp.maxZones,
            "max_twilight_points": maxp.maxTwilightPoints,
            "max_storage": maxp.maxStorage,
            "max_function_defs": maxp.maxFunctionDefs,
            "max_instruction_defs": maxp.maxInstructionDefs,
            "max_stack_elements": maxp.maxStackElements,
            "max_size_of_instructions": maxp.maxSizeOfInstructions,
            "max_component_elements": maxp.maxComponentElements,
            "max_component_depth": maxp.maxComponentDepth,
        },
    }

    best = font.getBestCmap() or {}
    cmap = {
        "{:04X}".format(code): font.getGlyphID(name)
        for code, name in best.items()
        if code != 0xFFFF
    }

    hmtx = font["hmtx"].metrics
    glyf = font["glyf"]
    metrics = []
    outlines = []
    coverage = []
    for gid in range(maxp.numGlyphs):
        name = glyph_order[gid]
        advance, lsb = hmtx[name]
        glyph = glyf[name]
        bbox = [
            glyph.xMin or 0,
            glyph.yMin or 0,
            glyph.xMax or 0,
            glyph.yMax or 0,
        ]
        metrics.append({
            "glyph_id": gid,
            "advance": advance,
            "lsb": lsb,
            "bounds": bbox,
            "scaled_bounds": [scaled(v, units_per_em) for v in bbox],
        })
        pen = DecomposingRecordingPen(glyph_set)
        glyph_set[name].draw(pen)
        commands = recording_to_commands(pen.value)
        outlines.append({"glyph_id": gid, "commands": commands})
        ink_coverage, ink_bbox = rasterise(commands, units_per_em)
        coverage.append({
            "glyph_id": gid,
            "ink_coverage": ink_coverage,
            "ink_bbox": ink_bbox,
        })

    return {
        "font": reference["font"],
        "tables": tables,
        "cmap": cmap,
        "metrics": metrics,
        "outlines": outlines,
        "coverage": coverage,
        "units_per_em": units_per_em,
        "num_glyphs": maxp.numGlyphs,
        "library_versions": {"fonttools": _fonttools_version()},
    }


def recording_to_commands(value):
    """Convert a fontTools RecordingPen value to canonical outline commands."""
    commands = []
    for op, args in value:
        if op == "moveTo":
            x, y = args[0]
            commands.append(["move", int(x), int(y)])
        elif op == "lineTo":
            x, y = args[0]
            commands.append(["line", int(x), int(y)])
        elif op == "qCurveTo":
            points = list(args)
            all_off_curve = bool(points) and points[-1] is None
            if all_off_curve:
                points = points[:-1]
                start_x = (int(points[-1][0]) + int(points[0][0])) // 2
                start_y = (int(points[-1][1]) + int(points[0][1])) // 2
                if not commands or commands[-1][0] == "close":
                    commands.append(["move", start_x, start_y])
                controls = [(int(p[0]), int(p[1])) for p in points]
                end = (start_x, start_y)
            else:
                controls = [(int(p[0]), int(p[1])) for p in points[:-1]]
                end = (int(points[-1][0]), int(points[-1][1]))
            for i, control in enumerate(controls):
                if i + 1 < len(controls):
                    following = controls[i + 1]
                    mid_x = (control[0] + following[0]) // 2
                    mid_y = (control[1] + following[1]) // 2
                    commands.append(
                        ["quad", control[0], control[1], mid_x, mid_y]
                    )
                else:
                    commands.append(
                        ["quad", control[0], control[1], end[0], end[1]]
                    )
        elif op in ("closePath", "endPath"):
            commands.append(["close"])
        elif op == "curveTo":
            raise ValueError("cubic outlines are not part of this fixture font")
        elif op == "addComponent":
            raise ValueError("unexpected undecomposed component in fontTools pen")
        else:
            raise ValueError("unsupported fontTools pen operation: {}".format(op))
    return commands


def _fonttools_version():
    import fontTools
    return getattr(fontTools, "version", "unknown")


def pillow_data(font_bytes):
    """Use Pillow/FreeType as the coverage oracle, reference for the rest."""
    require_module(
        "PIL",
        "pillow",
        "python -m pip install Pillow=={}".format(ORACLE_PINS["pillow"]),
    )
    from PIL import ImageFont

    reference = reference_data(font_bytes)
    font = ImageFont.truetype(str(FONT_PATH), GRID)
    ascent, _ = font.getmetrics()
    by_glyph = {}
    for key, gid in reference["cmap"].items():
        by_glyph.setdefault(gid, int(key, 16))
    # Unmapped glyphs are probed through a private-use codepoint, which resolves
    # to .notdef in FreeType.
    codepoint_for = {
        gid: by_glyph.get(gid, 0xE000 + gid) for gid in range(reference["num_glyphs"])
    }

    coverage = []
    for gid in range(reference["num_glyphs"]):
        character = chr(codepoint_for[gid])
        mask, offset = font.getmask2(character, mode="L")
        width, height = mask.size
        pixels = bytes(mask)
        total = 0.0
        min_x = min_y = GRID + 1
        max_x = max_y = -1
        for row in range(height):
            for col in range(width):
                value = pixels[row * width + col]
                if value:
                    total += value / 255.0
                    px = col + offset[0]
                    py = ascent - offset[1] - row - 1
                    min_x = min(min_x, px)
                    max_x = max(max_x, px)
                    min_y = min(min_y, py)
                    max_y = max(max_y, py)
        ink_coverage = round(total / (GRID * GRID) * 100.0, 6)
        ink_bbox = [min_x, min_y, max_x, max_y] if max_x >= 0 else None
        coverage.append({
            "glyph_id": gid,
            "ink_coverage": ink_coverage,
            "ink_bbox": ink_bbox,
        })

    import PIL
    return {
        "font": reference["font"],
        "tables": reference["tables"],
        "cmap": reference["cmap"],
        "metrics": reference["metrics"],
        "outlines": reference["outlines"],
        "coverage": coverage,
        "units_per_em": reference["units_per_em"],
        "num_glyphs": reference["num_glyphs"],
        "library_versions": {"pillow": PIL.__version__},
    }


# ---------------------------------------------------------------------------
# Document assembly and emission
# ---------------------------------------------------------------------------


def oracle_metadata(oracle, data):
    providers = {category: "moonfont.stdlib.reference" for category in CATEGORIES}
    if oracle == "fonttools":
        label = "fontTools {}".format(data["library_versions"]["fonttools"])
        for category in ("tables", "cmap", "metrics", "outlines"):
            providers[category] = label
    elif oracle == "pillow":
        providers["coverage"] = "Pillow {} (FreeType)".format(
            data["library_versions"]["pillow"]
        )

    return {
        "name": oracle,
        "version": ORACLE_VERSION,
        "providers": providers,
        "raster_algorithm": (
            "8x8 uniform-grid supersampling with non-zero winding on flattened "
            "quadratic outlines"
            if oracle != "pillow"
            else "Pillow ImageFont.getmask2 (FreeType 8-bit grey rasteriser)"
        ),
        "raster_grid": GRID,
        "raster_samples_per_axis": SAMPLES_PER_AXIS,
        "raster_y_axis": "up",
        "moonbit_raster_algorithm": (
            "eight-times vertical subsampling with exact horizontal area in "
            "26.6 fixed point"
        ),
        "library_versions": data.get("library_versions", {}),
    }


def build_document(oracle="reference"):
    """Build the complete canonical fixture document for one oracle."""
    if oracle not in VALID_ORACLES:
        raise SystemExit(
            "ERROR: unknown oracle {!r}; choose from {}".format(
                oracle, ", ".join(VALID_ORACLES)
            )
        )
    if not FONT_PATH.exists():
        raise SystemExit(
            "ERROR: {} is missing; run make_font.py first.".format(FONT_PATH)
        )
    font_bytes = FONT_PATH.read_bytes()
    if oracle == "reference":
        data = reference_data(font_bytes)
    elif oracle == "fonttools":
        data = fonttools_data(font_bytes)
    else:
        data = pillow_data(font_bytes)

    return {
        "schema": SCHEMA,
        "categories": list(CATEGORIES),
        "tolerances": dict(TOLERANCES),
        "font": data["font"],
        "oracle": oracle_metadata(oracle, data),
        "tables": data["tables"],
        "cmap": data["cmap"],
        "metrics": data["metrics"],
        "outlines": data["outlines"],
        "coverage": data["coverage"],
    }


def emit_all(document):
    FIXTURES.mkdir(parents=True, exist_ok=True)
    master_bytes = canonical_bytes(document)
    write_with_sidecar(MASTER, master_bytes)
    for category in CATEGORIES:
        payload = canonical_bytes(document[category])
        write_with_sidecar(FIXTURES / CATEGORY_FILES[category], payload)
    # The font sidecar is owned by make_font.py; refresh it here too so a
    # fixtures-only regeneration stays self-consistent.
    font_bytes = FONT_PATH.read_bytes()
    FONT_SIDECAR.write_text(
        "{}  {}\n".format(sha256_hex(font_bytes), FONT_PATH.name),
        encoding="utf-8",
    )


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Generate canonical differential-test fixtures."
    )
    parser.add_argument(
        "--oracle",
        choices=VALID_ORACLES,
        default="reference",
        help="data provider (default: reference, pure standard library)",
    )
    args = parser.parse_args(argv)
    document = build_document(args.oracle)
    emit_all(document)
    digest = sha256_hex(FONT_PATH.read_bytes())
    print("{}  synthetic.ttf".format(digest))
    print("oracle={}  categories={}  glyphs={}".format(
        args.oracle, len(CATEGORIES), document["font"]["num_glyphs"]
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
