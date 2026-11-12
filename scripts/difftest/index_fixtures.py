#!/usr/bin/env python3
"""Write the deterministic difftest index for the future documentation site.

The default destination is ``integration/difftest/fixtures/docs/difftest.json``,
which is the path ``docs/difftest.json`` relative to the fixtures root and is a
generated file under the allowed fixtures directory. Use --output to write the
same payload elsewhere, for example to a repository-level ``docs/`` directory.

The payload is a pure function of fixtures.json and the toolchain constants:
no timestamps, no environment probes and no filesystem-dependent ordering.
"""

import argparse
import json
import sys
from pathlib import Path

# Keep the toolchain inside its allow-list of written paths: importing the
# sibling module must not create a __pycache__ directory.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_fixtures as mf  # noqa: E402

INDEX_SCHEMA = "moonfont.difftest.index/1"
DEFAULT_OUTPUT = mf.DOC_INDEX


def build_index():
    if not mf.MASTER.exists():
        raise SystemExit(
            "ERROR: {} is missing; run make_fixtures.py first.".format(mf.MASTER)
        )
    master_bytes = mf.MASTER.read_bytes()
    document = json.loads(master_bytes.decode("utf-8"))

    categories = []
    for name in mf.CATEGORIES:
        path = mf.FIXTURES / mf.CATEGORY_FILES[name]
        categories.append({
            "name": name,
            "file": path.name,
            "sha256": mf.sha256_hex(path.read_bytes()),
            "tolerance": mf.TOLERANCES[name],
        })

    font = document["font"]
    oracle = document["oracle"]
    return {
        "schema": INDEX_SCHEMA,
        "fixtures": {
            "file": mf.MASTER.name,
            "sha256": mf.sha256_hex(master_bytes),
            "schema": document["schema"],
            "font": {
                "file": font["file"],
                "sha256": font["sha256"],
                "num_glyphs": font["num_glyphs"],
                "units_per_em": font["units_per_em"],
                "num_tables": font["num_tables"],
                "table_tags": font["table_tags"],
            },
            "oracle": {
                "name": oracle["name"],
                "version": oracle["version"],
                "providers": oracle["providers"],
                "raster_algorithm": oracle["raster_algorithm"],
                "raster_grid": oracle["raster_grid"],
                "raster_samples_per_axis": oracle["raster_samples_per_axis"],
                "raster_y_axis": oracle["raster_y_axis"],
                "moonbit_raster_algorithm": oracle["moonbit_raster_algorithm"],
            },
        },
        "categories": categories,
        "tolerances": dict(mf.TOLERANCES),
        "oracle_versions": {
            "toolchain": mf.ORACLE_VERSION,
            "pins": dict(mf.ORACLE_PINS),
            "recorded": dict(oracle.get("library_versions", {})),
        },
        "regeneration": [
            "python scripts/difftest/make_font.py",
            "python scripts/difftest/make_fixtures.py --oracle reference",
            "python scripts/difftest/verify_fixtures.py --check",
            "python scripts/difftest/index_fixtures.py",
        ],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Write the deterministic difftest documentation index."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="destination JSON path (default: {})".format(DEFAULT_OUTPUT),
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="rebuild in memory and compare with the destination; write nothing",
    )
    args = parser.parse_args(argv)
    payload = mf.canonical_bytes(build_index())
    digest = mf.sha256_hex(payload)

    if args.check:
        if not args.output.exists():
            print("FAIL: {} does not exist".format(args.output), file=sys.stderr)
            return 1
        on_disk = args.output.read_bytes()
        if mf.sha256_hex(on_disk) != digest:
            print("FAIL: {} is out of date".format(args.output), file=sys.stderr)
            return 1
        print("{}  {}".format(digest, args.output.name))
        return 0

    mf.write_with_sidecar(args.output, payload)
    print("{}  {}".format(digest, args.output.name))
    print("categories={}  oracle={}".format(
        len(mf.CATEGORIES), json.loads(payload.decode("utf-8"))["fixtures"]["oracle"]["name"]
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
