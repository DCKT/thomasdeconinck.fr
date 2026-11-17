/**
 * Tiny 12×12 pixel icons for the cartridge labels. Original, generic glyphs.
 * Palette indices: 1 primary · 2 secondary · 3 dark · 4 white · "." transparent.
 */
export const ICONS = {
  cup: [
    "........3...",
    ".......3....",
    "......3.....",
    "..1111111...",
    "..1444441...",
    "..14444411..",
    "..1444441.1.",
    "..1444441.1.",
    "..14444411..",
    "..1444441...",
    "..1111111...",
    "...11111....",
  ],
  magnifier: [
    "...1111.....",
    "..1....1....",
    ".1.44...1...",
    ".1.4....1...",
    ".1......1...",
    ".1......1...",
    "..1....1....",
    "...11112....",
    ".......22...",
    "........22..",
    ".........22.",
    "..........2.",
  ],
  heart: [
    "............",
    "..111..111..",
    ".1441111111.",
    ".1411111111.",
    ".1111111111.",
    ".1111111111.",
    "..11111111..",
    "...111111...",
    "....1111....",
    ".....11.....",
    "............",
    "............",
  ],
  star: [
    ".....11.....",
    ".....11.....",
    "....1111....",
    "111111111111",
    ".1111111111.",
    "..11111111..",
    "...111111...",
    "..11111111..",
    "..111..111..",
    ".111....111.",
    ".11......11.",
    "............",
  ],
  sword: [
    "..........44",
    ".........444",
    "........444.",
    ".......444..",
    "......444...",
    ".....444....",
    "..3.444.....",
    "...333......",
    "...33.......",
    "..3..3......",
    ".22.........",
    "22..........",
  ],
  ghost: [
    "....1111....",
    "..11111111..",
    ".1111111111.",
    ".1143114311.",
    ".1144114411.",
    "111111111111",
    "111111111111",
    "111111111111",
    "111111111111",
    "111111111111",
    "11.11..11.11",
    "1...1..1...1",
  ],
  gem: [
    "............",
    "...111111...",
    "..14411111..",
    ".1441111111.",
    "111111111111",
    ".1111111111.",
    "..11111111..",
    "...111111...",
    "....1111....",
    ".....11.....",
    "............",
    "............",
  ],
  controller: [
    "............",
    "............",
    "..11111111..",
    ".1111111111.",
    "113111111211",
    "133311112121",
    "113111111211",
    ".1111111111.",
    ".111....111.",
    "..1......1..",
    "............",
    "............",
  ],
} as const;

export type IconName = keyof typeof ICONS;

/** Draws an icon; `palette` = [primary, secondary]. */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  name: IconName,
  palette: readonly [string, string],
  x: number,
  y: number,
  scale: number,
) {
  const colors: Record<string, string> = { "1": palette[0], "2": palette[1], "3": "#1b1b1f", "4": "#ffffff" };
  ICONS[name].forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const color = colors[row[i]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
    }
  });
}

/**
 * Steam covers go through Next's image optimizer: tiny, cached, and same-origin
 * (a cross-origin image would taint the canvas and could not become a WebGL texture).
 */
export const coverUrl = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=64&q=75`; // q=75: the only quality Next 16 allows by default

/** Tries each cover candidate in turn; resolves with the first that loads. */
export function loadCover(candidates: string[]): Promise<HTMLImageElement | null> {
  return candidates.reduce<Promise<HTMLImageElement | null>>(
    (previous, src) =>
      previous.then(
        (found) =>
          found ??
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = coverUrl(src);
          }),
      ),
    Promise.resolve(null),
  );
}

/** Turns a cover into chunky pixel art: centre-crop to a square, shrink to `cells`, blow up crisp. */
export function drawPixelated(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  cells = 16,
) {
  const tiny = document.createElement("canvas");
  tiny.width = tiny.height = cells;
  const t = tiny.getContext("2d")!;
  const side = Math.min(img.width, img.height);
  // Tall library art: keep the upper part, where the logo / hero usually sits
  const sy = img.height > img.width ? (img.height - side) * 0.3 : (img.height - side) / 2;
  t.drawImage(img, (img.width - side) / 2, sy, side, side, 0, 0, cells, cells);
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tiny, x, y, size, size);
  ctx.imageSmoothingEnabled = smoothing;
}
