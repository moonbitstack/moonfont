#!/usr/bin/env python3
# Copyright 2026 Leo Cheng
# SPDX-License-Identifier: Apache-2.0
"""Build what the documentation site runs.

The pages call into the library itself: the engine they load is this repository
compiled to JavaScript, and the counts they show are read from the source. Both
are produced here rather than committed, so a page cannot drift from the code it
describes.

    python3 scripts/build_site.py            # engine, tray, vendor, numbers
    python3 scripts/build_site.py engine     # docs/engine/ only
    python3 scripts/build_site.py tray       # docs/site/tray.js and the vendor copy
    python3 scripts/build_site.py numbers    # docs/numbers.json only
    python3 scripts/build_site.py --check    # the committed copies are current

`docs/engine/` is not committed: the workflow builds it before uploading the
site. `docs/numbers.json` and `docs/site/tray.js` are, because the pages are
readable without a build and CI can then hold them to their sources.

The tray is TypeScript (`site/src/tray.ts`) compiled by `tsc`; matter-js is
vendored under `docs/vendor/` from the version `site/package-lock.json` pins,
because the page promises to make no request it does not serve itself.
"""

from __future__ import annotations

import argparse
import filecmp
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
ENGINE = DOCS / "engine"
ASSETS = ROOT / "scripts" / "site"
NUMBERS = DOCS / "numbers.json"
SITE = ROOT / "site"
TRAY = DOCS / "site" / "tray.js"
VENDOR = DOCS / "vendor"


def run(command: list[str], cwd: Path = ROOT) -> None:
    print(" ".join(command))
    result = subprocess.run(command, cwd=cwd)
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


def npm() -> str:
    """npm on the PATH, which is `npm.cmd` on Windows."""
    found = shutil.which("npm")
    if not found:
        raise SystemExit("npm is not on the PATH; the tray needs Node")
    return found


def build_tray() -> None:
    """Compile the tray and take the vendor copy from the pinned package."""
    if not (SITE / "node_modules").exists():
        raise SystemExit("site/node_modules is missing; run `npm ci --prefix site`")
    run([npm(), "run", "build", "--silent"], cwd=SITE)
    package = SITE / "node_modules" / "matter-js"
    if not package.exists():
        raise SystemExit("matter-js is not installed; run `npm ci --prefix site`")
    VENDOR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(package / "build" / "matter.min.js", VENDOR / "matter.min.js")
    shutil.copy2(package / "LICENSE", VENDOR / "matter.LICENSE")
    print(f"tray written to {TRAY.relative_to(ROOT)}; vendor copied to {VENDOR.relative_to(ROOT)}")


def check_tray() -> int:
    """The committed scripts are what the sources and the pin produce."""
    if not TRAY.exists():
        print("docs/site is missing; run build_site.py tray", file=sys.stderr)
        return 1
    if not (SITE / "node_modules").exists():
        print("site/node_modules is missing; run `npm ci --prefix site`", file=sys.stderr)
        return 1
    with tempfile.TemporaryDirectory() as temporary:
        result = subprocess.run(
            [npm(), "run", "build", "--silent", "--", "--outDir", temporary],
            cwd=SITE,
        )
        if result.returncode != 0:
            print("the site scripts did not compile", file=sys.stderr)
            return 1
        built = sorted(p.name for p in Path(temporary).glob("*.js"))
        committed = sorted(p.name for p in TRAY.parent.glob("*.js"))
        if built != committed:
            print(f"docs/site holds {committed}, the sources compile to {built}", file=sys.stderr)
            return 1
        for name in built:
            if not filecmp.cmp(Path(temporary) / name, TRAY.parent / name, shallow=False):
                print(f"docs/site/{name} does not match its source", file=sys.stderr)
                return 1
    vendored = VENDOR / "matter.min.js"
    package = SITE / "node_modules" / "matter-js" / "build" / "matter.min.js"
    if package.exists() and not filecmp.cmp(package, vendored, shallow=False):
        print("docs/vendor/matter.min.js does not match the pinned matter-js", file=sys.stderr)
        return 1
    print("the site scripts and their vendor copy are current")
    return 0


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
    # The page carries the same counts as a fallback for the moment before the
    # JSON arrives; a stale fallback shows a wrong number to a reader whose
    # script has not run yet, so the two are held together.
    page = (DOCS / "index.html").read_text(encoding="utf-8")
    counts = gather_numbers()
    for name, value in re.findall(r'data-count="([a-z_]+)">(\d+)<', page):
        if int(value) != counts.get(name):
            print(
                f"docs/index.html shows {value} for {name}, the source says {counts.get(name)}",
                file=sys.stderr,
            )
            return 1
    print("site numbers are current")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("what", nargs="?", choices=["engine", "tray", "numbers"], default=None)
    parser.add_argument("--check", action="store_true", help="compare, never write")
    args = parser.parse_args()
    if args.check:
        failure = check_numbers()
        failure = failure or check_tray()
        return failure or check_assets()
    if args.what in (None, "engine"):
        build_engine()
    if args.what in (None, "tray"):
        build_tray()
    if args.what in (None, "numbers"):
        write_numbers()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
