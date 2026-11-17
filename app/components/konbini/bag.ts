/** Floats per box instance: pos3, size3, rgb+emissive, uv rect, rotY+kind, anim4. */
export const STRIDE = 20;

/**
 * `ball` draws the sphere inscribed in the box (ray-traced in the fragment shader).
 * `fur` draws the ellipsoid inscribed in the (yawed) box, matte and fuzzy; a uv of
 * [freq, depth, freq, depth] adds tabby stripes. `soft` is the same ellipsoid, smooth (skin, dough).
 * `tube` draws the upright cylinder inscribed in the box; its uv rect wraps around the front half.
 * `card` is a box reduced to its artwork (cut-outs: only the textured face is drawn).
 * A uv rect whose third component is negative (see `topUv`) goes on the top face instead of the front.
 */
export const KIND = { solid: 0, rain: 1, ground: 2, glow: 3, unlit: 4, floor: 5, glass: 6, ball: 7, fur: 8, soft: 8.5, tube: 9, card: 10 } as const;

/**
 * Per-instance animation, evaluated in the vertex shader: [type, a, b, c]
 *   drive   → a = speed (u/s), b = anchor x of the vehicle (wraps every 90 u)
 *   flicker → b = phase, c = depth (0..1) of the dips
 *   bob     → a = frequency, b = phase, c = amplitude (y)
 *   sway    → a = frequency, b = phase, c = amplitude (x, grows with height)
 *   slide   → a = x distance travelled when the doors are fully open (uniform uDoor)
 *   wag     → a = frequency, b = phase, c = amplitude (x, the whole box)
 *   gacha   → a = machine index, b = phase, c = 0 capsule (rattles) / 1 dial (spins).
 *             Only the machine being cranked moves (uniform uGacha).
 */
export const ANIM = { none: 0, drive: 1, flicker: 2, bob: 3, sway: 4, slide: 5, gacha: 6, wag: 7 } as const;

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
