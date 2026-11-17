import type { Skin } from "app/lib/skins";
import { UV } from "./atlas";
import { topUv } from "./atlas-base";
import { ANIM, type Bag, KIND, mulberry32, NO_ANIM, NO_UV } from "./bag";
import { BOTTLES, CANS, SPR } from "./sprites";

/**
 * The inside of the store, laid out like a real konbini:
 *   front window  → magazine rack, copier, ATM, ticket kiosk, ice cream chest
 *   left wall     → walk-in drink coolers (the first door is the hot case)
 *   back wall     → open chilled case: milk, onigiri, sandwiches, bento, desserts
 *   centre        → two gondolas with end caps
 *   right         → the counter: fried food, registers, steamed buns, oden, coffee,
 *                   with the microwaves and the cigarette wall behind the clerk
 */

/** Dropped ceiling (the fascia sign hides the void above it) and the top of the floor tiles. */
export const CEIL = 3.0;
export const FLOOR = 0.16;

/** Where fixtures stand on the floor [x0, z0, x1, z1]: the shader darkens the tiles around them. */
export const FOOTPRINTS: number[][] = [
  [-4.3, -3.0, 1.9, -2.2], [-4.3, -4.8, 1.9, -4.0], // gondolas
  [1.94, -2.96, 2.37, -2.24], [1.94, -4.76, 2.37, -4.04], // end caps
  [3.9, -5.4, 4.6, -1.5], [5.55, -5.25, 5.95, -1.55], // counter, back cabinet
  [-5.95, -6.43, -5.29, -1.37], // coolers
  [-5.25, -6.95, 3.75, -6.2], // chilled case
  [-5.8, -0.75, -1.3, -0.45], // magazine rack
  [1.65, -1.0, 2.55, -0.4], [2.95, -1.0, 3.65, -0.4], [4.0, -0.78, 4.5, -0.34], // copier, ATM, kiosk
  [5.25, -1.36, 5.95, -0.2], // ice cream chest
  [-5.76, -1.22, -5.28, -0.88], // baskets
  [-4.78, -1.47, -4.42, -1.23], [0.32, -5.72, 0.68, -5.48], [4.82, -2.87, 5.18, -2.63], // people
];

/** rotY that turns a box's front (+z, the textured face) towards +x, -x and -z. */
const TO_X = Math.PI / 2, TO_NX = -Math.PI / 2, TO_NZ = Math.PI;

const WHITE = 0xe9ebe8;
const SHELF = 0xe3e5e2;
const STEEL = 0xb9bec4;
const DARK = 0x2b2e35;
const css = (color: string) => parseInt(color.slice(1), 16);

export const tube = (
  bag: Bag, cx: number, y0: number, cz: number, d: number, h: number,
  color: number, em = 0.95, uv: number[] = NO_UV, rot = 0, depth = d,
) => bag.box(cx, y0, cz, d, h, depth, color, em, uv, rot, KIND.tube);

export const soft = (
  bag: Bag, cx: number, y0: number, cz: number, w: number, h: number, d: number,
  color: number, em = 0.95, rot = 0,
) => bag.box(cx, y0, cz, w, h, d, color, em, NO_UV, rot, KIND.soft);

// ── People ──────────────────────────────────────────────────────────────────
export type Look = {
  top: number;
  bottom: number;
  hair: number;
  /** Horizontal bands across the chest (the clerk's uniform). */
  stripes?: number[];
  /** "front": forearms forward, holding something. "wave": right hand up, waving. */
  pose?: "front" | "wave";
  height?: number;
};

/**
 * A standing figure made of tubes and ellipsoids, facing local +z, turned by `yaw`.
 * Everything above the legs breathes with `bob`.
 */
export function person(bag: Bag, x: number, z: number, yaw: number, look: Look, bob: number[] = NO_ANIM) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const k = (look.height ?? 1.7) / 1.7;
  const put = (
    kind: number, lx: number, y: number, lz: number, w: number, h: number, d: number,
    color: number, em = 0.95, uv: number[] = NO_UV,
  ) => {
    lx *= k; lz *= k;
    bag.box(x + c * lx + s * lz, FLOOR + y * k, z - s * lx + c * lz, w * k, h * k, d * k, color, em, uv, yaw, kind);
  };
  const SKIN = 0xf0c8a4;
  for (const e of [-1, 1]) {
    put(KIND.soft, e * 0.09, 0, 0.035, 0.11, 0.08, 0.26, 0x1d1d22, 0.8); // shoes
    put(KIND.tube, e * 0.09, 0.05, 0, 0.135, 0.78, 0.15, look.bottom, 0.5);
  }
  const saved = bag.anim;
  bag.anim = bob;
  put(KIND.tube, 0, 0.8, 0, 0.38, 0.56, 0.23, look.top, 0.4); // torso
  put(KIND.soft, 0, 1.24, 0, 0.45, 0.19, 0.24, look.top); // shoulders
  (look.stripes ?? []).forEach((color, i) => put(KIND.tube, 0, 1.2 - i * 0.09, 0, 0.386, 0.045, 0.236, color, 0.4));
  if (look.stripes) put(KIND.solid, 0.1, 1.14, 0.117, 0.07, 0.04, 0.006, 0xffffff, 1); // name tag
  put(KIND.tube, 0, 1.38, 0, 0.1, 0.09, 0.1, SKIN, 0.3);
  put(KIND.soft, 0, 1.45, 0.005, 0.2, 0.25, 0.22, SKIN); // head
  put(KIND.fur, 0, 1.53, -0.02, 0.216, 0.19, 0.236, look.hair, 0.85); // hair
  for (const e of [-1, 1]) {
    put(KIND.soft, e * 0.042, 1.565, 0.103, 0.024, 0.03, 0.02, 0x17171c, 0.9); // eyes
    put(KIND.soft, e * 0.103, 1.53, 0.0, 0.03, 0.06, 0.04, SKIN); // ears
    // Arms: sleeve, then the forearm
    const up = look.pose === "wave" && e > 0;
    put(KIND.tube, e * 0.235, 1.04, 0, 0.105, 0.3, 0.105, look.top, 0.4);
    if (up) continue;
    if (look.pose === "front") {
      put(KIND.soft, e * 0.215, 0.98, 0.15, 0.085, 0.085, 0.36, SKIN);
      put(KIND.soft, e * 0.19, 0.975, 0.31, 0.085, 0.09, 0.1, SKIN);
    } else {
      put(KIND.tube, e * 0.235, 0.78, 0, 0.08, 0.27, 0.08, SKIN, 0.3);
      put(KIND.soft, e * 0.235, 0.7, 0.005, 0.085, 0.11, 0.09, SKIN);
    }
  }
  if (look.pose === "wave") {
    bag.anim = [ANIM.sway, 2.4, 0, 0.1];
    put(KIND.tube, 0.27, 1.28, 0.02, 0.08, 0.3, 0.08, SKIN, 0.3);
    put(KIND.soft, 0.27, 1.56, 0.02, 0.09, 0.12, 0.07, SKIN);
  }
  bag.anim = saved;
}

type StoreKit = {
  M: Bag;
  glass: (cx: number, y0: number, cz: number, w: number, h: number, d: number, strength?: number) => void;
  animated: (anim: number[], draw: () => void) => void;
  skin: Skin;
};

export function buildStore({ M, glass, animated, skin }: StoreKit) {
  const dice = mulberry32(31);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(dice() * list.length)];
  const index = (n: number) => Math.floor(dice() * n);
  const [c1, c2, c3] = skin.colors;
  const brand = c1 === 0xffffff ? c2 : c1;
  const accent = c3 === 0xffffff ? c2 : c3;

  // ── Ceiling, lights, wall trim ────────────────────────────────────────────
  M.box(0, CEIL, -3.5, 12, 0.1, 7, 0xf4f5f3, 1.12);
  for (const z of [-3.5, -5.5]) M.box(0, CEIL - 0.025, z, 10.6, 0.03, 0.3, 0xffffff, 1.7);
  animated([ANIM.flicker, 0, 0.37, 0.5], () => M.box(0, CEIL - 0.025, -1.5, 10.6, 0.03, 0.3, 0xffffff, 1.7));
  for (const z of [-1.5, -3.5, -5.5]) {
    for (const e of [-0.165, 0.165]) M.box(0, CEIL - 0.03, z + e, 10.64, 0.035, 0.03, 0xd9dcdf, 0.9);
  }
  // The chain's colours run around the top of the walls
  M.box(1.2, 2.62, -6.89, 9.4, 0.1, 0.02, brand, 1);
  M.box(1.2, 2.76, -6.89, 9.4, 0.04, 0.02, accent, 1);
  M.box(5.89, 2.62, -0.8, 0.02, 0.1, 1.6, brand, 1);
  M.box(5.89, 2.76, -0.8, 0.02, 0.04, 1.6, accent, 1);
  // Skirting
  M.box(0, FLOOR, -6.89, 11.8, 0.1, 0.02, 0x9aa0a6, 0.8);
  for (const s of [-1, 1]) M.box(s * 5.89, FLOOR, -3.5, 0.02, 0.1, 6.9, 0x9aa0a6, 0.8);

  // ── Front window: magazine rack (→ Blog) ──────────────────────────────────
  M.box(-3.55, FLOOR, -0.6, 4.5, 1.5, 0.3, WHITE, 0.9);
  M.box(-3.55, 1.66, -0.6, 4.54, 0.03, 0.34, 0xffffff, 1);
  for (let row = 0; row < 2; row++) {
    M.box(-3.55, 0.64 + row * 0.5, -0.43, 4.5, 0.03, 0.06, 0xffffff, 1);
    for (let i = 0; i < 13; i++) {
      const cover = index(SPR.mag.length);
      M.box(-5.6 + i * 0.34, 0.68 + row * 0.5, -0.43, 0.27, 0.38, 0.04, 0xf4f4f0, 1, SPR.mag[cover]);
    }
  }
  // Someone reading for free, of course
  person(M, -4.6, -1.35, 0, { top: 0x34435e, bottom: 0x23262d, hair: 0x2b2019, pose: "front" }, [ANIM.bob, 0.8, 1.3, 0.006]);
  animated([ANIM.bob, 0.8, 1.3, 0.006], () => {
    M.box(-4.6, FLOOR + 0.94, -1.0, 0.32, 0.22, 0.02, 0xfafaf7, 1);
    M.box(-4.6, FLOOR + 0.94, -0.992, 0.32, 0.22, 0.012, 0xf4f4f0, 1, SPR.mag[2]);
  });

  // Multi-function copier (→ Editor): paper drawers, scanner bed, feeder, touch panel
  M.box(2.1, FLOOR, -0.7, 0.9, 0.78, 0.6, 0xe6e8ea, 0.95);
  for (const y of [0.3, 0.5, 0.7]) {
    M.box(2.1, y, -1.003, 0.8, 0.17, 0.006, 0xd7dadd, 0.95);
    M.box(2.1, y + 0.1, -1.008, 0.2, 0.025, 0.008, 0x8a9199, 0.8);
  }
  M.box(2.1, 0.94, -0.7, 0.96, 0.16, 0.66, 0xf1f2f3, 0.95);
  M.box(2.1, 1.1, -0.7, 0.96, 0.03, 0.66, DARK, 0.7);
  M.box(1.98, 1.13, -0.66, 0.66, 0.1, 0.52, 0xe6e8ea, 0.95); // document feeder
  M.box(1.98, 1.23, -0.72, 0.5, 0.012, 0.3, 0xfafafa, 1); // a forgotten original
  M.box(2.44, 1.13, -0.88, 0.24, 0.17, 0.03, DARK, 0.8);
  M.box(2.44, 1.145, -0.897, 0.22, 0.14, 0.004, 0xffffff, 1.5, SPR.copier[0], TO_NZ);
  M.box(1.6, 0.86, -0.75, 0.12, 0.02, 0.4, 0xd7dadd, 0.9); // output tray
  M.box(2.1, 1.28, -0.42, 0.9, 0.3, 0.02, 0xffffff, 1, SPR.pop[2], TO_NZ);

  // ATM (→ Games)
  M.box(3.3, FLOOR, -0.7, 0.7, 1.72, 0.6, brand, 0.95);
  M.box(3.3, 0.92, -1.004, 0.62, 0.78, 0.01, 0xe6e8ea, 0.95);
  M.box(3.3, 1.27, -1.014, 0.46, 0.345, 0.012, 0x0b1830, 0.9);
  M.box(3.3, 1.285, -1.022, 0.42, 0.315, 0.004, 0xffffff, 1.5, SPR.atm[0], TO_NZ);
  M.box(3.3, 1.02, -1.06, 0.6, 0.03, 0.12, 0xd7dadd, 0.95); // ledge
  M.box(3.18, 1.05, -1.07, 0.16, 0.012, 0.09, DARK, 0.7); // keypad
  M.box(3.46, 1.1, -1.012, 0.14, 0.02, 0.008, 0x111318, 0.5); // card slot
  M.box(3.46, 1.125, -1.014, 0.03, 0.012, 0.006, 0x49e08a, 1.6);
  M.box(3.3, 0.72, -1.012, 0.4, 0.05, 0.008, 0x111318, 0.5); // cash drawer
  M.box(3.3, 1.9, -0.7, 0.72, 0.2, 0.62, 0xffffff, 1.25);
  M.box(3.3, 1.92, -1.012, 0.5, 0.16, 0.004, 0xffffff, 1.3, SPR.takuhai[0], TO_NZ);

  // Ticket kiosk
  M.box(4.25, FLOOR, -0.56, 0.46, 0.95, 0.4, 0xe6e8ea, 0.95);
  M.box(4.25, 1.11, -0.5, 0.46, 0.62, 0.26, 0xc1121f, 0.95);
  M.box(4.25, 1.15, -0.633, 0.36, 0.48, 0.004, 0xffffff, 1.5, SPR.kiosk[0], TO_NZ);
  M.box(4.25, 0.98, -0.765, 0.3, 0.025, 0.03, DARK, 0.6); // receipt slot

  // Ice cream chest along the right wall, sliding glass lids
  {
    const z0 = -1.34, z1 = -0.22, zc = (z0 + z1) / 2, len = z1 - z0;
    M.box(5.6, FLOOR, zc, 0.66, 0.78, len, 0xf4f5f3, 0.95);
    M.box(5.268, 0.5, zc, 0.006, 0.2, len - 0.04, brand, 1);
    M.box(5.6, FLOOR, zc, 0.68, 0.08, len + 0.02, 0x3a3f47, 0.6);
    M.box(5.6, 0.94, zc, 0.56, 0.01, len - 0.1, 0xdff1fa, 1.3); // frosted well
    for (const e of [-1, 1]) {
      M.box(5.6 + e * 0.31, 0.94, zc, 0.05, 0.1, len, 0xd7dadd, 0.95);
      M.box(5.6, 0.94, zc + e * (len / 2 - 0.025), 0.66, 0.1, 0.05, 0xd7dadd, 0.95);
    }
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6; i++) {
        const z = z0 + 0.14 + i * 0.172;
        const flavour = (i + row * 2) % SPR.ice.length;
        M.box(5.42 + row * 0.18, 0.95, z, 0.15, 0.035 + dice() * 0.02, 0.16, 0xf4f5f3, 1, topUv(SPR.ice[flavour]), TO_NX);
      }
    }
    M.box(5.6, 1.035, zc, 0.03, 0.012, len, 0xc9ced3, 0.9);
    glass(5.6, 1.04, zc, 0.58, 0.004, len - 0.08, 0.05);
    M.box(5.86, 1.25, zc, 0.9, 0.44, 0.02, 0xffffff, 1.1, SPR.pop[0], TO_NX);
  }

  // ── Left wall: walk-in drink coolers, five glass doors ────────────────────
  {
    const Z0 = -6.4, Z1 = -1.4, ZC = (Z0 + Z1) / 2, LEN = Z1 - Z0;
    for (let d = 0; d < 5; d++) {
      const hot = d === 0;
      M.box(-5.9, FLOOR, Z1 - 0.5 - d, 0.04, 2.34, 1.0, hot ? 0xffd9b0 : 0xe6f3fa, hot ? 1.15 : 1.1);
      glass(-5.3, 0.3, Z1 - 0.5 - d, 0.01, 2.14, 0.92, 0.07);
      M.box(-5.26, 0.9, Z1 - 0.1 - d, 0.03, 0.7, 0.03, 0xd0d4d8, 0.8); // handle
    }
    M.box(-5.6, FLOOR, ZC, 0.62, 0.14, LEN, 0x3a3f47, 0.6); // kick
    M.box(-5.6, 2.5, ZC, 0.7, 0.36, LEN + 0.06, brand, 1); // header
    M.box(-5.27, 2.44, ZC, 0.02, 0.05, LEN, 0xffffff, 1.6); // door-top light
    M.box(-5.3, 2.44, ZC, 0.06, 0.06, LEN, 0x8a9199, 0.6);
    for (let d = 0; d <= 5; d++) M.box(-5.3, FLOOR, Z1 - d, 0.06, 2.34, 0.06, 0x8a9199, 0.7);
    M.box(-5.245, 2.6, Z1 - 0.5, 0.004, 0.14, 0.42, 0xffffff, 1.2, SPR.temp[0], TO_X);
    M.box(-5.245, 2.6, Z1 - 2.5, 0.004, 0.14, 0.42, 0xffffff, 1.2, SPR.temp[1], TO_X);
    for (let level = 0; level < 5; level++) {
      const y = 0.32 + level * 0.43;
      M.box(-5.62, y - 0.015, ZC, 0.56, 0.015, LEN, 0xdfe6ea, 1);
      M.box(-5.345, y - 0.045, ZC, 0.01, 0.04, LEN, 0xffffff, 1.1); // price rail
      for (let d = 0; d < 5; d++) {
        const zDoor = Z1 - 0.5 - d;
        const hot = d === 0;
        // Two products per shelf, three or four facings each
        const cans = hot ? level > 1 : level === 4 || (level === 3 && d > 2);
        const skus = [index(8), index(8)];
        if (hot) skus.forEach((_, i) => (skus[i] = cans ? index(4) : [0, 1, 5][index(3)]));
        for (let f = 0; f < 7; f++) {
          const z = zDoor - 0.39 + f * 0.13;
          const sku = skus[f < 3 ? 0 : 1];
          for (const depth of [0, 1]) {
            const x = -5.42 - depth * 0.085;
            if (cans) {
              tube(M, x, y, z, 0.066, 0.122, depth ? css(CANS[sku][0]) : 0xc9ced3, 1, depth ? NO_UV : SPR.can[sku], TO_X);
            } else {
              const liquid = css(BOTTLES[sku][1]);
              tube(M, x, y, z, 0.066, depth ? 0.2 : 0.17, liquid, 1, depth ? NO_UV : SPR.bottle[sku], TO_X);
              if (depth) continue;
              tube(M, x, y + 0.17, z, 0.05, 0.022, liquid, 0.9);
              tube(M, x, y + 0.192, z, 0.03, 0.03, hot ? 0xe85d04 : 0xf5f5f2, 0.9);
            }
          }
        }
      }
    }
  }

  // ── Back wall: open chilled case ──────────────────────────────────────────
  {
    const X0 = -5.25, X1 = 3.75, XC = (X0 + X1) / 2, W = X1 - X0;
    M.box(XC, FLOOR, -6.88, W, 2.1, 0.06, 0xeef6fa, 1.1); // lit back
    M.box(XC, FLOOR, -6.55, W, 0.46, 0.7, 0x3a3f47, 0.7); // plinth
    M.box(XC, 0.52, -6.2, W, 0.1, 0.03, 0xdfe2e0, 0.95); // front lip of the well
    M.box(XC, 2.08, -6.67, W, 0.26, 0.46, brand, 1); // canopy
    M.box(XC, 2.05, -6.6, W - 0.1, 0.03, 0.16, 0xffffff, 1.7);
    M.box(XC, 2.04, -6.46, W, 0.07, 0.06, 0xd7dadd, 0.95); // night blind, rolled up
    for (const x of [X0, -2.4, 0.75, X1]) M.box(x, FLOOR, -6.55, 0.04, 2.18, 0.72, WHITE, 0.95);
    const tiers = [
      { y: 0.62, front: -6.2 },
      { y: 0.98, front: -6.32 },
      { y: 1.34, front: -6.42 },
      { y: 1.7, front: -6.52 },
    ];
    tiers.forEach(({ y, front }) => {
      const depth = front + 6.88;
      M.box(XC, y - 0.02, front - depth / 2, W, 0.02, depth, SHELF, 1);
      M.box(XC, y - 0.055, front + 0.005, W, 0.045, 0.01, 0xfff3b0, 1.05);
    });
    const run = (x0: number, x1: number, pitch: number, place: (x: number, i: number) => void) => {
      const n = Math.floor((x1 - x0 - 0.06) / pitch);
      const start = (x0 + x1) / 2 - ((n - 1) * pitch) / 2;
      for (let i = 0; i < n; i++) place(start + i * pitch, i);
    };
    /** `facings` neighbours share a product, like a real planogram. */
    const sku = (i: number, facings: number, count: number, offset = 0) => (Math.floor(i / facings) + offset) % count;

    // Dairy and drinks (left bay)
    run(X0, -2.4, 0.085, (x, i) => {
      for (const dz of [0.05, 0.14, 0.23]) M.box(x, 0.62, tiers[0].front - dz, 0.075, 0.2, 0.075, 0xf4f4f0, 1, dz < 0.1 ? SPR.carton[sku(i, 4, 4)] : NO_UV);
    });
    run(X0, -2.4, 0.075, (x, i) => {
      for (const dz of [0.05, 0.13]) tube(M, x, 0.98, tiers[1].front - dz, 0.066, 0.1, 0xf4f1e6, 1, dz < 0.1 ? SPR.can[sku(i, 5, 4)] : NO_UV);
    });
    run(X0, -2.4, 0.085, (x, i) => {
      for (const dz of [0.05, 0.14]) M.box(x, 1.34, tiers[2].front - dz, 0.07, 0.17, 0.07, 0xf4f4f0, 1, dz < 0.1 ? SPR.carton[sku(i, 4, 4, 2)] : NO_UV);
    });
    run(X0, -2.4, 0.075, (x, i) => {
      tube(M, x, 1.7, tiers[3].front - 0.05, 0.066, 0.1, 0xf4f1e6, 1, SPR.can[sku(i, 5, 8, 4)]);
    });

    // Rice and bread (middle bay): bento, onigiri, sandwiches
    run(-2.4, 0.75, 0.262, (x, i) => {
      for (const dz of [0.11, 0.32, 0.53]) {
        M.box(x, 0.62, tiers[0].front - dz, 0.24, 0.045, 0.18, 0x17181b, 1, topUv(SPR.bento[sku(i, 2, 5)]));
      }
      M.box(x, 0.665, tiers[0].front - 0.53, 0.24, 0.045, 0.18, 0x17181b, 1, topUv(SPR.bento[sku(i, 2, 5)]));
    });
    run(-2.4, 0.75, 0.112, (x, i) => {
      const flavour = sku(i, 4, 4);
      for (const dz of [0.03, 0.085, 0.14, 0.195]) {
        M.box(x, 0.98, tiers[1].front - dz, 0.104, 0.0975, 0.004, 0xffffff, 1, SPR.onigiri[flavour], 0, KIND.card);
        M.box(x, 0.98, tiers[1].front - dz - 0.02, 0.08, 0.045, 0.034, 0x1b241f, 0.9);
      }
    });
    run(-2.4, 0.75, 0.135, (x, i) => {
      const kind = sku(i, 4, 3);
      for (const dz of [0.03, 0.1, 0.17]) {
        M.box(x, 1.34, tiers[2].front - dz, 0.126, 0.105, 0.004, 0xffffff, 1, SPR.sando[kind], 0, KIND.card);
        M.box(x - 0.012, 1.34, tiers[2].front - dz - 0.03, 0.095, 0.07, 0.05, 0xf6efdc, 0.95);
      }
    });
    run(-2.4, 0.75, 0.125, (x, i) => {
      for (const dz of [0.05, 0.14]) M.box(x, 1.7, tiers[3].front - dz, 0.115, 0.079, 0.08, 0xfbf7ea, 1, dz < 0.1 ? SPR.sweet[sku(i, 3, 4)] : NO_UV);
    });

    // Noodles, salads, desserts (right bay)
    run(0.75, X1, 0.262, (x, i) => {
      for (const dz of [0.11, 0.32, 0.53]) {
        M.box(x, 0.62, tiers[0].front - dz, 0.24, 0.045, 0.18, 0x17181b, 1, topUv(SPR.bento[sku(i, 2, 5, 3)]));
      }
    });
    run(0.75, X1, 0.135, (x, i) => {
      const kind = sku(i, 4, 3, 1);
      for (const dz of [0.03, 0.1, 0.17]) {
        M.box(x, 0.98, tiers[1].front - dz, 0.126, 0.105, 0.004, 0xffffff, 1, SPR.sando[kind], 0, KIND.card);
        M.box(x - 0.012, 0.98, tiers[1].front - dz - 0.03, 0.095, 0.07, 0.05, 0xf6efdc, 0.95);
      }
    });
    run(0.75, X1, 0.125, (x, i) => {
      for (const dz of [0.05, 0.14, 0.23]) M.box(x, 1.34, tiers[2].front - dz, 0.115, 0.079, 0.08, 0xfbf7ea, 1, dz < 0.1 ? SPR.sweet[sku(i, 3, 4, 1)] : NO_UV);
    });
    run(0.75, X1, 0.09, (x, i) => {
      // Pudding and yoghurt cups
      const cup = [0xf6d55c, 0xfde2e4, 0xf4f1e6, 0xcdb4db][sku(i, 4, 4)];
      tube(M, x, 1.7, tiers[3].front - 0.05, 0.072, 0.07, cup, 1);
      tube(M, x, 1.77, tiers[3].front - 0.05, 0.078, 0.008, 0xffffff, 1);
    });
  }

  // ── Centre gondolas, double sided ─────────────────────────────────────────
  const gondola = (
    x0: number, x1: number, cz: number, h: number, levels: number[],
    fill: (side: 1 | -1, level: number, x0: number, x1: number, y: number, edge: number) => void,
    /** Back side, upper levels: shelves stop here (room for a display board). */
    backOpenFrom?: number,
  ) => {
    const cx = (x0 + x1) / 2, w = x1 - x0;
    M.box(cx, FLOOR, cz, w, h, 0.06, 0xf1f2ef, 0.95);
    M.box(cx, FLOOR, cz, w, 0.12, 0.8, 0xc9ccc8, 0.85);
    M.box(cx, FLOOR + h, cz, w + 0.04, 0.03, 0.82, 0xffffff, 1);
    for (const x of [x0, x1]) M.box(x, FLOOR, cz, 0.04, h, 0.8, WHITE, 0.95);
    for (const side of [1, -1] as const) {
      levels.forEach((y, i) => {
        const end = side === -1 && i > 0 && backOpenFrom !== undefined ? backOpenFrom : x1;
        const sx = (x0 + end) / 2, sw = end - x0;
        M.box(sx, y - 0.02, cz + side * 0.21, sw, 0.02, 0.38, SHELF, 0.95);
        M.box(sx, y - 0.055, cz + side * 0.4, sw, 0.035, 0.01, 0xffffff, 1.05);
        fill(side, i, x0 + 0.08, end - 0.06, y, cz + side * 0.38);
      });
    }
  };
  /** Puts an item on a shelf against its front edge, artwork facing the aisle. */
  const item = (
    x: number, y: number, edge: number, side: number, w: number, h: number, d: number,
    color: number, uv: number[] = NO_UV, row = 0,
  ) => M.box(x, y, edge - side * (d / 2 + 0.03 + row * (d + 0.012)), w, h, d, color, 1, uv, side > 0 ? 0 : TO_NZ);
  const BAG_TINT = [0xf7c531, 0xe76f51, 0x2a9d8f, 0xf28482, 0x3a86ff, 0x7b2cbf, 0x6f4518, 0xbc6c25];
  const BOX_TINT = [0xc1121f, 0x2d6a4f, 0xf7c531, 0x1d3557, 0xff8fab, 0x5a3d2b];
  const CUP_LID = [0xd62828, 0xf2b632, 0x2a9d8f, 0x3d348b];
  /** A shelf of crisps: each product gets three facings and a spare row behind. */
  const bags = (side: number, x0: number, x1: number, y: number, edge: number, offset: number) => {
    let i = 0;
    for (let x = x0 + 0.1; x < x1 - 0.06; x += 0.19, i++) {
      const sku = (Math.floor(i / 3) + offset) % 8;
      item(x, y, edge, side, 0.17, 0.21, 0.06, BAG_TINT[sku], SPR.bag[sku]);
      item(x, y, edge, side, 0.17, 0.2, 0.06, BAG_TINT[sku], NO_UV, 1);
    }
  };
  /** Small boxes, stacked two high. */
  const boxes = (side: number, x0: number, x1: number, y: number, edge: number, offset: number) => {
    let i = 0;
    for (let x = x0 + 0.09; x < x1 - 0.06; x += 0.172, i++) {
      const sku = (Math.floor(i / 4) + offset) % 6;
      for (const up of [0, 0.096]) {
        item(x, y + up, edge, side, 0.155, 0.095, 0.045, BOX_TINT[sku], SPR.box[sku]);
        item(x, y + up, edge, side, 0.155, 0.095, 0.045, BOX_TINT[sku], NO_UV, 1);
      }
    }
  };

  // Gondola 1: snacks facing the entrance, pixel art prints + cup noodles behind
  const PRINTS_FROM = -1.2; // the right part of its back holds framed pixel art (walk mode)
  gondola(-4.3, 1.9, -2.6, 1.2, [0.28, 0.6, 0.92], (side, level, x0, x1, y, edge) => {
    if (side === 1) {
      if (level === 2) boxes(side, x0, x1, y, edge, 0);
      else bags(side, x0, x1, y, edge, level * 4);
      return;
    }
    let i = 0;
    for (let x = x0 + 0.07; x < x1 - 0.04; x += 0.125, i++) {
      const sku = Math.floor(i / 4) % 4;
      for (const up of [0, 0.118]) {
        tube(M, x, y + up, edge + 0.085, 0.108, 0.1, 0xf6f3ea, 1, SPR.cup[sku], TO_NZ);
        tube(M, x, y + up + 0.1, edge + 0.085, 0.116, 0.012, CUP_LID[sku], 1);
      }
    }
  }, PRINTS_FROM);
  M.box(0.3, 0.52, -2.66, 3.0, 0.84, 0.03, 0xf7f7f4, 1); // pegboard for the prints

  // Gondola 2: games (cartridges) facing the middle aisle, sweets behind
  const SHELLS = [0x8a8f98, 0x3a3d45, 0x6b7280, 0xd1d5db, 0x4b5563];
  const LABELS = [0xe63946, 0xf4a261, 0xffd166, 0x2a9d8f, 0x4cc9f0, 0xf72585, 0xffffff, 0x8ac926, 0x7b2cbf, 0xff7b00];
  gondola(-4.3, 1.9, -4.4, 1.5, [0.28, 0.64, 1.0, 1.36], (side, level, x0, x1, y, edge) => {
    if (side === 1) {
      if (level === 3) return; // top shelf: the featured games, added in walk mode
      for (let x = x0 + 0.06; x < x1; x += 0.13) {
        item(x, y, edge, side, 0.1, 0.12, 0.025, pick(SHELLS));
        M.box(x, y + 0.045, edge - 0.028, 0.08, 0.055, 0.004, pick(LABELS), 1);
      }
    } else if (level === 0 || level === 3) {
      bags(side, x0, x1, y, edge, level + 2);
    } else {
      boxes(side, x0, x1, y, edge, level * 2);
    }
  });

  // End caps by the main aisle: three shelves of whatever is on promotion, a board on top
  [-2.6, -4.4].forEach((cz, cap) => {
    M.box(2.1, FLOOR, cz, 0.34, 1.12, 0.72, 0xf1f2ef, 0.95);
    M.box(2.1, FLOOR, cz, 0.36, 0.1, 0.74, 0xc9ccc8, 0.85);
    [0.3, 0.62, 0.94].forEach((y, level) => {
      M.box(2.3, y - 0.02, cz, 0.12, 0.02, 0.72, SHELF, 0.95);
      M.box(2.362, y - 0.055, cz, 0.008, 0.035, 0.72, 0xffe14d, 1.1);
      for (let i = 0; i < 4; i++) {
        const z = cz - 0.26 + i * 0.172;
        if (cap === 0) {
          const sku = (level * 2 + Math.floor(i / 2)) % 6;
          for (const up of [0, 0.096]) M.box(2.31, y + up, z, 0.155, 0.095, 0.045, BOX_TINT[sku], 1, SPR.box[sku], TO_X);
        } else {
          const sku = (level + Math.floor(i / 2) * 3) % 8;
          tube(M, 2.31, y, z, 0.066, 0.17, css(BOTTLES[sku][1]), 1, SPR.bottle[sku], TO_X);
          tube(M, 2.31, y + 0.17, z, 0.05, 0.022, css(BOTTLES[sku][1]), 0.9);
          tube(M, 2.31, y + 0.192, z, 0.03, 0.03, 0xf5f5f2, 0.9);
        }
      }
    });
    M.box(2.275, 1.28, cz, 0.72, 0.36, 0.012, 0xffffff, 1.15, SPR.pop[cap ? 3 : 1], TO_X);
  });

  // ── Right side: the counter ───────────────────────────────────────────────
  M.box(4.25, FLOOR, -3.45, 0.7, 0.95, 3.9, 0xf1f1ed, 0.95);
  M.box(4.25, FLOOR, -3.45, 0.72, 0.1, 3.92, 0x9aa0a6, 0.7);
  M.box(3.895, 0.68, -3.45, 0.01, 0.07, 3.9, accent, 1);
  M.box(3.895, 0.8, -3.45, 0.01, 0.03, 3.9, brand, 1);
  M.box(4.22, 1.11, -3.45, 0.82, 0.05, 4.0, 0xf7f7f5, 1); // worktop
  M.box(3.815, 1.1, -3.45, 0.012, 0.06, 4.0, brand, 1);
  // Staff gate at the front end, and the cabinet behind
  M.box(5.08, FLOOR + 0.1, -1.5, 0.94, 0.86, 0.04, 0xe6e8ea, 0.95);
  M.box(5.08, 1.12, -1.5, 0.98, 0.04, 0.08, brand, 1);
  M.box(5.72, FLOOR, -3.4, 0.35, 0.9, 3.6, WHITE, 0.95);
  M.box(5.72, 1.06, -3.4, 0.37, 0.03, 3.62, 0xf7f7f5, 1);

  // Heated showcase full of fried food
  {
    const z = -2.0;
    M.box(4.2, 1.16, z, 0.55, 0.05, 0.8, DARK, 0.8);
    M.box(4.46, 1.16, z, 0.04, 0.62, 0.8, 0xc9cdd2, 0.9);
    M.box(4.2, 1.76, z, 0.57, 0.05, 0.82, DARK, 0.8);
    M.box(4.2, 1.745, z, 0.5, 0.012, 0.74, 0xffd9a0, 1.9); // heat lamps
    for (const e of [-0.4, 0.4]) M.box(4.2, 1.16, z + e, 0.55, 0.62, 0.02, STEEL, 0.8);
    glass(3.94, 1.21, z, 0.01, 0.54, 0.78, 0.07);
    const FRIED = [0xc98a2c, 0xd9a040, 0xb26a1f, 0xe0b35a, 0xa85d1a];
    [1.215, 1.49].forEach((y, shelf) => {
      M.box(4.2, y - 0.012, z, 0.48, 0.012, 0.76, 0xd7dadd, 1);
      M.box(3.955, y, z, 0.004, 0.035, 0.76, 0xffffff, 1.1); // price rail
      for (let tray = 0; tray < 4; tray++) {
        const tz = z - 0.285 + tray * 0.19;
        M.box(4.2, y, tz, 0.4, 0.012, 0.17, 0x8a8f96, 0.9);
        const kind = (tray + shelf * 2) % 4;
        for (let i = 0; i < 6; i++) {
          const x = 4.07 + (i % 3) * 0.13, dz = (Math.floor(i / 3) - 0.5) * 0.08;
          const color = pick(FRIED);
          if (kind === 0) soft(M, x, y + 0.01, tz + dz, 0.075, 0.055, 0.065, color, 1.1, dice() * 3); // karaage
          else if (kind === 1) soft(M, x, y + 0.01, tz + dz, 0.11, 0.035, 0.07, color, 1.1); // croquette
          else if (kind === 2) {
            // corn dog on its stick
            soft(M, x, y + 0.01, tz + dz, 0.11, 0.05, 0.05, color, 1.1);
            M.box(x - 0.08, y + 0.03, tz + dz, 0.06, 0.008, 0.008, 0xe8d9b0, 1);
          } else soft(M, x, y + 0.01, tz + dz, 0.1, 0.045, 0.075, 0xd9a040, 1.1, 0.5); // fried chicken
        }
      }
    });
    M.box(3.925, 1.82, z, 0.8, 0.2, 0.02, 0xffffff, 1.1, UV.fried, TO_NX);
  }

  // Registers: till, the customer's display on a stalk, coin tray, card reader
  for (const z of [-2.75, -4.45]) {
    M.box(4.3, 1.16, z, 0.34, 0.12, 0.4, DARK, 0.8);
    M.box(4.36, 1.28, z, 0.05, 0.26, 0.34, DARK, 0.8); // the clerk's screen
    M.box(4.388, 1.3, z, 0.004, 0.22, 0.3, 0x9bdcff, 1.5);
    M.box(4.16, 1.28, z + 0.12, 0.03, 0.2, 0.03, 0x4a4e54, 0.8);
    M.box(4.14, 1.44, z + 0.12, 0.03, 0.14, 0.19, DARK, 0.8);
    M.box(4.122, 1.45, z + 0.12, 0.18, 0.125, 0.004, 0xffffff, 1.5, SPR.reg[0], TO_NX);
    if (z < -4) continue; // the second register's front is taken by the card display (walk mode)
    M.box(4.0, 1.16, z - 0.02, 0.17, 0.014, 0.24, 0x2f6fd0, 1); // blue coin tray
    M.box(4.0, 1.172, z - 0.02, 0.13, 0.004, 0.2, 0x5b93e6, 1);
    M.box(4.02, 1.16, z + 0.3, 0.09, 0.05, 0.15, DARK, 0.8); // card reader
    M.box(4.015, 1.21, z + 0.3, 0.07, 0.006, 0.09, 0x49e08a, 1.5);
    tube(M, 4.02, 1.16, z - 0.22, 0.05, 0.13, 0xdff1fa, 1); // hand sanitiser
    tube(M, 4.02, 1.29, z - 0.22, 0.02, 0.05, 0xffffff, 1);
  }

  // Steamed buns
  {
    const z = -3.3;
    M.box(4.2, 1.16, z, 0.45, 0.06, 0.45, DARK, 0.8);
    M.box(4.2, 1.66, z, 0.47, 0.06, 0.47, DARK, 0.8);
    M.box(4.2, 1.648, z, 0.4, 0.012, 0.4, 0xfff4e0, 1.8);
    for (const [ex, ez] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) M.box(4.2 + ex * 0.215, 1.22, z + ez * 0.215, 0.02, 0.44, 0.02, STEEL, 0.8);
    glass(3.98, 1.22, z, 0.01, 0.44, 0.42, 0.07);
    glass(4.2, 1.22, z + 0.22, 0.42, 0.44, 0.01, 0.06);
    [1.23, 1.37, 1.51].forEach((y, tier) => {
      M.box(4.2, y - 0.01, z, 0.4, 0.008, 0.4, 0xc9cdd2, 1);
      for (let i = 0; i < 6; i++) {
        if (tier === 2 && i > 3) continue; // someone bought two
        const color = tier === 1 && i % 3 === 0 ? 0xf4b860 : tier === 2 && i === 1 ? 0xf7d7c4 : 0xfbf8f0;
        soft(M, 4.07 + (i % 3) * 0.13, y, z - 0.07 + Math.floor(i / 3) * 0.14, 0.11, 0.075, 0.11, color, 1.1);
      }
    });
  }

  // Oden: a steel pan with dividers, simmering away
  {
    const z = -3.9;
    M.box(4.2, 1.16, z, 0.47, 0.15, 0.52, 0xb8bec6, 0.9);
    M.box(4.2, 1.296, z, 0.42, 0.012, 0.47, 0x8a5a24, 1); // broth
    M.box(4.2, 1.3, z, 0.012, 0.016, 0.47, 0xd7dadd, 1);
    for (const e of [-0.08, 0.08]) M.box(4.2, 1.3, z + e, 0.42, 0.016, 0.012, 0xd7dadd, 1);
    for (let i = 0; i < 12; i++) {
      const x = 4.09 + (i % 2) * 0.21 + (dice() - 0.5) * 0.06;
      const iz = z - 0.2 + Math.floor(i / 2) * 0.078 + (dice() - 0.5) * 0.02;
      const what = i % 5;
      if (what === 0) tube(M, x, 1.295, iz, 0.075, 0.03, 0xf2e8cf, 1); // daikon
      else if (what === 1) soft(M, x, 1.29, iz, 0.06, 0.045, 0.075, 0xe9c9a0, 1); // egg
      else if (what === 2) M.box(x, 1.295, iz, 0.08, 0.02, 0.05, 0x8d8d8d, 1, NO_UV, dice()); // konnyaku
      else if (what === 3) soft(M, x, 1.292, iz, 0.11, 0.035, 0.04, 0xd4a373, 1); // chikuwa
      else M.box(x, 1.295, iz, 0.06, 0.03, 0.06, 0xf6e7b4, 1, NO_UV, 0.4); // fried tofu
    }
    M.box(3.925, 1.62, -3.6, 0.9, 0.2, 0.02, 0xffffff, 1.1, UV.steam, TO_NX);
    for (const e of [-0.4, 0.4]) M.box(3.93, 1.31, -3.6 + e, 0.012, 0.31, 0.012, STEEL, 0.8);
  }

  // Self-serve coffee: the machine, cups and lids, sugar
  M.box(4.27, 1.16, -5.0, 0.42, 0.66, 0.44, 0x1a1b1f, 0.85);
  M.box(4.058, 1.2, -5.0, 0.4, 0.6, 0.004, 0xffffff, 1.2, SPR.coffee[0], TO_NX);
  M.box(4.02, 1.16, -5.0, 0.1, 0.02, 0.3, 0x3a3d45, 0.8); // drip tray
  for (let i = 0; i < 2; i++) {
    for (let k = 0; k < 5; k++) tube(M, 4.12 + i * 0.12, 1.16 + k * 0.022, -5.31, 0.085, 0.1, i ? 0xf6f3ea : 0x2b2118, 1);
    tube(M, 4.12 + i * 0.12, 1.35, -5.31, 0.09, 0.012, DARK, 0.9);
  }
  M.box(4.4, 1.16, -5.3, 0.1, 0.06, 0.14, 0xffffff, 1);

  // Behind the counter: two microwaves, the kettle, then the cigarette wall above
  for (const z of [-2.0, -4.95]) {
    M.box(5.68, 1.09, z, 0.4, 0.3, 0.52, 0xe9ecee, 0.95);
    M.box(5.478, 1.095, z, 0.5, 0.29, 0.004, 0xffffff, 1.05, SPR.micro[0], TO_NX);
  }
  tube(M, 5.7, 1.09, -4.45, 0.17, 0.26, 0xf1f2f3, 1);
  tube(M, 5.7, 1.35, -4.45, 0.1, 0.03, DARK, 0.8);
  M.box(5.88, 1.42, -3.4, 3.6, 1.2, 0.02, 0xffffff, 1, UV.cigarettes, TO_NX);
  M.box(5.85, 2.65, -3.4, 0.1, 0.04, 3.6, 0xffffff, 1.6);
  M.box(5.88, 2.7, -3.4, 0.03, 0.26, 3.6, brand, 1);

  // The clerk at the first register, waving now and then
  person(
    M, 5.0, -2.75, TO_NX,
    { top: 0xf7f7f5, bottom: 0x23262d, hair: 0x2b2019, stripes: [brand, accent, brand], pose: "wave" },
    [ANIM.bob, 1.7, 0, 0.008],
  );
  // A customer choosing an onigiri, basket on the arm
  person(M, 0.5, -5.6, TO_NZ, { top: 0x8d6e63, bottom: 0x2f3e46, hair: 0x111111, pose: "front", height: 1.62 }, [ANIM.bob, 1.2, 2.1, 0.006]);
  animated([ANIM.bob, 1.2, 2.1, 0.006], () => {
    M.box(0.5, FLOOR + 0.62, -5.93, 0.4, 0.2, 0.26, brand, 0.95);
    M.box(0.5, FLOOR + 0.82, -5.93, 0.42, 0.02, 0.28, DARK, 0.8);
    M.box(0.5, FLOOR + 0.86, -5.93, 0.3, 0.012, 0.012, DARK, 0.8);
    M.box(0.44, FLOOR + 0.74, -5.9, 0.1, 0.0975, 0.004, 0xffffff, 1, SPR.onigiri[0], 0.3, KIND.card);
  });

  // Staff door in the back corner
  M.box(5.1, FLOOR, -6.88, 0.95, 2.1, 0.06, 0xc3c8cd, 0.95);
  M.box(5.1, FLOOR, -6.875, 1.05, 2.16, 0.04, 0x8f959c, 0.8);
  M.box(4.74, 1.1, -6.84, 0.04, 0.14, 0.03, STEEL, 0.9);
  M.box(5.1, 1.6, -6.845, 0.45, 0.22, 0.01, 0xffffff, 1, UV.staff);
  M.box(4.05, 1.3, -6.89, 0.5, 0.66, 0.012, 0xffffff, 1, SPR.poster[0]);
}
