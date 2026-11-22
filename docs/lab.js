// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// moonfont interactive lab.
//
// Loads the compiled engine (./engine/moonfont.js, which wraps the
// MoonBit JS backend output) and drives it live in the browser: decode font
// files, rasterise glyphs to coverage masks, read SVG outlines, and extrude
// glyphs in WebGL. Nothing is uploaded and nothing is fetched from a network.

import { startCollisionTray } from "./collision.js";
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
  fontName: "DejaVu Sans Mono",
  units: 2048,
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
  const color = opts.color || "#ededf0";
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
  const scale = Math.min(canvas.width / mask.width, canvas.height / mask.height) * 0.84;
  const dw = mask.width * scale;
  const dh = mask.height * scale;
  const dx = (canvas.width - dw) / 2 + (opts.shiftX || 0) * canvas.width;
  const dy = (canvas.height - dh) / 2;
  ctx.drawImage(off, 0, 0, mask.width, mask.height, dx, dy, dw, dh);
  ctx.shadowBlur = 0;
}

// Draw an SVG outline path (font coordinates, y up) inside an <svg> element,
// fitted into the em square.
function paintOutline(svgEl, path, units) {
  if (!svgEl) return;
  svgEl.setAttribute("viewBox", `0 0 ${units} ${units}`);
  svgEl.innerHTML = "";
  if (!path) return;
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", path);
  // The engine emits the path with y already pointing down, in font units, so
  // the pen origin is at the top of the viewBox: translate, do not flip.
  p.setAttribute("transform", `translate(0 ${units})`);
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", "#ededf0");
  p.setAttribute("stroke-width", String(units * 0.012));
  p.setAttribute("stroke-linejoin", "round");
  p.setAttribute("stroke-linecap", "round");
  svgEl.appendChild(p);
}

// Draw the glyph plus the em-square metric rules.
function paintMetrics(canvas, mask, metrics, units) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;

  // Fit the em square (units x units) into the canvas.
  const pad = 22 * dpr;
  const s = (Math.min(w, h) - pad * 2) / units;
  const ox = (w - units * s) / 2;
  const oy = (h - units * s) / 2;
  const X = (fx) => ox + fx * s;
  const Y = (fy) => oy + (units - fy) * s; // y up -> screen down

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1 * dpr;
  ctx.strokeRect(X(0), Y(units), units * s, units * s);

  const rule = (fy, label, dash) => {
    ctx.save();
    ctx.setLineDash(dash ? [6 * dpr, 6 * dpr] : []);
    ctx.strokeStyle = "rgba(255,90,54,0.55)";
    ctx.beginPath();
    ctx.moveTo(X(0), Y(fy));
    ctx.lineTo(X(units), Y(fy));
    ctx.stroke();
    ctx.restore();
    if (label) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `${11 * dpr}px ui-monospace, monospace`;
      ctx.fillText(label, X(units) + 6 * dpr, Y(fy) + 3 * dpr);
    }
  };
  rule(metrics.ascent, "ascender", true);
  rule(metrics.cap_height, "cap", true);
  rule(metrics.x_height, "x-height", true);
  rule(0, "baseline", false);
  rule(metrics.descent, "descender", true);

  // Faint glyph fill from the mask, scaled to em square.
  if (mask) {
    const off = document.createElement("canvas");
    off.width = mask.width;
    off.height = mask.height;
    const octx = off.getContext("2d");
    const img = octx.createImageData(mask.width, mask.height);
    const ms = mask.samples;
    for (let i = 0; i < ms.length; i++) {
      img.data[i * 4] = 237;
      img.data[i * 4 + 1] = 237;
      img.data[i * 4 + 2] = 240;
      img.data[i * 4 + 3] = ms[i];
    }
    octx.putImageData(img, 0, 0);
    const gw = mask.width * s;
    const gh = mask.height * s;
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.85;
    ctx.drawImage(off, 0, 0, mask.width, mask.height, X(0), Y(units) - gh, gw, gh);
    ctx.globalAlpha = 1;
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
      float d = max(dot(N, L), 0.0);
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

  const r = {
    gl,
    mask: null,
    depth: opts.depth || 56,
    light: 45,
    yaw: opts.yaw || 0.5,
    pitch: opts.pitch || 0.25,
    autoRotate: opts.autoRotate !== false,
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
    const z1 = r.depth;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!covered(x, y)) continue;
        // top face (z = depth), normal up
        pushQuad(x, y, z1, x + 1, y, z1, x + 1, y + 1, z1, x, y + 1, z1, 0, 0, 1);
        if (!covered(x - 1, y))
          pushQuad(x, y, z1, x, y + 1, z1, x, y + 1, 0, x, y, 0, -1, 0, 0);
        if (!covered(x + 1, y))
          pushQuad(x + 1, y, z1, x + 1, y + 1, z1, x + 1, y + 1, 0, x + 1, y, 0, 1, 0, 0);
        if (!covered(x, y - 1))
          pushQuad(x, y, z1, x + 1, y, z1, x + 1, y, 0, x, y, 0, 0, -1, 0);
        if (!covered(x, y + 1))
          pushQuad(x, y + 1, z1, x + 1, y + 1, z1, x + 1, y + 1, 0, x, y + 1, 0, 0, 1, 0);
      }
    }
    r.vertexCount = positions.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  }

  r.setMask = (mask) => {
    r.mask = mask;
    buildGeometry();
  };
  r.setDepth = (d) => {
    r.depth = d;
    if (r.mask) buildGeometry();
  };
  r.setLight = (deg) => {
    r.light = deg;
  };
  r.reset = () => {
    r.yaw = opts.yaw || 0.5;
    r.pitch = opts.pitch || 0.25;
  };

  // Minimal mat4 helpers.
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
    const o = new Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        o[i * 4 + j] =
          a[i * 4] * b[j] +
          a[i * 4 + 1] * b[4 + j] +
          a[i * 4 + 2] * b[8 + j] +
          a[i * 4 + 3] * b[12 + j];
      }
    }
    return o;
  }
  function rotationX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  }
  function rotationY(a) {
    const c = Math.cos(a), s = Math.sin(a);
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
    if (r.autoRotate && !r.dragging) r.yaw += 0.006;
    const aspect = canvas.width / canvas.height;
    const proj = perspective((45 * Math.PI) / 180, aspect, 0.1, 100);
    const view = translation(0, 0, -5.2);
    const model = multiply(rotationY(r.yaw), rotationX(r.pitch));

    // Fit: scale so the mask's largest dimension is about 3.4 world units.
    let cx = 0, cy = 0;
    if (r.mask) {
      cx = r.mask.width / 2;
      cy = r.mask.height / 2;
    }
    const span = r.mask ? Math.max(r.mask.width, r.mask.height, 1) : 1;
    const fit = 3.4 / span;

    // Bake the centring + fit into the model matrix (column-major combine).
    const fitMat = [
      fit, 0, 0, 0,
      0, fit, 0, 0,
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
    r.yaw += (ev.clientX - r.lastX) * 0.01;
    r.pitch += (ev.clientY - r.lastY) * 0.01;
    r.pitch = Math.max(-1.4, Math.min(1.4, r.pitch));
    r.lastX = ev.clientX;
    r.lastY = ev.clientY;
  });
  const stop = (ev) => {
    r.dragging = false;
    if (ev.pointerId != null && canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
    }
  };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);

  r.start = () => {
    const loop = () => {
      r.frame();
      r._raf = requestAnimationFrame(loop);
    };
    loop();
  };

  return r;
}

// ---- Section renderers ----
function renderHero() {
  const canvas = document.getElementById("heroCanvas");
  const ch = (document.getElementById("heroChar").value || "A")[0];
  if (!state.face || !ch) return;
  const gi = glyphIndex(state.face, ch.charCodeAt(0));
  if (gi < 0) {
    paintMask(canvas, null);
    return;
  }
  const mask = getMask(gi, 220);
  // The glyph is the backdrop for the title, so it is drawn at just over half
  // strength and shifted right: the heading has to stay crisp over it.
  paintMask(canvas, mask, {
    color: "#ffffff",
    glow: 26,
    smooth: true,
    alpha: 0.42,
    shiftX: 0.13,
  });
}

function renderAnatomy() {
  const ch = (document.getElementById("anaChar").value || "g")[0];
  const ppem = parseInt(document.getElementById("anaPpem").value, 10);
  const gi = state.face ? glyphIndex(state.face, ch.charCodeAt(0)) : -1;
  if (gi < 0) {
    ["anaFill", "ana3d"].forEach((id) => paintMask(document.getElementById(id), null));
    paintOutline(document.getElementById("anaOutline"), "", state.units);
    return;
  }
  const mask = getMask(gi, ppem);
  paintMask(document.getElementById("anaFill"), mask, { color: "#ededf0", smooth: true });
  const out = outlineSvg(state.face, gi);
  paintOutline(document.getElementById("anaOutline"), out.ok ? out.value : "", state.units);
  paintMetrics(document.getElementById("anaMetrics"), mask, fontMetrics(state.face), state.units);

  const r3d = renderers.ana;
  if (r3d) {
    r3d.depth = Math.max(8, ppem * 0.7);
    r3d.setMask(mask);
  }
}

function renderGrid(container, text, opts = {}) {
  if (!container) return;
  container.innerHTML = "";
  if (!state.face) return;
  const ppem = opts.ppem || 72;
  const chars = Array.from(text || "");
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
    const gi = glyphIndex(state.face, ch.charCodeAt(0));
    if (gi < 0) {
      paintMask(cv, null);
      continue;
    }
    const mask = getMask(gi, ppem);
    paintMask(cv, mask, { color: "#ededf0", smooth: true });
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
}

function renderUpload() {
  const text = document.getElementById("uploadText").value;
  renderGrid(document.getElementById("uploadGrid"), text, { ppem: 72, clickTo3d: true });
}

function renderPlayground() {
  const text = document.getElementById("pgText").value;
  renderGrid(document.getElementById("pgGrid"), text, { ppem: 72, clickTo3d: true });
}

function renderLab3d() {
  const r = renderers.lab;
  if (!r) return;
  const ch = (document.getElementById("lab3dChar").value || "R")[0];
  const gi = state.face ? glyphIndex(state.face, ch.charCodeAt(0)) : -1;
  const mask = gi >= 0 ? getMask(gi, 96) : null;
  r.depth = parseInt(document.getElementById("lab3dDepth").value, 10);
  r.setLight(parseInt(document.getElementById("lab3dLight").value, 10));
  r.setMask(mask);
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
    state.fontName = "DejaVu Sans Mono";
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
      return;
    }
    state.face = r.value;
    state.fontName = file.name;
    state.units = unitsPerEm(state.face);
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
    yaw: 0.6,
    pitch: 0.3,
  });
  renderers.lab = createRenderer(document.getElementById("lab3dCanvas"), {
    autoRotate: false,
    yaw: 0.5,
    pitch: 0.25,
  });
  if (renderers.ana) renderers.ana.start();
  if (renderers.lab) renderers.lab.start();

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

// The tray runs its own small physics; this only hands it the element and the
// page's motion preference.
const tray = document.getElementById("tray");
if (tray) {
  startCollisionTray(tray, {
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
}

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

