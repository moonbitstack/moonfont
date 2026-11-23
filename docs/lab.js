// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// moonfont interactive lab.
//
// Loads the compiled engine (./engine/moonfont.js, which wraps the
// MoonBit JS backend output) and drives it live in the browser: decode font
// files, rasterise glyphs to coverage masks, read SVG outlines, and extrude
// glyphs in WebGL. Nothing is uploaded and nothing is fetched from a network.

import {
  decodeBytes,
  numGlyphs,
  unitsPerEm,
  glyphIndex,
  rasterise,
  fontMetrics,
  outlineSvg,
} from "./engine/moonfont.js";

const DEMO_URL = "./fonts/demo.ttf";

const state = {
  face: null,
  fontName: "JetBrains Mono",
  units: 2048,
  // The name of a file that would not decode, if the reader has just tried one.
  uploadError: null,
};

// Coverage masks are cached per glyph id and size. The cache is cleared whenever
// the active face changes, because glyph ids are not portable between fonts.
const maskCache = new Map();
function getMask(glyph, ppem) {
  if (!state.face) return null;
  const key = glyph + "@" + ppem;
  let m = maskCache.get(key);
  if (!m) {
    const r = rasterise(state.face, glyph, ppem);
    m = r.ok ? r.value : null;
    maskCache.set(key, m);
  }
  return m;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Paint a coverage mask upright, centred and scaled to fit the canvas. The mask
// is already top-down (row 0 is the top of the glyph), so no y-flip is needed.
function paintMask(canvas, mask, opts = {}) {
  const color = opts.color || inkColor();
  const glow = opts.glow || 0;
  const clear = opts.clear !== false;
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth || canvas.width;
  const ch = canvas.clientHeight || canvas.height;
  canvas.width = Math.max(1, Math.round(cw * dpr));
  canvas.height = Math.max(1, Math.round(ch * dpr));
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!mask) return;

  const off = document.createElement("canvas");
  off.width = mask.width;
  off.height = mask.height;
  const octx = off.getContext("2d");
  const img = octx.createImageData(mask.width, mask.height);
  const c = hexToRgb(color);
  const s = mask.samples;
  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    img.data[i * 4] = c.r;
    img.data[i * 4 + 1] = c.g;
    img.data[i * 4 + 2] = c.b;
    img.data[i * 4 + 3] = a;
  }
  octx.putImageData(img, 0, 0);

  ctx.imageSmoothingEnabled = opts.smooth !== false;
  ctx.imageSmoothingQuality = "high";
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow * dpr;
  }
  // A glyph that sits behind reading matter is drawn lighter and off centre,
  // so the copy over it keeps its contrast.
  ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
  // How much of the box the ink is allowed to fill. A tile keeps a strip at its
  // foot for the character's name, so it asks for a little more margin.
  const fit = opts.fit === undefined ? 0.84 : opts.fit;
  const scale = Math.min(canvas.width / mask.width, canvas.height / mask.height) * fit;
  const dw = mask.width * scale;
  const dh = mask.height * scale;
  const dx = (canvas.width - dw) / 2 + (opts.shiftX || 0) * canvas.width;
  const dy = (canvas.height - dh) / 2 + (opts.shiftY || 0) * canvas.height;
  ctx.drawImage(off, 0, 0, mask.width, mask.height, dx, dy, dw, dh);
  ctx.shadowBlur = 0;
}

// Colours come from the page, not from constants: the same panel has to work
// in the night impression and on paper, and a theme change repaints it.
function cssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
function inkColor() {
  return cssVar("--ink", "#ededf0");
}
function accentColor() {
  return cssVar("--accent", "#ff5a36");
}
function fade(hex, alpha) {
  const c = hexToRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

// The ink's box in font units. The path frame is y down with the baseline at
// 0, so the mask's top is a negative y and its left can be negative as well.
function inkBox(mask, units, ppem) {
  if (!mask) return null;
  const perUnit = ppem / units;
  return {
    x: mask.left / perUnit,
    y: mask.top / perUnit,
    w: mask.width / perUnit,
    h: mask.height / perUnit,
  };
}

// Draw the outline inside an <svg>. The path is in font units with y pointing
// down and the baseline at 0, so the viewBox is the ink's own box — negative y
// above the baseline included. Fitting the ink rather than the em square means
// a font with a deep descender or a wide side bearing is not cropped.
function paintOutline(svgEl, path, box) {
  if (!svgEl) return;
  svgEl.innerHTML = "";
  if (!path || !box) {
    svgEl.setAttribute("viewBox", "0 0 1000 1000");
    return;
  }
  const pad = Math.max(box.w, box.h) * 0.06;
  svgEl.setAttribute(
    "viewBox",
    `${box.x - pad} ${box.y - pad} ${box.w + pad * 2} ${box.h + pad * 2}`,
  );
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", path);
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", "currentColor");
  p.setAttribute("stroke-width", String(Math.max(box.w, box.h) * 0.008));
  p.setAttribute("stroke-linejoin", "round");
  p.setAttribute("stroke-linecap", "round");
  svgEl.appendChild(p);
}

// The glyph inside the em square, with the metrics the engine measured. The
// frame is the path's: font units, y down, baseline at 0 — so the ascender is
// a negative y and every rule is drawn at minus its value.
function paintMetrics(canvas, mask, path, metrics, units, ppem, text) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!metrics) return;
  const w = canvas.width;
  const h = canvas.height;
  const ink = inkColor();
  const accent = accentColor();

  // Mask pixels are `ppem` per em; the path is in `units` per em.
  const perUnit = ppem / units;
  const glyph = mask
    ? {
        x: mask.left / perUnit,
        y: mask.top / perUnit,
        w: mask.width / perUnit,
        h: mask.height / perUnit,
      }
    : null;
  // The visible box holds the em square, the ink, and every rule: the
  // ascender can sit above the em and the descender below the baseline.
  const left = Math.min(0, glyph ? glyph.x : 0);
  const right = Math.max(units, glyph ? glyph.x + glyph.w : units);
  const top = Math.min(-units, -metrics.ascent, glyph ? glyph.y : -units);
  const bottom = Math.max(0, -metrics.descent, glyph ? glyph.y + glyph.h : 0);

  const pad = 20 * dpr;
  const gutter = 78 * dpr; // room for the rule labels on the right
  const spanW = Math.max(1, right - left);
  const spanH = Math.max(1, bottom - top);
  const s = Math.min((w - pad * 2 - gutter) / spanW, (h - pad * 2) / spanH);
  const ox = (w - gutter - spanW * s) / 2 - left * s;
  const oy = (h - spanH * s) / 2 - top * s;
  const X = (x) => ox + x * s;
  const Y = (y) => oy + y * s;

  // the em square
  ctx.strokeStyle = fade(ink, 0.2);
  ctx.lineWidth = 1 * dpr;
  ctx.strokeRect(X(0), Y(-units), units * s, units * s);

  ctx.font = `${10.5 * dpr}px ui-monospace, "DejaVu Sans Mono", monospace`;
  const rule = (y, label, dash) => {
    ctx.save();
    ctx.setLineDash(dash ? [5 * dpr, 5 * dpr] : []);
    ctx.strokeStyle = fade(accent, 0.6);
    ctx.beginPath();
    ctx.moveTo(X(left), Y(y));
    ctx.lineTo(X(right), Y(y));
    ctx.stroke();
    ctx.restore();
    if (!label) return;
    ctx.fillStyle = fade(ink, 0.55);
    ctx.textBaseline = "middle";
    ctx.fillText(label, X(right) + 8 * dpr, Y(y));
  };
  rule(-metrics.ascent, "ascender", true);
  // Cap and x-height describe a Latin alphabet; a character set in this face
  // for want of an outline has no such reading, so the rules stop at the
  // ascender and the baseline.
  if (!text) {
    rule(-metrics.cap_height, "cap", true);
    rule(-metrics.x_height, "x-height", true);
  }
  rule(0, "baseline", false);
  rule(-metrics.descent, "descender", true);

  // The glyph is filled from the same path the outline panel strokes, in the
  // same frame as the rules, so the two cannot disagree about its size.
  if (path) {
    ctx.save();
    ctx.translate(X(0), Y(0));
    ctx.scale(s, s);
    ctx.fillStyle = fade(ink, 0.9);
    ctx.fill(path);
    ctx.restore();
  } else if (text) {
    // No path to fill: the page's face sets the character in the same frame.
    ctx.save();
    ctx.fillStyle = fade(ink, 0.9);
    ctx.font = pageFont(units * s, 500);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillText(text, X(0), Y(0));
    ctx.restore();
  }
}

// ---- WebGL extrusion renderer ----
function createRenderer(canvas, opts = {}) {
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) return null;

  const vsSrc = `
    attribute vec3 aPos;
    attribute vec3 aNormal;
    uniform mat4 uMVP;
    uniform mat4 uModel;
    varying vec3 vN;
    void main() {
      gl_Position = uMVP * vec4(aPos, 1.0);
      vN = mat3(uModel) * aNormal;
    }`;
  const fsSrc = `
    precision mediump float;
    varying vec3 vN;
    uniform vec3 uLightDir;
    uniform vec3 uColor;
    uniform float uAmbient;
    void main() {
      vec3 N = normalize(vN);
      vec3 L = normalize(uLightDir);
      // Two-sided: the mesh is a stack of per-pixel quads, and a face turned
      // away from the camera is still a face of the same solid.
      float d = abs(dot(N, L));
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 H = normalize(L + V);
      float s = pow(max(dot(N, H), 0.0), 30.0) * 0.55;
      vec3 col = uColor * (uAmbient + (1.0 - uAmbient) * d) + vec3(s);
      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }
  const vs = compile(gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const aPos = gl.getAttribLocation(prog, "aPos");
  const aNormal = gl.getAttribLocation(prog, "aNormal");
  const uMVP = gl.getUniformLocation(prog, "uMVP");
  const uModel = gl.getUniformLocation(prog, "uModel");
  const uLightDir = gl.getUniformLocation(prog, "uLightDir");
  const uColor = gl.getUniformLocation(prog, "uColor");
  const uAmbient = gl.getUniformLocation(prog, "uAmbient");

  const posBuf = gl.createBuffer();
  const nrmBuf = gl.createBuffer();

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const r = {
    gl,
    mask: null,
    depth: opts.depth || 56,
    light: 45,
    yaw: opts.yaw || 0.5,
    pitch: opts.pitch || 0.25,
    autoRotate: opts.autoRotate !== false,
    // Angular momentum, in radians per frame, taken away by drag. A turntable
    // that is pushed slows down and stops; a sine would turn for ever.
    spin: 0,
    visible: true,
    running: false,
    raf: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    vertexCount: 0,
    color: opts.color || [0.86, 0.86, 0.9],
    ambient: 0.28,
  };

  function buildGeometry() {
    const mask = r.mask;
    const positions = [];
    const normals = [];
    if (!mask) return;
    const { width: w, height: h, samples: s } = mask;
    const covered = (x, y) =>
      x >= 0 && x < w && y >= 0 && y < h ? s[y * w + x] > 128 : false;
    const pushQuad = (ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, nx, ny, nz) => {
      positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      positions.push(ax, ay, az, cx, cy, cz, dx, dy, dz);
      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    };

    // A wall that takes its normal from the local edge — instead of the axis
    // of the pixel step — shades as one continuous surface around a curve.
    // Without this the side of a letter is a stack of little lit steps and
    // reads as a pile of plates rather than a solid.
    const blur = (x, y) => {
      let sum = 0;
      let weight = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const sx = x + dx, sy = y + dy;
          const c = sx < 0 || sy < 0 || sx >= w || sy >= h ? 0 : s[sy * w + sx] / 255;
          const wgt = 3 - Math.max(Math.abs(dx), Math.abs(dy));
          sum += c * wgt;
          weight += wgt;
        }
      }
      return weight ? sum / weight : 0;
    };
    const wallNormal = (x, y) => {
      const gx = blur(x + 1, y) - blur(x - 1, y);
      const gy = blur(x, y + 1) - blur(x, y - 1);
      const len = Math.hypot(gx, gy);
      if (len < 1e-4) return [0, 0, 0];
      return [-gx / len, -gy / len, 0];
    };

    const z1 = r.depth;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!covered(x, y)) continue;
        // The face, and its mirror at z = 0: a closed slab, so a turn past
        // three-quarters shows the back of the letter, not its hollow inside.
        pushQuad(x, y, z1, x + 1, y, z1, x + 1, y + 1, z1, x, y + 1, z1, 0, 0, 1);
        pushQuad(x, y, 0, x, y + 1, 0, x + 1, y + 1, 0, x + 1, y, 0, 0, 0, -1);
        if (!covered(x - 1, y) || !covered(x + 1, y) || !covered(x, y - 1) || !covered(x, y + 1)) {
          const n = wallNormal(x, y);
          const nx = n[0], ny = n[1];
          if (!covered(x - 1, y))
            pushQuad(x, y, z1, x, y + 1, z1, x, y + 1, 0, x, y, 0, nx, ny, 0);
          if (!covered(x + 1, y))
            pushQuad(x + 1, y, z1, x + 1, y + 1, z1, x + 1, y + 1, 0, x + 1, y, 0, nx, ny, 0);
          if (!covered(x, y - 1))
            pushQuad(x, y, z1, x + 1, y, z1, x + 1, y, 0, x, y, 0, nx, ny, 0);
          if (!covered(x, y + 1))
            pushQuad(x, y + 1, z1, x + 1, y + 1, z1, x + 1, y + 1, 0, x, y + 1, 0, nx, ny, 0);
        }
      }
    }
  r.vertexCount = positions.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  }

  // Geometry arrives after the renderer is made, and there is no longer a
  // loop running to notice: every change asks for one frame.
  r.setMask = (mask) => {
    r.mask = mask;
    buildGeometry();
    if (r.start) r.start();
  };
  r.setDepth = (d) => {
    r.depth = d;
    if (r.mask) buildGeometry();
    if (r.start) r.start();
  };
  r.setLight = (deg) => {
    r.light = deg;
    if (r.start) r.start();
  };
  r.reset = () => {
    r.yaw = opts.yaw || 0.5;
    r.spin = 0;
    r.pitch = opts.pitch || 0.25;
    r.start();
  };

  // Minimal mat4 helpers, column-major as GL expects them. The product is
  // written column by column: a row-major multiply here transposes the result
  // and the solid lands outside the clip volume instead of in the middle.
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ];
  }
  function multiply(a, b) {
    const out = new Array(16).fill(0);
    for (let column = 0; column < 4; column++) {
      for (let row = 0; row < 4; row++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += a[k * 4 + row] * b[column * 4 + k];
        }
        out[column * 4 + row] = sum;
      }
    }
    return out;
  }
  function rotationX(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  }
  function rotationY(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  }
  function translation(x, y, z) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth || canvas.width;
    const ch = canvas.clientHeight || canvas.height;
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  r.frame = () => {
    if (!r.mask || r.vertexCount === 0) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      return;
    }
    resize();
    if (r.dragging) {
      // The hand owns the angle while it holds.
    } else if (r.spin !== 0) {
      r.yaw += r.spin;
      // Bearing friction, per frame at sixty frames a second: a flick coasts
      // for about two seconds and then the solid is simply still. The
      // threshold is the point where the next step would move a pixel.
      r.spin *= 0.985;
      if (Math.abs(r.spin) < 0.0006) r.spin = 0;
    }
    const aspect = canvas.width / canvas.height;
    const proj = perspective((45 * Math.PI) / 180, aspect, 0.1, 100);
    const view = translation(0, 0, -5.2);
    const model = multiply(rotationY(r.yaw), rotationX(r.pitch));

    // Fit: scale so the mask's largest dimension is about 3.1 world units.
    let cx = 0, cy = 0;
    if (r.mask) {
      cx = r.mask.width / 2;
      cy = r.mask.height / 2;
    }
    // The depth is part of the silhouette: a slab turned towards the camera is
    // as tall as its thickness plus its face, so the fit has to include it.
    const span = r.mask
      ? Math.max(r.mask.width, r.mask.height, r.depth * 1.7, 1)
      : 1;
    const fit = 3.1 / span;

    // Bake the centring and the fit into the model matrix. The mask's y runs
    // down and the world's runs up, so y takes the negative scale: without it
    // the solid is poured upside down.
    const fitMat = [
      fit, 0, 0, 0,
      0, -fit, 0, 0,
      0, 0, fit, 0,
      -cx * fit, cy * fit, -(r.depth * fit) / 2, 1,
    ];
    const modelFull = multiply(model, fitMat);
    const mvp = multiply(proj, multiply(view, modelFull));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(uMVP, false, new Float32Array(mvp));
    gl.uniformMatrix4fv(uModel, false, new Float32Array(model));

    const a = (r.light * Math.PI) / 180;
    const e = 0.55;
    const L = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)];
    gl.uniform3fv(uLightDir, new Float32Array(L));
    gl.uniform3fv(uColor, new Float32Array(r.color));
    gl.uniform1f(uAmbient, r.ambient);

    gl.drawArrays(gl.TRIANGLES, 0, r.vertexCount);
  };

  // Drag to orbit.
  canvas.addEventListener("pointerdown", (ev) => {
    r.dragging = true;
    r.lastX = ev.clientX;
    r.lastY = ev.clientY;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (!r.dragging) return;
    const dx = ev.clientX - r.lastX;
    r.yaw += dx * 0.01;
    r.pitch += (ev.clientY - r.lastY) * 0.01;
    r.pitch = Math.max(-1.4, Math.min(1.4, r.pitch));
    r.lastX = ev.clientX;
    r.lastY = ev.clientY;
    // Remember the hand's last motion: released mid-swing, the solid keeps
    // that turn and gives it back to friction.
    r.spin = reduceMotion ? 0 : Math.max(-0.008, Math.min(0.008, dx * 0.0003));
    r.start();
  });
  const stop = (ev) => {
    r.dragging = false;
    r.start();
    if (ev.pointerId != null && canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
    }
  };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);

  r.start = () => {
    if (r.running) return;
    r.running = true;
    const loop = () => {
      r.raf = 0;
      r.frame();
      const moving = r.dragging || r.spin !== 0;
      if (moving && r.visible) {
        r.raf = requestAnimationFrame(loop);
      } else {
        r.running = false;
      }
    };
    r.raf = requestAnimationFrame(loop);
  };

  // A solid on a page is not a reason to draw sixty times a second while it
  // sits below the fold: it is drawn when it is looked at.
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (!r.running) r.frame();
    }).observe(canvas);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          r.visible = entry.isIntersecting;
          if (r.visible && (r.dragging || r.spin !== 0)) r.start();
        }
      },
      { rootMargin: "120px" },
    ).observe(canvas);
  }

  return r;
}

// ---- Section renderers ----
// The hero letter is a shape, not a picture: filling its outline keeps the edges
// of a glyph drawn a metre across as crisp as the ones in the panels, where a
// mask blown up four times is a grey smear with a halo around it.
// A character the demo face does not carry — Chinese, or anything outside its
// coverage — is still shown, in the page's own face and at the hero's scale.
// The letter is a picture of a glyph; this is the glyph the reader typed.
// --- characters the demo face does not carry ---------------------------------
//
// jetbrains mono has no Chinese. Rather than draw nothing, every panel that
// shows a character falls back to the page's own face: the coverage is a canvas
// render, the outline a stroked glyph, the metrics measured from the same face,
// and the extrusion is built from that coverage like any other.

const PAGE_FACE = '"HarmonyOS Sans SC", ui-sans-serif, system-ui, sans-serif';

function pageFont(px, weight = 500) {
  return `${weight} ${px}px ${PAGE_FACE}`;
}

// Coverage of a character in the page's face, in the shape the rasteriser
// returns: 8-bit samples, and the ink's offset from the pen origin.
function textCoverage(text, ppem) {
  const pad = 4;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = pageFont(ppem, 500);
  const m = probe.measureText(text);
  const left = Math.ceil(m.actualBoundingBoxLeft) + pad;
  const right = Math.ceil(m.actualBoundingBoxRight) + pad;
  const up = Math.ceil(m.actualBoundingBoxAscent) + pad;
  const down = Math.ceil(m.actualBoundingBoxDescent) + pad;
  const width = Math.max(1, left + right);
  const height = Math.max(1, up + down);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.font = pageFont(ppem, 500);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.fillText(text, left, up);
  const data = ctx.getImageData(0, 0, width, height).data;
  const samples = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) samples[i] = data[i * 4 + 3];
  return { width, height, left: -left, top: -up, samples };
}

// The metrics of the page's face at one em, in the same shape the engine
// reports for a font: enough for the em square and its rules.
function textFontMetrics(text) {
  const units = 1000;
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = pageFont(units, 500);
  const ink = (ch) => ctx.measureText(ch);
  // The vertical rules follow the character itself: a Chinese glyph sits lower
  // in its square than a Latin one, and the rules have to describe what is on
  // the panel, not a different letter of the same face.
  const own = text ? ctx.measureText(text) : null;
  return {
    units_per_em: units,
    ascent: Math.round(own ? own.actualBoundingBoxAscent : ink("d").actualBoundingBoxAscent),
    // The descender is the face's, not the character's: a glyph that sits on the
    // baseline would otherwise put two rules on top of each other.
    descent: -Math.round(ink("p").actualBoundingBoxDescent),
    cap_height: Math.round(ink("H").actualBoundingBoxAscent),
    x_height: Math.round(ink("x").actualBoundingBoxAscent),
    line_gap: 0,
    num_glyphs: 0,
    bounding_box: { x_min: 0, y_min: 0, x_max: units, y_max: units },
  };
}

// A stroked glyph in the outline panel, for a character whose path the engine
// never produced: SVG text can be stroked, which is what an outline is.
function paintOutlineText(svgEl, text) {
  if (!svgEl) return;
  svgEl.innerHTML = "";
  svgEl.setAttribute("viewBox", "0 0 1000 1000");
  const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
  node.setAttribute("x", "500");
  node.setAttribute("y", "700");
  node.setAttribute("text-anchor", "middle");
  node.setAttribute("font-family", PAGE_FACE.replace(/"/g, "'"));
  node.setAttribute("font-size", "760");
  node.setAttribute("font-weight", "500");
  node.setAttribute("fill", "none");
  node.setAttribute("stroke", "currentColor");
  node.setAttribute("stroke-width", "9");
  node.setAttribute("stroke-linejoin", "round");
  node.textContent = text;
  svgEl.appendChild(node);
}

function paintCharacter(canvas, text, opts = {}) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth || canvas.width;
  const ch = canvas.clientHeight || canvas.height;
  canvas.width = Math.max(1, Math.round(cw * dpr));
  canvas.height = Math.max(1, Math.round(ch * dpr));
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!text) return;

  const weight = opts.weight || 500;
  // Size by the ink, not by the em: a Chinese character fills its square and a
  // Latin one does not, so an em-based size makes the two look like different
  // sizes on the same page.
  ctx.font = pageFont(100, weight);
  const probe = ctx.measureText(text);
  const ratio = (probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent) / 100 || 0.8;
  const target = opts.ink || (opts.size || Math.min(cw, ch) * 0.5) * ratio;
  const size = target / ratio;

  ctx.font = pageFont(size * dpr, weight);
  const m = ctx.measureText(text);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = fade(opts.color || inkColor(), opts.alpha === undefined ? 0.3 : opts.alpha);
  const x = (opts.x === undefined ? cw / 2 : opts.x) * dpr;
  const y = (opts.y === undefined ? ch / 2 : opts.y) * dpr;
  // Centre the ink, not the line box.
  ctx.fillText(text, x, y + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
}

function paintGlyphPath(canvas, path, box, opts = {}) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth || canvas.width;
  const ch = canvas.clientHeight || canvas.height;
  canvas.width = Math.max(1, Math.round(cw * dpr));
  canvas.height = Math.max(1, Math.round(ch * dpr));
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!path || !box || !box.w || !box.h) return;

  const span = Math.min(canvas.width / box.w, canvas.height / box.h) * (opts.fit || 0.84);
  const dw = box.w * span;
  const dh = box.h * span;
  // Either a nudge from the centre, or a margin from the right edge: the hero
  // letter is placed by its margin, so it keeps its distance from the copy at
  // every width instead of drifting off the page on a narrow one.
  const dx =
    opts.right === undefined
      ? (canvas.width - dw) / 2 + (opts.shiftX || 0) * canvas.width
      : canvas.width - dw - opts.right * canvas.width;
  const dy = (canvas.height - dh) / 2 + (opts.shiftY || 0) * canvas.height;

  const ink = opts.color || inkColor();
  const top = opts.alpha === undefined ? 0.34 : opts.alpha;
  const foot = opts.alphaFoot === undefined ? top : opts.alphaFoot;
  let fill;
  if (top === foot) {
    fill = fade(ink, top);
  } else {
    const fadeOut = ctx.createLinearGradient(0, dy, 0, dy + dh);
    fadeOut.addColorStop(0, fade(ink, top));
    fadeOut.addColorStop(1, fade(ink, foot));
    fill = fadeOut;
  }

  ctx.save();
  ctx.translate(dx, dy);
  ctx.scale(span, span);
  ctx.translate(-box.x, -box.y);
  ctx.fillStyle = fill;
  ctx.fill(new Path2D(path));
  ctx.restore();
}

// The hero's placement, for a character the demo face has no outline for.
function heroCharacter(canvas, text) {
  const cw = canvas.clientWidth || window.innerWidth;
  const ch = canvas.clientHeight || 1;
  const copyRight = document.querySelector(".hero__copy")?.getBoundingClientRect().right ?? 0;
  const room = cw - copyRight;
  const beside = cw >= 760 && room > cw * 0.16;
  const dark = (document.documentElement.dataset.theme || "dark") === "dark";
  // The same ink height the letter of the demo face would take, or as much of
  // the column as a square character can have.
  // The same gap the letter keeps from the copy, on both sides: a square
  // character then takes as much of the column as the column can hold.
  const ink = beside
    ? Math.min(ch * 0.78, Math.max(ch * 0.3, room - 192))
    : // A watermark still has to fit the width of the page it sits behind.
      Math.min(ch * 0.55, cw * 0.76);
  paintCharacter(canvas, text, {
    color: inkColor(),
    alpha: beside ? (dark ? 0.3 : 0.22) : cw < 760 ? 0.1 : 0.14,
    weight: 500,
    ink,
    x: beside ? copyRight + room / 2 : cw / 2,
    y: beside ? ch / 2 : ch * 0.38,
  });
}

function renderHero() {
  const canvas = document.getElementById("heroCanvas");
  const ch = (document.getElementById("heroChar").value || "A")[0];
  if (!state.face || !ch) return;
  const gi = glyphIndex(state.face, ch.charCodeAt(0));
  if (gi < 0) {
    heroCharacter(canvas, ch);
    return;
  }
  const out = outlineSvg(state.face, gi);
  // A small mask is enough to say where the ink is; the drawing itself is the
  // path, so the letter is sharp at any size.
  const box = inkBox(getMask(gi, 96), state.units, 96);
  if (!out.ok || !box) {
    paintMask(canvas, null);
    return;
  }
  const dark = (document.documentElement.dataset.theme || "dark") === "dark";
  const cw = canvas.clientWidth || window.innerWidth;
  const chPx = canvas.clientHeight || 1;
  const ratio = box.w / box.h;
  const full = Math.min(cw, chPx * ratio);

  // The copy takes a fixed measure, so the question is how much column is left
  // beside it. Given room, the letter stands in the middle of that column; on a
  // narrow one it shrinks to fit; with none left it becomes the ground behind
  // the copy, as it is on a phone.
  const copyRight = document.querySelector(".hero__copy")?.getBoundingClientRect().right ?? 0;
  const room = cw - copyRight;
  const gap = 96;
  let fit = cw < 760 ? 0.7 : 0.78;
  let beside = cw >= 760 && room > full * 0.52 + gap;
  if (beside && full * fit > room - gap) fit = (room - gap) / full;
  const inset = beside ? (room - full * fit) / 2 / cw : 0;

  // The glyph is the ground for the title, lighter than the copy, so the
  // heading stays the subject; on a phone it also rises out of the text's way.
  paintGlyphPath(canvas, out.value, box, {
    color: inkColor(),
    alpha: beside ? (dark ? 0.3 : 0.22) : cw < 760 ? 0.1 : 0.14,
    // A hair lighter at the foot, where the stats sit under it.
    alphaFoot: beside ? (dark ? 0.16 : 0.12) : 0.03,
    fit,
    ...(beside ? { right: inset } : { shiftX: 0.02 }),
    shiftY: beside ? 0 : -0.15,
  });
}

// The extrusion is built out of coverage, so its side walls are only as smooth
// as the mask is fine: one mask step is one stair on the silhouette. The panels
// show the mask at the size the reader asked for; the solid is cut from a
// finer one, which costs a few milliseconds once per change.
function solidMask(gi, ppem) {
  const fine = Math.min(192, Math.max(96, Math.round(ppem * 2.4)));
  return { mask: getMask(gi, fine), ppem: fine };
}

function renderAnatomy() {
  const ch = (document.getElementById("anaChar").value || "g")[0];
  const ppem = parseInt(document.getElementById("anaPpem").value, 10);
  const gi = state.face ? glyphIndex(state.face, ch.charCodeAt(0)) : -1;
  if (gi < 0) {
    // The demo face has no such character — Chinese, most often. Every panel
    // shows the page's own face instead, so the anatomy is still of a glyph.
    const ink = textCoverage(ch, ppem);
    paintMask(document.getElementById("anaFill"), ink, { color: inkColor(), smooth: true });
    paintOutlineText(document.getElementById("anaOutline"), ch);
    paintMetrics(
      document.getElementById("anaMetrics"),
      ink,
      null,
      textFontMetrics(ch),
      state.units,
      ppem,
      ch,
    );
    const r3d = renderers.ana;
    if (r3d) {
      const fine = textCoverage(ch, 160);
      // Thinner strokes than a Latin capital: the slab keeps its proportion
      // to the drawing, not to the em.
      r3d.depth = Math.max(10, 160 * 0.12);
      r3d.setMask(fine);
    }
    return;
  }
  const mask = getMask(gi, ppem);
  paintMask(document.getElementById("anaFill"), mask, { color: inkColor(), smooth: true });
  const out = outlineSvg(state.face, gi);
  paintOutline(
    document.getElementById("anaOutline"),
    out.ok ? out.value : "",
    inkBox(mask, state.units, ppem),
  );
  const path = out.ok ? new Path2D(out.value) : null;
  paintMetrics(
    document.getElementById("anaMetrics"),
    mask,
    path,
    fontMetrics(state.face),
    state.units,
    ppem,
  );

  const r3d = renderers.ana;
  if (r3d) {
    const solid = solidMask(gi, ppem);
    // Depth is a fraction of the em, so it is expressed in the mask's pixels.
    r3d.depth = Math.max(8, solid.ppem * 0.22);
    r3d.setMask(solid.mask);
  }
}

function renderGrid(container, text, opts = {}) {
  if (!container) return { absent: [] };
  container.innerHTML = "";
  if (!state.face) return { absent: [] };
  const ppem = opts.ppem || 72;
  const chars = Array.from(text || "");
  const absent = [];
  for (const ch of chars) {
    const tile = document.createElement("div");
    tile.className = "tile";
    const cv = document.createElement("canvas");
    tile.appendChild(cv);
    const label = document.createElement("span");
    label.className = "tile__ch";
    label.textContent = ch === " " ? "␣" : ch;
    tile.appendChild(label);
    container.appendChild(tile);
    if (ch === " ") {
      paintMask(cv, null);
      continue;
    }
    // Code points, not code units: a character outside the basic plane is two
    // units long, and would otherwise be looked up as half of itself.
    const gi = glyphIndex(state.face, ch.codePointAt(0));
    if (gi < 0) {
      // Not in the face. Where the grid is a courtesy, the page's own face
      // stands in at full strength. Where the grid is a test of the file, it
      // stands in faintly behind a dashed rule — an empty tile cannot be told
      // apart from a renderer that failed, and the reader is owed the
      // difference.
      if (opts.fallback) {
        paintMask(cv, textCoverage(ch, ppem), {
          color: inkColor(),
          smooth: true,
          fit: 0.76,
        });
      } else if (opts.markAbsent) {
        paintMask(cv, textCoverage(ch, ppem), {
          color: inkColor(),
          smooth: true,
          alpha: 0.42,
          fit: 0.76,
        });
        tile.dataset.absent = "true";
        tile.title = "Not in this file — set in the page's face.";
        absent.push(ch);
      } else {
        paintMask(cv, null);
      }
      continue;
    }
    const mask = getMask(gi, ppem);
    paintMask(cv, mask, { color: inkColor(), smooth: true, fit: 0.76 });
    if (opts.clickTo3d) {
      tile.style.cursor = "pointer";
      tile.addEventListener("click", () => {
        const lab = document.getElementById("lab3dChar");
        if (lab) {
          lab.value = ch;
          renderLab3d();
          document.getElementById("lab3d").scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  }
  return { absent };
}

function renderUpload() {
  const grid = document.getElementById("uploadGrid");
  // A file that would not decode leaves the section empty until another one
  // does; repainting it from the previous face would contradict the name above.
  if (state.uploadError) {
    if (grid) grid.innerHTML = "";
    return;
  }
  const text = document.getElementById("uploadText").value;
  const drawn = renderGrid(grid, text, {
    ppem: 72,
    clickTo3d: true,
    markAbsent: true,
  });
  const note = document.getElementById("uploadNote");
  if (!note) return;
  const missing = drawn ? drawn.absent : [];
  note.hidden = missing.length === 0;
  if (!missing.length) return;
  const shown = missing.slice(0, 6).join(", ");
  const rest = missing.length > 6 ? " and " + (missing.length - 6) + " more" : "";
  note.textContent =
    (state.fontName || "This file") + " has no glyph for " + shown + rest +
    ". Those tiles are set in the page's own face, faintly, behind a dashed rule.";
}

function renderPlayground() {
  const text = document.getElementById("pgText").value;
  renderGrid(document.getElementById("pgGrid"), text, {
    ppem: 72,
    clickTo3d: true,
    fallback: true,
  });
}

function renderLab3d() {
  const r = renderers.lab;
  if (!r) return;
  const ch = (document.getElementById("lab3dChar").value || "R")[0];
  const gi = state.face ? glyphIndex(state.face, ch.charCodeAt(0)) : -1;
  const solid =
    gi >= 0
      ? solidMask(gi, 96)
      : { mask: ch ? textCoverage(ch, 160) : null, ppem: 160 };
  const asked = parseInt(document.getElementById("lab3dDepth").value, 10);
  r.depth = (asked * solid.ppem) / 96;
  r.setLight(parseInt(document.getElementById("lab3dLight").value, 10));
  r.setMask(solid.mask);
}

function renderAll() {
  renderHero();
  renderAnatomy();
  renderPlayground();
  renderUpload();
  renderLab3d();
}

// ---- Wiring ----
const renderers = {};

async function loadDemo() {
  try {
    const res = await fetch(DEMO_URL);
    const buf = await res.arrayBuffer();
    const r = decodeBytes(buf);
    if (!r.ok) {
      console.error("demo font decode failed", r.error);
      return;
    }
    state.face = r.value;
    state.fontName = "JetBrains Mono";
    state.units = unitsPerEm(state.face);
    maskCache.clear();
    renderAll();
  } catch (e) {
    console.error("could not load demo font", e);
  }
}

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const r = decodeBytes(reader.result);
    if (!r.ok) {
      const info = document.getElementById("uploadInfo");
      if (info) {
        info.hidden = false;
        document.getElementById("uploadName").textContent = file.name;
        document.getElementById("uploadMeta").textContent = " — could not decode this file";
      }
      // Nothing was drawn, so nothing is left on the sheet: keeping the previous
      // file's tiles under this file's name would be a lie about what is shown.
      state.uploadError = file.name;
      const grid = document.getElementById("uploadGrid");
      if (grid) grid.innerHTML = "";
      const note = document.getElementById("uploadNote");
      if (note) {
        note.hidden = false;
        note.textContent =
          "moonfont could not read this file, so nothing was drawn. The other " +
          "specimens on the page are still set in the face that loaded before it.";
      }
      return;
    }
    state.face = r.value;
    state.fontName = file.name;
    state.units = unitsPerEm(state.face);
    state.uploadError = null;
    maskCache.clear();
    const info = document.getElementById("uploadInfo");
    if (info) {
      info.hidden = false;
      document.getElementById("uploadName").textContent = file.name;
      const m = fontMetrics(state.face);
      document.getElementById("uploadMeta").textContent =
        ` — ${numGlyphs(state.face)} glyphs, ${state.units} units/em` +
        (m ? `, ascent ${m.ascent}` : "");
    }
    renderAll();
  };
  reader.readAsArrayBuffer(file);
}

function init() {
  // ES modules require an http(s) origin; warn if opened from the filesystem.
  if (location.protocol === "file:") {
    const w = document.getElementById("fileWarning");
    if (w) w.hidden = false;
  }

  renderers.ana = createRenderer(document.getElementById("ana3d"), {
    autoRotate: true,
    yaw: 0.34,
    pitch: 0.14,
  });
  renderers.lab = createRenderer(document.getElementById("lab3dCanvas"), {
    autoRotate: false,
    yaw: 0.36,
    pitch: 0.16,
  });
  if (renderers.ana) {
    // A gentle push when the page loads: the solid turns far enough to read as
    // a solid, then friction takes the turn away and it rests. A reader who
    // asked for less motion gets the resting view straight away.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderers.ana.spin = still ? 0 : 0.006;
    renderers.ana.start();
  }
  if (renderers.lab) renderers.lab.start();

  // The panels are painted in the page's ink and the solids are lit in it, so
  // a change of impression repaints them instead of leaving the old colour.
  const applyPalette = () => {
    // On paper the ink is nearly black, and a black solid shows no shading at
    // all; a little of the ground mixed in keeps its faces readable.
    const ink = hexToRgb(inkColor());
    const ground = hexToRgb(cssVar("--bg-panel", "#121216"));
    const dark = (document.documentElement.dataset.theme || "dark") === "dark";
    const t = dark ? 0 : 0.24;
    const colour = [
      (ink.r + (ground.r - ink.r) * t) / 255,
      (ink.g + (ground.g - ink.g) * t) / 255,
      (ink.b + (ground.b - ink.b) * t) / 255,
    ];
    for (const renderer of Object.values(renderers)) {
      if (renderer) renderer.color = colour;
    }
  };
  applyPalette();
  let repaint = 0;
  new MutationObserver(() => {
    cancelAnimationFrame(repaint);
    repaint = requestAnimationFrame(() => {
      applyPalette();
      renderAll();
    });
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Hero
  const heroChar = document.getElementById("heroChar");
  heroChar.addEventListener("input", renderHero);

  // Anatomy
  document.getElementById("anaChar").addEventListener("input", renderAnatomy);
  document.getElementById("anaPpem").addEventListener("change", renderAnatomy);

  // Upload
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fileInput.click();
  });
  fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));
  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add("is-drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-drag");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    const f = e.dataTransfer && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  document.getElementById("uploadText").addEventListener("input", renderUpload);

  // Playground
  document.getElementById("pgText").addEventListener("input", renderPlayground);

  // 3D lab
  document.getElementById("lab3dChar").addEventListener("input", renderLab3d);
  document.getElementById("lab3dDepth").addEventListener("input", renderLab3d);
  document.getElementById("lab3dLight").addEventListener("input", renderLab3d);
  document.getElementById("lab3dReset").addEventListener("click", () => {
    renderers.lab.reset();
  });

  // Re-render on resize (canvas-backed panels).
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      renderHero();
      renderAnatomy();
      renderPlayground();
      renderUpload();
    }, 150);
  });

  loadDemo();
}

init();

// The figures in the hero are read from the source by scripts/build_site.py and
// written to numbers.json. The markup carries a fallback so the first paint is
// never empty; the file only corrects it.
async function loadFigures() {
  try {
    const response = await fetch("./numbers.json", { cache: "no-cache" });
    if (!response.ok) return;
    const numbers = await response.json();
    for (const node of document.querySelectorAll("[data-count]")) {
      const key = node.dataset.count;
      if (Object.prototype.hasOwnProperty.call(numbers, key)) {
        node.textContent = String(numbers[key]);
      }
    }
  } catch (error) {
    /* A page opened from file:// cannot fetch; the fallbacks stand. */
  }
}
loadFigures();

