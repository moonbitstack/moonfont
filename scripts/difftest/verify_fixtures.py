#!/usr/bin/env python3
"""Validate the differential-test fixtures.

Checks the schema, canonical JSON form, SHA-256 sidecars, required fields,
internal consistency and the structural invariants of synthetic.ttf. Exits
non-zero on any mismatch. The --check flag additionally rebuilds the whole
fixture document in memory and compares its canonical bytes with the committed
file, and keeps output quiet for CI use.
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Keep the toolchain inside its allow-list of written paths: importing the
# sibling module must not create a __pycache__ directory.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_fixtures as mf  # noqa: E402

FIXTURES = mf.FIXTURES
FONT_PATH = mf.FONT_PATH
MASTER = mf.MASTER

REQUIRED_SECTIONS = [
    "schema", "categories", "tolerances", "font", "oracle",
    "tables", "cmap", "metrics", "outlines", "coverage",
]

FONT_FIELDS = [
    "file", "sha256", "sfnt_version", "num_tables", "table_tags",
    "units_per_em", "num_glyphs", "index_to_loc_format",
]
HEAD_FIELDS = [
    "version", "font_revision", "check_sum_adjustment", "magic_number",
    "flags", "units_per_em", "created", "modified", "x_min", "y_min",
    "x_max", "y_max", "mac_style", "lowest_rec_ppem", "font_direction_hint",
    "index_to_loc_format", "glyph_data_format",
]
HHEA_FIELDS = [
    "version", "ascender", "descender", "line_gap", "advance_width_max",
    "min_left_side_bearing", "min_right_side_bearing", "x_max_extent",
    "caret_slope_rise", "caret_slope_run", "caret_offset",
    "metric_data_format", "number_of_h_metrics",
]
MAXP_FIELDS = [
    "version", "num_glyphs", "max_points", "max_contours",
    "max_composite_points", "max_composite_contours", "max_zones",
    "max_twilight_points", "max_storage", "max_function_defs",
    "max_instruction_defs", "max_stack_elements", "max_size_of_instructions",
    "max_component_elements", "max_component_depth",
]
ORACLE_FIELDS = [
    "name", "version", "providers", "raster_algorithm", "raster_grid",
    "raster_samples_per_axis", "raster_y_axis", "moonbit_raster_algorithm",
    "library_versions",
]

CMAP_KEY = re.compile(r"^[0-9A-F]{4}$")
COMMAND_SHAPES = {"move": 3, "line": 3, "quad": 5, "close": 1}


class Report:
    def __init__(self):
        self.errors = []
        self.checks = 0

    def require(self, condition, message):
        self.checks += 1
        if not condition:
            self.errors.append(message)
        return bool(condition)

    def fail(self, message):
        self.errors.append(message)


def is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def check_sidecar(report, path):
    sidecar = path.with_name(path.name + ".sha256")
    if not report.require(sidecar.exists(), "missing sidecar for {}".format(path.name)):
        return
    lines = sidecar.read_text(encoding="utf-8").strip().splitlines()
    if not report.require(
        len(lines) == 1, "malformed sidecar for {}".format(path.name)
    ):
        return
    parts = lines[0].split()
    if not report.require(
        len(parts) == 2 and parts[1] == path.name,
        "malformed sidecar content for {}".format(path.name),
    ):
        return
    expected = parts[0]
    actual = mf.sha256_hex(path.read_bytes())
    report.require(
        expected == actual,
        "SHA-256 sidecar mismatch for {}: expected {} found {}".format(
            path.name, expected, actual
        ),
    )


def check_fields(report, obj, fields, label):
    if not report.require(isinstance(obj, dict), "{} must be an object".format(label)):
        return
    for field in fields:
        report.require(field in obj, "{} is missing field '{}'".format(label, field))


def check_int_list(report, value, length, label):
    if not report.require(
        isinstance(value, list) and len(value) == length,
        "{} must be a list of {} integers".format(label, length),
    ):
        return False
    return report.require(
        all(is_int(v) for v in value), "{} contains a non-integer".format(label)
    )


def check_font_structure(report, document):
    if not FONT_PATH.exists():
        report.fail("{} is missing".format(FONT_PATH))
        return
    data = FONT_PATH.read_bytes()
    try:
        parser = mf.ReferenceParser(data)
    except Exception as exc:  # noqa: BLE001 - a parse failure is a fixture failure
        report.fail("synthetic.ttf cannot be parsed: {}".format(exc))
        return

    report.require(
        parser.sfnt_version == 0x00010000,
        "synthetic.ttf sfnt version is not 0x00010000",
    )
    report.require(
        parser.head["magic_number"] == "0x5F0F3CF5",
        "synthetic.ttf head magicNumber is wrong",
    )
    report.require(
        parser.table_tags == sorted(parser.table_tags)
        and len(parser.table_tags) == len(set(parser.table_tags)),
        "table directory tags are not sorted and unique",
    )
    report.require(
        all(t["offset"] % 4 == 0 for t in parser.tables.values()),
        "a table offset is not four-byte aligned",
    )
    report.require(
        all(t["length"] > 0 for t in parser.tables.values()),
        "a table has zero length",
    )
    report.require(
        all(
            t["offset"] + t["length"] <= len(data)
            for t in parser.tables.values()
        ),
        "a table extends past end of file",
    )
    report.require(
        len(parser.loca) == parser.num_glyphs + 1,
        "loca length does not equal numGlyphs + 1",
    )
    report.require(
        all(parser.loca[i] <= parser.loca[i + 1] for i in range(len(parser.loca) - 1)),
        "loca offsets are not monotonic",
    )
    report.require(
        parser.loca[-1] <= parser.tables["glyf"]["length"],
        "last loca offset lies outside glyf",
    )
    report.require(
        parser.num_glyphs == document["font"]["num_glyphs"],
        "maxp numGlyphs disagrees with fixtures.json",
    )
    report.require(
        mf.sha256_hex(data) == document["font"]["sha256"],
        "font.sha256 disagrees with synthetic.ttf on disk",
    )
    check_sidecar(report, FONT_PATH)


def check_cmap(report, document):
    cmap = document["cmap"]
    if not report.require(isinstance(cmap, dict), "cmap must be an object"):
        return
    num_glyphs = document["font"]["num_glyphs"]
    for key, gid in cmap.items():
        report.require(
            isinstance(key, str) and CMAP_KEY.match(key) is not None,
            "cmap key {!r} is not four upper-case hex digits".format(key),
        )
        report.require(
            is_int(gid) and 0 <= gid < num_glyphs,
            "cmap entry {!r} has an out-of-range glyph id".format(key),
        )


def check_metrics(report, document):
    entries = document["metrics"]
    num_glyphs = document["font"]["num_glyphs"]
    upem = document["font"]["units_per_em"]
    if not report.require(
        isinstance(entries, list) and len(entries) == num_glyphs,
        "metrics must have one entry per glyph",
    ):
        return
    for index, entry in enumerate(entries):
        label = "metrics[{}]".format(index)
        check_fields(report, entry, ["glyph_id", "advance", "lsb", "bounds", "scaled_bounds"], label)
        report.require(entry.get("glyph_id") == index, "{} glyph_id is out of order".format(label))
        report.require(is_int(entry.get("advance")) and entry["advance"] >= 0, "{} advance is invalid".format(label))
        report.require(is_int(entry.get("lsb")), "{} lsb is not an integer".format(label))
        if check_int_list(report, entry.get("bounds"), 4, label + ".bounds"):
            x0, y0, x1, y1 = entry["bounds"]
            report.require(x0 <= x1 and y0 <= y1, "{} bounds are inverted".format(label))
        if check_int_list(report, entry.get("scaled_bounds"), 4, label + ".scaled_bounds"):
            expected = [mf.scaled(v, upem) for v in entry["bounds"]]
            report.require(
                entry["scaled_bounds"] == expected,
                "{} scaled_bounds do not match the canonical scaling".format(label),
            )


def check_outlines(report, document):
    entries = document["outlines"]
    num_glyphs = document["font"]["num_glyphs"]
    if not report.require(
        isinstance(entries, list) and len(entries) == num_glyphs,
        "outlines must have one entry per glyph",
    ):
        return
    for index, entry in enumerate(entries):
        label = "outlines[{}]".format(index)
        check_fields(report, entry, ["glyph_id", "commands"], label)
        report.require(entry.get("glyph_id") == index, "{} glyph_id is out of order".format(label))
        commands = entry.get("commands")
        if not report.require(isinstance(commands, list), "{} commands must be a list".format(label)):
            continue
        if not commands:
            continue
        report.require(commands[0][0] == "move", "{} does not start with move".format(label))
        report.require(commands[-1][0] == "close", "{} does not end with close".format(label))
        open_contour = False
        for position, command in enumerate(commands):
            where = "{} command {}".format(label, position)
            if not report.require(
                isinstance(command, list) and command and isinstance(command[0], str),
                where + " is not a command list",
            ):
                continue
            op = command[0]
            if not report.require(op in COMMAND_SHAPES, where + " has an unknown op"):
                continue
            if not report.require(
                len(command) == COMMAND_SHAPES[op], where + " has the wrong arity"
            ):
                continue
            report.require(
                all(is_int(v) for v in command[1:]),
                where + " has a non-integer coordinate",
            )
            if op == "move":
                report.require(not open_contour, where + " opens a nested contour")
                open_contour = True
            elif op == "close":
                report.require(open_contour, where + " closes with no open contour")
                open_contour = False
        report.require(not open_contour, "{} leaves a contour unclosed".format(label))


def check_coverage(report, document):
    entries = document["coverage"]
    num_glyphs = document["font"]["num_glyphs"]
    if not report.require(
        isinstance(entries, list) and len(entries) == num_glyphs,
        "coverage must have one entry per glyph",
    ):
        return
    for index, entry in enumerate(entries):
        label = "coverage[{}]".format(index)
        check_fields(report, entry, ["glyph_id", "ink_coverage", "ink_bbox"], label)
        report.require(entry.get("glyph_id") == index, "{} glyph_id is out of order".format(label))
        value = entry.get("ink_coverage")
        report.require(
            isinstance(value, (int, float)) and not isinstance(value, bool)
            and 0.0 <= value <= 100.0,
            "{} ink_coverage must be a number in [0, 100]".format(label),
        )
        bbox = entry.get("ink_bbox")
        if bbox is None:
            continue
        if check_int_list(report, bbox, 4, label + ".ink_bbox"):
            report.require(
                bbox[0] <= bbox[2] and bbox[1] <= bbox[3],
                "{} ink_bbox is inverted".format(label),
            )


def check_category_files(report, document):
    for category in mf.CATEGORIES:
        path = FIXTURES / mf.CATEGORY_FILES[category]
        if not report.require(path.exists(), "missing category file {}".format(path.name)):
            continue
        raw = path.read_bytes()
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError) as exc:
            report.fail("{} is not valid JSON: {}".format(path.name, exc))
            continue
        report.require(
            payload == document[category],
            "{} does not match the {} section of fixtures.json".format(
                path.name, category
            ),
        )
        report.require(
            mf.canonical_bytes(payload) == raw,
            "{} is not in canonical JSON form".format(path.name),
        )
        check_sidecar(report, path)


def verify(quiet=False, do_check=False):
    report = Report()
    if not MASTER.exists():
        report.fail("{} is missing; run make_fixtures.py first".format(MASTER))
        return report, None

    raw = MASTER.read_bytes()
    try:
        document = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        report.fail("fixtures.json is not valid JSON: {}".format(exc))
        return report, None

    report.require(
        mf.canonical_bytes(document) == raw,
        "fixtures.json is not in canonical JSON form",
    )
    check_sidecar(report, MASTER)

    check_fields(report, document, REQUIRED_SECTIONS, "fixtures.json")
    report.require(document.get("schema") == mf.SCHEMA, "schema version is wrong")
    report.require(
        document.get("categories") == mf.CATEGORIES,
        "categories list does not match the toolchain",
    )
    report.require(
        document.get("tolerances") == mf.TOLERANCES,
        "tolerances do not match the pre-registered table",
    )

    check_fields(report, document.get("font"), FONT_FIELDS, "font")
    check_fields(report, document.get("oracle"), ORACLE_FIELDS, "oracle")
    report.require(
        document.get("oracle", {}).get("name") in mf.VALID_ORACLES,
        "oracle.name is not a supported oracle",
    )

    tables = document.get("tables")
    if report.require(isinstance(tables, dict), "tables must be an object"):
        for name, fields in (("head", HEAD_FIELDS), ("hhea", HHEA_FIELDS), ("maxp", MAXP_FIELDS)):
            check_fields(report, tables.get(name), fields, "tables.{}".format(name))

    check_cmap(report, document)
    check_metrics(report, document)
    check_outlines(report, document)
    check_coverage(report, document)
    check_category_files(report, document)
    check_font_structure(report, document)

    if do_check:
        oracle = document.get("oracle", {}).get("name", "reference")
        try:
            rebuilt = mf.build_document(oracle)
            report.require(
                mf.canonical_bytes(rebuilt) == raw,
                "in-memory regeneration does not reproduce fixtures.json",
            )
        except SystemExit as exc:
            report.fail("in-memory regeneration failed: {}".format(exc))
        except Exception as exc:  # noqa: BLE001
            report.fail("in-memory regeneration failed: {}".format(exc))

    if not quiet:
        print("fixture checks run : {}".format(report.checks))
        print("schema             : {}".format(document.get("schema")))
        print("oracle             : {}".format(document.get("oracle", {}).get("name")))
        print("categories         : {}".format(len(mf.CATEGORIES)))
        print("glyphs             : {}".format(document.get("font", {}).get("num_glyphs")))
        print("font sha256        : {}".format(document.get("font", {}).get("sha256")))
    return report, document


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate the difftest fixtures.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="also rebuild fixtures in memory and compare; print a single result line",
    )
    args = parser.parse_args(argv)
    report, _ = verify(quiet=args.check, do_check=args.check)
    if report.errors:
        for error in report.errors:
            print("FAIL: " + error, file=sys.stderr)
        if args.check:
            print("FAIL ({} errors)".format(len(report.errors)))
        return 1
    if args.check:
        print("OK ({} checks)".format(report.checks))
    else:
        print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
