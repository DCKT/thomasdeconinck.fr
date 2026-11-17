import type { Skin } from "app/lib/skins";
import { GACHA_CARD_UV, UV } from "./atlas";
import { ANIM, Bag, KIND, mulberry32, NO_ANIM, NO_UV, STRIDE } from "./bag";
import { GACHA, GACHA_COUNT, GACHA_SERIES, machineBase } from "./gacha-data";
import { buildStore } from "./store";

export { ANIM, Bag, KIND, mulberry32, NO_ANIM, NO_UV, STRIDE } from "./bag";
export { CEIL, FOOTPRINTS } from "./store";

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
  /** A pane of glass: drawn additively, mostly visible at grazing angles. */
  const glass = (cx: number, y0: number, cz: number, w: number, h: number, d: number, strength = 0.05) =>
    FX.box(cx, y0, cz, w, h, d, 0xdcecff, strength, NO_UV, 0, KIND.glass);
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
  M.box(0, 0.1, -6.95, 12, 4, 0.1, 0xf0f1ee, 1);
  for (const s of [-1, 1]) {
    M.box(s * 6.1, 0, -3.5, 0.2, 4.2, 7.2, 0xd9d9d4);
    M.box(s * 5.95, 0.1, -3.5, 0.1, 4, 7, 0xf0f1ee, 1);
  }
  G.box(0, 0.1, -3.5, 11.9, 0.06, 6.9, 0xe9e6dd, 0.9, NO_UV, 0, KIND.floor); // polished tiles
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
  // Window glass between the mullions
  for (const [a, b] of [[-6, -4.37], [-4.37, -2.73], [-2.73, -1.1], [1.1, 2.73], [2.73, 4.37], [4.37, 6]]) {
    glass((a + b) / 2, 0.57, 0, b - a - 0.09, 2.33, 0.01, 0.045);
  }
  glass(0, 2.49, 0, 2.11, 0.42, 0.01, 0.045);
  // Automatic sliding doors (opened by the uDoor uniform)
  for (const s of [-1, 1]) {
    animated([ANIM.slide, s * 1.02, 0, 0], () => {
      const cx = s * 0.55;
      for (const e of [-0.52, 0.52]) M.box(cx + e, 0.12, 0.12, 0.05, 2.33, 0.06, 0x9aa1a8, 0.3);
      M.box(cx, 2.4, 0.12, 1.09, 0.05, 0.06, 0x9aa1a8, 0.3);
      M.box(cx, 0.12, 0.12, 1.09, 0.1, 0.06, 0x9aa1a8, 0.3);
      M.box(cx - s * 0.4, 0.85, 0.16, 0.03, 0.55, 0.03, 0xd0d4d8, 0.4);
      glass(cx, 0.22, 0.12, 1.0, 2.18, 0.01, 0.06);
    });
  }
  M.box(0, 0.12, 0.9, 1.9, 0.02, 1, brand); // door mat
  M.box(-4.9, 1.2, 0.03, 0.75, 1, 0.02, WHITE, 0.95, UV.poster1);
  M.box(-1.95, 1.2, 0.03, 0.75, 1, 0.02, WHITE, 0.95, UV.poster2);

  // ── Interior (see store.ts) ───────────────────────────────────────────────
  buildStore({ M, glass, animated, skin });

  // ── Outside props ─────────────────────────────────────────────────────────
  // Umbrella stand by the door (it's raining, after all)
  M.box(-1.65, 0.12, 0.55, 0.5, 0.42, 0.3, 0x9aa0a6, 0.3);
  [0x1d3557, 0xe63946, 0xf1faee, 0x2a9d8f, 0x111111, 0xf4a261].forEach((color, i) => {
    const x = -1.84 + (i % 3) * 0.19, z = 0.48 + Math.floor(i / 3) * 0.14;
    M.box(x, 0.2, z, 0.07, 0.75, 0.07, color, 0.15);
    M.box(x, 0.95, z, 0.025, 0.12, 0.025, 0x3b2a20, 0.15);
  });

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
  // Gachapon bank (→ the gacha scene): six machines, two high, in front of the right window
  {
    const { w, h, depth, front } = GACHA;
    const zc = front - depth / 2;
    const cx = GACHA.x0 + (GACHA.cols * w) / 2;
    const bankW = GACHA.cols * w;
    const BODY = 0xf3f4f1;
    // Its own dice, so adding the bank does not reshuffle the rest of the street
    const dice = mulberry32(23);
    M.box(cx, 0.12, zc, bankW + 0.04, 0.1, depth + 0.02, 0x2b2e35, 0.4); // plinth
    for (const e of [-1, 1]) M.box(cx + e * (bankW / 2 + 0.01), 0.22, zc, 0.02, GACHA.rows * h, depth, 0xd9dcd8, 0.6);
    M.box(cx, GACHA.y0 + GACHA.rows * h, front - 0.08, bankW, 0.26, 0.08, 0xffffff, 1, UV.gachaHeader); // topper
    M.box(cx, GACHA.y0 + GACHA.rows * h + 0.26, front - 0.06, bankW + 0.04, 0.03, 0.16, 0xffffff, 1.4);

    for (let i = 0; i < GACHA_COUNT; i++) {
      const { x, y } = machineBase(i);
      const { color } = GACHA_SERIES[i];
      const bw = w - 0.02; // a hair of shadow between neighbours
      // Lower half: the control panel
      M.box(x, y, zc, bw, 0.3, depth, BODY, 0.82, UV.gachaPanel);
      M.box(x, y + 0.285, front + 0.004, bw, 0.03, 0.008, color, 0.95);
      // Dial: a domed knob with a grip bar across it (the bar spins when cranked)
      const dx = x + 0.03, dy = y + 0.147;
      M.box(dx, dy - 0.065, front - 0.025, 0.13, 0.13, 0.13, 0xe9ecef, 0.85, NO_UV, 0, KIND.ball);
      animated([ANIM.gacha, i, 0, 1], () => {
        M.box(dx, dy - 0.02, front + 0.05, 0.15, 0.04, 0.035, color, 0.95);
        M.box(dx, dy - 0.012, front + 0.07, 0.06, 0.024, 0.01, 0xffffff, 1);
      });
      // Coin slot
      M.box(x + 0.2, y + 0.12, front + 0.004, 0.06, 0.1, 0.008, 0xb9bec4, 0.7);
      M.box(x + 0.2, y + 0.15, front + 0.01, 0.012, 0.05, 0.006, 0x15171c, 0.3);
      M.box(x + 0.2, y + 0.095, front + 0.012, 0.03, 0.03, 0.012, 0xe63946, 1);
      // Chute where the capsule comes out
      M.box(x - 0.155, y + 0.02, front + 0.002, 0.16, 0.11, 0.006, 0x15171c, 0.25);
      M.box(x - 0.155, y + 0.012, front + 0.025, 0.18, 0.016, 0.05, 0xdfe2e0, 0.8);
      for (const e of [-1, 1]) M.box(x - 0.155 + e * 0.085, y + 0.02, front + 0.02, 0.012, 0.115, 0.04, 0xdfe2e0, 0.8);
      M.box(x - 0.155, y + 0.132, front + 0.02, 0.182, 0.012, 0.04, 0xdfe2e0, 0.8);

      // Upper half: the display, a lit box full of capsules behind glass
      const wy = y + 0.3;
      M.box(x, wy, front - depth / 2 - 0.1, bw, 0.5, depth - 0.2, 0xeef5fa, 1.05); // lit back
      for (const e of [-1, 1]) M.box(x + e * (bw / 2 - 0.015), wy, zc, 0.03, 0.5, depth, BODY, 0.82);
      M.box(x, wy + 0.47, zc, bw, 0.03, depth, BODY, 0.82);
      M.box(x, wy + 0.47, front + 0.003, bw, 0.03, 0.006, color, 0.95);
      M.box(x, wy + 0.225, front - 0.006, bw - 0.06, 0.245, 0.008, 0xffffff, 1, GACHA_CARD_UV[i]);
      glass(x, wy, front - 0.002, bw - 0.06, 0.225, 0.004, 0.05);
      // The pile: staggered layers, two rows deep, a few missing on top
      const R = 0.043;
      animated([ANIM.gacha, i, 0, 0], () => {
        for (let layer = 0; layer < 3; layer++) {
          const odd = layer % 2;
          for (let row = 0; row < 2; row++) {
            for (let k = 0; k < 5 - odd; k++) {
              if (layer === 2 && dice() < 0.3) continue;
              const bx = x + (k - (4 - odd) / 2) * 0.089 + (dice() - 0.5) * 0.012;
              const bz = front - 0.058 - row * 0.086 - odd * 0.03 + (dice() - 0.5) * 0.01;
              const tint = dice() < 0.3 ? color : CANDY[Math.floor(dice() * CANDY.length)];
              // Which way the capsule's lid points (never exactly 0: that means "plain ball")
              const tilt = [dice() * 2 - 1 || 0.3, dice() * 2 - 1 || 0.3];
              M.anim = [ANIM.gacha, i, dice() * 6.28, 0];
              M.box(bx, wy + layer * 0.073, bz, R * 2, R * 2, R * 2, tint, 0.92, [...tilt, ...tilt], 0, KIND.ball);
            }
          }
        }
      });
    }
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
  // Three street cats (the orange one from the old site brought friends)
  cats(M);

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
  glow(5.0, 1.25, 0.72, 3.4, 3.4, 0xfff4d6, 0.1);
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

// ── Cats ────────────────────────────────────────────────────────────────────
type Coat = { fur: number; light: number; nose: number; eyes: number; stripes: number[] };
const ORANGE: Coat = { fur: 0xe08a3c, light: 0xf6dcb0, nose: 0xe58a8a, eyes: 0xd9e85a, stripes: [62, 0.32, 62, 0.32] };
const GREY: Coat = { fur: 0x8c877f, light: 0xe2ddd3, nose: 0xc98585, eyes: 0x9fe07a, stripes: [70, 0.42, 70, 0.42] };
const TUXEDO: Coat = { fur: 0x26262b, light: 0xf0ede6, nose: 0x3a2e30, eyes: 0xf2d24a, stripes: NO_UV };

/**
 * A cat sculpted from fur ellipsoids. Parts are given in the cat's own frame
 * (x: its left→right, y: up from the paws, z: towards its nose), then scaled,
 * yawed and dropped at (x, z) on the sidewalk.
 */
function makeCat(bag: Bag, x: number, z: number, yaw: number, scale: number, coat: Coat) {
  const Y0 = 0.12;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  /** An ellipsoid centred on (lx, ly, lz) with full sizes w × h × d. */
  const part = (
    lx: number, ly: number, lz: number, w: number, h: number, d: number,
    color: number, uv: number[] = NO_UV, turn = 0, emissive = 0,
  ) => {
    lx *= scale; ly *= scale; lz *= scale;
    w *= scale; h *= scale; d *= scale;
    bag.box(x + c * lx + s * lz, Y0 + ly - h / 2, z - s * lx + c * lz, w, h, d, color, emissive, uv, yaw + turn, KIND.fur);
  };
  const anim = (a: number[], draw: () => void) => {
    bag.anim = a;
    draw();
    bag.anim = NO_ANIM;
  };
  /** A tail: fur beads strung along a polyline, thinning to the tip; the tip end can swish. */
  const tail = (points: number[][], r0: number, r1: number, swish: (t: number) => number[] | null) => {
    const steps = 18;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const f = t * (points.length - 1);
      const k = Math.min(Math.floor(f), points.length - 2);
      const u = f - k;
      const [ax, ay, az] = points[k], [bx, by, bz] = points[k + 1];
      const r = r0 + (r1 - r0) * t;
      const draw = () => part(ax + (bx - ax) * u, ay + (by - ay) * u, az + (bz - az) * u, r, r, r, coat.fur, coat.stripes);
      const a = swish(t);
      if (a) anim(a, draw);
      else draw();
    }
  };
  /** Head facing +z at (hx, hy, hz), w wide. `sleepy` narrows the eyes to slits. */
  const head = (hx: number, hy: number, hz: number, w: number, sleepy: boolean) => {
    const h = w * 0.86, d = w * 0.86;
    part(hx, hy, hz, w, h, d, coat.fur, coat.stripes);
    // Cheeks and whisker pads give the face its shape
    for (const side of [-1, 1]) part(hx + side * w * 0.27, hy - h * 0.18, hz + d * 0.12, w * 0.5, h * 0.55, d * 0.6, coat.fur, coat.stripes);
    for (const side of [-1, 1]) part(hx + side * w * 0.11, hy - h * 0.2, hz + d * 0.38, w * 0.27, h * 0.24, d * 0.24, coat.light);
    part(hx, hy - h * 0.34, hz + d * 0.3, w * 0.22, h * 0.16, d * 0.2, coat.light); // chin
    part(hx, hy - h * 0.06, hz + d * 0.47, w * 0.12, h * 0.08, d * 0.06, coat.nose);
    // Eyes catch the light at night
    for (const side of [-1, 1]) {
      part(hx + side * w * 0.22, hy + h * 0.08, hz + d * 0.36, w * 0.2, sleepy ? h * 0.05 : h * 0.19, d * 0.12, coat.eyes, NO_UV, 0, sleepy ? 0.5 : 1.4);
      if (!sleepy) part(hx + side * w * 0.22, hy + h * 0.08, hz + d * 0.4, w * 0.035, h * 0.15, d * 0.06, 0x0a0a0c);
    }
    // Ears: a broad base and a narrower tip, angled out, pink inside
    for (const side of [-1, 1]) {
      const ex = hx + side * w * 0.3, ey = hy + h * 0.42, turn = side * 0.4;
      part(ex, ey, hz - d * 0.04, w * 0.34, h * 0.36, d * 0.12, coat.fur, NO_UV, turn);
      part(ex + side * w * 0.03, ey + h * 0.2, hz - d * 0.05, w * 0.17, h * 0.26, d * 0.08, coat.fur, NO_UV, turn);
      part(ex, ey - h * 0.02, hz + d * 0.01, w * 0.2, h * 0.24, d * 0.04, 0xd99a96, NO_UV, turn);
    }
    // Whiskers
    for (const side of [-1, 1]) {
      for (const k of [-1, 1]) {
        const lx = (hx + side * w * 0.42) * scale, ly = (hy - h * 0.2 + k * 0.004) * scale, lz = (hz + d * 0.36) * scale;
        bag.box(x + c * lx + s * lz, Y0 + ly, z - s * lx + c * lz, 0.11 * scale, 0.0018, 0.0018, 0xf4f1ea, 0.7, NO_UV, yaw + side * (0.25 + k * 0.1));
      }
    }
  };
  return { part, anim, tail, head };
}

function cats(bag: Bag) {
  // 1. The chonk: an orange tabby loafing by the door, eyes half shut
  {
    const { part, anim, tail, head } = makeCat(bag, 1.85, 1.3, -0.35, 1, ORANGE);
    part(0, 0.035, 0, 0.44, 0.07, 0.5, ORANGE.fur, ORANGE.stripes); // fur pooling on the ground
    anim([ANIM.bob, 1.4, 0, 0.004], () => {
      part(0, 0.13, -0.02, 0.4, 0.25, 0.5, ORANGE.fur, ORANGE.stripes);
      part(0, 0.17, -0.12, 0.36, 0.2, 0.26, ORANGE.fur, ORANGE.stripes); // round rump
      part(0, 0.1, 0.17, 0.26, 0.16, 0.14, ORANGE.light); // chest ruff
    });
    for (const side of [-1, 1]) part(side * 0.065, 0.016, 0.25, 0.07, 0.032, 0.07, ORANGE.light); // tucked paws
    anim([ANIM.bob, 1.4, 0.3, 0.003], () => head(0, 0.26, 0.2, 0.2, true));
    tail(
      [[0.12, 0.05, -0.25], [0.2, 0.03, -0.12], [0.22, 0.025, 0.04], [0.16, 0.02, 0.17]],
      0.07, 0.05,
      (t) => (t > 0.7 ? [ANIM.wag, 1.1, t * 3, (t - 0.7) * 0.06] : null),
    );
  }

  // 2. A grey tabby sitting upright, tail wrapped around its front paws
  {
    const { part, anim, tail, head } = makeCat(bag, -2.25, 1.45, 0.3, 1, GREY);
    anim([ANIM.bob, 1.7, 0.8, 0.003], () => {
      part(0, 0.08, -0.05, 0.22, 0.17, 0.24, GREY.fur, GREY.stripes); // haunches
      for (const side of [-1, 1]) part(side * 0.075, 0.07, -0.02, 0.1, 0.13, 0.19, GREY.fur, GREY.stripes);
      part(0, 0.18, 0.0, 0.16, 0.22, 0.15, GREY.fur, GREY.stripes);
      part(0, 0.23, 0.035, 0.13, 0.17, 0.12, GREY.fur, GREY.stripes);
      part(0, 0.2, 0.075, 0.09, 0.17, 0.06, GREY.light); // bib
    });
    for (const side of [-1, 1]) {
      part(side * 0.035, 0.1, 0.07, 0.042, 0.19, 0.045, GREY.fur, GREY.stripes);
      part(side * 0.036, 0.016, 0.095, 0.05, 0.032, 0.07, GREY.light);
    }
    part(0, 0.3, 0.035, 0.1, 0.09, 0.09, GREY.fur, GREY.stripes); // neck
    anim([ANIM.wag, 0.35, 0, 0.006], () => head(0, 0.35, 0.055, 0.15, false));
    tail(
      [[0, 0.04, -0.17], [0.11, 0.025, -0.12], [0.14, 0.02, 0.0], [0.1, 0.02, 0.1], [0.02, 0.02, 0.14]],
      0.05, 0.035,
      (t) => (t > 0.8 ? [ANIM.wag, 3.2, t * 4, (t - 0.8) * 0.05] : null),
    );
  }

  // 3. A slightly smaller tuxedo cat strolling along the kerb, tail up
  {
    const { part, anim, tail, head } = makeCat(bag, 4.0, 1.75, -1.25, 0.82, TUXEDO);
    anim([ANIM.bob, 2.2, 0, 0.003], () => {
      part(0, 0.2, 0, 0.13, 0.13, 0.3, TUXEDO.fur);
      part(0, 0.2, -0.1, 0.14, 0.14, 0.14, TUXEDO.fur);
      part(0, 0.21, 0.1, 0.13, 0.15, 0.13, TUXEDO.fur);
      part(0, 0.16, 0.1, 0.1, 0.09, 0.12, TUXEDO.light); // white chest and belly
      part(0, 0.15, 0.0, 0.08, 0.06, 0.2, TUXEDO.light);
      part(0, 0.28, 0.15, 0.08, 0.1, 0.09, TUXEDO.fur); // neck
    });
    // Mid-stride: one front and one hind leg forward, white socks
    for (const [lx, lz] of [[-0.04, 0.14], [0.04, 0.09], [-0.04, -0.08], [0.04, -0.13]]) {
      part(lx, 0.1, lz, 0.042, 0.18, 0.048, TUXEDO.fur);
      part(lx, 0.035, lz + 0.005, 0.044, 0.06, 0.05, TUXEDO.light);
      part(lx, 0.014, lz + 0.015, 0.046, 0.028, 0.065, TUXEDO.light);
    }
    anim([ANIM.bob, 2.2, 0.4, 0.004], () => head(0, 0.33, 0.2, 0.13, false));
    tail(
      [[0, 0.24, -0.16], [0, 0.32, -0.22], [0, 0.44, -0.23], [0, 0.52, -0.2], [0, 0.54, -0.15]],
      0.042, 0.032,
      (t) => [ANIM.wag, 1.6, -t * 1.5, t * t * 0.03],
    );
  }
}
