import type { Skin } from "app/lib/skins";
import { UV } from "./atlas";

/** Floats per box instance: pos3, size3, rgb+emissive, uv rect, rotY+kind, anim4. */
export const STRIDE = 20;

export const KIND = { solid: 0, rain: 1, ground: 2, glow: 3, unlit: 4 } as const;

/**
 * Per-instance animation, evaluated in the vertex shader: [type, a, b, c]
 *   drive   → a = speed (u/s), b = anchor x of the vehicle (wraps every 90 u)
 *   flicker → b = phase, c = depth (0..1) of the dips
 *   bob     → a = frequency, b = phase, c = amplitude (y)
 *   sway    → a = frequency, b = phase, c = amplitude (x, grows with height)
 *   slide   → a = x distance travelled when the doors are fully open (uniform uDoor)
 */
export const ANIM = { none: 0, drive: 1, flicker: 2, bob: 3, sway: 4, slide: 5 } as const;

export const NO_UV = [0, 0, 0, 0];
export const NO_ANIM = [0, 0, 0, 0];

export class Bag {
  data: number[] = [];
  /** Animation applied to every box added while it is set (see `animated`). */
  anim: number[] = NO_ANIM;
  get count() {
    return this.data.length / STRIDE;
  }
  /** Box centred on (cx, cz) sitting on y0. */
  box(
    cx: number, y0: number, cz: number,
    w: number, h: number, d: number,
    color: number, emissive = 0, uv: number[] = NO_UV, rotY = 0, kind = 0,
  ) {
    this.data.push(
      cx, y0 + h / 2, cz, w, h, d,
      ((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255, emissive,
      uv[0], uv[1], uv[2], uv[3], rotY, kind,
      this.anim[0], this.anim[1], this.anim[2], this.anim[3],
    );
  }
}

export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CANDY = [0xe63946, 0xf4a261, 0xffd166, 0x2a9d8f, 0x4cc9f0, 0xf72585, 0xffffff, 0x8ac926, 0x7b2cbf, 0xff7b00];
const WINDOW_LIGHT = [0xffd9a0, 0xbfe3ff, 0xfff1c9, 0xffc27a];
const WHITE = 0xe9ebe8;

export const LAMP_POS: [number, number, number] = [8.6, 6.3, 1.7];

/**
 * Builds the whole konbini out of boxes. Returned ranges are drawn as:
 *   mirrored  → reflected in the wet ground, then drawn normally
 *   plain     → drawn normally only
 *   ground    → alpha blended over the reflection
 *   fx        → additive (glow sprites, rain)
 */
export function buildWorld(skin: Skin) {
  const rnd = mulberry32(7);
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
  const M = new Bag();
  const S = new Bag();
  const G = new Bag();
  const FX = new Bag();
  const animated = (anim: number[], draw: () => void) => {
    M.anim = FX.anim = anim;
    draw();
    M.anim = FX.anim = NO_ANIM;
  };
  const [c1, c2, c3] = skin.colors;
  const brand = c1 === 0xffffff ? c2 : c1;
  const signBg = parseInt(skin.sign.bg.slice(1), 16);

  // ── Ground ────────────────────────────────────────────────────────────────
  G.box(0, -1, 0, 500, 1, 500, 0x24262c, 0, NO_UV, 0, KIND.ground);
  M.box(0, 0, 0.9, 21, 0.12, 3, 0x50535a); // sidewalk
  for (const x of [-6, -3, 0, 3, 6]) S.box(x, 0, 6.3, 0.12, 0.03, 5, 0xe8e8e8);
  for (const x of [-4.5, -1.5, 1.5, 4.5]) M.box(x, 0, 3.7, 1.7, 0.14, 0.22, 0xc9cdd1);
  for (const x of [-3, -1.5, 1.5, 3]) M.box(x, 0.12, 2.2, 0.12, 0.75, 0.12, 0xf2c200);

  // ── Shell ─────────────────────────────────────────────────────────────────
  M.box(0, 0, -7.1, 12.4, 4.2, 0.2, 0x30333a);
  M.box(0, 0.1, -6.95, 12, 4, 0.1, 0xd9dde0, 0.8);
  for (const s of [-1, 1]) {
    M.box(s * 6.1, 0, -3.5, 0.2, 4.2, 7.2, 0xd9d9d4);
    M.box(s * 5.95, 0.1, -3.5, 0.1, 4, 7, 0xd3d8dc, 0.8);
  }
  M.box(0, 0.1, -3.5, 12, 0.06, 7, 0xc9d0d4, 0.75);
  M.box(0, 4.0, -3.5, 12, 0.1, 7, 0xe4e7ea, 0.9);
  for (const z of [-3.5, -5.5]) M.box(0, 3.96, z, 10.5, 0.05, 0.25, 0xffffff, 1);
  animated([ANIM.flicker, 0, 0.37, 0.8], () => M.box(0, 3.96, -1.5, 10.5, 0.05, 0.25, 0xffffff, 1));
  M.box(0, 4.2, -3.5, 12.6, 0.2, 7.6, 0x2b2e35);
  M.box(-3, 4.4, -4, 1.6, 0.8, 1, 0x55595f);
  M.box(2.5, 4.4, -5, 1, 0.6, 1, 0x4a4e54);

  // Fascia sign + soffit light
  M.box(0, 3.05, 0.12, 12.6, 1.15, 0.3, signBg, 1, UV.sign);
  M.box(0, 3.0, 0.32, 12.2, 0.05, 0.5, 0xffffff, 1.5);

  // Storefront: kick plates, mullions, sliding doors
  for (const s of [-1, 1]) M.box(s * 3.55, 0.12, 0, 4.9, 0.45, 0.12, 0xc9ccd0, 0.15);
  for (const x of [-6, -4.37, -2.73, -1.1, 1.1, 2.73, 4.37, 6]) M.box(x, 0.12, 0, 0.09, 2.95, 0.14, 0xb9bec4, 0.25);
  M.box(0, 2.95, 0, 12, 0.1, 0.14, 0xb9bec4, 0.25);
  M.box(0, 2.45, 0, 2.2, 0.08, 0.12, 0xb9bec4, 0.25);
  // Automatic sliding doors (opened by the uDoor uniform)
  for (const s of [-1, 1]) {
    animated([ANIM.slide, s * 1.02, 0, 0], () => {
      const cx = s * 0.55;
      for (const e of [-0.52, 0.52]) M.box(cx + e, 0.12, 0.12, 0.05, 2.33, 0.06, 0x9aa1a8, 0.3);
      M.box(cx, 2.4, 0.12, 1.09, 0.05, 0.06, 0x9aa1a8, 0.3);
      M.box(cx, 0.12, 0.12, 1.09, 0.1, 0.06, 0x9aa1a8, 0.3);
      M.box(cx - s * 0.4, 0.85, 0.16, 0.03, 0.55, 0.03, 0xd0d4d8, 0.4);
    });
  }
  M.box(0, 0.12, 0.9, 1.9, 0.02, 1, brand); // door mat
  M.box(-4.9, 1.2, 0.03, 0.75, 1, 0.02, WHITE, 0.95, UV.poster1);
  M.box(5.2, 1.2, 0.03, 0.75, 1, 0.02, WHITE, 0.95, UV.poster2);

  // ── Interior: laid out like a real konbini ────────────────────────────────
  // Front: magazines + copy/ATM · right: counter, hot snacks, cigarettes ·
  // left: drink fridges · back: chilled onigiri/bento · centre: two gondolas.
  const accent = c3 === 0xffffff ? c2 : c3;
  const SHELF = 0xe3e5e2;

  // Magazine rack against the window (→ Blog), with someone reading for free
  M.box(-3.55, 0.16, -0.6, 4.5, 1.5, 0.3, WHITE, 0.85);
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 13; i++) {
      M.box(-5.6 + i * 0.34, 0.68 + row * 0.5, -0.42, 0.27, 0.38, 0.04, pick(CANDY), 0.95);
    }
  }
  M.box(-2.3, 0.16, -1.35, 0.42, 1.3, 0.26, 0x34435e, 0.75);
  animated([ANIM.bob, 0.8, 1.3, 0.025], () => {
    M.box(-2.3, 1.48, -1.35, 0.26, 0.28, 0.26, 0xf1c9a5, 0.85);
    M.box(-2.3, 1.72, -1.37, 0.28, 0.1, 0.28, 0x2b2019, 0.8);
  });

  // Copy machine (→ Editor) and ATM (→ Games)
  M.box(2.1, 0.16, -0.7, 0.9, 1.05, 0.6, 0xe6e8ea, 0.85);
  M.box(2.1, 1.21, -0.7, 0.95, 0.12, 0.65, 0x3a3d42, 0.6);
  M.box(2.38, 1.33, -0.5, 0.3, 0.22, 0.05, 0x4cc9f0, 1.3);
  M.box(3.3, 0.16, -0.7, 0.7, 1.7, 0.6, brand, 0.85);
  M.box(3.3, 1.2, -0.39, 0.4, 0.3, 0.03, 0xbfe9ff, 1.3);

  // Left wall: walk-in drink fridges, five glass doors facing the store
  const FZ0 = -6.4, FZ1 = -1.4, FCZ = (FZ0 + FZ1) / 2, FLEN = FZ1 - FZ0;
  M.box(-5.9, 0.16, FCZ, 0.04, 2.34, FLEN, 0xd8ecf8, 1.05); // lit back
  M.box(-5.6, 0.16, FCZ, 0.62, 0.14, FLEN, 0x3a3f47, 0.5); // kick
  M.box(-5.6, 2.5, FCZ, 0.7, 0.36, FLEN + 0.06, brand, 0.95); // header
  M.box(-5.3, 2.44, FCZ, 0.06, 0.06, FLEN, 0x8a9199, 0.5);
  for (let d = 0; d <= 5; d++) M.box(-5.3, 0.16, FZ1 - d, 0.06, 2.34, 0.06, 0x8a9199, 0.5);
  const BOTTLES = [0x2a9d8f, 0xe63946, 0xf4a261, 0x457b9d, 0x8ac926, 0xffd166, 0xe9c46a, 0xf1faee, 0x6a4c93];
  for (let level = 0; level < 5; level++) {
    const y = 0.32 + level * 0.43;
    M.box(-5.62, y - 0.015, FCZ, 0.56, 0.015, FLEN, 0xc3ccd3, 0.9);
    for (let d = 0; d < 5; d++) {
      const zDoor = FZ1 - 0.5 - d;
      const color = pick(BOTTLES);
      const can = rnd() < 0.35;
      for (let k = 0; k < 7; k++) {
        const z = zDoor - 0.39 + k * 0.13;
        M.box(-5.45, y, z, 0.07, can ? 0.13 : 0.24, 0.07, rnd() < 0.8 ? color : pick(BOTTLES), 0.95);
        if (!can) M.box(-5.45, y + 0.24, z, 0.035, 0.03, 0.035, 0xf5f5f2, 0.95);
      }
      // door handle
      M.box(-5.26, 0.9, zDoor + 0.4, 0.03, 0.7, 0.03, 0xd0d4d8, 0.6);
    }
  }

  // Back wall: open chilled cases — bento, onigiri, sandwiches, desserts
  const CX0 = -5.25, CX1 = 3.75, CCX = (CX0 + CX1) / 2, CW = CX1 - CX0;
  M.box(CCX, 0.16, -6.88, CW, 2.1, 0.06, 0xe8f2f8, 1.05);
  M.box(CCX, 0.16, -6.55, CW, 0.46, 0.7, 0x3a3f47, 0.6);
  M.box(CCX, 2.08, -6.67, CW, 0.26, 0.46, brand, 0.95);
  M.box(CCX, 2.06, -6.67, CW - 0.1, 0.02, 0.4, 0xffffff, 1.5);
  for (const x of [CX0, CX1]) M.box(x, 0.16, -6.55, 0.05, 2.18, 0.72, WHITE, 0.85);
  const tiers = [
    { y: 0.62, front: -6.2 },
    { y: 0.98, front: -6.32 },
    { y: 1.34, front: -6.42 },
    { y: 1.7, front: -6.52 },
  ];
  tiers.forEach(({ y, front }) => {
    const depth = front + 6.88;
    M.box(CCX, y - 0.02, front - depth / 2, CW, 0.02, depth, SHELF, 0.9);
    M.box(CCX, y - 0.05, front + 0.005, CW, 0.045, 0.01, 0xfff3b0, 1);
  });
  const LIDS = [0xc1121f, 0x2a9d8f, 0xe9c46a, 0x6a994e, 0xbc6c25, 0x1d3557];
  for (let x = CX0 + 0.16; x < CX1 - 0.12; x += 0.27) {
    for (const dz of [0.12, 0.36]) {
      // bento: white tray + coloured lid
      M.box(x, 0.62, tiers[0].front - dz, 0.22, 0.06, 0.17, 0xf7f7f2, 0.95);
      M.box(x, 0.68, tiers[0].front - dz, 0.22, 0.015, 0.17, pick(LIDS), 0.95);
    }
  }
  for (let x = CX0 + 0.1; x < CX1 - 0.08; x += 0.13) {
    // onigiri: rice, nori band, flavour label
    const z = tiers[1].front - 0.08;
    M.box(x, 0.98, z, 0.1, 0.1, 0.04, 0xf7f5ee, 0.95);
    M.box(x, 0.98, z + 0.001, 0.1, 0.045, 0.041, 0x1f2a24, 0.9);
    M.box(x, 1.06, z + 0.002, 0.04, 0.02, 0.041, pick([0xe63946, 0x2a9d8f, 0xf4a261, 0x457b9d]), 1);
    M.box(x, 0.98, z - 0.12, 0.1, 0.1, 0.04, 0xf7f5ee, 0.95);
  }
  for (let x = CX0 + 0.12; x < CX1 - 0.1; x += 0.16) {
    // sandwiches
    const z = tiers[2].front - 0.08;
    M.box(x, 1.34, z, 0.13, 0.12, 0.06, 0xf0e2b8, 0.95);
    M.box(x, 1.38, z + 0.001, 0.131, 0.03, 0.061, pick([0xe9c46a, 0x8ac926, 0xf4a261, 0xe63946]), 0.95);
  }
  for (let x = CX0 + 0.12; x < CX1 - 0.1; x += 0.15) {
    // desserts and salads
    const z = tiers[3].front - 0.08;
    M.box(x, 1.7, z, 0.11, 0.07, 0.11, pick([0xffe5ec, 0xfefae0, 0xb7e4c7, 0xffd6a5, 0xcdb4db]), 0.95);
    M.box(x, 1.77, z, 0.11, 0.02, 0.11, 0xffffff, 0.9);
  }

  // Centre gondolas, double sided
  const gondola = (
    x0: number, x1: number, cz: number, h: number, levels: number[],
    fill: (side: 1 | -1, level: number, x0: number, x1: number, y: number, edge: number) => void,
    /** Back side, upper levels: shelves stop here (room for a display board). */
    backOpenFrom?: number,
  ) => {
    const cx = (x0 + x1) / 2, w = x1 - x0;
    M.box(cx, 0.16, cz, w, h, 0.06, WHITE, 0.85);
    M.box(cx, 0.16, cz, w, 0.12, 0.8, 0xd5d8d4, 0.8);
    M.box(cx, 0.16 + h, cz, w + 0.04, 0.03, 0.82, 0xffffff, 0.9);
    for (const x of [x0, x1]) M.box(x, 0.16, cz, 0.04, h, 0.8, WHITE, 0.85);
    for (const side of [1, -1] as const) {
      levels.forEach((y, i) => {
        const end = side === -1 && i > 0 && backOpenFrom !== undefined ? backOpenFrom : x1;
        const sx = (x0 + end) / 2, sw = end - x0;
        M.box(sx, y - 0.02, cz + side * 0.21, sw, 0.02, 0.38, SHELF, 0.85);
        M.box(sx, y - 0.055, cz + side * 0.4, sw, 0.035, 0.01, 0xffffff, 1);
        fill(side, i, x0 + 0.08, x1 - 0.08, y, cz + side * 0.38);
      });
    }
  };
  /** Puts an item on a shelf, against its front edge. */
  const item = (x: number, y: number, edge: number, side: number, w: number, h: number, d: number, color: number) =>
    M.box(x, y, edge - side * (d / 2 + 0.03), w, h, d, color, 0.95);

  // Gondola 1: snacks facing the entrance, pixel art prints + noodles behind
  const PRINTS_FROM = -1.2; // the right part of its back holds framed pixel art (walk mode)
  gondola(-4.3, 1.9, -2.6, 1.2, [0.28, 0.6, 0.92], (side, level, x0, x1, y, edge) => {
    if (side === 1) {
      for (let x = x0 + 0.09; x < x1; x += 0.2) item(x, y, edge, side, 0.17, 0.22, 0.07, pick(CANDY));
    } else {
      for (let x = x0 + 0.07; x < (level > 0 ? PRINTS_FROM - 0.1 : x1); x += 0.15) {
        item(x, y, edge, side, 0.12, 0.11, 0.12, 0xf3f3ef);
        item(x, y + 0.08, edge, side, 0.121, 0.03, 0.121, pick(CANDY));
      }
    }
  }, PRINTS_FROM);
  M.box(0.3, 0.52, -2.66, 3.0, 0.84, 0.03, 0xf7f7f4, 0.9); // pegboard for the prints

  // Gondola 2: games (cartridges) facing the middle aisle, sweets behind
  const SHELLS = [0x8a8f98, 0x3a3d45, 0x6b7280, 0xd1d5db, 0x4b5563];
  gondola(-4.3, 1.9, -4.4, 1.5, [0.28, 0.64, 1.0, 1.36], (side, level, x0, x1, y, edge) => {
    if (side === 1) {
      if (level === 2) return; // eye level: the featured favourites, added in walk mode
      for (let x = x0 + 0.06; x < x1; x += 0.13) {
        item(x, y, edge, side, 0.1, 0.12, 0.025, pick(SHELLS));
        M.box(x, y + 0.045, edge - 0.028, 0.08, 0.055, 0.004, pick(CANDY), 1);
      }
    } else {
      for (let x = x0 + 0.06; x < x1; x += 0.12) item(x, y, edge, side, 0.1, 0.14, 0.05, pick(CANDY));
    }
  });
  // End-cap promos by the main aisle (the middle aisle stays open between them)
  for (const cz of [-2.6, -4.4]) {
    for (let i = 0; i < 4; i++) M.box(2.12, 0.16 + i * 0.26, cz, 0.32 - i * 0.05, 0.24, 0.7 - i * 0.12, i % 2 ? WHITE : brand, 0.9);
  }

  // Right side: long counter with registers, hot snacks, buns, oden, coffee
  M.box(4.25, 0.16, -3.45, 0.7, 0.95, 3.9, 0xeeeeea, 0.85);
  M.box(4.25, 0.16, -3.45, 0.72, 0.1, 3.92, 0x9aa0a6, 0.6);
  M.box(3.895, 0.68, -3.45, 0.01, 0.07, 3.9, accent, 0.9);
  M.box(4.22, 1.11, -3.45, 0.82, 0.05, 4.0, brand, 0.9);
  // Heated showcase full of fried food
  M.box(4.2, 1.16, -2.0, 0.55, 0.04, 0.8, 0x6b6f76, 0.7);
  M.box(4.46, 1.16, -2.0, 0.04, 0.6, 0.8, 0xc9cdd2, 0.7);
  M.box(4.2, 1.74, -2.0, 0.57, 0.04, 0.82, 0xffd9a0, 1.6);
  for (const e of [-0.4, 0.4]) M.box(4.2, 1.16, -2.0 + e, 0.55, 0.6, 0.02, 0xb9bec4, 0.5);
  M.box(4.25, 1.43, -2.0, 0.42, 0.02, 0.76, 0xb9bec4, 0.6);
  const FRIED = [0xc98a2c, 0xd9a040, 0xb26a1f, 0xe0b35a, 0xa85d1a];
  for (const y of [1.2, 1.45]) {
    for (let i = 0; i < 8; i++) {
      for (const x of [4.08, 4.27]) {
        const size = 0.07 + rnd() * 0.04;
        M.box(x, y, -2.33 + i * 0.095, size, size * 0.8, size, pick(FRIED), 1.15);
      }
    }
  }
  M.box(3.96, 1.8, -2.0, 0.8, 0.2, 0.02, 0xffffff, 1, UV.fried, -Math.PI / 2);
  // Registers
  for (const z of [-2.75, -4.45]) {
    M.box(4.18, 1.16, z, 0.32, 0.1, 0.36, 0x2b2e35, 0.6);
    M.box(4.2, 1.26, z, 0.06, 0.22, 0.3, 0x2b2e35, 0.6);
    M.box(4.165, 1.29, z, 0.01, 0.16, 0.25, 0x7dd3fc, 1.3);
  }
  // Steamed buns case
  M.box(4.2, 1.16, -3.3, 0.45, 0.04, 0.45, 0x6b6f76, 0.7);
  M.box(4.2, 1.6, -3.3, 0.47, 0.04, 0.47, 0xfff4e0, 1.5);
  for (const e of [-0.22, 0.22]) M.box(4.2, 1.16, -3.3 + e, 0.45, 0.44, 0.02, 0xb9bec4, 0.5);
  for (let i = 0; i < 6; i++) M.box(4.08 + (i % 2) * 0.17, 1.2 + Math.floor(i / 4) * 0.16, -3.42 + (i % 3) * 0.12, 0.1, 0.07, 0.1, 0xfaf6ee, 1.1);
  // Oden pot
  M.box(4.2, 1.16, -3.9, 0.45, 0.14, 0.5, 0xb8bec6, 0.7);
  M.box(4.2, 1.29, -3.9, 0.41, 0.01, 0.46, 0x7a4a1f, 0.9);
  for (let i = 0; i < 10; i++) {
    M.box(4.04 + (i % 4) * 0.1, 1.3, -4.08 + Math.floor(i / 4) * 0.15, 0.07, 0.04, 0.07, pick([0xf2e8cf, 0xfff3c4, 0x8d8d8d, 0xd4a373]), 0.95);
  }
  M.box(3.96, 1.62, -3.6, 0.9, 0.2, 0.02, 0xffffff, 1, UV.steam, -Math.PI / 2);
  // Coffee machine + cups
  M.box(4.25, 1.16, -5.0, 0.4, 0.62, 0.42, 0x2b2e35, 0.7);
  M.box(4.045, 1.5, -5.0, 0.01, 0.16, 0.26, 0x7dd3fc, 1.4);
  M.box(4.25, 1.16, -5.33, 0.08, 0.2, 0.08, 0xf5f5f2, 0.95);
  // The clerk, at the first register
  animated([ANIM.bob, 1.7, 0, 0.03], () => {
    M.box(5.0, 1.0, -2.75, 0.28, 0.65, 0.5, accent, 0.9);
    M.box(5.0, 1.67, -2.75, 0.28, 0.3, 0.28, 0xf1c9a5, 0.9);
    M.box(5.02, 1.94, -2.75, 0.3, 0.1, 0.3, 0x2b2019, 0.8);
  });
  // Behind the counter: cabinet + the cigarette wall
  M.box(5.72, 0.16, -3.4, 0.35, 0.9, 3.6, WHITE, 0.85);
  M.box(5.88, 1.12, -3.4, 3.6, 1.5, 0.02, 0xffffff, 1, UV.cigarettes, -Math.PI / 2);
  M.box(5.85, 2.65, -3.4, 0.1, 0.05, 3.6, 0xffffff, 1.4);
  M.box(5.88, 2.7, -3.4, 0.03, 0.25, 3.6, brand, 0.95);
  // Staff door in the back corner
  M.box(5.1, 0.16, -6.88, 0.95, 2.1, 0.06, 0x8f959c, 0.6);
  M.box(5.1, 1.6, -6.84, 0.45, 0.22, 0.01, 0xffffff, 1, UV.staff);

  // ── Outside props ─────────────────────────────────────────────────────────
  // Recycling bins
  [0x2563eb, 0x16a34a, 0x9ca3af].forEach((lid, i) => {
    const x = -5.5 + i * 0.68;
    M.box(x, 0.12, 0.45, 0.6, 0.95, 0.5, 0xeceff1);
    M.box(x, 0.9, 0.45, 0.62, 0.12, 0.54, lid);
  });
  // Capsule toy machines (→ Pixel Art)
  for (const x of [-6.75, -7.45]) {
    for (const row of [0, 1]) M.box(x, 0.12 + row * 0.82, 0.3, 0.64, 0.8, 0.5, WHITE, 0.75, UV.gacha);
  }
  // Vending machines (→ Games)
  M.box(6.95, 0.12, 0.2, 1, 1.9, 0.75, 0xd7263d, 1, UV.vend1);
  M.box(8.05, 0.12, 0.2, 1, 1.9, 0.75, 0xf4f6f8, 1, UV.vend2);
  // Nobori banners
  for (const x of [-8.7, -9.5]) {
    M.box(x, 0, 2.3, 0.05, 2.7, 0.05, 0xcfd3d6);
    M.box(x + 0.32, 1.0, 2.3, 0.56, 1.6, 0.02, c3 === 0xffffff ? c1 : c3, 0.35, UV.nobori);
  }
  // Pylon sign
  M.box(-9.4, 0, -0.6, 0.3, 5.2, 0.3, 0x9aa0a6);
  animated([ANIM.flicker, 0, 0.71, 0.6], () => M.box(-9.4, 5.2, -0.6, 2.4, 2.4, 0.5, signBg, 1, UV.logo, 0.2));
  // Utility pole, street lamp and wires
  M.box(9.9, 0, 1.7, 0.32, 8.5, 0.32, 0x6f7378);
  M.box(9.9, 7.6, 1.7, 2.2, 0.12, 0.12, 0x55585e);
  M.box(10.3, 6.1, 1.7, 0.5, 0.8, 0.5, 0x7d8187);
  M.box(9.2, 6.6, 1.7, 1.4, 0.08, 0.08, 0x6f7378);
  M.box(8.6, 6.5, 1.7, 0.5, 0.1, 0.25, 0xffc98a, 2);
  for (const z of [1.25, 1.7, 2.15]) S.box(0, 7.72, z, 140, 0.025, 0.025, 0x08090c);
  // The cat from the old site still hangs around
  M.box(1.75, 0.12, 1.5, 0.24, 0.2, 0.42, 0xf0a04b);
  animated([ANIM.bob, 1.1, 0.5, 0.012], () => {
    M.box(1.75, 0.26, 1.76, 0.24, 0.22, 0.2, 0xf0a04b);
    M.box(1.67, 0.48, 1.78, 0.07, 0.08, 0.06, 0xf0a04b);
    M.box(1.83, 0.48, 1.78, 0.07, 0.08, 0.06, 0xf0a04b);
  });
  animated([ANIM.sway, 2.6, 0, 0.09], () => M.box(1.75, 0.2, 1.26, 0.06, 0.32, 0.06, 0xf0a04b));

  // Traffic: cars loop along the street, lights and reflections included
  const car = (anchor: number, z: number, speed: number, body: number, roof: number | null) =>
    animated([ANIM.drive, speed, anchor, 0], () => {
      const dir = Math.sign(speed);
      M.box(anchor, 0.18, z, 3.8, 0.62, 1.6, body);
      M.box(anchor - dir * 0.25, 0.8, z, 2.1, 0.55, 1.45, 0x1c2230, 0.15);
      for (const s of [-1, 1]) {
        M.box(anchor + dir * 1.91, 0.5, z + s * 0.55, 0.04, 0.14, 0.3, 0xfff6dc, 2.2);
        M.box(anchor - dir * 1.91, 0.52, z + s * 0.58, 0.04, 0.12, 0.26, 0xff2a2a, 1.6);
        for (const w of [-1.2, 1.2]) M.box(anchor + w, 0, z + s * 0.72, 0.62, 0.36, 0.2, 0x111215);
      }
      if (roof !== null) M.box(anchor - dir * 0.25, 1.35, z, 0.5, 0.18, 0.3, roof, 1.4);
      FX.box(anchor + dir * 3.1, 0.05, z, 4.2, 1.6, 0.001, 0xfff1d0, 0.38, UV.glow, 0, KIND.glow);
      FX.box(anchor - dir * 2.3, 0.2, z, 1.8, 0.9, 0.001, 0xff3030, 0.3, UV.glow, 0, KIND.glow);
    });
  car(-30, 7.4, 7.5, 0x1d1f26, 0xffb347);
  car(12, 9.6, -10.5, 0xe9ecef, null);

  // ── City ──────────────────────────────────────────────────────────────────
  const building = (bag: Bag, cx: number, cz: number, w: number, h: number, d: number, color: number, lit: number) => {
    bag.box(cx, 0, cz, w, h, d, color);
    const zf = cz + d / 2 + 0.03;
    for (let y = 1.6; y < h - 1.2; y += 1.7) {
      for (let x = cx - w / 2 + 0.9; x < cx + w / 2 - 0.6; x += 1.3) {
        if (rnd() < lit) S.box(x, y, zf, 0.7, 0.9, 0.04, pick(WINDOW_LIGHT), 0.85);
      }
    }
  };
  building(M, -15.5, -5, 9, 7.5, 9, 0x1a1c22, 0.3);
  building(M, 16.5, -6, 11, 10.5, 9, 0x16181e, 0.25);
  for (let i = 0; i < 26; i++) {
    const x = -78 + i * 6 + rnd() * 3;
    building(S, x, -16 - rnd() * 34, 5 + rnd() * 5, 7 + rnd() * 20, 6, 0x101218, 0.16);
  }
  S.box(0, -6, -80, 360, 110, 0.1, 0xffffff, 1, UV.sky, 0, KIND.unlit);

  // ── FX ────────────────────────────────────────────────────────────────────
  const glow = (cx: number, cy: number, cz: number, w: number, h: number, color: number, intensity: number) =>
    FX.box(cx, cy - h / 2, cz, w, h, 0.001, color, intensity, UV.glow, 0, KIND.glow);
  glow(0, 3.6, 0.6, 24, 6, skin.glow, 0.22);
  glow(0, 1.4, 0.5, 19, 6.5, 0xfff6e6, 0.08);
  animated([ANIM.flicker, 0, 0.71, 0.6], () => glow(-9.3, 6.4, -0.2, 7, 7, skin.glow, 0.3));
  glow(7.5, 1.1, 0.7, 5.5, 4.5, 0xffffff, 0.16);
  glow(8.6, 6.4, 1.9, 5, 5, 0xffb060, 0.55);
  for (let i = 0; i < 520; i++) {
    FX.box(-20 + rnd() * 40, rnd() * 14, -5 + rnd() * 19, 0.014, 0.5 + rnd() * 0.3, 0.014, 0, 0, NO_UV, 0, KIND.rain + rnd() * 0.99);
  }

  const bags = [M, S, G, FX];
  const data = new Float32Array(bags.reduce((n, b) => n + b.data.length, 0));
  let offset = 0;
  const ranges = bags.map((bag) => {
    data.set(bag.data, offset);
    const range = { first: offset / STRIDE, count: bag.count };
    offset += bag.data.length;
    return range;
  });
  return { data, mirrored: ranges[0], plain: ranges[1], ground: ranges[2], fx: ranges[3] };
}
