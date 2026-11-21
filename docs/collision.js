// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// A tray of sorts. Each glyph is a rigid body whose outline came out of the
// engine in this page; its collision shape is a handful of circles laid over the
// coverage mask, so a letter stacks on another letter the way a flat casting
// would, and a throw spins it.
//
// The physics is deliberately small: one fixed step, gravity, circle contacts
// solved by sequential impulses with friction and restitution, and a spring for
// the pointer. Nothing here draws type with a webfont — every outline is a path
// string the engine produced.

import {
  decodeBytes,
  glyphIndex,
  numGlyphs,
  unitsPerEm,
  rasterise,
  outlineSvg,
} from "./vendor/moonfont/moonfont.js";

const DEMO_URL = "./vendor/moonfont/demo.ttf";
const GLYPH_CAPACITY = 14;

export function startCollisionTray(root, options = {}) {
  const canvas = root.querySelector("canvas");
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  const reduce = options.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    bodies: [],
    face: null,
    units: 1000,
    pointer: { down: false, body: null, x: 0, y: 0, px: 0, py: 0 },
    running: false,
    frame: 0,
    scale: 1,
  };

  const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#ededf0";

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.scale = dpr;
  }

  // A body at the size the page wants, from one glyph.
  function makeBody(glyph, x, y) {
    const ppem = 96;
    const mask = rasterise(state.face, glyph, ppem);
    if (!mask || !mask.ok) return null;
    const value = mask.value;
    const path = outlineSvg(state.face, glyph);
    if (!path || !path.ok) return null;

    const px = 1 / 64; // the mask origin and glyph space are both in 26.6
    // A mask pixel is one 96th of an em, so a font unit is this many pixels.
    const s = ppem / state.units;
    const width = value.width || 1;
    const height = value.height || 1;
    // One circle per filled cell, sampled sparsely enough that a letter is a
    // few dozen circles rather than a thousand.
    const stride = Math.max(1, Math.round(Math.min(width, height) / 9));
    const radius = (stride * px) / 2;
    const spheres = [];
    for (let row = 0; row < height; row += stride) {
      for (let col = 0; col < width; col += stride) {
        let cover = 0;
        let cells = 0;
        for (let dy = 0; dy < stride && row + dy < height; dy++) {
          for (let dx = 0; dx < stride && col + dx < width; dx++) {
            cover += value.samples[(row + dy) * width + col + dx];
            cells++;
          }
        }
        if (cells && cover / (cells * 255) > 0.5) {
          spheres.push({
            x: (col + stride / 2) * px + value.left,
            y: -(row + stride / 2) * px + value.top,
            r: radius,
          });
        }
      }
    }
    if (spheres.length === 0) return null;

    // The body's local origin is the middle of its ink, so rotation looks right.
    let cx = 0;
    let cy = 0;
    for (const s of spheres) {
      cx += s.x;
      cy += s.y;
    }
    cx /= spheres.length;
    cy /= spheres.length;
    for (const s of spheres) {
      s.x -= cx;
      s.y -= cy;
    }

    const mass = spheres.length * 1.0;
    let inertia = 0;
    for (const s of spheres) {
      inertia += mass / spheres.length * (s.x * s.x + s.y * s.y) + mass / spheres.length * s.r * s.r * 0.5;
    }
    const path2d = new Path2D(path.value);
    return {
      glyph,
      path: path2d,
      // The outline is in font units and the body in mask pixels.
      scale: s,
      pathBox: { x: cx / s, y: cy / s },
      spheres,
      x,
      y,
      angle: 0,
      vx: 0,
      vy: 0,
      omega: 0,
      mass,
      inertia: Math.max(inertia, 1),
      radius: Math.max(...spheres.map((s) => Math.hypot(s.x, s.y) + s.r)),
      held: false,
    };
  }

  function addGlyph() {
    if (!state.face || state.bodies.length >= GLYPH_CAPACITY) return;
    const count = numGlyphs(state.face);
    for (let attempt = 0; attempt < 24; attempt++) {
      const glyph = Math.floor(Math.random() * count);
      const codepoint = 0x41 + Math.floor(Math.random() * 26);
      const chosen = glyphIndex(state.face, codepoint);
      const gid = chosen >= 0 ? chosen : glyph;
      const body = makeBody(gid, 60 + Math.random() * (canvas.clientWidth - 120), -120 - Math.random() * 80);
      if (body) {
        body.angle = (Math.random() - 0.5) * 0.6;
        body.omega = (Math.random() - 0.5) * 2;
        state.bodies.push(body);
        return;
      }
    }
  }

  // --- physics ------------------------------------------------------------

  const GRAVITY = 2100; // pixels per second squared
  const STEP = 1 / 120;
  const ITERATIONS = 6;

  function contactsOf(body, floor, ceiling) {
    const list = [];
    for (let i = 0; i < body.spheres.length; i++) {
      const s = body.spheres[i];
      const cos = Math.cos(body.angle);
      const sin = Math.sin(body.angle);
      const wx = body.x + s.x * cos - s.y * sin;
      const wy = body.y + s.x * sin + s.y * cos;
      if (wy + s.r > floor) list.push({ i, nx: 0, ny: -1, depth: wy + s.r - floor, wx, wy });
      if (wy - s.r < ceiling) list.push({ i, nx: 0, ny: 1, depth: ceiling - (wy - s.r), wx, wy });
      const left = s.r - (wx - 0);
      if (left > 0) list.push({ i, nx: 1, ny: 0, depth: left, wx, wy });
      const right = s.r - (canvas.clientWidth - wx);
      if (right > 0) list.push({ i, nx: -1, ny: 0, depth: right, wx, wy });
    }
    return list;
  }

  function applyImpulse(body, nx, ny, wx, wy, j) {
    body.vx += (nx * j) / body.mass;
    body.vy += (ny * j) / body.mass;
    const rx = wx - body.x;
    const ry = wy - body.y;
    body.omega += (rx * (ny * j) - ry * (nx * j)) / body.inertia;
  }

  function pointVelocity(body, wx, wy) {
    const rx = wx - body.x;
    const ry = wy - body.y;
    return { x: body.vx - body.omega * ry, y: body.vy + body.omega * rx };
  }

  function solvePair(a, b, nx, ny, depth, wa, wb) {
    // The normal points from a to b.
    const va = pointVelocity(a, wa.x, wa.y);
    const vb = pointVelocity(b, wb.x, wb.y);
    const rvx = vb.x - va.x;
    const rvy = vb.y - va.y;
    const along = rvx * nx + rvy * ny;
    const rax = wa.x - a.x;
    const ray = wa.y - a.y;
    const rbx = wb.x - b.x;
    const rby = wb.y - b.y;
    const crossA = rax * ny - ray * nx;
    const crossB = rbx * ny - rby * nx;
    const inv = 1 / a.mass + 1 / b.mass + (crossA * crossA) / a.inertia + (crossB * crossB) / b.inertia;
    const restitution = 0.12;
    const bias = Math.min(depth, 4) * 26;
    const j = (-(1 + restitution) * along + bias) / inv;
    if (j <= 0) return;
    applyImpulse(a, -nx, -ny, wa.x, wa.y, j);
    applyImpulse(b, nx, ny, wb.x, wb.y, j);

    // Friction along the tangent, clamped by the normal impulse.
    const tx = -ny;
    const ty = nx;
    const vta = pointVelocity(a, wa.x, wa.y);
    const vtb = pointVelocity(b, wb.x, wb.y);
    const alongT = (vtb.x - vta.x) * tx + (vtb.y - vta.y) * ty;
    const crossAT = rax * ty - ray * tx;
    const crossBT = rbx * ty - rby * tx;
    const invT = 1 / a.mass + 1 / b.mass + (crossAT * crossAT) / a.inertia + (crossBT * crossBT) / b.inertia;
    let jt = -alongT / invT;
    const limit = j * 0.45;
    if (jt > limit) jt = limit;
    if (jt < -limit) jt = -limit;
    applyImpulse(a, -tx, -ty, wa.x, wa.y, jt);
    applyImpulse(b, tx, ty, wb.x, wb.y, jt);
  }

  function step(dt) {
    const floor = canvas.clientHeight - 6;
    const ceiling = 6;

    for (const body of state.bodies) {
      if (body.held) continue;
      body.vy += GRAVITY * dt;
      body.vx *= 0.999;
      body.omega *= 0.998;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.omega * dt;
    }

    for (let pass = 0; pass < ITERATIONS; pass++) {
      const world = [];
      for (const body of state.bodies) {
        const cos = Math.cos(body.angle);
        const sin = Math.sin(body.angle);
        const points = body.spheres.map((s) => ({
          x: body.x + s.x * cos - s.y * sin,
          y: body.y + s.x * sin + s.y * cos,
          r: s.r,
        }));
        world.push(points);
      }
      for (let i = 0; i < state.bodies.length; i++) {
        const body = state.bodies[i];
        for (const contact of contactsOf(body, floor, ceiling)) {
          const va = pointVelocity(body, contact.wx, contact.wy);
          const along = va.x * contact.nx + va.y * contact.ny;
          const rax = contact.wx - body.x;
          const ray = contact.wy - body.y;
          const cross = rax * contact.ny - ray * contact.nx;
          const inv = 1 / body.mass + (cross * cross) / body.inertia;
          const restitution = 0.06;
          const j = (-(1 + restitution) * along + Math.min(contact.depth, 4) * 26) / inv;
          if (j > 0 && contact.depth > 0) {
            applyImpulse(body, contact.nx, contact.ny, contact.wx, contact.wy, j);
            // Friction against the tray.
            const tx = -contact.ny;
            const ty = contact.nx;
            const vt = pointVelocity(body, contact.wx, contact.wy);
            const alongT = vt.x * tx + vt.y * ty;
            const crossT = rax * ty - ray * tx;
            const invT = 1 / body.mass + (crossT * crossT) / body.inertia;
            let jt = -alongT / invT;
            const limit = j * 0.5;
            jt = Math.max(-limit, Math.min(limit, jt));
            applyImpulse(body, tx, ty, contact.wx, contact.wy, jt);
          }
        }
      }
      for (let i = 0; i < state.bodies.length; i++) {
        for (let k = i + 1; k < state.bodies.length; k++) {
          const a = state.bodies[i];
          const b = state.bodies[k];
          const pa = world[i];
          const pb = world[k];
          for (let p = 0; p < pa.length; p++) {
            for (let q = 0; q < pb.length; q++) {
              const dx = pb[q].x - pa[p].x;
              const dy = pb[q].y - pa[p].y;
              const reach = pa[p].r + pb[q].r;
              const distance = Math.hypot(dx, dy) || 0.0001;
              if (distance >= reach) continue;
              const nx = dx / distance;
              const ny = dy / distance;
              solvePair(a, b, nx, ny, reach - distance, pa[p], pb[q]);
            }
          }
        }
      }
    }

    for (const body of state.bodies) {
      if (body.held) continue;
      // A body that leaves the tray sideways is gone; the tray refills.
      if (body.y > canvas.clientHeight + 400) body.dead = true;
    }
    state.bodies = state.bodies.filter((body) => !body.dead);
  }

  function pointerDown(event) {
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    let best = null;
    let bestDistance = Infinity;
    for (const body of state.bodies) {
      const d = Math.hypot(body.x - x, body.y - y);
      if (d < body.radius + 24 && d < bestDistance) {
        best = body;
        bestDistance = d;
      }
    }
    if (best) {
      best.held = true;
      state.pointer = { down: true, body: best, x, y, px: x, py: y };
      canvas.setPointerCapture(event.pointerId);
    }
  }

  function pointerMove(event) {
    if (!state.pointer.down || !state.pointer.body) return;
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    state.pointer.px = state.pointer.x;
    state.pointer.py = state.pointer.y;
    state.pointer.x = x;
    state.pointer.y = y;
  }

  function pointerUp() {
    const body = state.pointer.body;
    if (body) {
      body.held = false;
      body.vx = (state.pointer.x - state.pointer.px) * 45;
      body.vy = (state.pointer.y - state.pointer.py) * 45;
      body.omega = (Math.random() - 0.5) * 3;
    }
    state.pointer = { down: false, body: null, x: 0, y: 0, px: 0, py: 0 };
  }

  // --- drawing ------------------------------------------------------------

  function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = ink;
    for (const body of state.bodies) {
      ctx.save();
      ctx.translate(body.x, body.y);
      ctx.rotate(body.angle);
      ctx.scale(body.scale, body.scale);
      ctx.translate(-body.pathBox.x, -body.pathBox.y);
      ctx.globalAlpha = body.held ? 0.75 : 1;
      ctx.fillStyle = ink;
      ctx.fill(body.path);
      ctx.restore();
    }
  }

  let last = 0;
  let accumulator = 0;

  function frame(now) {
    if (!state.running) return;
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    accumulator += dt;
    while (accumulator >= STEP) {
      if (state.pointer.body) {
        const body = state.pointer.body;
        body.vx = (state.pointer.x - body.x) * 18;
        body.vy = (state.pointer.y - body.y) * 18;
      }
      step(STEP);
      accumulator -= STEP;
    }
    draw();
    state.frame = requestAnimationFrame(frame);
  }

  function settle() {
    // Reduced motion: drop everything once, then hold the result.
    for (let i = 0; i < 900; i++) step(STEP);
    draw();
  }

  async function boot() {
    resize();
    try {
      const response = await fetch(DEMO_URL);
      const decoded = decodeBytes(await response.arrayBuffer());
      if (!decoded || !decoded.ok) return;
      state.face = decoded.value;
      state.units = unitsPerEm(state.face) || 1000;
      for (let i = 0; i < 7; i++) addGlyph();
      if (reduce) {
        draw();
      } else {
        state.running = true;
        state.frame = requestAnimationFrame(frame);
      }
    } catch (error) {
      root.dataset.state = "unavailable";
    }
  }

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  const refill = root.querySelector("[data-refill]");
  if (refill) refill.addEventListener("click", () => addGlyph());

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const visible = entry.isIntersecting;
      if (visible && !reduce && !state.running) {
        state.running = true;
        last = 0;
        state.frame = requestAnimationFrame(frame);
      } else if (!visible && state.running) {
        state.running = false;
        cancelAnimationFrame(state.frame);
      }
    }
  });
  observer.observe(canvas);

  boot();

  return () => {
    state.running = false;
    cancelAnimationFrame(state.frame);
    observer.disconnect();
    canvas.removeEventListener("pointerdown", pointerDown);
    canvas.removeEventListener("pointermove", pointerMove);
    canvas.removeEventListener("pointerup", pointerUp);
    canvas.removeEventListener("pointercancel", pointerUp);
  };
}
