/* moonfont documentation helpers. Vanilla JavaScript, no dependencies, no
   network requests and no analytics. The readings below are the committed
   values from integration/difftest/fixtures/fixtures.json; every displayed
   number on the measure page is computed from them, never invented. */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  /* Font-wide readings from head and hhea, plus cap height and x-height
     measured from the drawn sorts. The synthetic face carries no OS/2 table,
     so those two heights come from the outlines, not from a metrics table. */
  var UPEM = 1000;
  var ASCENT = 800;
  var DESCENT = -200;
  var LINE_GAP = 0;
  var CAP_HEIGHT = 700;
  var X_HEIGHT = 500;
  var NUM_GLYPHS = 6;
  var NUM_TABLES = 9;

  /* id, mapped codepoint, advance, left side bearing, declared bounds and the
     canonical outline command stream, all in font units with y up. */
  var GLYPHS = [
    {
      id: 0, codepoint: null, label: ".notdef", advance: 500, lsb: 0,
      bounds: [0, 0, 0, 0], coverage: 0.0,
      commands: []
    },
    {
      id: 1, codepoint: 0x0020, label: "space", advance: 250, lsb: 0,
      bounds: [0, 0, 0, 0], coverage: 0.0,
      commands: []
    },
    {
      id: 2, codepoint: 0x0041, label: "A", advance: 600, lsb: 0,
      bounds: [0, 0, 600, 700], coverage: 27.825928,
      commands: [
        ["move", 100, 0], ["line", 500, 0],
        ["quad", 600, 300, 500, 500], ["quad", 400, 700, 200, 700],
        ["quad", 0, 300, 100, 0], ["close"]
      ]
    },
    {
      id: 3, codepoint: 0x0042, label: "B", advance: 500, lsb: 50,
      bounds: [50, 0, 450, 700], coverage: 27.859497,
      commands: [
        ["move", 50, 0], ["line", 450, 0], ["line", 450, 700],
        ["line", 50, 700], ["line", 50, 0], ["close"]
      ]
    },
    {
      id: 4, codepoint: 0x0061, label: "a", advance: 450, lsb: 50,
      bounds: [50, 0, 400, 500], coverage: 12.459946,
      commands: [
        ["move", 50, 0], ["line", 300, 0],
        ["quad", 400, 250, 200, 500], ["line", 50, 500],
        ["line", 50, 0], ["close"]
      ]
    },
    {
      id: 5, codepoint: 0x00C1, label: "Aacute (composite)",
      advance: 700, lsb: 40,
      bounds: [40, 10, 640, 720], coverage: 34.243774,
      commands: [
        ["move", 140, 20], ["line", 540, 20],
        ["quad", 640, 320, 540, 520], ["quad", 440, 720, 240, 720],
        ["quad", 40, 320, 140, 20], ["close"],
        ["move", 60, 10], ["line", 460, 10], ["line", 460, 710],
        ["line", 60, 710], ["line", 60, 10], ["close"]
      ]
    }
  ];

  /* Scale::of stores ppem shifted left by six; Scale::apply multiplies in 64
     bits and truncates toward zero. All operands here stay well inside the
     exact integer range of a JavaScript number, so the result is identical to
     the MoonBit computation on all four backends. */
  function apply(units, ppem) {
    var ppem266 = ppem << 6;
    return Math.trunc(units * ppem266 / UPEM);
  }

  function pixels(v266) {
    return (v266 / 64).toFixed(2);
  }

  function fmt(value) {
    return String(value);
  }

  function hex4(codepoint) {
    if (codepoint === null || codepoint === undefined) {
      return "unmapped";
    }
    var text = codepoint.toString(16).toUpperCase();
    while (text.length < 4) {
      text = "0" + text;
    }
    return "U+" + text;
  }

  /* Canonical commands become one SVG path. Font y grows upwards, SVG y grows
     downwards, so every y coordinate is negated here. */
  function outlineToPath(commands) {
    var parts = [];
    for (var i = 0; i < commands.length; i += 1) {
      var c = commands[i];
      if (c[0] === "move") {
        parts.push("M" + c[1] + " " + (-c[2]));
      } else if (c[0] === "line") {
        parts.push("L" + c[1] + " " + (-c[2]));
      } else if (c[0] === "quad") {
        parts.push(
          "Q" + c[1] + " " + (-c[2]) + " " + c[3] + " " + (-c[4])
        );
      } else if (c[0] === "close") {
        parts.push("Z");
      }
    }
    return parts.join(" ");
  }

  function glyphById(id) {
    for (var i = 0; i < GLYPHS.length; i += 1) {
      if (GLYPHS[i].id === id) {
        return GLYPHS[i];
      }
    }
    return null;
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        el.setAttribute(key, String(attrs[key]));
      }
    }
    return el;
  }

  function clear(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  /* A theme change is a state change, so the measure page redraws. currentColor
     already follows the theme; the redraw also recomputes every reading so the
     sheet and the table can never disagree after a swap. */
  function onThemeChange(callback) {
    var root = document.documentElement;
    document.addEventListener("moonfont-theme", function (event) {
      callback(event.detail || root.dataset.theme || "light");
    });
    if (typeof MutationObserver !== "undefined") {
      var observer = new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i += 1) {
          if (records[i].attributeName === "data-theme") {
            callback(root.dataset.theme || "light");
            return;
          }
        }
      });
      observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }
  }

  var Moonfont = {
    upem: UPEM,
    ascent: ASCENT,
    descent: DESCENT,
    lineGap: LINE_GAP,
    capHeight: CAP_HEIGHT,
    xHeight: X_HEIGHT,
    numGlyphs: NUM_GLYPHS,
    numTables: NUM_TABLES,
    glyphs: GLYPHS,
    apply: apply,
    pixels: pixels,
    fmt: fmt,
    hex4: hex4,
    outlineToPath: outlineToPath,
    glyphById: glyphById,
    byId: function (id) { return document.getElementById(id); },
    svgEl: svgEl,
    clear: clear,
    onThemeChange: onThemeChange
  };
  window.Moonfont = Moonfont;

  /* ------------------------------------------------------------------ */
  /* showcase.html                                                       */
  /* ------------------------------------------------------------------ */

  function buildGrid() {
    var body = Moonfont.byId("grid-body");
    if (!body) {
      return;
    }
    Moonfont.clear(body);
    for (var i = 0; i < GLYPHS.length; i += 1) {
      var glyph = GLYPHS[i];
      var cell = Moonfont.svgEl("g", { transform: "translate(" + (i * 1000) + " 0)" });
      cell.appendChild(Moonfont.svgEl("rect", {
        x: 0, y: -800, width: 1000, height: 1000,
        fill: "none", stroke: "currentColor", "stroke-width": 1,
        "stroke-opacity": 0.35
      }));
      if (glyph.commands.length === 0) {
        cell.appendChild(Moonfont.svgEl("rect", {
          x: 250, y: -600, width: 500, height: 500,
          fill: "none", stroke: "currentColor", "stroke-width": 2,
          "stroke-dasharray": "12 12"
        }));
      } else {
        cell.appendChild(Moonfont.svgEl("path", {
          d: Moonfont.outlineToPath(glyph.commands),
          fill: "currentColor", "fill-rule": "nonzero"
        }));
      }
      cell.appendChild(Moonfont.svgEl("text", {
        x: 0, y: 250, "font-size": 60, fill: "currentColor"
      })).textContent = fmt(glyph.id) + " " + Moonfont.hex4(glyph.codepoint);
      body.appendChild(cell);
    }
  }

  function drawGlyph(glyph) {
    var group = Moonfont.byId("stage-glyph");
    if (!group) {
      return;
    }
    Moonfont.clear(group);
    if (!glyph) {
      return;
    }
    if (glyph.commands.length === 0) {
      group.appendChild(Moonfont.svgEl("rect", {
        x: 250, y: -600, width: 500, height: 500,
        fill: "none", stroke: "currentColor", "stroke-width": 4
      }));
      return;
    }
    group.appendChild(Moonfont.svgEl("path", {
      d: Moonfont.outlineToPath(glyph.commands),
      fill: "currentColor", "fill-rule": "nonzero"
    }));
  }

  function renderTable(ppem, glyph) {
    var body = Moonfont.byId("metric-body");
    if (!body) {
      return;
    }
    Moonfont.clear(body);
    var rows = [
      ["ascent", ASCENT],
      ["descent", DESCENT],
      ["line_gap", LINE_GAP],
      ["cap_height", CAP_HEIGHT],
      ["x_height", X_HEIGHT]
    ];
    if (glyph) {
      rows.push(["advance", glyph.advance]);
      rows.push(["left_side_bearing", glyph.lsb]);
      rows.push(["bounds.width", glyph.bounds[2] - glyph.bounds[0]]);
      rows.push(["bounds.height", glyph.bounds[3] - glyph.bounds[1]]);
    }
    for (var i = 0; i < rows.length; i += 1) {
      var name = rows[i][0];
      var units = rows[i][1];
      var v266 = apply(units, ppem);
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.setAttribute("scope", "row");
      th.textContent = name;
      tr.appendChild(th);
      var cells = [fmt(units), fmt(v266), pixels(v266)];
      for (var j = 0; j < cells.length; j += 1) {
        var td = document.createElement("td");
        td.textContent = cells[j];
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
  }

  function initShowcase() {
    var slider = Moonfont.byId("size-slider");
    var select = Moonfont.byId("glyph-select");
    if (!slider || !select) {
      return;
    }

    var sizeReading = Moonfont.byId("size-reading");
    var ppemReading = Moonfont.byId("ppem-reading");
    var caption = Moonfont.byId("stage-caption");
    var note = Moonfont.byId("stage-note");
    var notdef = Moonfont.byId("show-notdef");
    var probe = Moonfont.byId("probe-sort");

    function selectedGlyph() {
      var value = select.value;
      if (value === "") {
        return null;
      }
      return glyphById(parseInt(value, 10));
    }

    function render() {
      var ppem = parseInt(slider.value, 10);
      var glyph = selectedGlyph();
      if (sizeReading) {
        sizeReading.textContent = fmt(ppem);
      }
      if (ppemReading) {
        ppemReading.textContent = fmt(ppem);
      }
      drawGlyph(glyph);
      renderTable(ppem, glyph);
      if (caption) {
        if (!glyph) {
          caption.textContent = "Choose a character to set a sort.";
        } else {
          caption.textContent =
            "Sort " + fmt(glyph.id) + " at " + fmt(ppem) +
            " pixels per em, drawn from its outline commands. The five rules " +
            "are ascender " + fmt(ASCENT) + ", cap height " + fmt(CAP_HEIGHT) +
            ", x-height " + fmt(X_HEIGHT) + ", baseline 0 and descender " +
            fmt(DESCENT) + ".";
        }
      }
    }

    slider.addEventListener("input", render);
    select.addEventListener("change", function () {
      if (note) {
        note.hidden = true;
      }
      if (notdef) {
        notdef.hidden = true;
      }
      render();
    });

    if (probe) {
      probe.addEventListener("click", function () {
        if (note) {
          note.textContent = "This face has no sort for U+0043.";
          note.hidden = false;
        }
        if (notdef) {
          notdef.hidden = false;
        }
        /* The previous glyph stays on the sheet. */
      });
    }

    if (notdef) {
      notdef.addEventListener("click", function () {
        select.value = "0";
        if (note) {
          note.hidden = true;
        }
        notdef.hidden = true;
        render();
      });
    }

    buildGrid();
    Moonfont.onThemeChange(render);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShowcase);
  } else {
    initShowcase();
  }
})();
