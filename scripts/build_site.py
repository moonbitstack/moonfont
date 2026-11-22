#!/usr/bin/env python3
# Copyright 2026 Leo Cheng
# SPDX-License-Identifier: Apache-2.0
"""Build what the documentation site runs.

The pages call into the library itself: the engine they load is this repository
compiled to JavaScript, and the counts they show are read from the source. Both
are produced here rather than committed, so a page cannot drift from the code it
describes.

    python3 scripts/build_site.py            # engine and numbers
    python3 scripts/build_site.py engine     # docs/engine/ only
    python3 scripts/build_site.py numbers    # docs/numbers.json only
    python3 scripts/build_site.py --check    # numbers are current, no build

`docs/engine/` is not committed: the workflow builds it before uploading the
site. `docs/numbers.json` is committed, because the pages are readable without a
build and CI can then hold the file to the source.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
ENGINE = DOCS / "engine"
ASSETS = ROOT / "scripts" / "site"
NUMBERS = DOCS / "numbers.json"


def run(command: list[str]) -> None:
    print(" ".join(command))
    result = subprocess.run(command, cwd=ROOT)
    if result.returncode != 0:
        raise SystemExit(f"{command[0]} failed with {result.returncode}")


def build_engine() -> None:
    run(["moon", "build", "--target", "js", "--release"])
    produced = ROOT / "_build" / "js" / "release" / "build" / "web" / "web.js"
    if not produced.exists():
        raise SystemExit(f"the JS backend produced no {produced.relative_to(ROOT)}")
    ENGINE.mkdir(parents=True, exist_ok=True)
    # The backend's output is one ES module; the loader beside it turns the
    # MoonBit result convention into { ok, value, error } and is the only
    # JavaScript in the repository that touches the engine.
    shutil.copy2(produced, ENGINE / "web.js")
    shutil.copy2(ASSETS / "loader.js", ENGINE / "moonfont.js")
    shutil.copy2(ASSETS / "web.d.ts", ENGINE / "web.d.ts")
    print(f"engine written to {ENGINE.relative_to(ROOT)}")


def count(pattern: str, paths: list[Path], flags: int = 0) -> int:
    expression = re.compile(pattern, flags)
    total = 0
    for path in paths:
        total += len(expression.findall(path.read_text(encoding="utf-8")))
    return total


def gather_numbers() -> dict:
    sources = sorted((ROOT / "src").rglob("*.mbt"))
    packages = sorted(p for p in (ROOT / "src").glob("*/moon.pkg"))
    return {
        "packages": len(packages),
        "tables": count(r"^pub fn tag_[a-z0-9]+\(\)", [ROOT / "src" / "sfnt" / "directory.mbt"], re.M),
        "containers": count(r"^\s+@\w+\.\w+::new\(\),", [ROOT / "src" / "font.mbt"], re.M),
        "public_functions": count(r"^pub fn ", sources, re.M),
        "tests": count(r'^test "', sources, re.M),
        "targets": 4,
    }


def write_numbers() -> None:
    payload = gather_numbers()
    text = json.dumps(payload, indent=2, sort_keys=True) + "\n"
    NUMBERS.write_text(text, encoding="utf-8", newline="\n")
    print(f"numbers written to {NUMBERS.relative_to(ROOT)}: {payload}")


def check_assets() -> int:
    """Every local file a page points at must exist.

    A page that names a script which has been deleted fails silently in a
    browser: the page still loads, the console shows one 404, and nothing a
    reader sees says so. This is the check that would have caught it.
    """
    pattern = re.compile(r'(?:src|href)="([^":]+)"')
    missing = []
    for page in sorted(DOCS.glob("*.html")):
        text = page.read_text(encoding="utf-8")
        for reference in pattern.findall(text):
            if reference.startswith(("//", "#")) or "://" in reference:
                continue
            target = (page.parent / reference).resolve()
            if not target.exists():
                missing.append(f"{page.name} points at {reference}")
    if missing:
        for line in missing:
            print(line, file=sys.stderr)
        return 1
    print("every asset a page names exists")
    return 0


def check_numbers() -> int:
    if not NUMBERS.exists():
        print("docs/numbers.json is missing; run build_site.py numbers", file=sys.stderr)
        return 1
    expected = json.dumps(gather_numbers(), indent=2, sort_keys=True) + "\n"
    if NUMBERS.read_text(encoding="utf-8") != expected:
        print("docs/numbers.json does not match the source", file=sys.stderr)
        return 1
    print("site numbers are current")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("what", nargs="?", choices=["engine", "numbers"], default=None)
    parser.add_argument("--check", action="store_true", help="compare, never write")
    args = parser.parse_args()
    if args.check:
        failure = check_numbers()
        return failure or check_assets()
    if args.what in (None, "engine"):
        build_engine()
    if args.what in (None, "numbers"):
        write_numbers()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
