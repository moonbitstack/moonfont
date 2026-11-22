// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The measure page. Every number here comes out of the compiled engine: the
// outline is the path `outline_svg` returned, the advance and the bearing are
// `metrics`, and the 26.6 column is `scale_value`, which is `Scale::apply` and
// nothing else. The page does no arithmetic of its own beyond dividing 26.6 by
// 64 to print pixels.

import {
  decodeBytes,
  glyphIndex,
  numGlyphs,
  unitsPerEm,
  fontMetrics,
  metrics,
  scaleValue,
  outlineSvg,
} from "./engine/moonfont.js";

const FONT_URL = "./fonts/synthetic.ttf";
const SVG_NS = "http://www.w3.org/2000/svg";

const state = {
  face: null,
  units: 1000,
  // The codepoint a reader last asked for, which may have no glyph.
  wanted: null,
};

const byId = (id) => document.getElementById(id);

function element(tag, attributes) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

const format = (value) => String(Math.round(value));

/* A 26.6 value as pixels, two decimals. The fixed-point number itself always
   comes from the engine; this is only how a reader reads it. */
function toPixels(value266) {
  return (value266 / 64).toFixed(2);
}

function hex4(codepoint) {
  if (codepoint === null) return "—";
  return "U+" + codepoint.toString(16).toUpperCase().padStart(4, "0");
}

/* The engine emits path commands with y already pointing down, and this drawing
   is in mathematical coordinates with the baseline at zero, so the group is
   mirrored once here rather than in every path. */
function drawPath(container, glyph) {
  const path = outlineSvg(state.face, glyph);
  if (!path || !path.ok) return false;
  container.appendChild(
    element("path", {
      d: path.value,
      fill: "currentColor",
      "fill-rule": "nonzero",
      transform: "scale(1 -1)",
    }),
  );
  return true;
}

function buildGrid() {
  const body = byId("grid-body");
  if (!body || !state.face) return;
  body.replaceChildren();
  const count = Math.min(numGlyphs(state.face), 6);
  for (let glyph = 0; glyph < count; glyph += 1) {
    const cell = element("g", { transform: "translate(" + glyph * 1000 + " 0)" });
    cell.appendChild(
      element("rect", {
        x: 0,
        y: -800,
        width: 1000,
        height: 1000,
        fill: "none",
        stroke: "currentColor",
        "stroke-width": 1,
        "stroke-opacity": 0.35,
      }),
    );
    if (!drawPath(cell, glyph)) {
      // A glyph with no ink is drawn as the box a compositor would set.
      cell.appendChild(
        element("rect", {
          x: 250,
          y: -600,
          width: 500,
          height: 500,
          fill: "none",
          stroke: "currentColor",
          "stroke-width": 2,
          "stroke-dasharray": "12 12",
        }),
      );
    }
    const label = element("text", {
      x: 0,
      y: 250,
      "font-size": 60,
      fill: "currentColor",
    });
    label.textContent = glyph + " " + hex4(codepointOf(glyph));
    cell.appendChild(label);
    body.appendChild(cell);
  }
}

/* The six sorts this face carries, as the codepoints a reader would type. The
   grid is in glyph order, so a label needs the codepoint a glyph answers to. */
const KNOWN = [null, 0x20, 0x41, 0x42, 0x61, 0xc1];
function codepointOf(glyph) {
  for (const codepoint of KNOWN) {
    if (codepoint !== null && glyphIndex(state.face, codepoint) === glyph) {
      return codepoint;
    }
  }
  return null;
}

/* The top of one sort, in font units, taken from the ink box the engine
   reports. Used for the two heights a face may describe in `OS/2`; this
   fixture carries no `OS/2`, so the heights on this page are measured from the
   sorts themselves rather than read from a table that is not there. */
function inkTop(codepoint) {
  const glyph = glyphIndex(state.face, codepoint);
  if (glyph < 0) return 0;
  const one = metrics(state.face, glyph);
  return one.ok ? one.value.bounds.y_max : 0;
}

function readRows(ppem, glyph) {
  const wide = fontMetrics(state.face);
  const rows = [
    ["ascent", wide.ascent],
    ["descent", wide.descent],
    ["line_gap", wide.line_gap],
    ["cap_height", wide.cap_height || inkTop(0x41)],
    ["x_height", wide.x_height || inkTop(0x61)],
  ];
  if (glyph !== null) {
    const one = metrics(state.face, glyph);
    if (one.ok) {
      const bounds = one.value.bounds;
      rows.push(["advance", one.value.advance]);
      rows.push(["left_side_bearing", one.value.left_side_bearing]);
      rows.push(["bounds.width", bounds.x_max - bounds.x_min]);
      rows.push(["bounds.height", bounds.y_max - bounds.y_min]);
    }
  }
  return rows.map(([name, units]) => {
    const fixed = scaleValue(state.face, units, ppem);
    return { name, units, fixed, pixels: toPixels(fixed) };
  });
}

function writeTable(ppem, glyph) {
  const body = byId("metric-body");
  if (!body || !state.face) return;
  body.replaceChildren();
  for (const row of readRows(ppem, glyph)) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.setAttribute("scope", "row");
    th.textContent = row.name;
    tr.appendChild(th);
    for (const value of [format(row.units), format(row.fixed), row.pixels]) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    body.appendChild(tr);
  }
}

function drawStage(glyph) {
  const group = byId("stage-glyph");
  if (!group) return;
  group.replaceChildren();
  if (glyph === null) return;
  if (!drawPath(group, glyph)) {
    group.appendChild(
      element("rect", {
        x: 250,
        y: -600,
        width: 500,
        height: 500,
        fill: "none",
        stroke: "currentColor",
        "stroke-width": 4,
      }),
    );
  }
}

function start() {
  const slider = byId("size-slider");
  const select = byId("glyph-select");
  if (!slider || !select) return;

  const sizeReading = byId("size-reading");
  const ppemReading = byId("ppem-reading");
  const caption = byId("stage-caption");
  const note = byId("stage-note");
  const notdef = byId("show-notdef");
  const probe = byId("probe-sort");

  const render = () => {
    const ppem = parseInt(slider.value, 10) || 16;
    const glyph = state.wanted === null ? null : state.wanted;
    if (sizeReading) sizeReading.textContent = format(ppem);
    if (ppemReading) ppemReading.textContent = format(ppem);
    drawStage(glyph);
    writeTable(ppem, glyph);
    if (caption && state.face) {
      const wide = fontMetrics(state.face);
      caption.textContent =
        glyph === null
          ? "Choose a character to set a sort."
          : "Sort " + glyph + " at " + ppem + " pixels per em, drawn from the " +
            "path the engine returned. The five rules are ascender " + wide.ascent +
            ", cap height " + wide.cap_height + ", x-height " + wide.x_height +
            ", baseline 0 and descender " + wide.descent + ".";
    }
  };

  select.addEventListener("change", () => {
    const codepoint = select.value === "" ? null : parseInt(select.dataset.codepoint || "", 10);
    if (note) note.hidden = true;
    if (notdef) notdef.hidden = true;
    if (codepoint === null || !state.face) {
      state.wanted = null;
    } else {
      const glyph = glyphIndex(state.face, codepoint);
      state.wanted = glyph >= 0 ? glyph : null;
    }
    render();
  });

  slider.addEventListener("input", render);

  if (probe) {
    probe.addEventListener("click", () => {
      if (note) {
        note.hidden = false;
        note.textContent =
          "U+0043 is not in this face: glyph_index returned " +
          (state.face ? glyphIndex(state.face, 0x43) : -1) +
          ", so the sort on the stage stays as it was. A missing glyph is not an error.";
      }
      if (notdef) notdef.hidden = false;
    });
  }

  if (notdef) {
    notdef.addEventListener("click", () => {
      state.wanted = 0;
      render();
    });
  }

  render();
}

async function boot() {
  try {
    const response = await fetch(FONT_URL);
    if (!response.ok) throw new Error("no font");
    const decoded = decodeBytes(await response.arrayBuffer());
    if (!decoded || !decoded.ok) throw new Error("refused");
    state.face = decoded.value;
    state.units = unitsPerEm(state.face) || 1000;
    buildGrid();
    start();
  } catch (error) {
    document.body.dataset.state = "unavailable";
  }
}


boot();
