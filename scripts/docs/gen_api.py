#!/usr/bin/env python3
# Copyright 2026 Leo Cheng
# SPDX-License-Identifier: Apache-2.0
"""Rebuild docs/api.html from the exported interfaces and the source notes.

`moon info --target all` writes one `pkg.generated.mbti` per package. That file
is the inventory: it says which declarations exist and how the compiler sees
their types. The `///|` blocks in the `.mbt` sources carry the prose and the
parameter names the interface has dropped, so the page is built from both.

The page is deterministic. No date, clock, absolute path, version, script name
or count taken from the surrounding filesystem appears in it: running the
script twice gives byte-identical output, which is what `--check` verifies.
"""

from __future__ import annotations

import argparse
import difflib
import html
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
OUT = DOCS / "api.html"

# The five pages the shell is allowed to link to.
LOCAL_PAGES = frozenset(
    {"index.html", "guide.html", "api.html", "difftest.html", "showcase.html"}
)

# Fixed literal ordering, never derived from the file or from a kind name.
KIND_RANK = {"type": 0, "trait": 1, "impl": 2, "const": 3, "fn": 4, "method": 5}

EMPTY_TEXT = "The case is empty: no interface files were found."

# The head, top bar and footer are a literal constant. Only these two markers
# are substituted; there is no template engine and no other computed fragment.
SHELL = """<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>moonfont — Reference</title>
<meta name="description" content="Every public type, function and doc comment in moonfont, set out compartment by compartment.">
<script>
  (() => {
    let chosen = null;
    try { chosen = localStorage.getItem("moonfont-theme"); } catch (e) {}
    const theme = chosen === "light" || chosen === "dark"
      ? chosen
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  })();
</script>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="style.css">
</head>
<body>
<a class="skip" href="#case">Skip to the case</a>
<header class="top">
  <nav aria-label="Sections">
    <a class="brand" href="index.html"><b>moonfont</b><span>font reading for MoonBit</span></a>
    <a class="link" href="index.html">Specimen</a>
    <a class="link" href="guide.html">Guide</a>
    <a class="link" href="api.html" aria-current="page">Reference</a>
    <a class="link" href="difftest.html">Comparison</a>
    <a class="link" href="showcase.html">Measure</a>
    <button class="theme-toggle" type="button" aria-label="Use the dark case" aria-pressed="false">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <g class="face"><rect x="4" y="3" width="16" height="18" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.4"/></g>
        <g class="foot"><rect x="4" y="3" width="16" height="18" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 3v18M4 12h16" stroke="currentColor" stroke-width="1.4"/></g>
      </svg>
    </button>
  </nav>
</header>
<main id="main">
  <div class="wrap">
    <div class="case">
      <nav class="case-index" aria-label="Packages">
        <ol class="case-index-list">{{CASE_INDEX}}</ol>
      </nav>
      <div class="case-body" id="case">
        <h1 class="case-title">The case</h1>
        <p class="case-intro">Every package is a drawer and every declaration a compartment. The cast line comes from the interface; the note beside it comes from the source.</p>
        {{CASE_BODY}}
        <p class="api-note">This page is rebuilt from the interface files and the notes in the source. It carries no dates and no ordering of its own.</p>
      </div>
    </div>
  </div>
</main>
<footer>
  <div class="wrap row">
    <span class="mark">moonfont</span>
    <a href="index.html">Specimen</a>
    <a href="guide.html">Guide</a>
    <a href="api.html">Reference</a>
    <a href="difftest.html">Comparison</a>
    <a href="showcase.html">Measure</a>
    <span>Apache-2.0 licence</span>
  </div>
</footer>
<script src="theme.js" defer></script>
<script src="site.js" defer></script>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Anchors
# ---------------------------------------------------------------------------


def slug(s: str) -> str:
    out = []
    for b in s.lower().encode("utf-8"):
        c = chr(b)
        if ("a" <= c <= "z") or ("0" <= c <= "9"):
            out.append(c)
        else:
            out.append("-{:02x}".format(b))
    return "".join(out)


def anchor_pkg(path: str) -> str:
    return "p--" + slug(path)


def anchor_decl(path: str, qualified_name: str, kind: str) -> str:
    return "d--" + slug(path) + "--" + slug(qualified_name) + "--" + kind


# ---------------------------------------------------------------------------
# Reading and errors
# ---------------------------------------------------------------------------


def read_text(path: Path) -> str:
    # Universal newlines: a CRLF source never changes the LF output.
    return path.read_text(encoding="utf-8")


class Malformed(Exception):
    """A .mbti file that cannot be trusted."""

    def __init__(self, path: Path, line_no: int, detail: str):
        super().__init__(detail)
        self.path = path
        self.line_no = line_no
        self.detail = detail

    def __str__(self) -> str:
        try:
            shown = self.path.relative_to(ROOT).as_posix()
        except ValueError:
            shown = self.path.as_posix()
        return "%s:%d: %s" % (shown, self.line_no, self.detail)


def module_info():
    """The module name and its declared source root, from moon.mod."""
    name = None
    source = None
    for raw in read_text(ROOT / "moon.mod").split("\n"):
        line = raw.strip()
        m = re.match(r'name\s*=\s*"([^"]+)"', line)
        if m:
            name = m.group(1)
            continue
        m = re.match(r'source\s*=\s*"([^"]+)"', line)
        if m:
            source = m.group(1)
    if not name or not source:
        raise RuntimeError("moon.mod does not declare both name and source")
    return name, source


def package_path(mbti: Path, module: str, source_root: Path) -> str:
    parts = [p for p in mbti.parent.relative_to(source_root).parts if p != "."]
    return "/".join([module] + parts)


# ---------------------------------------------------------------------------
# The interface: what exists
# ---------------------------------------------------------------------------


class Decl:
    def __init__(self, kind, name, sig_lines, shape=None):
        self.kind = kind
        self.name = name
        self.sig_lines = sig_lines
        self.shape = shape
        self.fields = []       # (name, type)
        self.variants = []     # (name, payload)
        self.docs = []
        self.field_docs = {}
        self.sig_override = None

    def interface_signature(self) -> str:
        return "\n".join(self.sig_lines)


BODY_RE = re.compile(
    r"pub(?:\(all\))? (struct|enum|suberror|trait) ([A-Za-z_][A-Za-z0-9_]*) \{"
)
FN_RE = re.compile(r"pub fn ([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)\(")
CONST_RE = re.compile(r"pub (?:let|const) ([A-Za-z_][A-Za-z0-9_]*)")
IMPL_RE = re.compile(r"pub impl (.+)")
USING_RE = re.compile(r"pub using (.+) \{type ([A-Za-z_][A-Za-z0-9_]*)\}")
TYPE_RE = re.compile(r"pub(?:\(all\))? type ([A-Za-z_][A-Za-z0-9_]*)")
IMPORT_ITEM_RE = re.compile(r'"[^"]+",?')
IMPORT_END_RE = re.compile(r'\}\s+for\s+"[^"]+"')
FIELD_RE = re.compile(r"(?:mut )?([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)")
VARIANT_RE = re.compile(r"([A-Za-z_][A-Za-z0-9_]*)(?:\((.*)\))?")


def balanced(text: str) -> bool:
    depth = 0
    for ch in text:
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
    return depth == 0


def parse_members(decl: Decl, body_lines, path: Path, line_no: int) -> None:
    for raw in body_lines:
        stripped = raw.strip()
        if not stripped or stripped.startswith("//"):
            continue
        if decl.shape == "struct":
            m = FIELD_RE.fullmatch(stripped)
            if not m:
                raise Malformed(path, line_no, "unreadable struct field %r" % stripped)
            decl.fields.append((m.group(1), m.group(2).strip()))
        elif decl.shape in ("enum", "suberror"):
            m = VARIANT_RE.fullmatch(stripped)
            if not m:
                raise Malformed(path, line_no, "unreadable variant %r" % stripped)
            decl.variants.append((m.group(1), (m.group(2) or "").strip()))
        # A trait body keeps its lines in the signature but has no fields.


def parse_mbti(path: Path, expected_path: str):
    """Return the declarations of one interface file.

    Anything that is not part of the observed grammar is a malformed file: a
    partial page is never produced from a doubtful inventory.
    """
    lines = read_text(path).split("\n")
    package = None
    decls = []
    state = "top"
    body_decl = None
    body_lines = []

    i = 0
    while i < len(lines):
        raw = lines[i]
        stripped = raw.strip()
        line_no = i + 1

        if state == "import":
            if stripped == "" or stripped.startswith("//"):
                i += 1
                continue
            if stripped == "}" or IMPORT_END_RE.fullmatch(stripped):
                state = "top"
                i += 1
                continue
            if IMPORT_ITEM_RE.fullmatch(stripped):
                i += 1
                continue
            raise Malformed(path, line_no, "unreadable line inside import block")

        if state == "body":
            if stripped == "}":
                body_decl.sig_lines = (
                    [body_decl.sig_lines[0]] + body_lines + ["}"]
                )
                parse_members(body_decl, body_lines, path, line_no)
                decls.append(body_decl)
                body_decl = None
                body_lines = []
                state = "top"
                i += 1
                continue
            body_lines.append(raw.rstrip())
            i += 1
            continue

        if stripped == "" or stripped.startswith("//") or stripped.startswith("#"):
            i += 1
            continue

        if package is None:
            m = re.fullmatch(r'package "([^"]+)"', stripped)
            if not m:
                raise Malformed(path, line_no, "expected a package declaration")
            package = m.group(1)
            if package != expected_path:
                raise Malformed(
                    path,
                    line_no,
                    "package %r does not match its location %r"
                    % (package, expected_path),
                )
            i += 1
            continue

        if stripped == "import {":
            state = "import"
            i += 1
            continue

        m = BODY_RE.fullmatch(stripped)
        if m:
            shape, name = m.group(1), m.group(2)
            kind = "trait" if shape == "trait" else "type"
            body_decl = Decl(kind, name, [raw.rstrip()], shape)
            body_lines = []
            state = "body"
            i += 1
            continue

        # A declaration may run over several lines. Keep the newlines so the
        # signature reads exactly as the interface wrote it.
        collected = [raw.rstrip()]
        while not balanced("\n".join(collected)) and i + 1 < len(lines):
            i += 1
            collected.append(lines[i].rstrip())
        if not balanced("\n".join(collected)):
            raise Malformed(path, line_no, "unfinished declaration")
        whole = "\n".join(collected)
        first = collected[0].strip()

        m = FN_RE.match(first)
        if m:
            name = m.group(1)
            kind = "method" if "::" in name else "fn"
            decls.append(Decl(kind, name, collected))
            i += 1
            continue

        m = CONST_RE.match(first)
        if m:
            decls.append(Decl("const", m.group(1), collected))
            i += 1
            continue

        m = IMPL_RE.fullmatch(first)
        if m:
            decls.append(Decl("impl", m.group(1).strip(), collected))
            i += 1
            continue

        m = USING_RE.fullmatch(first)
        if m:
            decls.append(Decl("type", m.group(2), collected))
            i += 1
            continue

        m = TYPE_RE.match(first)
        if m:
            decls.append(Decl("type", m.group(1), collected))
            i += 1
            continue

        raise Malformed(path, line_no, "unrecognised declaration %r" % whole[:120])

    if package is None:
        raise Malformed(path, 1, "no package declaration")
    if state == "import":
        raise Malformed(path, len(lines), "import block is not closed")
    if state == "body":
        raise Malformed(path, len(lines), "declaration body is not closed")
    return decls


# ---------------------------------------------------------------------------
# The source: notes and signatures that keep their parameter names
# ---------------------------------------------------------------------------


def clean_doc_line(line: str, marker: str) -> str:
    stripped = line.strip()
    body = stripped[len(marker):]
    if body.startswith(" "):
        body = body[1:]
    return body.rstrip()


def doc_paragraphs(lines) -> list:
    bodies = []
    for line in lines:
        if line.strip().startswith("///"):
            bodies.append(clean_doc_line(line, "///"))
    paragraphs = []
    current = []
    for body in bodies:
        if not body.strip():
            if current:
                paragraphs.append(" ".join(current))
                current = []
        else:
            current.append(body.strip())
    if current:
        paragraphs.append(" ".join(current))
    return paragraphs


def normalise_signature(text: str) -> str:
    text = " ".join(text.split())
    for old, new in (
        ("( ", "("),
        (" )", ")"),
        (" ,", ","),
        (",)", ")"),
    ):
        text = text.replace(old, new)
    return text


def read_signature(lines, start: int) -> str:
    collected = []
    for line in lines[start:]:
        if "{" in line:
            collected.append(line.split("{", 1)[0].strip())
            break
        collected.append(line.strip())
    return normalise_signature(" ".join(collected))


def collect_members(lines, start: int, type_name: str, field_docs: dict) -> int:
    """Read the body of a struct, enum or error for per-member notes."""
    i = start
    while i < len(lines) and "{" not in lines[i]:
        i += 1
    if i >= len(lines):
        return start
    depth = 0
    body = []
    while i < len(lines):
        depth += lines[i].count("{") - lines[i].count("}")
        body.append(lines[i])
        if depth == 0:
            break
        i += 1

    pending = []
    for line in body[1:-1] if len(body) > 2 else []:
        stripped = line.strip()
        if stripped.startswith("///"):
            pending.append(stripped)
            continue
        if not stripped or stripped.startswith("//"):
            continue
        m = re.match(r"(?:mut )?([A-Za-z_][A-Za-z0-9_]*)", stripped)
        if m and pending:
            paragraphs = doc_paragraphs(pending)
            if paragraphs:
                field_docs[(type_name, m.group(1))] = paragraphs
        pending = []
    return i


STRUCT_DECL_RE = re.compile(
    r"pub(?:\(all\))? (?:struct|enum|suberror|trait) ([A-Za-z_][A-Za-z0-9_]*)"
)
FN_DECL_RE = re.compile(
    r"pub fn ([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)"
)
CONST_DECL_RE = re.compile(r"pub (?:let|const) ([A-Za-z_][A-Za-z0-9_]*)")


def scan_source(package_dir: Path):
    """Return (docs, field_docs, signatures) for one package directory."""
    docs = {}
    field_docs = {}
    signatures = {}
    files = sorted(
        (
            p
            for p in package_dir.iterdir()
            if p.is_file() and p.suffix == ".mbt" and "test" not in p.name.lower()
        ),
        key=lambda p: p.name,
    )
    for path in files:
        lines = read_text(path).split("\n")
        i = 0
        while i < len(lines):
            if lines[i].strip() != "///|":
                i += 1
                continue
            block = []
            i += 1
            while (
                i < len(lines)
                and lines[i].strip().startswith("///")
                and lines[i].strip() != "///|"
            ):
                block.append(lines[i].strip())
                i += 1
            while i < len(lines) and (
                not lines[i].strip() or lines[i].strip().startswith("#")
            ):
                i += 1
            if i >= len(lines):
                break
            declaration = lines[i].strip()
            paragraphs = doc_paragraphs(block)

            m = STRUCT_DECL_RE.match(declaration)
            if m:
                name = m.group(1)
                docs[name] = paragraphs
                i = collect_members(lines, i, name, field_docs)
                continue
            m = FN_DECL_RE.match(declaration)
            if m:
                name = m.group(1)
                docs[name] = paragraphs
                signatures[name] = read_signature(lines, i)
                i += 1
                continue
            m = CONST_DECL_RE.match(declaration)
            if m:
                name = m.group(1)
                docs[name] = paragraphs
                signatures[name] = read_signature(lines, i)
                i += 1
                continue
            i += 1
    return docs, field_docs, signatures


def read_pkg_doc(package_dir: Path):
    """The leading `//` note on moon.pkg, as paragraphs."""
    path = package_dir / "moon.pkg"
    if not path.exists():
        return []
    paragraphs = []
    current = []
    for raw in read_text(path).split("\n"):
        stripped = raw.strip()
        if not stripped.startswith("//"):
            break
        body = clean_doc_line(stripped, "//")
        if not body.strip():
            if current:
                paragraphs.append(" ".join(current))
                current = []
        else:
            current.append(body.strip())
    if current:
        paragraphs.append(" ".join(current))
    return paragraphs


# ---------------------------------------------------------------------------
# Inline notes and cross-links
# ---------------------------------------------------------------------------

INLINE_RE = re.compile(
    r"`(?P<code>[^`]+)`"
    r"|\[pkg:(?P<pkg>[^\]]+)\]"
    r"|\[(?P<label>[^\]]+)\]\((?P<page>[^)]+)\)"
    r"|\[(?P<name>[A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)\]"
)


def resolve_package(label: str, packages: dict):
    if label in packages:
        return packages[label]
    candidates = sorted(p for p in packages if p.endswith("/" + label))
    if candidates:
        return packages[candidates[0]]
    return None


def render_inline(raw: str, symbols: dict, packages: dict) -> str:
    out = []
    pos = 0
    for m in INLINE_RE.finditer(raw):
        out.append(html.escape(raw[pos:m.start()], quote=False))
        code = m.group("code")
        pkg = m.group("pkg")
        label = m.group("label")
        name = m.group("name")
        if code is not None:
            out.append("<code>%s</code>" % html.escape(code, quote=False))
        elif pkg is not None:
            href = resolve_package(pkg, packages)
            if href is None:
                out.append("<code>%s</code>" % html.escape(pkg, quote=False))
            else:
                out.append(
                    '<a class="xref-pkg" href="%s">%s</a>'
                    % (
                        html.escape("#" + href, quote=True),
                        html.escape(pkg, quote=False),
                    )
                )
        elif label is not None:
            page = m.group("page")
            if page in LOCAL_PAGES:
                out.append(
                    '<a href="%s">%s</a>'
                    % (
                        html.escape(page, quote=True),
                        html.escape(label, quote=False),
                    )
                )
            else:
                out.append(html.escape(m.group(0), quote=False))
        elif name is not None:
            href = symbols.get(name)
            if href is None:
                out.append("<code>%s</code>" % html.escape(name, quote=False))
            else:
                out.append(
                    '<a class="xref" href="%s">%s</a>'
                    % (
                        html.escape("#" + href, quote=True),
                        html.escape(name, quote=False),
                    )
                )
        pos = m.end()
    out.append(html.escape(raw[pos:], quote=False))
    return "".join(out)


# ---------------------------------------------------------------------------
# Signature lexer: the closed token vocabulary inside .sig
# ---------------------------------------------------------------------------

KEYWORDS = frozenset(
    {
        "pub",
        "fn",
        "struct",
        "enum",
        "trait",
        "suberror",
        "impl",
        "let",
        "raise",
        "async",
        "extend",
        "with",
    }
)
PLAIN_WORDS = frozenset({"for", "mut", "using", "type", "as", "derive"})

TOKEN_RE = re.compile(
    r"(?P<comment>//[^\n]*)"
    r'|(?P<string>"(?:[^"\\]|\\.)*")'
    r"|(?P<puball>pub\(all\))"
    r"|(?P<word>@?[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*|::[A-Za-z_][A-Za-z0-9_]*)*)"
    r"|(?P<number>[0-9]+)"
    r"|(?P<op>::|->|:|\||~)"
    r"|(?P<space>\s+)"
    r"|(?P<other>[^\s])"
)


def span(cls: str, text: str) -> str:
    return '<span class="%s">%s</span>' % (cls, html.escape(text, quote=False))


def classify_word(word: str, previous_keyword, inside_body: bool, first_word: bool):
    if word in KEYWORDS:
        return "tok-kw"
    if word in PLAIN_WORDS:
        return None
    if previous_keyword in ("fn", "let"):
        return "tok-fn"
    if previous_keyword in (
        "struct",
        "enum",
        "suberror",
        "trait",
        "impl",
        "raise",
        "extend",
        "with",
    ):
        return "tok-ty"
    if word.startswith("@"):
        return "tok-ty"
    if inside_body and first_word:
        return "tok-fn"
    if word[0].isupper():
        return "tok-ty"
    return "tok-fn"


def tokenise_signature(signature: str) -> str:
    out_lines = []
    depth = 0
    for line in signature.split("\n"):
        inside_body = depth > 0
        first_word = True
        previous_keyword = None
        parts = []
        for m in TOKEN_RE.finditer(line):
            kind = m.lastgroup
            text = m.group(0)
            if kind in ("space", "other"):
                parts.append(html.escape(text, quote=False))
                continue
            if kind == "op":
                parts.append(span("tok-op", text))
                continue
            if kind == "number":
                parts.append(span("tok-num", text))
                continue
            if kind == "string":
                parts.append(span("tok-str", text))
                continue
            if kind == "comment":
                parts.append(span("tok-com", text))
                continue
            if kind == "puball":
                parts.append(span("tok-kw", text))
                previous_keyword = "pub"
                continue
            # word
            cls = classify_word(text, previous_keyword, inside_body, first_word)
            first_word = False
            previous_keyword = text if text in KEYWORDS else None
            if cls is None:
                parts.append(html.escape(text, quote=False))
            else:
                parts.append(span(cls, text))
        for ch in line:
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
        out_lines.append("".join(parts))
    return "\n".join(out_lines)


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------


class Package:
    def __init__(self, path, doc, decls):
        self.path = path
        self.doc = doc
        self.decls = decls


def render_decl_lines(pkg: Package, decl: Decl, symbols, packages):
    lines = []
    lines.append(
        '<article class="entry" id="%s">'
        % html.escape(anchor_decl(pkg.path, decl.name, decl.kind), quote=True)
    )
    lines.append('  <div class="entry-head">')
    lines.append('    <span class="entry-kind">%s</span>' % decl.kind)
    lines.append(
        '    <h3 class="entry-name">%s</h3>'
        % html.escape(decl.name, quote=False)
    )
    lines.append("  </div>")

    signature = decl.sig_override or decl.interface_signature()
    lines.append(
        '  <code class="sig">%s</code>' % tokenise_signature(signature)
    )

    members = []
    if decl.fields:
        members = [(name, type_text) for name, type_text in decl.fields]
    elif decl.variants:
        members = [
            (name, "(" + payload + ")" if payload else "")
            for name, payload in decl.variants
        ]
    if members:
        lines.append('  <ul class="entry-fields">')
        for name, type_text in sorted(members, key=lambda item: item[0]):
            note = decl.field_docs.get(name, [])
            note_text = " ".join(note)
            field = (
                '    <li class="entry-field"><b class="field-name">%s</b>'
                '<span class="field-type">%s</span>'
                % (
                    html.escape(name, quote=False),
                    html.escape(type_text, quote=False),
                )
            )
            if note_text:
                field += '<span class="field-doc">%s</span>' % render_inline(
                    note_text, symbols, packages
                )
            field += "</li>"
            lines.append(field)
        lines.append("  </ul>")

    if decl.docs:
        lines.append('  <div class="entry-doc">')
        for paragraph in decl.docs:
            lines.append(
                "    <p>%s</p>" % render_inline(paragraph, symbols, packages)
            )
        lines.append("  </div>")
    lines.append("</article>")
    return lines


def render_pkg_lines(pkg: Package, symbols, packages):
    lines = []
    lines.append(
        '<section class="pkg" id="%s">'
        % html.escape(anchor_pkg(pkg.path), quote=True)
    )
    lines.append('  <div class="pkg-head">')
    lines.append(
        '    <h2 class="pkg-name">%s</h2>' % html.escape(pkg.path, quote=False)
    )
    lines.append('    <span class="pkg-kind">package</span>')
    lines.append("  </div>")
    if pkg.doc:
        lines.append(
            '  <div class="pkg-doc">%s</div>'
            % "".join(
                "<p>%s</p>" % render_inline(p, symbols, packages) for p in pkg.doc
            )
        )
    lines.append('  <div class="pkg-list">')
    if pkg.decls:
        for decl in pkg.decls:
            for line in render_decl_lines(pkg, decl, symbols, packages):
                lines.append("    " + line)
    else:
        lines.append('    <p class="empty">%s</p>' % EMPTY_TEXT)
    lines.append("  </div>")
    lines.append("</section>")
    return lines


def build():
    module, source = module_info()
    source_root = ROOT / source
    mbti_files = sorted(
        (p for p in source_root.rglob("pkg.generated.mbti") if p.is_file()),
        key=lambda p: p.relative_to(ROOT).as_posix(),
    )

    packages = []
    for mbti in mbti_files:
        path = package_path(mbti, module, source_root)
        decls = parse_mbti(mbti, path)
        docs, field_docs, signatures = scan_source(mbti.parent)
        for decl in decls:
            decl.docs = docs.get(decl.name, [])
            decl.sig_override = signatures.get(decl.name)
            if decl.fields:
                decl.field_docs = {
                    name: field_docs[(decl.name, name)]
                    for name, _ in decl.fields
                    if (decl.name, name) in field_docs
                }
            if decl.variants:
                decl.field_docs = {
                    name: field_docs[(decl.name, name)]
                    for name, _ in decl.variants
                    if (decl.name, name) in field_docs
                }
        decls.sort(key=lambda d: (KIND_RANK[d.kind], d.name))
        packages.append(Package(path, read_pkg_doc(mbti.parent), decls))
    packages.sort(key=lambda p: p.path)

    # Exact case-sensitive lookup, built after sorting. The first path wins
    # when a name is exported by more than one package.
    symbols = {}
    package_anchors = {}
    for pkg in packages:
        package_anchors.setdefault(pkg.path, anchor_pkg(pkg.path))
        for decl in pkg.decls:
            symbols.setdefault(
                decl.name, anchor_decl(pkg.path, decl.name, decl.kind)
            )

    if not packages:
        case_index = ""
        case_body = '<p class="empty">%s</p>' % EMPTY_TEXT
    else:
        items = []
        body_lines = []
        for pkg in packages:
            items.append(
                '<li class="case-index-item"><a class="case-index-link" href="%s">'
                '<span class="case-index-name">%s</span>'
                '<span class="case-index-count">%d</span></a></li>'
                % (
                    html.escape("#" + anchor_pkg(pkg.path), quote=True),
                    html.escape(pkg.path, quote=False).replace("/", "/<wbr>"),
                    len(pkg.decls),
                )
            )
            for line in render_pkg_lines(pkg, symbols, package_anchors):
                if not body_lines:
                    body_lines.append(line)  # the shell supplies the base indent
                else:
                    body_lines.append("        " + line)
        case_index = (
            "\n" + "\n".join("          " + item for item in items) + "\n        "
        )
        case_body = "\n".join(body_lines)

    page = SHELL.replace("{{CASE_INDEX}}", case_index).replace(
        "{{CASE_BODY}}", case_body
    )
    if not page.endswith("\n"):
        page += "\n"
    stats = (len(packages), sum(len(p.decls) for p in packages))
    return page, stats


# ---------------------------------------------------------------------------
# Check and write
# ---------------------------------------------------------------------------


def check_page(page: str) -> int:
    expected = page.encode("utf-8")
    relative = OUT.relative_to(ROOT).as_posix()
    if not OUT.exists():
        print("%s is missing; expected %d bytes" % (relative, len(expected)))
        print("run the generator once to create it")
        return 1
    current = OUT.read_bytes()
    if current == expected:
        print("%s is current: %d bytes, no differences" % (relative, len(expected)))
        return 0

    print("%s is out of date" % relative)
    print("  on disk  : %d bytes" % len(current))
    print("  expected : %d bytes" % len(expected))
    old = current.decode("utf-8", errors="replace").split("\n")
    new = expected.decode("utf-8").split("\n")
    diff = list(
        difflib.unified_diff(
            old,
            new,
            fromfile="%s (on disk)" % relative,
            tofile="%s (expected)" % relative,
            lineterm="",
            n=2,
        )
    )
    for line in diff[:60]:
        print(line)
    if len(diff) > 60:
        print("  ... %d more diff lines" % (len(diff) - 60))
    print("run the generator once to bring the page up to date")
    return 1


def write_page(page: str) -> None:
    DOCS.mkdir(parents=True, exist_ok=True)
    temporary = OUT.with_name(".api.html.tmp")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(page)
    os.replace(temporary, OUT)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Rebuild the static API reference from the MoonBit interfaces."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="compare against the existing page without writing anything",
    )
    args = parser.parse_args()

    try:
        page, stats = build()
    except Malformed as error:
        print("malformed interface: %s" % error, file=sys.stderr)
        return 1

    if args.check:
        return check_page(page)

    write_page(page)
    print(
        "wrote %s (%d bytes, %d packages, %d declarations)"
        % (
            OUT.relative_to(ROOT).as_posix(),
            len(page.encode("utf-8")),
            stats[0],
            stats[1],
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
