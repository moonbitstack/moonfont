// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The casting tray.
//
// Every letter below is a rigid body whose outline came out of this engine:
// the coverage mask is sampled into convex hulls, matter-js collides them, and
// the page's own controls are static bodies, so a letter can come to rest on
// the button that dropped it.
//
// The tray is a plane, not a box. Depth is drawn rather than simulated: a
// casting is the outline extruded towards the camera and lit from one
// direction, with the extrusion direction following the pointer by a few
// degrees, and a contact shadow that lengthens when a piece is lifted. That
// keeps the collision solver exact on the plane the reader is pointing at,
// while the pieces read as solids rather than as flat silhouettes.
//
// Five renderings of the same bodies are a switch away, because the point of
// the section is that one set of engine data can be read several ways.

import type MatterApi from "matter-js";

type MatterNamespace = typeof import("matter-js");

declare global {
  interface Window {
    Matter?: MatterNamespace;
  }
}

// --- the engine's browser façade -------------------------------------------
//
// `scripts/site/loader.js` is the only JavaScript that touches the compiled
// module; this is the shape it exports. It is loaded at run time from beside
// the page, not bundled, so the page always runs the build the repository just
// produced.

interface CoverageMask {
  width: number;
  height: number;
  left: number;
  top: number;
  samples: Uint8Array;
}

type Face = object;

type Decoded<T> = { ok: true; value: T } | { ok: false; error: unknown };

interface EngineFacade {
  decodeBytes(buffer: ArrayBuffer): Decoded<Face>;
  unitsPerEm(face: Face): number;
  glyphIndex(face: Face, codepoint: number): number;
  numGlyphs(face: Face): number;
  rasterise(face: Face, glyph: number, ppem: number): Decoded<CoverageMask>;
  outlineSvg(face: Face, glyph: number): Decoded<string>;
}

// --- small utilities --------------------------------------------------------

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const MODES = ["cast", "ink", "wire", "raster", "hull"] as const;
type Mode = (typeof MODES)[number];

const MODE_NOTES: Record<Mode, string> = {
  cast: "Solid: the outline extruded towards the light, one shadow per piece.",
  ink: "Flat ink: the filled outline, as it would print.",
  wire: "Wire: the path the engine handed out, stroked and repeated in depth.",
  raster: "Raster: the coverage mask, one square per sample, grey where it is partial.",
  hull: "Hulls: the convex parts the solver actually collides.",
};

const STEP = 1000 / 60;
const BASE_PPEM = 140;
const MAX_PIECES = 20;

function clamp(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

function hexToRgb(value: string): Rgb {
  let hex = value.trim();
  if (!hex.startsWith("#")) return { r: 237, g: 237, b: 240 };
  if (hex.length === 4) {
    hex = "#" + hex.slice(1).split("").map((c) => c + c).join("");
  }
  return {
    r: parseInt(hex.slice(1, 3), 16) || 0,
    g: parseInt(hex.slice(3, 5), 16) || 0,
    b: parseInt(hex.slice(5, 7), 16) || 0,
  };
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function css(color: Rgb, alpha = 1): string {
  return alpha >= 1
    ? `rgb(${color.r} ${color.g} ${color.b})`
    : `rgb(${color.r} ${color.g} ${color.b} / ${alpha})`;
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

// --- palette ----------------------------------------------------------------

interface Palette {
  ink: Rgb;
  accent: Rgb;
  faceTop: string;
  faceBottom: string;
  ramp: string[];
  rim: string;
  shadow: string;
  contact: string;
  hullFill: string;
  hullLine: string;
  vertex: string;
}

function readPalette(): Palette {
  const computed = getComputedStyle(document.documentElement);
  const ink = hexToRgb(computed.getPropertyValue("--ink") || "#ededf0");
  const accent = hexToRgb(computed.getPropertyValue("--accent") || "#ff5a36");
  const bg = hexToRgb(computed.getPropertyValue("--bg-panel") || "#121216");
  const dark = (document.documentElement.dataset.theme || "dark") === "dark";

  // The face is lit from the upper left, the visible side is the far copy: it
  // takes the colour of the ground, which is what a side turned away from the
  // key light looks like in both impressions of the page.
  const faceTop = css(mix(ink, dark ? WHITE : BLACK, dark ? 0.05 : 0.16));
  const faceBottom = css(mix(ink, bg, dark ? 0.16 : 0.12));
  const far = mix(ink, bg, dark ? 0.74 : 0.68);
  const near = mix(ink, bg, dark ? 0.46 : 0.48);
  const ramp: string[] = [];
  for (let i = 0; i < 16; i++) {
    ramp.push(css(mix(far, near, i / 15)));
  }

  return {
    ink,
    accent,
    faceTop,
    faceBottom,
    ramp,
    rim: css(mix(ink, WHITE, dark ? 0.5 : 0.8), dark ? 0.26 : 0.3),
    shadow: dark ? "rgb(0 0 0 / 0.6)" : "rgb(23 22 26 / 0.2)",
    contact: dark ? "rgb(0 0 0 / 0.8)" : "rgb(23 22 26 / 0.38)",
    hullFill: css(accent, 0.13),
    hullLine: css(accent, 0.75),
    vertex: css(mix(accent, ink, 0.35), 0.8),
  };
}

// --- geometry ---------------------------------------------------------------

interface Hull {
  points: MatterApi.Vector[];
  centre: { x: number; y: number };
}

interface Shape {
  glyph: number;
  path: Path2D;
  mask: CoverageMask;
  /** the ink's centroid in mask pixels: the drawing pivot */
  centre: { x: number; y: number };
  /** mask pixels per font unit at the base size */
  scale: number;
  /** the ink box in font units, relative to the centroid */
  box: { x: number; y: number; w: number; h: number };
  /** collision parts, in mask pixels relative to the centroid */
  hulls: Hull[];
  /** the coarse grid the raster mode draws, in mask pixels */
  cells: { x: number; y: number; alpha: number }[];
  cell: number;
  /** the em, in mask pixels, at the base size */
  em: number;
}

/**
 * Sample the coverage mask into a grid, then into convex parts.
 *
 * One part per run of covered cells in a band of rows: a stem stays a stem, a
 * counter stays a hole, and each part is convex by construction, so matter-js
 * needs no decomposition library at all.
 */
function shapeFromMask(
  mask: CoverageMask,
  path: Path2D,
  glyph: number,
  units: number,
  ppem: number,
  M: MatterNamespace,
): Shape {
  const scale = ppem / units;
  const cell = Math.max(3, Math.round(Math.max(mask.width, mask.height) / 27));
  const cols = Math.max(1, Math.ceil(mask.width / cell));
  const rows = Math.max(1, Math.ceil(mask.height / cell));
  const cover = new Float32Array(cols * rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let sum = 0;
      let count = 0;
      for (let dy = 0; dy < cell; dy++) {
        const y = row * cell + dy;
        if (y >= mask.height) break;
        for (let dx = 0; dx < cell; dx++) {
          const x = col * cell + dx;
          if (x >= mask.width) break;
          sum += mask.samples[y * mask.width + x] ?? 0;
          count++;
        }
      }
      cover[row * cols + col] = count ? sum / (count * 255) : 0;
    }
  }

  // The centroid of the ink, weighted by coverage: a rotation about this point
  // looks like a casting turning, not like a glyph orbiting its pen.
  let mx = 0;
  let my = 0;
  let total = 0;
  const cells: { x: number; y: number; alpha: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const alpha = cover[row * cols + col] ?? 0;
      if (alpha < 0.08) continue;
      const x = mask.left + col * cell + cell / 2;
      const y = mask.top + row * cell + cell / 2;
      cells.push({ x, y, alpha });
      mx += x * alpha;
      my += y * alpha;
      total += alpha;
    }
  }
  const centre = total ? { x: mx / total, y: my / total } : { x: 0, y: 0 };

  const hulls: Hull[] = [];
  const bands = 10;
  const band = Math.max(2, Math.ceil(rows / bands));
  for (let start = 0; start < rows; start += band) {
    const end = Math.min(rows, start + band);
    const filled = new Uint8Array(cols);
    for (let row = start; row < end; row++) {
      for (let col = 0; col < cols; col++) {
        if ((cover[row * cols + col] ?? 0) > 0.22) filled[col] = 1;
      }
    }
    let col = 0;
    while (col < cols) {
      if (!filled[col]) {
        col++;
        continue;
      }
      const from = col;
      while (col < cols && filled[col]) col++;
      const points: { x: number; y: number }[] = [];
      for (let row = start; row < end; row++) {
        for (let c = from; c < col; c++) {
          if ((cover[row * cols + c] ?? 0) <= 0.22) continue;
          points.push({
            x: mask.left + c * cell + cell / 2,
            y: mask.top + row * cell + cell / 2,
          });
        }
      }
      if (points.length < 3) continue;
      // `hull` reads positions only; the vertex bookkeeping it would add is
      // matter's own business, done when the body is built.
      const vertices = M.Vertices.hull(points as unknown as MatterApi.Vertex[]);
      if (vertices.length < 3) continue;
      if (Math.abs(M.Vertices.area(vertices, false)) < cell * cell * 1.5) continue;
      const points2 = vertices.map((v) => ({
        x: v.x - centre.x,
        y: v.y - centre.y,
      }));
      let hx = 0;
      let hy = 0;
      for (const p of points2) {
        hx += p.x;
        hy += p.y;
      }
      hulls.push({
        points: points2,
        centre: { x: hx / points2.length, y: hy / points2.length },
      });
    }
  }

  return {
    glyph,
    path,
    mask,
    centre,

    scale,
    box: {
      x: (mask.left - centre.x) / scale,
      y: (mask.top - centre.y) / scale,
      w: mask.width / scale,
      h: mask.height / scale,
    },
    hulls,
    cells: cells.map((c) => ({
      x: c.x - centre.x,
      y: c.y - centre.y,
      alpha: c.alpha,
    })),
    cell,
    em: ppem,
  };
}

// --- a piece ----------------------------------------------------------------

interface Piece {
  body: MatterApi.Body;
  shape: Shape;
  /** the fraction of the base size this casting was poured at */
  factor: number;
  depth: number;
  /** the body's offset from the ink centroid at rest, in world pixels */
  pivot: { x: number; y: number };
  lift: number;
  liftTarget: number;
  /** 1 while the pointer is over this piece: the target */
  hover: number;
  /** the eased value, which lifts the piece a little */
  hoverEase: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// --- the tray ---------------------------------------------------------------

class Tray {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly note: HTMLElement | null;
  private readonly hud: HTMLElement | null;
  private readonly hudMode: HTMLElement | null;
  private readonly buttons: HTMLButtonElement[];

  private readonly M: MatterNamespace;
  private readonly engine: MatterApi.Engine;
  private readonly mouse: MatterApi.Mouse;
  private readonly grab: MatterApi.MouseConstraint;

  private face: Face | null = null;
  private units = 1000;
  private engineApi: EngineFacade | null = null;

  private pieces: Piece[] = [];
  private walls: MatterApi.Body[] = [];
  private solids: MatterApi.Body[] = [];
  private solidRects = "";

  private shapes = new Map<number, Shape>();
  private pool: number[] = [];

  private width = 0;
  private height = 0;
  private dpr = 1;
  private palette: Palette;

  private mode: Mode = "cast";
  private reduced = false;

  private raf = 0;
  private last = 0;
  private accumulator = 0;
  private parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  private fade: { canvas: HTMLCanvasElement; at: number } | null = null;
  private pointer = { x: -1, y: -1, inside: false };
  /** how much smaller a casting is than the reference stage's */
  private sizeScale = 1;
  /** where the next poured piece is set down, in canvas pixels */
  private cursor = 10;
  private originCursor = 10;
  private row = 0;
  /** seconds the whole tray has been effectively still */
  private calm = 0;
  private hovered: Piece | null = null;
  private trail: { x: number; y: number; t: number }[] = [];
  private running = false;

  constructor(root: HTMLElement, M: MatterNamespace) {
    this.root = root;
    this.M = M;
    const canvas = root.querySelector("canvas");
    if (!canvas) throw new Error("the tray needs a canvas");
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    this.ctx = ctx;

    this.note = root.querySelector("[data-mode-note]");
    this.hud = root.querySelector("[data-hud]");
    this.hudMode = root.querySelector("[data-hud-mode]");
    this.buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-mode]"));

    this.engine = M.Engine.create({ enableSleeping: true });
    this.engine.gravity.y = 1.25;
    this.engine.positionIterations = 8;
    this.engine.velocityIterations = 6;
    this.engine.constraintIterations = 3;

    this.mouse = M.Mouse.create(canvas);
    this.grab = M.MouseConstraint.create(this.engine, {
      mouse: this.mouse,
      constraint: {
        stiffness: 0.2,
        damping: 0.28,
        render: { visible: false },
      },
    });
    M.Composite.add(this.engine.world, this.grab);

    this.palette = readPalette();
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // --- lifecycle ------------------------------------------------------------

  public async start(): Promise<void> {
    this.bind();
    this.resize();
    this.engineApi = await this.loadEngine();
    if (!this.engineApi) {
      this.root.dataset.state = "unavailable";
      return;
    }
    try {
      const response = await fetch(new URL("../fonts/demo.ttf", import.meta.url));
      const decoded = this.engineApi.decodeBytes(await response.arrayBuffer());
      if (!decoded.ok) throw decoded.error;
      this.face = decoded.value;
      this.units = this.engineApi.unitsPerEm(this.face) || 1000;
    } catch {
      this.root.dataset.state = "unavailable";
      return;
    }

    this.collectGlyphs();
    // The row of castings starts beside the label rather than under it: the
    // label is a solid, and a letter behind frosted glass is a letter lost.
    const label = this.root.querySelector(".tray__note")?.getBoundingClientRect();
    const field = this.canvas.getBoundingClientRect();
    // On a phone the label spans half the tray, so the row starts at the left
    // edge instead and the label steps aside (it is hidden at that width).
    const beside = label ? label.right - field.left + 14 : 12;
    this.cursor = beside > this.width * 0.35 ? 12 : beside;
    this.originCursor = this.cursor;
    const pour = clamp(Math.round(this.width / 74), 7, 15);
    for (let i = 0; i < pour; i++) this.pour(false);
    // A composed pile is a better first impression than a shower of letters,
    // so the pour is simulated to rest before anything is drawn, and the tray
    // starts asleep: no loop, no battery, no drift. The reader starts it.
    for (let i = 0; i < 420; i++) this.M.Engine.update(this.engine, STEP);
    for (const piece of this.pieces) this.M.Sleeping.set(piece.body, true);

    this.root.dataset.state = "ready";
    this.setMode("cast");
    this.updateHud();
    this.draw(performance.now());
  }

  private async loadEngine(): Promise<EngineFacade | null> {
    try {
      const url = new URL("../engine/moonfont.js", import.meta.url).href;
      return (await import(url)) as EngineFacade;
    } catch {
      return null;
    }
  }

  private collectGlyphs(): void {
    if (!this.face || !this.engineApi) return;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&@#?%!*";
    const seen = new Set<number>();
    for (const ch of alphabet) {
      const glyph = this.engineApi.glyphIndex(this.face, ch.codePointAt(0) ?? 0);
      if (glyph > 0) seen.add(glyph);
    }
    this.pool = [...seen];
  }

  private bind(): void {
    for (const button of this.buttons) {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode as Mode;
        if (MODES.includes(mode)) this.setMode(mode);
      });
    }

    const refill = this.root.querySelector<HTMLButtonElement>("[data-refill]");
    refill?.addEventListener("click", () => {
      this.pour(true);
      this.kick();
    });

    this.canvas.addEventListener("pointerenter", (event) => {
      this.pointer.inside = true;
      this.track(event);
    });
    this.canvas.addEventListener("pointerleave", () => {
      this.pointer.inside = false;
      this.parallax.tx = 0;
      this.parallax.ty = 0;
      this.setHover(null);
      this.kick();
    });
    this.canvas.addEventListener("pointermove", (event) => this.track(event));
    this.canvas.addEventListener("pointerdown", () => this.kick());
    this.canvas.addEventListener("pointerup", () => this.release());
    this.canvas.addEventListener("pointercancel", () => this.release());
    this.canvas.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        this.pour(true);
        this.kick();
      }
    });

    // The two solids are page elements: they change size when the label wraps,
    // and the bodies have to follow, or a letter rests on air.
    const watcher = new ResizeObserver(() => this.measureSolids());
    for (const element of this.root.querySelectorAll("[data-collide]")) {
      watcher.observe(element);
    }

    this.M.Events.on(this.grab, "startdrag", () => {
      // The tray starts asleep, so a piece has to be woken before the spring
      // can move it.
      const body = this.grab.constraint.bodyB;
      if (body) this.M.Sleeping.set(body, false);
      this.kick();
    });
    this.M.Events.on(this.grab, "enddrag", () => this.release());

    window.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      this.last = 0;
      if (!document.hidden) this.kick();
    });
    new MutationObserver(() => {
      this.palette = readPalette();
      this.kick();
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) this.kick();
      }
    });
    observer.observe(this.canvas);
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    // A phone holds fewer, smaller pieces: the tray is a composition, and the
    // same eighteen castings would fill it to the frame.
    this.sizeScale = clamp(width / 1000, 0.72, 1);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    // matter reads the ratio once; a page zoom changes it, so it is written
    // back before the next pointer position is normalised.
    this.canvas.setAttribute("data-pixel-ratio", String(this.dpr));
    this.mouse.pixelRatio = this.dpr;

    this.buildBounds();
    this.measureSolids();
    this.kick();
  }

  private buildBounds(): void {
    const M = this.M;
    if (this.walls.length) M.Composite.remove(this.engine.world, this.walls);
    const slab = 120;
    const inset = 34;
    const options: MatterApi.IChamferableBodyDefinition = {
      isStatic: true,
      friction: 0.6,
      restitution: 0.02,
      render: { visible: false },
    };
    this.walls = [
      // The floor sits a little above the frame line, so a pile reads as
      // resting in the tray rather than being cut off by its bottom edge.
      M.Bodies.rectangle(
        this.width / 2,
        this.height - inset + slab / 2,
        this.width + slab * 2,
        slab,
        options,
      ),
      M.Bodies.rectangle(inset - slab / 2, this.height / 2, slab, this.height * 2, options),
      M.Bodies.rectangle(
        this.width - inset + slab / 2,
        this.height / 2,
        slab,
        this.height * 2,
        options,
      ),
    ];
    M.Composite.add(this.engine.world, this.walls);
  }

  /**
   * The elements the letters land on, measured from the page rather than
   * guessed: a change of type size or a wrap moves them, and the bodies follow.
   */
  private measureSolids(): void {
    const field = this.canvas.getBoundingClientRect();
    const solids: Rect[] = [];
    for (const element of this.root.querySelectorAll<HTMLElement>("[data-collide]")) {
      const box = element.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      solids.push({
        x: box.left - field.left,
        y: box.top - field.top,
        w: box.width,
        h: box.height,
      });
    }

    // A mode's label is a different length, so the solid it describes moves
    // when the rendering changes. Only a real change rebuilds the bodies.
    const signature = solids.map((r) => [r.x, r.y, r.w, r.h].map(Math.round).join(",")).join(";");
    if (signature === this.solidRects) return;
    this.solidRects = signature;

    const M = this.M;
    if (this.solids.length) M.Composite.remove(this.engine.world, this.solids);
    this.solids = solids.map((rect) =>
      M.Bodies.rectangle(
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        rect.w,
        rect.h,
        {
          isStatic: true,
          friction: 0.55,
          restitution: 0.03,
          render: { visible: false },
        },
      ),
    );
    M.Composite.add(this.engine.world, this.solids);
  }

  // --- pieces ---------------------------------------------------------------

  private shapeFor(glyph: number): Shape | null {
    if (!this.face || !this.engineApi) return null;
    const cached = this.shapes.get(glyph);
    if (cached) return cached;
    const raster = this.engineApi.rasterise(this.face, glyph, BASE_PPEM);
    if (!raster.ok) return null;
    const outline = this.engineApi.outlineSvg(this.face, glyph);
    if (!outline.ok) return null;
    const shape = shapeFromMask(
      raster.value,
      new Path2D(outline.value),
      glyph,
      this.units,
      BASE_PPEM,
      this.M,
    );
    if (shape.hulls.length === 0) return null;
    this.shapes.set(glyph, shape);
    return shape;
  }

  private pour(drop: boolean): void {
    if (!this.face || !this.pool.length) return;
    let shape: Shape | null = null;
    let glyph = 0;
    for (let attempt = 0; attempt < 12 && !shape; attempt++) {
      glyph = this.pool[Math.floor(Math.random() * this.pool.length)] ?? 0;
      shape = this.shapeFor(glyph);
    }
    if (!shape) return;

    const factor = (0.8 + Math.random() * 0.24) * this.sizeScale;
    // The first pour composes: pieces are set down along the floor from left
    // to right, overlapping by a hair so they lean on each other, and a second
    // row when the floor is full. A letter dropped by the reader falls from
    // above instead, wherever the dice put it.
    const margin = 12;
    const height = shape.mask.height * factor;
    const width = shape.mask.width * factor;
    if (drop) {
      const anchors = [0.18, 0.42, 0.66, 0.88];
      const anchor = anchors[Math.floor(Math.random() * anchors.length)] ?? 0.5;
      const x = clamp(
        anchor * this.width + (Math.random() - 0.5) * this.width * 0.12,
        margin + width / 2,
        Math.max(margin + width / 2, this.width - margin - width / 2),
      );
      const y = -height - 40 - Math.random() * 60;
      this.compose(shape, factor, x, y);
      return;
    }
    if (this.cursor + width > this.width - margin) {
      this.cursor = this.originCursor + Math.random() * 24;
      this.row += 1;
    }
    const x = this.cursor + width / 2;
    const y = this.height - 34 - height / 2 - this.row * 104;
    this.cursor += width * 0.94;
    this.compose(shape, factor, x, y, true);
  }

  /** Build the compound body for one glyph and put it in the world. */
  private compose(
    shape: Shape,
    factor: number,
    x: number,
    y: number,
    upright = false,
  ): void {
    const M = this.M;
    const options: MatterApi.IChamferableBodyDefinition = {
      friction: 0.52,
      frictionStatic: 0.9,
      frictionAir: 0.014,
      restitution: 0.05,
      density: 0.0016,
      slop: 0.03,
      render: { visible: false },
    };

    // One body per hull, then a parent that owns them. A body is created
    // around its own centre, so each part is given the centre the mask found
    // for it; passing one shared origin would stack every part on one point
    // and flatten the letter into a sliver.
    const parts = shape.hulls.map((hull) =>
      M.Body.create({
        ...options,
        position: { x: hull.centre.x * factor, y: hull.centre.y * factor },
        vertices: hull.points.map((p) => ({
          x: p.x * factor,
          y: p.y * factor,
        })) as unknown as MatterApi.Vertex[],
      }),
    );
    if (!parts.length) return;

    const body = M.Body.create({ ...options, parts });
    // The mesh is centred on the ink, the body on its centre of mass. Keeping
    // the difference lets the drawing pivot on the ink while the solver
    // balances the mass where it actually is.
    const pivot = { x: -body.position.x, y: -body.position.y };
    M.Body.setPosition(body, { x, y });
    // Poured type is roughly upright and slightly askew; a uniform random
    // angle makes a heap that reads as debris rather than as a type case.
    const spread = upright ? 0.05 : 0.5;
    M.Body.setAngle(body, (Math.random() - 0.5) * spread);
    M.Body.setAngularVelocity(body, (Math.random() - 0.5) * spread * 0.1);
    M.Composite.add(this.engine.world, body);

    const piece: Piece = {
      body,
      shape,
      factor,
      depth: 10 + 8 * factor,
      pivot,
      lift: 0,
      liftTarget: 0,
      hover: 0,
      hoverEase: 0,
    };
    this.pieces.push(piece);

    if (this.pieces.length > MAX_PIECES) {
      const oldest = this.pieces.shift();
      if (oldest) M.Composite.remove(this.engine.world, oldest.body);
    }
    this.updateHud();
  }

  private updateHud(): void {
    if (!this.hud) return;
    this.hud.textContent = `${String(this.pieces.length).padStart(2, "0")} / ${MAX_PIECES}`;
  }

  // --- interaction ----------------------------------------------------------

  private local(event: PointerEvent): { x: number; y: number } {
    const box = this.canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  private track(event: PointerEvent): void {
    const point = this.local(event);
    this.pointer.x = point.x;
    this.pointer.y = point.y;
    this.pointer.inside = true;
    this.parallax.tx = (point.x / Math.max(1, this.width) - 0.5) * 0.24;
    this.parallax.ty = (point.y / Math.max(1, this.height) - 0.5) * 0.18;
    this.trail.push({ x: point.x, y: point.y, t: performance.now() });
    while (this.trail.length > 12) this.trail.shift();

    const state = this.grab.constraint;
    if (state.bodyB) {
      this.setHover(null);
      return;
    }
    const found = this.M.Query.point(
      this.pieces.map((p) => p.body),
      point,
    );
    const body = found[0];
    const piece = body ? this.pieces.find((p) => p.body === body) ?? null : null;
    this.setHover(piece);
    this.canvas.style.cursor = piece ? "grab" : "default";
    this.kick();
  }

  private setHover(piece: Piece | null): void {
    if (this.hovered === piece) return;
    if (this.hovered) this.hovered.hover = 0;
    this.hovered = piece;
    if (piece) piece.hover = 1;
    this.kick();
  }

  /**
   * The solver's spring already carries a piece while it is held; this adds
   * the throw the hand made in the last tenth of a second, which is what makes
   * a flick feel like a flick rather than like letting go.
   */
  private release(): void {
    const body = this.grab.constraint.bodyB;
    if (!body) return;
    const piece = this.pieces.find((p) => p.body === body);
    const now = performance.now();
    const recent = this.trail.filter((point) => now - point.t <= 110);
    if (piece && recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      if (first && last) {
        const dt = Math.max(16, last.t - first.t) / 1000;
        const vx = clamp(((last.x - first.x) / dt) * 0.9, -2400, 2400);
        const vy = clamp(((last.y - first.y) / dt) * 0.9, -2400, 2400);
        if (Math.hypot(vx, vy) > 40) {
          this.M.Sleeping.set(body, false);
          this.M.Body.setVelocity(body, { x: vx * 0.018, y: vy * 0.018 });
          this.M.Body.setAngularVelocity(body, clamp(vx * 0.00006, -0.18, 0.18));
        }
      }
    }
    this.trail = [];
    this.kick();
  }

  private setMode(mode: Mode): void {
    if (mode === this.mode && this.root.dataset.mode === mode) {
      this.paintMode();
      return;
    }
    this.captureFade();
    this.mode = mode;
    this.root.dataset.mode = mode;
    this.paintMode();
    this.kick();
  }

  private paintMode(): void {
    for (const button of this.buttons) {
      const active = button.dataset.mode === this.mode;
      button.setAttribute("aria-pressed", active ? "true" : "false");
    }
    if (this.note) this.note.textContent = MODE_NOTES[this.mode];
    if (this.hudMode) this.hudMode.textContent = this.mode;
    this.canvas.setAttribute(
      "aria-label",
      `A tray of castings. Rendering: ${this.mode}. Drag a letter to throw it, or press space to drop one.`,
    );
  }

  private captureFade(): void {
    if (!this.width || !this.height) return;
    const canvas = document.createElement("canvas");
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(this.canvas, 0, 0);
    this.fade = { canvas, at: performance.now() };
  }

  // --- simulation -----------------------------------------------------------

  private kick(): void {
    if (this.raf) return;
    if (!this.running) {
      this.running = true;
      this.last = 0;
    }
    this.raf = requestAnimationFrame((now) => this.tick(now));
  }

  private tick(now: number): void {
    this.raf = 0;
    if (!this.last) this.last = now;
    const elapsed = Math.min(now - this.last, 90);
    this.last = now;
    this.accumulator = Math.min(this.accumulator + elapsed, STEP * 4);

    while (this.accumulator >= STEP) {
      this.M.Engine.update(this.engine, STEP);
      this.accumulator -= STEP;
    }

    this.animate(elapsed / 1000);
    this.draw(now);

    if (this.wantsFrames(now)) {
      this.raf = requestAnimationFrame((next) => this.tick(next));
    } else {
      this.running = false;
      this.last = 0;
    }
  }

  private wantsFrames(now: number): boolean {
    if (this.fade && now - this.fade.at < 260) return true;
    for (const piece of this.pieces) {
      if (!piece.body.isSleeping) return true;
      if (Math.abs(piece.lift - piece.liftTarget) > 0.002) return true;
      if (Math.abs(piece.hoverEase - piece.hover) > 0.002) return true;
    }
    const holding = Boolean(this.grab.constraint.bodyB);
    if (holding) return true;
    if (Math.abs(this.parallax.x - this.parallax.tx) > 0.001) return true;
    if (Math.abs(this.parallax.y - this.parallax.ty) > 0.001) return true;
    return false;
  }

  private animate(dt: number): void {
    const held = this.grab.constraint.bodyB;

    // A pile wedged between two other pieces can creep at a few pixels a
    // second for ever: matter's own sleep test never fires on that crawl, and
    // two touching sleepers wake each other. Stillness is therefore judged for
    // the tray as a whole, and the whole tray is put to rest at once.
    let busy = Boolean(held);
    for (const piece of this.pieces) {
      if (piece.body.isSleeping) continue;
      if (piece.body.speed > 2.2 || Math.abs(piece.body.angularVelocity) > 0.04) busy = true;
    }
    this.calm = busy ? 0 : this.calm + dt;
    if (this.calm > 0.6) {
      this.calm = 0;
      for (const piece of this.pieces) this.M.Sleeping.set(piece.body, true);
    }

    for (const piece of this.pieces) {
      if (this.reduced) {
        piece.hoverEase = piece.hover;
        piece.lift = held === piece.body ? 1 : piece.hoverEase * 0.34;
        continue;
      }
      piece.hoverEase += (piece.hover - piece.hoverEase) * (1 - Math.exp(-dt * 12));
      piece.liftTarget = held === piece.body ? 1 : piece.hoverEase * 0.34;
      piece.lift += (piece.liftTarget - piece.lift) * (1 - Math.exp(-dt * 14));
    }
    if (this.reduced) {
      this.parallax.x = 0;
      this.parallax.y = 0;
      return;
    }
    const rate = 1 - Math.exp(-dt * 6);
    this.parallax.x += (this.parallax.tx - this.parallax.x) * rate;
    this.parallax.y += (this.parallax.ty - this.parallax.y) * rate;
    if (!this.pointer.inside) {
      this.parallax.tx *= 0.96;
      this.parallax.ty *= 0.96;
    }
  }

  // --- drawing --------------------------------------------------------------

  private centreOf(piece: Piece): { x: number; y: number } {
    const angle = piece.body.angle;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: piece.body.position.x + piece.pivot.x * cos - piece.pivot.y * sin,
      y: piece.body.position.y + piece.pivot.x * sin + piece.pivot.y * cos,
    };
  }

  /** Screen-space direction the extrusion leans in: down and to the right. */
  private axis(): { x: number; y: number } {
    const turn = this.parallax.x * 1.6;
    const x = 0.44 + turn;
    const y = 0.9;
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  /**
   * Path units are the font's: one em is `units`, y points up, the pen is at
   * the origin. A mask pixel is `scale` path units, so the same transform
   * that places the ink's centroid at the piece's position also carries the
   * outline, and the outline cannot drift from the hulls built out of the mask.
   */
  private faceTransform(piece: Piece, at: { x: number; y: number }, angle: number): void {
    const ctx = this.ctx;
    ctx.translate(at.x, at.y);
    ctx.rotate(angle);
    ctx.scale(piece.factor, piece.factor);
    ctx.translate(-piece.shape.centre.x, -piece.shape.centre.y);
    ctx.scale(piece.shape.scale, piece.shape.scale);
  }

  private maskTransform(piece: Piece, at: { x: number; y: number }, angle: number): void {
    const ctx = this.ctx;
    ctx.translate(at.x, at.y);
    ctx.rotate(angle);
    ctx.scale(piece.factor, piece.factor);
    ctx.translate(-piece.shape.centre.x, -piece.shape.centre.y);
  }

  private draw(now: number): void {
    if (!this.width) return;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const ordered = [...this.pieces].sort((a, b) => {
      const liftA = a.lift * 1000;
      const liftB = b.lift * 1000;
      return a.body.position.y + liftA - (b.body.position.y + liftB);
    });

    // A diagram casts no shadow: in the hull view the parts are the subject.
    if (this.mode !== "hull") {
      for (const piece of ordered) this.paintShadow(piece);
    }
    for (const piece of ordered) this.paintPiece(piece);

    if (this.fade) {
      const age = now - this.fade.at;
      if (age >= 260) {
        this.fade = null;
      } else {
        const alpha = 1 - age / 260;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.globalAlpha = alpha * alpha;
        this.ctx.drawImage(this.fade.canvas, 0, 0);
        this.ctx.globalAlpha = 1;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }
    }

    if (!this.pieces.length) this.paintEmpty();
  }

  private paintEmpty(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = css(this.palette.ink, 0.35);
    ctx.font = "13px ui-monospace, monospace";
    ctx.letterSpacing = "0.16em";
    ctx.fillText("no castings — press space", 24, this.height / 2);
    ctx.restore();
  }

  /**
   * Two passes: a wide one that reads as the key light's penumbra, and a
   * tight one that keeps the piece from floating. Lifting a piece separates
   * the two, which is the only cue a flat drawing gives that something rose.
   */
  private paintShadow(piece: Piece): void {
    const ctx = this.ctx;
    const at = this.centreOf(piece);
    const axis = this.axis();
    const lift = piece.lift;
    const depth = piece.depth * (1 + lift * 1.2);
    const angle = piece.body.angle;

    ctx.save();
    this.faceTransform(
      piece,
      { x: at.x + axis.x * depth * 0.8 + 2 + lift * 8, y: at.y + axis.y * depth * 0.8 + 5 + lift * 10 },
      angle,
    );
    ctx.fillStyle = this.palette.shadow;
    ctx.shadowColor = this.palette.shadow;
    ctx.shadowBlur = 16 + lift * 34;
    ctx.fill(piece.shape.path);
    ctx.restore();

    ctx.save();
    this.faceTransform(piece, { x: at.x + 1.5, y: at.y + 3 }, angle);
    ctx.fillStyle = this.palette.contact;
    ctx.shadowColor = this.palette.contact;
    ctx.shadowBlur = 3 + lift * 8;
    ctx.globalAlpha = 1 - lift * 0.5;
    ctx.fill(piece.shape.path);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private paintPiece(piece: Piece): void {
    switch (this.mode) {
      case "cast":
        this.paintCast(piece);
        break;
      case "ink":
        this.paintInk(piece);
        break;
      case "wire":
        this.paintWire(piece);
        break;
      case "raster":
        this.paintRaster(piece);
        break;
      case "hull":
        this.paintHull(piece);
        break;
    }
    if (piece === this.hovered || this.grab.constraint.bodyB === piece.body) {
      this.paintHold(piece);
    }
  }

  private paintCast(piece: Piece): void {
    const ctx = this.ctx;
    const at = this.centreOf(piece);
    const axis = this.axis();
    const angle = piece.body.angle;
    const depth = piece.depth * (1 + piece.lift * 0.75);
    const layers = clamp(Math.round(depth / 1.4), 3, 14);
    const palette = this.palette;

    for (let layer = layers; layer >= 1; layer--) {
      const t = layer / layers;
      const step = depth * t;
      ctx.save();
      this.faceTransform(piece, { x: at.x + axis.x * step, y: at.y + axis.y * step }, angle);
      const rampIndex = Math.round((1 - t) * (palette.ramp.length - 1));
      ctx.fillStyle = palette.ramp[rampIndex] ?? palette.ramp[0] ?? "#888";
      ctx.fill(piece.shape.path);
      ctx.restore();
    }

    const box = piece.shape.box;
    ctx.save();
    this.faceTransform(piece, at, angle);
    const wash = ctx.createLinearGradient(box.x, box.y, box.x + box.w * 0.3, box.y + box.h);
    wash.addColorStop(0, palette.faceTop);
    wash.addColorStop(1, palette.faceBottom);
    ctx.fillStyle = wash;
    ctx.fill(piece.shape.path);
    const width = 1.15 / (piece.shape.scale * piece.factor);
    ctx.lineWidth = width;
    ctx.strokeStyle = palette.rim;
    ctx.stroke(piece.shape.path);
    ctx.restore();
  }

  private paintInk(piece: Piece): void {
    const ctx = this.ctx;
    const at = this.centreOf(piece);
    const angle = piece.body.angle;
    const palette = this.palette;

    ctx.save();
    this.faceTransform(piece, { x: at.x + 2.5, y: at.y + 3 }, angle);
    ctx.fillStyle = css(palette.ink, 0.12);
    ctx.fill(piece.shape.path);
    ctx.restore();

    ctx.save();
    this.faceTransform(piece, at, angle);
    ctx.fillStyle = palette.faceBottom;
    ctx.fill(piece.shape.path);
    ctx.restore();
  }

  private paintWire(piece: Piece): void {
    const ctx = this.ctx;
    const at = this.centreOf(piece);
    const angle = piece.body.angle;
    const palette = this.palette;
    const axis = this.axis();

    for (let layer = 3; layer >= 1; layer--) {
      const step = piece.depth * 0.55 * (layer / 3);
      ctx.save();
      this.faceTransform(piece, { x: at.x + axis.x * step, y: at.y + axis.y * step }, angle);
      ctx.strokeStyle = css(palette.ink, 0.12 + 0.02 * (3 - layer));
      ctx.lineWidth = 1 / (piece.shape.scale * piece.factor);
      ctx.stroke(piece.shape.path);
      ctx.restore();
    }

    ctx.save();
    this.faceTransform(piece, at, angle);
    ctx.strokeStyle = css(palette.ink, 0.92);
    ctx.lineWidth = 1.35 / (piece.shape.scale * piece.factor);
    ctx.stroke(piece.shape.path);
    ctx.restore();
  }

  private paintRaster(piece: Piece): void {
    const ctx = this.ctx;
    const at = this.centreOf(piece);
    const palette = this.palette;
    const cell = piece.shape.cell * 0.97;
    ctx.save();
    this.maskTransform(piece, at, piece.body.angle);
    for (const sample of piece.shape.cells) {
      ctx.fillStyle = css(palette.ink, 0.3 + sample.alpha * 0.7);
      ctx.fillRect(sample.x - cell / 2, sample.y - cell / 2, cell, cell);
    }
    ctx.restore();
  }

  private paintHull(piece: Piece): void {
    const ctx = this.ctx;
    const at = this.centreOf(piece);
    const angle = piece.body.angle;
    const palette = this.palette;
    const line = 1 / piece.factor;

    ctx.save();
    this.faceTransform(piece, at, angle);
    ctx.strokeStyle = css(palette.ink, 0.14);
    ctx.lineWidth = 1 / (piece.shape.scale * piece.factor);
    ctx.stroke(piece.shape.path);
    ctx.restore();

    ctx.save();
    this.maskTransform(piece, at, angle);
    for (const hull of piece.shape.hulls) {
      const first = hull.points[0];
      if (!first) continue;
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < hull.points.length; i++) {
        const point = hull.points[i];
        if (point) ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.fillStyle = palette.hullFill;
      ctx.fill();
      ctx.strokeStyle = palette.hullLine;
      ctx.lineWidth = line;
      ctx.stroke();
      ctx.fillStyle = palette.vertex;
      for (const point of hull.points) {
        ctx.fillRect(point.x - 1.5, point.y - 1.5, 3, 3);
      }
    }
    ctx.restore();
  }

  private paintHold(piece: Piece): void {
    const ctx = this.ctx;
    const at = this.centreOf(piece);
    const active = this.grab.constraint.bodyB === piece.body;
    ctx.save();
    this.faceTransform(piece, at, piece.body.angle);
    ctx.strokeStyle = css(this.palette.accent, active ? 0.9 : 0.5);
    ctx.lineWidth = (active ? 1.8 : 1.2) / (piece.shape.scale * piece.factor);
    ctx.stroke(piece.shape.path);
    ctx.restore();
  }
}

// --- mount ------------------------------------------------------------------

/**
 * matter-js is a classic script, and a module does not wait for one: the order
 * two deferred files execute in is not the order they are written. So the tray
 * fetches the library itself and starts when it has it, from beside this file.
 */
function loadMatter(): Promise<MatterNamespace> {
  if (window.Matter) return Promise.resolve(window.Matter);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("../vendor/matter.min.js", import.meta.url).href;
    script.onload = () => {
      if (window.Matter) resolve(window.Matter);
      else reject(new Error("matter-js loaded without Matter"));
    };
    script.onerror = () => reject(new Error("matter-js did not load"));
    document.head.append(script);
  });
}

async function mount(): Promise<void> {
  const root = document.getElementById("tray");
  if (!root) return;
  let M: MatterNamespace;
  try {
    M = await loadMatter();
  } catch {
    root.dataset.state = "unavailable";
    return;
  }
  const tray = new Tray(root, M);
  void tray.start();
}

void mount();
