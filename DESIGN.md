# moonfont — design contract

This document is the single source for the visual and structural contract of the local documentation site in `docs/`. It is a contract, not a mood board: every value below is a value, not an adjective. The site is five plain HTML pages (`index.html`, `guide.html`, `api.html`, `difftest.html`, `showcase.html`) with `style.css`, `site.js`, `theme.js` and `favicon.svg`. It works when `docs/index.html` is opened from a local directory: no network, no build step, no framework, no external resource. `api.html` is written by `scripts/docs/gen_api.py` from `moon info` `.mbti` output and `///` source comments; section 6 specifies its markup so the script and the stylesheet can be written against one another.

Prose and all user-visible copy use British English. CSS property names, HTML attributes and MoonBit identifiers keep the spelling their language requires.

---

## 1. Design thesis

**This site is a typefounder's specimen sheet — the one printed sheet that proves a face by setting its display line, its alphabet of sorts, a passage of continuous text and a ruled statement of its measurements — and every decision below follows from the fact that a font library can only be described honestly with letterforms it has itself read, measured and set on a line.** The sheet fixes the container width (the compositor's measure), the four-pixel unit (a quarter of the em), the rules (strips of steel set between settings, never borders), the two colour designs (the inked proof and the case in raking light), and the refusal to put anything on the page that a compositor would not put on a sheet. Nothing here is atmospheric: there is no grain, no vignette, no glow, no gradient, no decorative divider, and no illustration standing in for a letterform.

---

## 2. Semantic mapping

Every page and region is one physical artefact from the composing room. Where an artefact has no job, the region is cut.

| Page / region | Physical artefact | Why this and nothing else |
|---|---|---|
| `index.html` | **The specimen sheet** | A foundry summarises a face on one sheet: a display line, the alphabet and figures, a setting of continuous text, and the face's measurements. It is the only honest summary of a font library. |
| The opening display line | **The display line of the sheet** | One line at the largest size of the face, drawn from bytes the library parsed. It is the single focus of the first screen. |
| The alphabet and figures row | **Sorts laid out in case order** | Upper- and lower-case drawers hold one sort per compartment, cast to a fixed set width. An equal-width row is correct here because the objects really are equal, so this is a ruled `<ul>`, never a card grid. |
| The continuous-text setting | **The specimen paragraph** | Running text at body size proves spacing and rasterisation; a slogan proves nothing. |
| The measurement figure | **The em square with its five lines** | Baseline, x-height, cap-height, ascender, descender. These are the five readings the library must get right, and the figure is the instrument that shows them. |
| `guide.html` | **The composing stick and its instructions** | A stick holds one line at a fixed measure and is set step by step. The guide is a measured sequence, each step ending with the line it actually produced. |
| Guide side rail | **The stick's adjustable knee** | It sets the measure for the current line; in the page it sets which step you are on. It is a real `<nav>` with real links, not a decorative sidebar. |
| `api.html` | **The type case, laid out compartment by compartment** | A case is a physical inventory: one drawer per package, one compartment per declaration, each with a label, a cast line and the founder's note. An inventory is enumerated, not narrated, which is why this page is written by a script. |
| `api.html` package index | **The labels on the drawer fronts** | You read the labels before you pull a drawer. Counts are counts of compartments, set in mono. |
| An API entry | **One compartment with its sort** | `.entry-kind` is the compartment label, `.sig` is the cast line, `.entry-doc` is the note beside it, `.entry-fields` is the sorts inside a composite. |
| `difftest.html` | **A kerning pair: two impressions set together** | Two readers of the same bytes set on one baseline, so the disagreement shows at the edges. A comparison matrix is a table of readings, not a wall of cards. |
| `difftest.html` result cells | **The proofreader's correction marks** | "Match", "disagrees", "refused" are words first and colours second; the numeric delta is a measurement. |
| `showcase.html` | **The point-size ruler and the em square, live** | A compositor's gauge: choose a size and a character, see the sort and its metrics change. This is the one place the reader operates the sheet. |
| Full-bleed band | **A solid pull of ink** | A real reversed line is printed from an inked forme. One per page at most; never a gradient or a glow. |
| Horizontal rules | **Steel rule set between settings** | A rule is a strip of metal locked into the forme. It appears only where two settings are actually separated; it is never a card border. |
| Top bar | **The label strip on the case** | The labels stay on the drawer when it is pulled out, which is why the bar is sticky. Five entries, no more. |
| Theme control | **A sort seen from the face and from the foot** | The two states are the two sides of one object; the foundry's nick on the foot is the difference. Its `aria-label` names the material, not a setting. |
| Footer | **The colophon** | Foundry name, the licence, and the pages. No decorative marks. |
| `favicon.svg` | **One sort, seen from the face** | A square of metal with a letter on it; no logotype flourish. |

**Cut list — anything here is rejected on sight.** Eyebrow or kicker labels above headings; pill badges; icon-plus-heading-plus-paragraph feature cards; three-card heroes; bento grids; numbered section markers such as `01 / 02 / 03`; decorative gradients, glows, glass blur, grain or vignettes; static shadows on flat elements; italic serif headlines; a wall of equal cards; stock illustrations; a three-tier pricing layout; any web font, CDN link or `preconnect`. Small-caps labels are permitted only as identifying furniture (compartment labels, table heads, figure captions, the colophon), never above a heading.

**Uniqueness check.** Cover the wordmark: the drawn specimen line, the em square with its five rules and the ruled case index still say "a font library". They do not describe an image codec, a dashboard or a marketing site.

---

## 3. Colour token contract

### Mechanism

All colour tokens are declared once on `:root` as `light-dark()` pairs. `light-dark()` needs a `color-scheme` on the element or an ancestor, so:

```css
:root { color-scheme: light dark; }
:root[data-theme="light"] { color-scheme: only light; }
:root[data-theme="dark"]  { color-scheme: only dark; }
```

Decisions that are not colours cannot live in the pair and go in `:root[data-theme="dark"]`: the display weight, the impression shadow, the metal highlight and the groove lip. No component may redefine a colour token. `color-mix()` is permitted only for washes, selection and scrollbars; every other value references a token directly. No gradient is used anywhere: no background gradient, no gradient text, no glow, no glass blur. No purple or pink appears in any token.

```css
:root {
  --stock:        light-dark(#f2f4f3, #161c1f);
  --stock-deep:   light-dark(#e4e9e7, #0e1315);
  --sheet:        light-dark(#fafcfb, #101517);
  --solid:        light-dark(#1b2327, #0a0f11);
  --on-solid:     light-dark(#f2f4f3, #e8eeeb);
  --ink:          light-dark(#1b2327, #e8eeeb);
  --ink-soft:     light-dark(#3e4b51, #bcc9c6);
  --ink-faint:    light-dark(#5a686e, #95a6a3);
  --rule:         light-dark(#b7c3c0, #0a0e10);
  --rule-lip:     light-dark(transparent, #3d4a47);
  --rule-soft:    light-dark(#d4dcda, #24302f);
  --mark:         light-dark(#2c6382, #a9cbdc);
  --mark-strong:  light-dark(#1b4a63, #d3e8f1);
  --mark-on-solid:light-dark(#a9cbdc, #a9cbdc);
  --code:         light-dark(#e9efec, #0d1214);
  --code-ink:     light-dark(#1b2327, #e2ebe7);
  --code-dim:     light-dark(#4c5c61, #9aaba8);
  --code-rule:    light-dark(#bcc9c5, #2b3735);
  --focus:        light-dark(#1b4a63, #d3e8f1);
  --focus-halo:   light-dark(#f2f4f3, #161c1f);
  --impression:   light-dark(rgb(27 35 39 / 8%), rgb(0 0 0 / 45%));
  --edge:         light-dark(transparent, rgb(232 238 235 / 10%));

  --info:         light-dark(#2c6382, #a9cbdc);
  --warning:      light-dark(#7a4e0f, #e3b46c);
  --danger:       light-dark(#9b3327, #e6907f);
  --success:      light-dark(#2e624f, #98cbb0);
  --info-wash:    light-dark(rgb(44 98 130 / 10%),   rgb(169 203 220 / 12%));
  --warning-wash: light-dark(rgb(122 78 15 / 10%),   rgb(227 180 108 / 12%));
  --danger-wash:  light-dark(rgb(155 51 39 / 10%),   rgb(230 144 127 / 12%));
  --success-wash: light-dark(rgb(46 98 79 / 10%),    rgb(152 203 176 / 12%));
}
```

### Token table

Contrast notes are WCAG 2.x ratios computed from the hex values above, daylight / dark.

| Token | Daylight | Dark | Purpose | Contrast note |
|---|---|---|---|---|
| `--stock` | `#f2f4f3` | `#161c1f` | The sheet by day; the bed of the case by night | `--ink` 14.44:1 / 14.64:1 |
| `--stock-deep` | `#e4e9e7` | `#0e1315` | Trim area, band ground, table head | `--ink` 13.00:1 / 15.91:1 |
| `--sheet` | `#fafcfb` | `#101517` | The field a setting sits on: a pasted slip (lighter than the stock) by day, a recessed compartment (darker than the stock) by night | `--ink` 15.48:1 / 15.64:1 |
| `--solid` | `#1b2327` | `#0a0f11` | Full-bleed ink pull, reversed display line | `--on-solid` 14.44:1 / 16.40:1 |
| `--on-solid` | `#f2f4f3` | `#e8eeeb` | Text and links reversed out of the ink | as above |
| `--ink` | `#1b2327` | `#e8eeeb` | Body text, headings, signatures | 14.44:1 / 14.64:1 on stock |
| `--ink-soft` | `#3e4b51` | `#bcc9c6` | Standfirst, doc paragraphs, secondary prose | 8.16:1 / 10.09:1 |
| `--ink-faint` | `#5a686e` | `#95a6a3` | Captions, colophon, table heads, compartment labels | 5.22:1 / 6.77:1 on stock; 4.95:1 / 7.42:1 on `--code` |
| `--rule` | `#b7c3c0` | `#0a0e10` | A printed steel stroke by day; an **incised groove** by night | decorative, carries no text |
| `--rule-lip` | `transparent` | `#3d4a47` | The 1px lower lip that makes the night groove visible; absent by day | decorative |
| `--rule-soft` | `#d4dcda` | `#24302f` | Rule between entries in the case | decorative |
| `--mark` | `#2c6382` | `#a9cbdc` | Blue pencil by day, chalk by night: links, current location, focus, measurement lines | 5.91:1 / 10.05:1 |
| `--mark-strong` | `#1b4a63` | `#d3e8f1` | Hover, active, selected | 8.62:1 / 13.59:1 |
| `--mark-on-solid` | `#a9cbdc` | `#a9cbdc` | Links inside the ink band | 9.32:1 / 11.26:1 |
| `--code` | `#e9efec` | `#0d1214` | Proof slip by day, recessed channel by night: signatures and code | `--code-ink` 13.69:1 / 15.51:1 |
| `--code-ink` | `#1b2327` | `#e2ebe7` | Signature and code text | as above |
| `--code-dim` | `#4c5c61` | `#9aaba8` | Comments, line numbers, dim syntax tokens | 5.99:1 / 7.87:1 |
| `--code-rule` | `#bcc9c5` | `#2b3735` | Rule around a proof slip | decorative |
| `--focus` | `#1b4a63` | `#d3e8f1` | Focus ring | 8.62:1 / 13.59:1 on stock |
| `--focus-halo` | `#f2f4f3` | `#161c1f` | Outer halo so the ring survives on the ink band | paired with `--focus` |
| `--impression` | `rgb(27 35 39 / 8%)` | `rgb(0 0 0 / 45%)` | Deboss under the inked letter by day; short lower-right shadow of the raised sort by night | effect, never a static shadow on a flat element |
| `--edge` | `transparent` | `rgb(232 238 235 / 10%)` | Night only: 1px upper-left highlight on the metal face | effect |

### Semantic four

Each has a **background at 10% daylight / 12% dark** and its text in the matching full-strength value, which is one step darker than the wash by construction. Every wash also carries a word, so colour is never the only signal.

| Token | Daylight | Dark | Meaning on this site | Text on stock | Text on its wash |
|---|---|---|---|---|---|
| `--info` / `--info-wash` | `#2c6382` / 10% | `#a9cbdc` / 12% | How to read this setting (the blue pencil marks that do not reproduce) | 5.91:1 / 10.05:1 | 5.16:1 / 7.75:1 |
| `--warning` / `--warning-wash` | `#7a4e0f` / 10% | `#e3b46c` / 12% | A provisional proof, a caveat in the guide | 6.50:1 / 9.03:1 | 5.60:1 / 7.14:1 |
| `--danger` / `--danger-wash` | `#9b3327` / 10% | `#e6907f` / 12% | A refused glyph, a bad sort, a comparison that failed | 6.56:1 / 7.10:1 | 5.63:1 / 5.82:1 |
| `--success` / `--success-wash` | `#2e624f` / 10% | `#98cbb0` / 12% | Matched the reference reader | 6.39:1 / 9.43:1 | 5.52:1 / 7.35:1 |

`--info` and `--mark` deliberately resolve to the same value: one colour, one meaning, "an instruction, not part of the printed text". No second blue exists.

### Two designs, not one inverted

The daylight sheet and the night case are different objects, not a lightness flip. The pairs above were chosen independently, and four decisions are structural rather than chromatic:

| Decision | Daylight: the inked proof | Dark: the case in raking light |
|---|---|---|
| Surface direction | `--sheet` is **lighter** than `--stock`: a slip pasted on the sheet | `--sheet` is **darker** than `--stock`: a compartment recessed into the case |
| Rules | A printed stroke, `--rule` lighter than the text | An incised groove, `--rule` darker than the ground, drawn by its `--rule-lip` |
| Display weight | 500, because ink spread on paper thickens a stroke | 600, because the bare metal face reads thinner |
| Mark and light | Blue pencil on paper; a soft deboss (`--impression`) | Chalk on lead; a 1px upper-left `--edge` highlight and a lower-right shadow |

There is no grain, no vignette and no safelight by night: the paper is gone. Paper is diffuse and evenly lit; the case has one directional lamp. Both use the same `--solid` ink pull for the full-bleed band, because the forme is inked in both.

### Area budget and reasons

Ground 70–85 per cent, ink and grey 15–25 per cent, `--mark` at most 5 per cent. No more than two visible uses of `--mark` in one viewport. One `--solid` band per page.

Reasons for the three decisions a reader would notice: **main colour** is the non-reproducing blue pencil of the proofreader, so it marks instructions (links, where you are, focus, measurement lines) and never content; it is not a "tech blue". **Radius** is zero for everything structural because a sort and a cut sheet are square, with 2px and 4px reserved for controls the reader presses. **Type** uses three deliberate local stacks and no web font, because the site's own letterforms must not compete with the letterforms the library draws.

**Design-tell count: zero.** No default component skin, no purple, no gradient text, no glow, no emoji, no centred hero with three cards, no large soft radii, no italic serif, no equal spacing everywhere, no decorative microinteraction, no stock illustration, no pricing table. The third-wave editorial look (cream stock, terracotta, oversized italic serif, hairline newspaper rules) is specifically excluded: the stock is cool, the accent is a pencil blue, the display face is a plain grotesque, and rules appear only between real settings. The page is not thin: its mass comes from the drawn specimen line, the alphabet of sorts, the ruled em square and the full inventory of the case.

---

## 4. Type contract

### Three stacks, all local

```css
--font-display: "Helvetica Neue", "Arial Nova", Arial, "Liberation Sans",
                "Nimbus Sans", "Segoe UI", system-ui, sans-serif;
--font-body:    "Charter", "Bitstream Charter", "Iowan Old Style", Georgia,
                "Liberation Serif", "Times New Roman", serif;
--font-mono:    "JetBrains Mono", "Cascadia Mono", "SF Mono", Menlo, Consolas,
                "Liberation Mono", "DejaVu Sans Mono", monospace;
```

`--font-display` is the plain grotesque of a case label: furniture, not specimen; used for headings, navigation and buttons. `--font-body` is Charter, a serif drawn for low-resolution raster output, which is the same problem this library solves; it is present on macOS and iOS and falls back through Georgia and Liberation Serif to Times on Windows and Linux. `--font-mono` carries signatures, identifiers and every number. Two families plus mono; no third family anywhere.

No `@font-face`, `@import`, `preconnect` or CDN. If a self-hosted face is ever added it is **optional**: it must live under `docs/fonts/`, be declared with `font-display: swap`, and each stack above must remain as its complete fallback chain. The layout must be identical with the optional face absent.

### Exactly eight type sizes

The scale is a point-size ruler: 1 CSS pixel is four-thirds of a point, so each step is a real typesetting size. These are the only `font-size` values allowed in the site. Per page at most six tokens appear, and at most five in any one viewport.

| Token | px | points | Role | Line height | Letter spacing | Weight |
|---|---:|---:|---|---:|---|---|
| `--t-caption` | 12 | 9 | Colophon, figure caption, compartment label | 1.50 | 0.09em small caps; 0.10em uppercase | 400 |
| `--t-label` | 15 | 11 | Table heads, `.entry-kind`, ruler tick labels | 1.50 | 0.06em | 500 |
| `--t-body` | 19 | 14 | All prose, guide steps, doc paragraphs | 1.70 | 0 | 400 |
| `--t-lede` | 24 | 18 | Standfirst, pull quotations | 1.55 | 0 | 400 |
| `--t-h3` | 32 | 24 | Step headings, `.entry-name` | 1.35 | 0 | 500 |
| `--t-h2` | 48 | 36 | Section headings | 1.25 | -0.01em, Latin only | 500 |
| `--t-display` | 72 | 54 | The drawn specimen line in `showcase.html` | 1.15 | -0.01em, Latin only | 500 day / 600 night |
| `--t-specimen` | 96 | 72 | The single display line on `index.html` | 1.05 | -0.01em, Latin only | 500 day / 600 night |

No `clamp()` on type. At phone width roles are **remapped to existing tokens** rather than given new values: the specimen line uses `--t-h2`, the showcase display uses `--t-h3`, a section heading uses `--t-h3`, a step heading uses `--t-lede`. Adjacent steps in the scale differ by at least 1.25 times, so hierarchy comes from size and never from a heavier weight or a coloured word.

### Tracking rules

- Prose and labels: 0 tracking. Negative tracking is forbidden below 48px and on any small text.
- Small caps (`font-variant-caps: all-small-caps`, used for `.entry-kind`, `.pkg-kind`, table heads and the colophon): 0.08em to 0.10em. Never on a display line, never negative.
- Uppercase labels (`text-transform: uppercase`, ruler ticks and case index counters): at least 0.10em.
- Latin display at 48px and above: no tighter than -0.02em; the tokens use -0.01em.
- Chinese text, if any appears in the interface: 0 tracking, line height at least 1.3 for display and 1.7 for body, with no exception at 96px. A CJK **specimen** is drawn from the parsed outline, not typed.
- No italic display face and no italic serif headline anywhere.

### The numeric rule

**Every number that is a measurement is set in `--font-mono` with `font-variant-numeric: tabular-nums`, right-aligned inside a table, and never in `--font-display` or `--font-body`.** This covers `units_per_em`, `ascent`, `descent`, `line_gap`, `cap_height`, `x_height`, `advance`, `left_side_bearing`, `ppem`, `GlyphId.index`, `Bounds` coordinates, byte offsets, table tags, checksums, Unicode codepoints written `U+` plus hex, point sizes, pixel dimensions, coverage values from 0 to 255, and every comparison delta on `difftest.html`. Numbers that are ordinary words in prose stay in the body face. Identifiers, field names, signatures and code are mono as well. A proportional figure in a metrics table would misrepresent the very thing the library documents.

---

## 5. Spacing and layout contract

### Four fixed scales

The front-end needs no other numbers.

| Group | The only permitted values |
|---|---|
| Spacing | `--s-1` 4, `--s-2` 8, `--s-3` 12, `--s-4` 16, `--s-6` 24, `--s-8` 32, `--s-12` 48, `--s-18` 72, `--s-24` 96, `--s-32` 128, `--s-44` 176 px |
| Type | `--t-caption` 12, `--t-label` 15, `--t-body` 19, `--t-lede` 24, `--t-h3` 32, `--t-h2` 48, `--t-display` 72, `--t-specimen` 96 px |
| Radius | `--r-0` 0, `--r-1` 2, `--r-2` 4 px |
| Container | `--rail: 1120px`, one width, no wide exceptions |

The 4px unit is a quarter of the 16px em, not an arbitrary grid: the spacing scale is halves and multiples of the em because the em is what the library measures. `--s-*` are the only values allowed for padding, margin, gap, and the width of fixed furniture.

`--r-0` covers sheets, panels, figures, bands, buttons, inputs and tables. `--r-1` is for inline `code` chips and `.entry-kind`. `--r-2` is for the theme control and form controls. Nothing above 4px. Buttons are square everywhere: one shape, chosen once. No pill shapes, no circular cards.

`--rail: 1120px` is 70 em, the compositor's measure. **Every text section shares the same left edge.** Full-bleed bands colour the whole viewport but their inner `.wrap` still uses `--rail` and the same `--pad`; no section gets a wider container. `--pad` is `--s-12` (48px) above 980px, `--s-6` (24px) from 641 to 980px, `--s-4` (16px) at 640px and below. Section rhythm is `--s-32` (128px) on the desktop, `--s-18` (72px) at 980px, `--s-12` (48px) at 640px; one breathing section per page takes `--s-44` (176px) before the closing colophon. Inside a section: `--s-8` between a heading and its content, `--s-4` between paragraphs, `--s-2` between a figure and its caption. At most two distinct left edges on any page: the main column and the indented case index.

`z-index` is a fixed seven-step scale: `--z-base` 0, `--z-rule` 1, `--z-rail` 10, `--z-top` 20, `--z-popover` 30, `--z-modal` 40, `--z-skip` 50. No page currently uses a popover or a modal.

### Layout families and which page uses which

| Family | Class | Structure | Used on |
|---|---|---|---|
| Full-bleed ink pull | `.band` | 100vw `--solid` ground, inner `.wrap` still at `--rail`; reversed type | `index.html` opening display line; `showcase.html` em-square stage. Once per page. |
| Two-column measure | `.measure` | `minmax(0, 1.15fr) minmax(0, 0.85fr)`, gap `--s-12` | `index.html` display line / em-square figure; `guide.html` step prose / its printed output; `showcase.html` ruler / drawn glyph |
| The case | `.case` | `190px minmax(0, 1fr)`, sticky index plus a ruled list of compartments | `api.html` |
| Numbered stick | `<ol class="stick">` | Real `<li>`, step number in mono in the margin, one rule between steps | `guide.html`, the sequence of settings |
| Ruled figure | `<figure class="rule-figure">` | Steel rule above and below, `<figcaption>` in mono, no border box | `index.html` alphabet of sorts; `showcase.html` em square; `difftest.html` a pair impression |
| Case table | `<table class="case-table">` | `<caption>`, `<th scope>`, tabular numerals right-aligned, one rule under the head, none between rows | `difftest.html` comparison matrix; `showcase.html` metric readings |
| Colophon | `<blockquote class="colophon">` | 24px quotation from the source or the licence, attribution at caption size, no decorative quote marks | `index.html` closing; `guide.html` a note from the source |

**Adjacency rule.** Give each section one word from `{band, measure, case, stick, figure, table, colophon}`. Two adjacent sections may not share a word, and no word may appear three times on one page.

**The same card grid down the whole page is forbidden.** There is no `.grid` of equal cards anywhere on the site; no icon-plus-heading-plus-paragraph card, no three-card hero, no bento. Repeated equal-width containers occur only for the alphabet of sorts on `index.html`, where equal width is physically correct because sorts are cast to a fixed set width, and that row is a `<ul>` with rules between items, not a set of cards. Where a decorative element would otherwise have gone, put more real material: a longer specimen setting, another measurement, a fuller row of the inventory.

---

## 6. `api.html` generator contract

`api.html` is written by `scripts/docs/gen_api.py`. This section is the complete interface between that script and `style.css`. The script emits only the class names in the table below, no `style` attributes, and no `id` values other than the anchors defined here, `id="main"` and `id="case"`.

### 6.1 Inputs and determinism

Inputs are the `.mbti` files produced by `moon info` for each package under `src/`, and the `///|` doc-comment blocks immediately preceding each declaration in the `.mbt` sources. Package paths come from `moon.pkg` and `moon.mod`, for example `moonbitstack/moonfont/model`.

- Collect paths with `sorted()` over an explicit list; never emit in `os.listdir`, `glob`, `set` or `dict` iteration order.
- Sort packages by path. Sort declarations within a package by `(KIND_RANK[kind], qualified_name)`, where `KIND_RANK` is a fixed literal ordering: `type, trait, impl, const, fn, method`. Sort fields, variants and parameters by name. Doc paragraphs keep source order.
- Do not depend on file mtimes, the current working directory, locale, Python version, or the internal ordering of `.mbti` entries; sort after parsing.
- Output one complete `docs/api.html` in UTF-8, LF line endings, no BOM, exactly one trailing newline, via an explicit `newline="\n"` write.
- The output contains **no date, time, build identifier, version string, script name, absolute path or environment-derived count**. Running the script twice produces byte-identical output; this is the acceptance check.
- A malformed `.mbti` stops with a nonzero exit and a message naming the offending file. Build the whole document in memory and replace `api.html` only once it is complete: never write a partial page.
- There are no network requests and no external resources. Links out of the page are limited to the five local page filenames.

### 6.2 Anchor scheme

Anchors are stable, lowercase ASCII and derived only from names, never from position, count or file order. The slug function is lossless and collision-free:

```python
def slug(s):
    out = []
    for b in s.lower().encode("utf-8"):
        c = chr(b)
        if ("a" <= c <= "z") or ("0" <= c <= "9"):
            out.append(c)
        else:
            out.append("-{:02x}".format(b))
    return "".join(out)
```

Each byte becomes either one alphanumeric character or a hyphen followed by exactly two hex digits, so no two distinct names can produce the same slug. Anchors:

```text
ANCHOR_PKG(path)  = "p--" + slug(path)
ANCHOR_DECL(path, qualified_name, kind)
                  = "d--" + slug(path) + "--" + slug(qualified_name) + "--" + kind
```

`kind` is one of the fixed lowercase literals `type`, `trait`, `impl`, `const`, `fn`, `method`. Examples:

```text
moonbitstack/moonfont/model      -> p--moonbitstack-2fmoonfont-2fmodel
FontMetrics (type)               -> d--moonbitstack-2fmoonfont-2fmodel--fontmetrics--type
GlyphId::of (method)             -> d--moonbitstack-2fmoonfont-2fmodel--glyphid-3a-3aof--method
```

Anchor readability is not a goal; stability is. A symbol keeps its anchor even when other packages are added.

### 6.3 Exact skeleton

The head, top bar and footer below are a **literal constant** in `gen_api.py`, byte-identical to the shell of the four hand-written pages. The pre-paint script must match verbatim (see section 7.4). `{{CASE_INDEX}}` and `{{CASE_BODY}}` are the only substitutions; no template engine is involved.

```html
<!doctype html>
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
```

`theme.js` updates the toggle's `aria-label` between `Use the dark case` and `Use the daylight proof`, and keeps `aria-pressed` in step with the chosen theme.

### 6.4 Closed class vocabulary

The script may emit no class outside this table.

| Class | Element | Meaning |
|---|---|---|
| `.case`, `.case-index`, `.case-index-list`, `.case-index-item` | `div`, `nav`, `ol`, `li` | The two-column case and its drawer labels |
| `.case-index-link`, `.case-index-name`, `.case-index-count` | `a`, `span`, `span` | One label, the path in mono, the compartment count in mono |
| `.case-body`, `.case-title`, `.case-intro`, `.api-note` | `div`, `h1`, `p`, `p` | Fixed page furniture |
| `.pkg`, `.pkg-head`, `.pkg-name`, `.pkg-kind`, `.pkg-doc`, `.pkg-list` | `section`, `div`, `h2`, `span`, `div`, `div` | One drawer and its optional note |
| `.entry`, `.entry-head`, `.entry-kind`, `.entry-name` | `article`, `div`, `span`, `h3` | One compartment |
| `.sig` | `code` | The full signature, block, with newlines preserved |
| `.entry-doc` | `div` | Doc paragraphs from `///` comments |
| `.entry-fields`, `.entry-field`, `.field-name`, `.field-type`, `.field-doc` | `ul`, `li`, `b`, `span`, `span` | Struct fields, enum variants, error shapes |
| `.xref`, `.xref-pkg` | `a` | Cross-link to a declaration or a package |
| `.tok-kw`, `.tok-ty`, `.tok-fn`, `.tok-num`, `.tok-str`, `.tok-com`, `.tok-op` | `span` inside `.sig` | Syntax tokens; same vocabulary as the other four pages |
| `.empty` | `p` | Empty state at page or package level |

### 6.5 Exact markup for each kind of content

**Package section.** One `<section>` per package, sorted by path. `id` is `ANCHOR_PKG`.

```html
<section class="pkg" id="p--moonbitstack-2fmoonfont-2fmodel">
  <div class="pkg-head">
    <h2 class="pkg-name">moonbitstack/moonfont/model</h2>
    <span class="pkg-kind">package</span>
  </div>
  <div class="pkg-doc"><p>The domain model: the vocabulary every other layer speaks.</p></div>
  <div class="pkg-list">
    <!-- entries, sorted by (KIND_RANK, qualified_name) -->
  </div>
</section>
```

**A type.** `.entry-kind` is the compartment label; `.sig` is the cast line; `.entry-fields` lists the sorts inside.

```html
<article class="entry" id="d--moonbitstack-2fmoonfont-2fmodel--fontmetrics--type">
  <div class="entry-head">
    <span class="entry-kind">type</span>
    <h3 class="entry-name">FontMetrics</h3>
  </div>
  <code class="sig"><span class="tok-kw">pub(all) struct</span> <span class="tok-ty">FontMetrics</span> {
  <span class="tok-fn">units_per_em</span> : <span class="tok-ty">Int32</span>,
  <span class="tok-fn">ascent</span> : <span class="tok-ty">Int32</span>,
  <span class="tok-fn">descent</span> : <span class="tok-ty">Int32</span>,
}</code>
  <ul class="entry-fields">
    <li class="entry-field"><b class="field-name">units_per_em</b><span class="field-type">Int32</span><span class="field-doc">Font units in one em.</span></li>
    <li class="entry-field"><b class="field-name">descent</b><span class="field-type">Int32</span><span class="field-doc">Negative in a well-formed font.</span></li>
  </ul>
  <div class="entry-doc"><p>Font-wide metrics, in font units. All vertical values keep the font's y-up sign.</p></div>
</article>
```

**A function signature.** Always one `<code class="sig">`, escaped but otherwise verbatim; `->` is emitted as `-&gt;`.

```html
<article class="entry" id="d--moonbitstack-2fmoonfont-2fmodel--glyphid-3a-3aof--method">
  <div class="entry-head">
    <span class="entry-kind">method</span>
    <h3 class="entry-name">GlyphId::of</h3>
  </div>
  <code class="sig"><span class="tok-kw">pub fn</span> <span class="tok-fn">GlyphId::of</span>(<span class="tok-fn">index</span> : <span class="tok-ty">Int32</span>) <span class="tok-op">-&gt;</span> <span class="tok-ty">GlyphId</span></code>
  <div class="entry-doc"><p>Codepoints are not glyphs: translation belongs to the charmap, and everything downstream speaks only <a class="xref" href="#d--moonbitstack-2fmoonfont-2fmodel--glyphid--type">GlyphId</a>.</p></div>
</article>
```

Tokenisation is a fixed lexer over the signature string: `.tok-kw` for `pub`, `pub(all)`, `fn`, `struct`, `enum`, `trait`, `suberror`, `impl`, `let`, `raise`, `async`, `extend`, `with`; `.tok-ty` for type names; `.tok-fn` for function, field and method names; `.tok-num` for numeric literals; `.tok-str` for string literals; `.tok-com` for comments; `.tok-op` for `::`, `->`, `:`, `|`, `~`. Any unrecognised fragment is emitted as plain text, never guessed. Newlines inside a multi-line signature are preserved; `white-space: pre-wrap` comes from CSS, not an inline style.

**A doc paragraph.** A block begins at a line whose stripped content is `///|`. The consecutive `///` lines that follow are its body. Strip the marker and exactly one following space; an empty stripped line separates paragraphs; consecutive non-empty lines join with one space into a single `<p>`. Inline handling, in this order: escape all text with `html.escape(..., quote=False)`, then convert backtick spans to `<code>`, `[Name]` to `.xref`, `[pkg:path]` to `.xref-pkg`, and `[label](page.html)` to a plain `<a>` only when `page.html` is one of the five local page filenames. Attribute values are escaped with `quote=True`. No raw HTML from a source comment, no `<br>`, no lists and no headings are ever emitted.

```html
<div class="entry-doc">
  <p>A glyph's index in the font. Codepoints are not glyphs: translation belongs to the charmap, and everything downstream speaks only <a class="xref" href="#d--moonbitstack-2fmoonfont-2fmodel--glyphid--type">GlyphId</a>.</p>
  <p>See the <a class="xref-pkg" href="#p--moonbitstack-2fmoonfont-2fmodel">model</a> package for the other readings.</p>
</div>
```

**A cross-link.** Resolution is against a symbol table built after sorting, keyed by `qualified_name` for declarations and by `path` for packages, with exact case-sensitive lookup. If a qualified name appears in more than one package, the lexicographically first path wins, deterministically. An unresolved name becomes `<code>Name</code>`, never a broken fragment. `[pkg:...]` always uses the package anchor.

### 6.6 States of the emitted page

| State | Contract |
|---|---|
| Populated | Normal: index plus one drawer per package, one compartment per declaration. |
| Empty | No `.mbti` files found: one `<p class="empty">The case is empty: no interface files were found.</p>` in `.case-body`, no index, no broken links. A package with no declarations gets the same `.empty` inside its `.pkg-list`. |
| Edge | Long signatures wrap at whitespace and at `(`, `,` and `)`; long identifiers use `overflow-wrap: anywhere` in CSS; no horizontal document scroll. A drawer with a very large number of compartments stays one column with rules between entries, never spawns a second column. |
| Unresolved cross-link | `<code>`, never a fragment that goes nowhere. |
| Loading / Error | These do not exist on this page. Nothing is fetched, and a malformed input stops the script instead of producing a page. Do not add a spinner, a skeleton or an error banner. |

---

## 7. Motion and state contract

### 7.1 What moves

Only state changes move. A printed sheet is static; the reader's action is the only thing that changes it.

| Token | Value | Used for |
|---|---|---|
| `--motion-press` | `100ms ease-out` | A 1px downward impression on an active button or chip, with the ink darkening |
| `--motion-state` | `150ms ease-out` | Link colour and underline, the current-location rule, chip selection, the face/foot crossfade of the theme control |
| `--motion-swap` | `200ms ease-out` | Opacity-only crossfade when `showcase.html` redraws the specimen for a new character or size |

Everything else is 0ms. No load animation, no scroll reveal, no parallax, no hover lift, no decorative pulses, no animated rules, no counting numbers, and no transition on a section that merely comes into view. `scroll-behavior: smooth` is allowed only for in-page anchor jumps.

### 7.2 Reduced motion and contrast preferences

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

Under reduced motion the specimen swap becomes an immediate redraw. Under `prefers-contrast: more`, semantic washes become a 1px rule in the matching semantic colour and `--rule` resolves to `--ink-soft`. Under `forced-colors: active`, outlines carry the separation and no meaning rests on a background colour.

### 7.3 Focus rings

```css
:where(a, button, input, select, [tabindex]):focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 5px var(--focus-halo);
}
```

`outline: none` is forbidden anywhere. The halo keeps the ring visible on the ink band, where `--focus` alone would be too dark. `::selection` uses `color-mix(in srgb, var(--mark) 26%, transparent)`. Focus is visible on every interactive element in both themes.

### 7.4 Theme switching without flash

The pre-paint script in section 6.3 is a byte-identical constant in all five pages and in the generator's shell. It runs in `<head>` **before** the stylesheet: read `localStorage["moonfont-theme"]` inside `try/catch` (a `file://` page can throw), fall back to `matchMedia("(prefers-color-scheme: dark)")`, set `document.documentElement.dataset.theme`. `:root` declares `color-scheme: light dark`; the `data-theme` attribute narrows it to `only light` or `only dark`.

There is **no transition on the page background**: a crossfade would show a half-painted frame, and the swap must be instantaneous. `theme.js` only handles the control, the storage write, the two `aria` attributes, and OS changes when no explicit choice is stored. `scrollbar-gutter: stable` and `scrollbar-color` are set so the swap never shifts the measure. Non-colour differences live in `:root[data-theme="dark"]`: `--display-weight: 600`, `--impression`, `--edge`, `--rule-lip`. The daylight values are `--display-weight: 500`, no grain and no vignette in either theme.

### 7.5 Five-state matrix

| State | Rule |
|---|---|
| Loading | No network requests exist anywhere on the site, so there is no data-loading state. The first canvas rasterisation in `showcase.html` is synchronous. If a future page adds asynchronous work, it must use exactly one skeleton shaped like the content, never a spinner and never a second loader on the same page. |
| Empty | `showcase.html` with no character chosen: the em square is drawn with its five rules and no glyph, caption `Choose a character to set a sort.`, one primary action. |
| Error | A codepoint with no glyph: an inline note `This face has no sort for U+0041.` with a `Show the .notdef box` action; the previous glyph stays on the sheet. No modal, no alert, no status code and no traceback. |
| Populated | Normal rendering. |
| Edge | Long identifiers wrap rather than widen the page; point size is clamped to the em square; codepoints are shown as `U+` plus hex in mono; no emoji is used as an icon or as a stand-in for a specimen; CJK text keeps its line height and zero tracking. |

Buttons cover default, hover, active, disabled and focus. Disabled uses `--ink-faint` on `--stock-deep` with `cursor: not-allowed`; it is never dimmed with opacity to the point where contrast falls below 4.5:1. Comparison cells on `difftest.html` always carry a word (`match`, `disagrees`, `refused`) and a mono delta, never colour alone.

---

## 8. Accessibility and responsive notes

### Accessibility

**Contrast floor.** Every text/background pair in section 3 was computed with the WCAG 2.x relative-luminance formula and is at least 4.5:1 in both themes. The five lowest measured pairs: `--ink-faint` on `--code` 4.95:1 daylight / 7.42:1 dark; `--info` on its wash 5.16:1 / 7.75:1; `--ink-faint` on `--stock` 5.22:1 / 6.77:1; `--success` on its wash 5.52:1 / 7.35:1; `--warning` on its wash 5.60:1 / 7.14:1. Large text is held to the same 4.5:1 floor rather than the 3:1 allowance. No information is conveyed by colour alone.

**Keyboard order.** Skip link, wordmark, five section links, theme control, `<main>`, on-this-page index, content, footer. DOM order equals visual order. No positive `tabindex`, no keyboard traps, no focus moved by a theme change. The sticky index is a real `<nav aria-label>` with real links. If a modal is ever added, focus moves into it on open and returns to the invoking control on close.

**Skip link.** First focusable element, visible on focus, `href="#case"` on `api.html` and `href="#main"` elsewhere.

**Landmarks.** `<header>`, `<nav aria-label>`, `<main id="main">`, `<section aria-labelledby>`, `<figure>` with `<figcaption>`, `<table>` with `<caption>` and `<th scope>`, `<footer>`. The page is `lang="en-GB"`.

**Touch and text.** Targets at least 44 by 44 px on phone and 28 by 28 px on desktop, with at least 8px between them. Text zooms to 200 per cent without the layout collapsing; no `user-scalable=no`. Visible copy uses plain language: `This face has no sort for U+0041.` rather than a status code or an exception name.

### Responsive

Breakpoints at 1080, 980, 700 and 640 px, checked at 390, 834 and 1440 px. `--pad` is 48 / 24 / 16 px and `--section` is 128 / 72 / 48 px across those ranges. Type remaps to existing tokens as specified in section 4; no new font sizes appear.

**What survives at phone width.** The single display line, clamped to at most two lines by remapping to `--t-h2`; the em square with **all five** measurement rules and their mono labels; the alphabet of sorts as a wrapping ruled list; the full inventory of the case; the comparison table with its caption and its column heads; the full-bleed ink band; the five top-level links; the theme control. Two-column layouts collapse to one column, and the case index becomes a horizontal strip above the compartments with 44px targets. Full-bleed bands stay full-bleed.

**What is dropped, not squashed.** The sticky behaviour of the side rails; the ruler's minor tick marks (the labelled major ticks remain); the second column of a two-column measure; any horizontal rule that was only separating columns. `pre` and `.case-table` scroll inside their own `overflow-x: auto` container with a visible caption; the document itself never scrolls horizontally and no text falls below 19px. The sticky bar must not cover the last line of a section: `scroll-margin-top` equals the bar height plus `--s-4`.

---

## 9. Two decisions made for this product, not for a template

**One. The specimen letterforms are drawn, not typed.** Every glyph shown at display size is rendered from bytes the library itself parsed, into a canvas or an inline SVG built from the outline. It is never set in the site's own font. A template would put a large word in a decorative display face and call it a hero; on a font library that is a lie about what the software does. This one decision removes the web font, the CDN link, the italic serif headline and the whole editorial look, and it is why `--font-display` is a deliberately plain case-label grotesque: the UI face must stay out of the specimen's way. It also fixes the offline constraint, because nothing needs to be fetched to show the product.

**Two. The two colour designs are two stages of one process, not an inversion.** Daylight is the inked proof on cool wove paper: ink spread thickens a stroke, so the display face is set at weight 500; rules are printed strokes; panels are lighter slips pasted on the sheet; the only depth is a soft deboss under the letter. Dark is the type case under one raking lamp: there is no paper, so there is no grain and no vignette; the letter is bare metal and reads thinner, so the display face goes to weight 600; rules become incised grooves drawn by a lower lip; compartments are recessed and therefore darker than the ground; the metal carries a 1px upper-left highlight and a short lower-right shadow. A template would invert the lightness, keep every other decision the same, and call it a dark mode.

A corollary of both: the 4px unit is a quarter of the 16px em, the container is a 70 em measure, and every numeric reading is set in mono. The sheet measures with the same instrument the library documents.

**Acceptance.** The front-end can build all five pages from sections 3 to 8 without asking for a single pixel value. `gen_api.py` can emit `api.html` from section 6 alone. Any value not in this document is not part of the design.
