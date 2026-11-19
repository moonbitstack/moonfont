#!/usr/bin/env python3
# Copyright 2026 Leo Cheng
# SPDX-License-Identifier: Apache-2.0
"""Compile the hostile corpus and its contracted refusals into a MoonBit test.

The library performs no I/O, so a test cannot open a font at run time. These
byte literals are the bridge: make_corpus.py regenerates the corpus and its
canonical manifest, and this script rebuilds the test data from both. The
output is deterministic: sort order comes from the manifest keys, never from
the filesystem.

Usage:
    python3 scripts/difftest/embed_corpus.py            # write src/testdata_test.mbt
    python3 scripts/difftest/embed_corpus.py --check    # compare, never write
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORPUS = ROOT / "integration" / "difftest" / "corpus"
OUT = ROOT / "src" / "testdata_test.mbt"

# A short list kept as named bindings for the hand-written unit tests. The full
# corpus is emitted below as a table keyed by filename.
NAMED = [
    ("valid_minimal", "valid_minimal.ttf"),
    ("bad_signature", "bad_signature.bin"),
    ("bad_sfnt_scaler", "bad_sfnt_scaler.ttf"),
    ("zero_num_tables", "zero_num_tables.ttf"),
    ("missing_head", "missing_head.ttf"),
    ("table_offset_past_eof", "table_offset_past_eof.ttf"),
    ("truncated_file", "truncated_file.bin"),
    ("units_per_em_zero", "units_per_em_zero.ttf"),
    ("loca_offsets_going_backwards", "loca_offsets_going_backwards.ttf"),
    ("composite_self_reference", "composite_self_reference.ttf"),
    ("glyf_repeat_flag_overflow", "glyf_repeat_flag_overflow.ttf"),
    ("unsupported_maxp_version", "unsupported_maxp_version.ttf"),
    ("table_length_over_limit", "table_length_over_limit.ttf"),
]


def byte_literal(data: bytes, indent: str) -> str:
    """One literal per 512-byte chunk, joined across lines.

    A single 25 KB font as one literal produces a source line past the
    compiler's column limit and a warning; --deny-warn would then fail. Chunked
    literals keep every line short and the value byte-identical.
    """
    chunks = [
        'b"' + "".join(f"\\x{value:02X}" for value in data[start : start + 512]) + '"'
        for start in range(0, len(data), 512)
    ]
    if not chunks:
        return 'b""'
    return (" +\n" + indent).join(chunks)


def read(filename: str) -> bytes:
    path = CORPUS / filename
    if not path.is_file():
        raise SystemExit(f"missing corpus fixture: {path}")
    return path.read_bytes()


def cases() -> list[tuple[str, str, bool, str]]:
    """The semantic content of the embedded table, in stable sort order.

    Each entry is (filename, contracted refusal variant, must-be-accepted,
    hex of the font bytes). Two renders of the same corpus must agree on this
    list exactly, regardless of how the byte literals are line-wrapped.
    """
    manifest = json.loads((CORPUS / "manifest.json").read_text(encoding="utf-8"))
    out: list[tuple[str, str, bool, str]] = []
    for filename in sorted(manifest):
        info = manifest[filename]
        variant = info.get("variant") or ""
        accepted = bool(info.get("legal_but_unusual")) or filename == "valid_minimal.ttf"
        out.append((filename, variant, accepted, read(filename).hex()))
    return out


def embed_checksum() -> str:
    payload = json.dumps(cases(), separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build() -> str:
    manifest = json.loads((CORPUS / "manifest.json").read_text(encoding="utf-8"))
    lines = [
        "// Copyright 2026 Leo Cheng",
        "// SPDX-License-Identifier: Apache-2.0",
        f"// embed-checksum: {embed_checksum()}",
        "",
        "// Rebuilt from integration/difftest/corpus/ by",
        "// scripts/difftest/embed_corpus.py. Do not edit by hand. A MoonBit test",
        "// cannot open a file, so each font is compiled in as a byte literal.",
        "",
    ]
    for name, filename in NAMED:
        lines.append("///|")
        lines.append(f"/// The `{filename}` fixture.")
        lines.append(f"let {name} : Bytes = {byte_literal(read(filename), '  ')}")
        lines.append("")

    lines.append("///|")
    lines.append("/// (filename, bytes, contracted refusal variant, must be accepted).")
    lines.append("/// An empty variant means the reader must not refuse these bytes.")
    lines.append("let corpus_cases : Array[(String, Bytes, String, Bool)] = [")
    for filename in sorted(manifest):
        info = manifest[filename]
        variant = info.get("variant") or ""
        accepted = bool(info.get("legal_but_unusual")) or filename == "valid_minimal.ttf"
        if not accepted and not variant:
            raise SystemExit(f"corpus case has neither a variant nor an acceptance: {filename}")
        flag = "true" if accepted else "false"
        lines.append(
            f'  ("{filename}", {byte_literal(read(filename), "    ")}, '
            f'"{variant}", {flag}),'
        )
    lines.append("]")
    return "\n".join(lines) + "\n"


def main() -> int:
    content = build()
    if "--check" in sys.argv[1:]:
        if not OUT.exists():
            print(f"{OUT.name} is missing; run scripts/difftest/embed_corpus.py", file=sys.stderr)
            return 1
        with OUT.open(encoding="utf-8", newline="") as f:
            current = f.read()
        match = re.search(r"//\s*embed-checksum:\s*([0-9a-f]{64})", current)
        if not match or match.group(1) != embed_checksum():
            print(f"{OUT.name} is out of date; run scripts/difftest/embed_corpus.py", file=sys.stderr)
            return 1
        print(f"{OUT.name} is current")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content)
    print(f"wrote {OUT.relative_to(ROOT)} ({len(content)} bytes, {len(json.loads((CORPUS / 'manifest.json').read_text(encoding='utf-8')))} cases)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
