#!/usr/bin/env python3
# Copyright 2026 Leo Cheng
# SPDX-License-Identifier: Apache-2.0
"""The repository's own chores, one command each.

The toolchain does the building and testing; these are the steps that need a
script: regenerating the derived pages, the corpus literals and the differential
fixtures, and checking that each of them is current.

Usage:
    python3 scripts/dev.py check     # the gate: check every target
    python3 scripts/dev.py test      # run the suite on every target
    python3 scripts/dev.py fmt       # format the sources
    python3 scripts/dev.py api       # regenerate docs/api.html from the .mbti
    python3 scripts/dev.py docs      # verify docs/api.html instead of writing it
    python3 scripts/dev.py embed     # rebuild the in-source corpus literals
    python3 scripts/dev.py formats   # rebuild the format fixtures and their test
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(*command: str) -> int:
    printable = " ".join(command)
    print(f"+ {printable}")
    return subprocess.call(command, cwd=ROOT)


def check() -> int:
    return run("moon", "check", "--target", "all", "--deny-warn")


def test() -> int:
    return run("moon", "test", "--target", "all")


def fmt() -> int:
    return run("moon", "fmt")


def api() -> int:
    status = run("moon", "info", "--target", "all")
    if status != 0:
        return status
    return run(sys.executable, "scripts/docs/gen_api.py")


def docs() -> int:
    return run(sys.executable, "scripts/docs/gen_api.py", "--check")


def embed() -> int:
    return run(sys.executable, "scripts/difftest/embed_corpus.py")


def formats() -> int:
    return run(sys.executable, "scripts/difftest/make_formats.py")


TASKS = {
    "check": check,
    "test": test,
    "fmt": fmt,
    "api": api,
    "docs": docs,
    "embed": embed,
    "formats": formats,
}


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in TASKS:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    return TASKS[sys.argv[1]]()


if __name__ == "__main__":
    raise SystemExit(main())
