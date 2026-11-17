/** One 2D canvas holds every texture of the scene: a single upload, a single bind. */
export const ATLAS_W = 2048;
export const ATLAS_H = 2048;

export type Rect = readonly [x: number, y: number, w: number, h: number];

export const rectUv = ([x, y, w, h]: Rect) => [
  (x + 1) / ATLAS_W,
  (y + 1) / ATLAS_H,
  (x + w - 1) / ATLAS_W,
  (y + h - 1) / ATLAS_H,
];

/** Same rect, flagged for the shader to lay it on the top face of a box instead of its front. */
export const topUv = (uv: number[]) => [uv[0], uv[1], -uv[2], uv[3]];

export const FONT = `system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif`;
