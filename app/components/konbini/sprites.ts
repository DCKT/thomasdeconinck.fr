import { ATLAS_W, FONT, rectUv, type Rect } from "./atlas-base";

/**
 * Packaging and screen artwork for the inside of the store: everything a shelf needs to
 * stop looking like coloured blocks. Painted with the rest of the atlas, in the rows
 * between SPRITE_Y and SPRITE_END. All of it is made up: no real brand is reproduced.
 */
const SPRITE_Y = 1600;
export const SPRITE_END = 1896;

/** [width, height, how many variants]. Order matters: rows are packed as listed. */
const SHEET = {
  bottle: [40, 96, 8],
  carton: [48, 88, 4],
  bag: [72, 88, 8],
  mag: [64, 88, 6],
  kiosk: [72, 96, 1],
  coffee: [96, 96, 1],
  poster: [72, 96, 1],
  atm: [96, 72, 1],
  bento: [96, 72, 5],
  foot: [64, 64, 1],
  onigiri: [64, 60, 4],
  sando: [72, 60, 3],
  can: [40, 56, 8],
  cup: [64, 56, 4],
  micro: [96, 56, 1],
  reg: [64, 48, 1],
  kuji: [128, 60, 1],
  pop: [96, 48, 4],
  camera: [96, 48, 1],
  box: [72, 44, 6],
  sweet: [64, 44, 4],
  ice: [64, 44, 6],
  copier: [64, 40, 1],
  trash: [48, 32, 3],
  takuhai: [64, 32, 1],
  temp: [64, 24, 2],
  tag: [48, 16, 3],
} as const satisfies Record<string, readonly [number, number, number]>;

type Name = keyof typeof SHEET;

const RECTS = (() => {
  const out = {} as Record<Name, Rect[]>;
  let x = 0, y = SPRITE_Y, rowH = 0;
  for (const [name, [w, h, n]] of Object.entries(SHEET) as [Name, readonly [number, number, number]][]) {
    out[name] = [];
    for (let i = 0; i < n; i++) {
      if (x + w > ATLAS_W) {
        x = 0;
        y += rowH + 4;
        rowH = 0;
      }
      out[name].push([x, y, w, h]);
      x += w + 4;
      rowH = Math.max(rowH, h);
    }
  }
  return out;
})();

/** UV rects, one per variant: `SPR.bottle[3]`. */
export const SPR = Object.fromEntries(
  Object.entries(RECTS).map(([name, rects]) => [name, rects.map(rectUv)]),
) as Record<Name, number[][]>;

// ── What is on the shelves ──────────────────────────────────────────────────
/** PET bottles: [label, liquid, ink, name]. */
export const BOTTLES = [
  ["#2f7d32", "#a9b84a", "#ffffff", "お茶"],
  ["#8a5a2b", "#7a4a20", "#fff3d6", "麦茶"],
  ["#1e88e5", "#dff1fa", "#ffffff", "天然水"],
  ["#c62828", "#2a1410", "#ffffff", "コーラ"],
  ["#f4f8fb", "#eef6f8", "#1565c0", "スポーツ"],
  ["#f3e3c3", "#c9a27a", "#7b3f1d", "ミルクティー"],
  ["#fb8c00", "#f7a521", "#ffffff", "オレンジ"],
  ["#b3e5fc", "#eaf7f2", "#0277bd", "サイダー"],
] as const;
/** Cans: [body, ink, big word, small word]. The first four also live in the hot case. */
export const CANS = [
  ["#16171b", "#f5d98a", "珈琲", "BLACK"],
  ["#b98a2e", "#2a1608", "微糖", "COFFEE"],
  ["#e9d8b4", "#6b3d1b", "カフェオレ", "MILD"],
  ["#f6c945", "#7a3b00", "コーン", "SOUP"],
  ["#c9ced6", "#1d3fa8", "ENERGY", "ZERO"],
  ["#f2f2ee", "#c9a227", "生", "BEER"],
  ["#ffe45c", "#2e7d32", "レモン", "SOUR"],
  ["#f8bbd0", "#ad1457", "もも", "SOUR"],
] as const;
const CUPS = [
  ["#d62828", "#ffffff", "しょうゆ", "RAMEN"],
  ["#f2b632", "#7a1f00", "カレー", "CURRY"],
  ["#2a9d8f", "#ffffff", "シーフード", "SEAFOOD"],
  ["#3d348b", "#ffd166", "きつねうどん", "UDON"],
] as const;
const CARTONS = [
  ["#ffffff", "#1565c0", "牛乳", "MILK"],
  ["#d7b48a", "#5d3a1a", "コーヒー", "牛乳"],
  ["#f8bbd0", "#c2185b", "いちご", "オレ"],
  ["#66bb6a", "#fff8e1", "野菜", "ジュース"],
] as const;
const BAGS = [
  ["#f7c531", "#c1121f", "ポテト", "うすしお", "#f2d16b"],
  ["#e76f51", "#fff3b0", "ポテト", "コンソメ", "#f2d16b"],
  ["#2a9d8f", "#ffffff", "ポテト", "のりしお", "#e8d27a"],
  ["#f28482", "#ffffff", "えびせん", "SHRIMP", "#f6bd60"],
  ["#3a86ff", "#ffffff", "ポップコーン", "SALT", "#fff3c4"],
  ["#7b2cbf", "#ffd60a", "グミ", "GRAPE", "#c77dff"],
  ["#6f4518", "#ffe8c2", "チョコ", "CHOCOLATE", "#3b2412"],
  ["#bc6c25", "#fefae0", "せんべい", "しょうゆ", "#dda15e"],
] as const;
const BOXES = [
  ["#c1121f", "#ffffff", "チョコスティック", "#6f4518"],
  ["#2d6a4f", "#ffffff", "抹茶スティック", "#95d5b2"],
  ["#f7c531", "#6f4518", "キャラメル", "#bc6c25"],
  ["#1d3557", "#a8dadc", "ミントガム", "#f1faee"],
  ["#ff8fab", "#ffffff", "いちごチョコ", "#fb6f92"],
  ["#5a3d2b", "#ffd166", "アーモンド", "#d4a373"],
] as const;
const ONIGIRI = [
  ["#1565c0", "ツナマヨ"],
  ["#ef6c00", "鮭"],
  ["#c2185b", "梅"],
  ["#2e7d32", "昆布"],
] as const;
const SANDOS = [
  ["#f6d55c", "#f6d55c", "たまご"],
  ["#f4a7a0", "#7cb342", "ハムレタス"],
  ["#b9722d", "#e8d9a0", "カツ"],
] as const;
const SWEETS = [
  ["#fff1c1", "#b5651d", "プリン"],
  ["#fde2e4", "#c9184a", "いちご大福"],
  ["#e9f5db", "#386641", "抹茶ロール"],
  ["#f1e3d3", "#7f5539", "シュークリーム"],
] as const;
const ICES = [
  ["#fff8e1", "#1565c0", "バニラ"],
  ["#5d4037", "#ffe0b2", "チョコモナカ"],
  ["#4fc3f7", "#ffffff", "ソーダバー"],
  ["#2e7d32", "#f1f8e9", "抹茶"],
  ["#f06292", "#ffffff", "いちご"],
  ["#fbc02d", "#4e342e", "ジャンボ"],
] as const;
const MAGS = [
  ["#c1121f", "#ffffff", "週刊ブログ", "#ffd166"],
  ["#1d3557", "#f1faee", "TECH", "#4cc9f0"],
  ["#ffd60a", "#111111", "漫画", "#e63946"],
  ["#2a9d8f", "#ffffff", "旅", "#e9c46a"],
  ["#f72585", "#ffffff", "ゲーム", "#3a0ca3"],
  ["#f1faee", "#1d3557", "CODE", "#e63946"],
] as const;

export function paintSprites(ctx: CanvasRenderingContext2D) {
  const sprite = (name: Name, i: number, draw: (w: number, h: number) => void) => {
    const [x, y, w, h] = RECTS[name][i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.clearRect(x, y, w, h); // cut-outs start from nothing
    ctx.translate(x, y);
    draw(w, h);
    ctx.restore();
  };
  const fill = (color: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const text = (
    s: string, x: number, y: number, size: number, color: string,
    { weight = 900, align = "center" as CanvasTextAlign, max = 999 } = {},
  ) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(s, x, y, max);
  };
  /** Japanese set vertically, one glyph per line, sized to fit `h`. */
  const vertical = (s: string, x: number, y: number, h: number, maxSize: number, color: string) => {
    const size = Math.min(maxSize, h / s.length);
    Array.from(s).forEach((ch, i) => text(ch === "ー" ? "｜" : ch, x, y + (i + 0.5) * (h / s.length), size, color));
  };
  const disc = (x: number, y: number, rx: number, ry: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const rounded = (x: number, y: number, w: number, h: number, r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  };
  const sheen = (w: number, h: number, alpha = 0.22) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(0,0,0,.18)");
    g.addColorStop(0.3, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.42, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(0,0,0,.2)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  const barcode = (x: number, y: number, w: number, h: number) => {
    fill("#ffffff", x, y, w, h);
    for (let i = 1; i < w - 1; i += 2) fill("#111", x + i, y + 1, (i * 7) % 3 ? 1 : 1.6, h - 2);
  };

  // ── Drinks ────────────────────────────────────────────────────────────────
  BOTTLES.forEach(([label, liquid, ink, name], i) =>
    sprite("bottle", i, (w, h) => {
      fill(liquid, 0, 0, w, h);
      fill("rgba(255,255,255,.25)", 0, 0, w, 6);
      fill(label, 0, 22, w, 54);
      fill(ink, 0, 24, w, 2);
      fill(ink, 0, 72, w, 2);
      vertical(name, w / 2, 28, 42, 15, ink);
      sheen(w, h);
    }),
  );
  CANS.forEach(([body, ink, big, small], i) =>
    sprite("can", i, (w, h) => {
      fill(body, 0, 0, w, h);
      fill("#c9ced3", 0, 0, w, 4);
      fill("#c9ced3", 0, h - 4, w, 4);
      fill(ink, 0, 8, w, 2);
      if (/^[A-Z]+$/.test(big)) text(big, w / 2, 24, 10, ink, { max: w - 6 });
      else if (big.length > 2) vertical(big, w / 2, 11, 30, 11, ink);
      else text(big, w / 2, 25, big.length > 1 ? 16 : 22, ink);
      text(small, w / 2, 46, 8, ink, { weight: 800, max: w - 6 });
      sheen(w, h, 0.3);
    }),
  );
  CUPS.forEach(([body, ink, name, en], i) =>
    sprite("cup", i, (w, h) => {
      fill("#f6f3ea", 0, 0, w, h);
      fill(body, 0, 10, w, 34);
      fill("#e8c04a", 0, 8, w, 2);
      disc(w / 2, 27, 13, 13, "rgba(255,255,255,.18)");
      text(name, w / 2, 24, name.length > 4 ? 10 : 13, ink, { max: w - 8 });
      text(en, w / 2, 37, 8, ink, { weight: 800 });
      fill("rgba(0,0,0,.12)", 0, h - 3, w, 3);
      sheen(w, h, 0.18);
    }),
  );
  CARTONS.forEach(([body, ink, a, b], i) =>
    sprite("carton", i, (w, h) => {
      fill(body, 0, 0, w, h);
      // Gable top: the folded seam and its shadow
      fill("rgba(0,0,0,.14)", 0, 0, w, 12);
      fill("rgba(255,255,255,.5)", 0, 12, w, 1.5);
      fill(ink, 0, 16, w, 5);
      text(a, w / 2, 36, a.length > 3 ? 11 : 15, ink, { max: w - 6 });
      text(b, w / 2, 52, b.length > 3 ? 10 : 13, ink, { max: w - 6 });
      disc(w / 2, 70, 9, 7, ink);
      disc(w / 2 - 2, 68, 3, 2, body);
      fill(ink, 0, h - 5, w, 5);
    }),
  );

  // ── Snacks ────────────────────────────────────────────────────────────────
  BAGS.forEach(([bg, ink, name, flavour, food], i) =>
    sprite("bag", i, (w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, bg);
      g.addColorStop(1, "rgba(0,0,0,.25)");
      fill(bg, 0, 0, w, h);
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      // Crimped seals
      for (let x = 0; x < w; x += 3) {
        fill(x % 6 ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.18)", x, 0, 3, 7);
        fill(x % 6 ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.18)", x, h - 6, 3, 6);
      }
      text(name, w / 2, 24, name.length > 4 ? 12 : 17, ink, { max: w - 8 });
      rounded(10, 34, w - 20, 14, 7, ink);
      text(flavour, w / 2, 41.5, 9, bg, { max: w - 26 });
      for (let k = 0; k < 5; k++) disc(16 + k * 10 + (k % 2) * 3, 64 + (k % 3) * 4, 9, 6, food);
      for (let k = 0; k < 5; k++) disc(14 + k * 10 + (k % 2) * 3, 62 + (k % 3) * 4, 3, 1.5, "rgba(255,255,255,.4)");
      fill("rgba(255,255,255,.14)", 6, 8, 5, h - 16);
    }),
  );
  BOXES.forEach(([bg, ink, name, food], i) =>
    sprite("box", i, (w, h) => {
      fill(bg, 0, 0, w, h);
      fill("rgba(0,0,0,.16)", 0, h - 4, w, 4);
      text(name, w / 2 - 8, 13, name.length > 6 ? 8 : 10, ink, { max: w - 26 });
      // Sticks / pieces of what is inside
      for (let k = 0; k < 6; k++) fill(food, 8 + k * 7, 23, 4, 16);
      for (let k = 0; k < 6; k++) fill("#e9c46a", 8 + k * 7, 35, 4, 4);
      disc(w - 12, 13, 9, 9, ink);
      text("NEW", w - 12, 13.5, 7, bg);
    }),
  );

  // ── Chilled food ──────────────────────────────────────────────────────────
  ONIGIRI.forEach(([color, name], i) =>
    sprite("onigiri", i, (w, h) => {
      const shape = () => {
        ctx.beginPath();
        ctx.moveTo(w / 2 - 6, 5);
        ctx.quadraticCurveTo(w / 2, 0, w / 2 + 6, 5);
        ctx.lineTo(w - 6, h - 12);
        ctx.quadraticCurveTo(w - 2, h - 3, w - 12, h - 3);
        ctx.lineTo(12, h - 3);
        ctx.quadraticCurveTo(2, h - 3, 6, h - 12);
        ctx.closePath();
      };
      ctx.save();
      shape();
      ctx.clip();
      fill("#f7f5ee", 0, 0, w, h);
      fill("#1b241f", 0, h * 0.5, w, h);
      fill("rgba(255,255,255,.07)", 0, h * 0.5, w, 3);
      // Film: a pull tab down the middle, a glare across
      fill("rgba(255,255,255,.55)", w / 2 - 1.5, 0, 3, h);
      ctx.globalAlpha = 0.22;
      ctx.rotate(-0.5);
      fill("#ffffff", -20, 34, 80, 6);
      ctx.restore();
      rounded(w / 2 - 17, 15, 34, 17, 3, color);
      text(name, w / 2, 24, name.length > 2 ? 9 : 13, "#ffffff", { max: 30 });
      text("¥148", w / 2, h - 12, 8, "#f7f5ee", { weight: 800 });
    }),
  );
  SANDOS.forEach(([fillA, fillB, name], i) =>
    sprite("sando", i, (w, h) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(5, h - 3);
      ctx.lineTo(w - 4, h - 3);
      ctx.lineTo(w - 4, h - 20);
      ctx.lineTo(16, 3);
      ctx.lineTo(5, 3);
      ctx.closePath();
      ctx.clip();
      fill("#f6efdc", 0, 0, w, h);
      // Two sandwiches side by side, cut faces showing: bread, filling, bread
      ctx.translate(8, 0);
      ctx.rotate(0.0);
      for (let k = 0; k < 2; k++) {
        const x = k * 30;
        fill("#fbf7ea", x, 6, 26, h);
        fill("#d9b77a", x, 6, 2, h);
        fill(fillA, x + 7, 6, 6, h);
        fill(fillB, x + 13, 6, 5, h);
        fill("#d9b77a", x + 24, 6, 2, h);
      }
      ctx.restore();
      rounded(8, h - 22, 44, 15, 3, "#ffffff");
      text(name, 30, h - 14, name.length > 3 ? 8 : 10, "#3a2a1a", { max: 40 });
    }),
  );
  const BENTO = ["幕の内", "からあげ", "カレー", "ナポリタン", "鮭のり"];
  BENTO.forEach((name, i) =>
    sprite("bento", i, (w, h) => {
      rounded(0, 0, w, h, 7, "#17181b");
      rounded(3, 3, w - 6, h - 6, 5, "#26272c");
      const rice = (x: number, y: number, rw: number, rh: number) => {
        rounded(x, y, rw, rh, 4, "#f8f6ef");
        for (let k = 0; k < 14; k++) fill("rgba(0,0,0,.08)", x + 3 + ((k * 13) % (rw - 6)), y + 3 + ((k * 7) % (rh - 6)), 2, 1);
      };
      if (i === 2) {
        rice(6, 6, 40, h - 12);
        rounded(42, 6, w - 48, h - 12, 4, "#8a4b16");
        for (let k = 0; k < 5; k++) disc(54 + (k % 3) * 13, 20 + Math.floor(k / 3) * 22 + (k % 2) * 6, 5, 4, k % 2 ? "#e9a23b" : "#c46a1f");
        disc(26, 20, 5, 5, "#c1121f");
      } else if (i === 3) {
        rounded(6, 6, w - 12, h - 12, 4, "#f3ead6");
        ctx.strokeStyle = "#e2632a";
        ctx.lineWidth = 2.4;
        for (let k = 0; k < 16; k++) {
          ctx.beginPath();
          ctx.ellipse(w / 2 + ((k * 17) % 30) - 15, h / 2 + ((k * 11) % 18) - 9, 16, 9, k, 0, Math.PI * 1.4);
          ctx.stroke();
        }
        for (let k = 0; k < 4; k++) disc(26 + k * 14, 24 + (k % 2) * 18, 4, 3, k % 2 ? "#3a7d2c" : "#b23a2a");
      } else {
        rice(6, 6, 42, h - 12);
        if (i === 4) {
          fill("#1b241f", 8, 8, 38, h - 16);
          rounded(13, 20, 28, 12, 3, "#f08a5d");
        } else {
          disc(27, h / 2, 5, 5, "#c1121f");
        }
        // Main dish, omelette, greens, pickles
        for (let k = 0; k < (i === 1 ? 5 : 3); k++) disc(60 + (k % 2) * 16, 14 + Math.floor(k / 2) * 13 + (k % 2) * 3, 8, 6, k % 2 ? "#b26a1f" : "#c98a2c");
        if (i !== 1) rounded(52, 42, 16, 12, 2, "#f6d55c");
        disc(i === 1 ? 58 : 76, 52, 6, 6, "#3a7d2c");
        disc(i === 1 ? 72 : 86, 56, 4, 4, "#e85d75");
      }
      // Clear lid: a soft glare, then the price sticker
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.rotate(-0.35);
      fill("#ffffff", -30, 30, 140, 9);
      ctx.restore();
      rounded(w - 42, h - 24, 38, 20, 3, "#ffe14d");
      text(name, w - 23, h - 18, 7, "#3a2a1a", { max: 34 });
      text(`¥${[498, 550, 460, 430, 398][i]}`, w - 23, h - 9.5, 9, "#c1121f");
    }),
  );
  SWEETS.forEach(([bg, ink, name], i) =>
    sprite("sweet", i, (w, h) => {
      fill(bg, 0, 0, w, h);
      fill("rgba(255,255,255,.6)", 0, 0, w, 3);
      disc(15, h / 2 + 3, 10, 10, "#ffffff");
      disc(15, h / 2 + 3, 7, 7, ink);
      disc(13, h / 2 + 1, 2.5, 2, "rgba(255,255,255,.6)");
      text(name, w / 2 + 12, h / 2 - 3, name.length > 4 ? 7.5 : 10, ink, { max: w - 32 });
      text("¥168", w / 2 + 12, h / 2 + 11, 8, ink, { weight: 800 });
    }),
  );
  ICES.forEach(([bg, ink, name], i) =>
    sprite("ice", i, (w, h) => {
      fill(bg, 0, 0, w, h);
      fill(ink, 0, 0, w, 5);
      fill(ink, 0, h - 5, w, 5);
      text(name, w / 2, h / 2 - 4, name.length > 4 ? 9 : 13, ink, { max: w - 8 });
      text("ICE", w / 2, h / 2 + 9, 7, ink, { weight: 800 });
      // Frost
      for (let k = 0; k < 9; k++) disc(4 + ((k * 23) % (w - 8)), 8 + ((k * 13) % (h - 16)), 1.2, 1.2, "rgba(255,255,255,.7)");
    }),
  );

  // ── Magazines (the generic ones: the blog's own covers are painted in walk mode) ──
  MAGS.forEach(([bg, ink, title, accent], i) =>
    sprite("mag", i, (w, h) => {
      fill(bg, 0, 0, w, h);
      text(title, w / 2, 13, title.length > 4 ? 11 : 17, ink, { max: w - 6 });
      fill(accent, 5, 24, w - 10, 34);
      disc(w / 2, 40, 10, 12, "rgba(255,255,255,.55)");
      fill(ink, 5, 63, w - 30, 3);
      fill(ink, 5, 69, w - 22, 3);
      fill(ink, 5, 75, w - 34, 3);
      disc(w - 12, 72, 8, 8, accent);
      text("新", w - 12, 72.5, 9, bg);
    }),
  );

  // ── Shelf-edge bits ───────────────────────────────────────────────────────
  [["#ffffff", "¥128"], ["#fff3b0", "¥198"], ["#ffffff", "¥248"]].forEach(([bg, price], i) =>
    sprite("tag", i, (w, h) => {
      fill(bg, 0, 0, w, h);
      text(price, 3, h / 2 + 0.5, 11, "#c1121f", { align: "left" });
      barcode(w - 16, 3, 13, h - 6);
    }),
  );
  [
    ["#ffe14d", "#c1121f", "新商品", "NEW!"],
    ["#c1121f", "#ffffff", "おすすめ", "STAFF PICK"],
    ["#1d3557", "#ffe14d", "期間限定", "LIMITED"],
    ["#ffffff", "#c1121f", "2個で¥50引", "2 FOR ¥50 OFF"],
  ].forEach(([bg, ink, jp, en], i) =>
    sprite("pop", i, (w, h) => {
      fill(bg, 0, 0, w, h);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.strokeRect(2.5, 2.5, w - 5, h - 5);
      text(jp, w / 2, 19, jp.length > 5 ? 15 : 20, ink, { max: w - 12 });
      text(en, w / 2, 37, 9, ink, { weight: 800, max: w - 12 });
    }),
  );
  [["#c1121f", "あたたかい"], ["#1565c0", "つめたい"]].forEach(([bg, label], i) =>
    sprite("temp", i, (w, h) => {
      fill(bg, 0, 0, w, h);
      text(label, w / 2, h / 2 + 1, 12, "#ffffff", { max: w - 6 });
    }),
  );
  [["#c1121f", "もえるゴミ", "BURNABLE"], ["#1565c0", "ペットボトル", "PET"], ["#6b7280", "カン・ビン", "CANS"]].forEach(
    ([bg, jp, en], i) =>
      sprite("trash", i, (w, h) => {
        fill("#ffffff", 0, 0, w, h);
        fill(bg, 0, 0, w, 19);
        text(jp, w / 2, 10, 9, "#ffffff", { max: w - 4 });
        text(en, w / 2, 25.5, 7, bg, { weight: 800 });
      }),
  );

  // ── Machines and notices ──────────────────────────────────────────────────
  sprite("atm", 0, (w, h) => {
    fill("#0b3d91", 0, 0, w, h);
    fill("#082a66", 0, 0, w, 14);
    text("ATM · いらっしゃいませ", w / 2, 7.5, 7.5, "#ffffff", { weight: 800 });
    ["お引出し", "お預入れ", "残高照会", "GAMES", "お振込み", "English"].forEach((label, k) => {
      const x = 5 + (k % 2) * 45, y = 19 + Math.floor(k / 2) * 17;
      rounded(x, y, 41, 14, 3, k === 3 ? "#ffd60a" : "#e8f1ff");
      text(label, x + 20.5, y + 7.5, 7.5, "#0b3d91", { max: 37 });
    });
  });
  sprite("copier", 0, (w, h) => {
    fill("#10151c", 0, 0, w, h);
    ["コピー", "プリント", "スキャン", "FAX", "写真", "PIXEL"].forEach((label, k) => {
      const x = 3 + (k % 3) * 20, y = 4 + Math.floor(k / 3) * 17;
      rounded(x, y, 18, 15, 2, ["#4cc9f0", "#8ac926", "#ffd166", "#f4a261", "#f72585", "#ffffff"][k]);
      text(label, x + 9, y + 8, 5.5, "#10151c", { max: 16 });
    });
  });
  sprite("kiosk", 0, (w, h) => {
    fill("#c1121f", 0, 0, w, h);
    fill("#ffffff", 4, 16, w - 8, h - 22);
    text("チケット", w / 2, 8.5, 9, "#ffffff");
    ["ライブ", "映画", "スポーツ", "高速バス", "くじ", "支払い"].forEach((label, k) => {
      const x = 7 + (k % 2) * 30, y = 20 + Math.floor(k / 2) * 23;
      rounded(x, y, 27, 20, 3, ["#ffd166", "#4cc9f0", "#8ac926", "#f4a261", "#f28482", "#cdb4db"][k]);
      text(label, x + 13.5, y + 10.5, 7, "#22223b", { max: 24 });
    });
  });
  sprite("coffee", 0, (w, h) => {
    fill("#1a1b1f", 0, 0, w, h);
    fill("#2a2c33", 0, 0, w, 20);
    text("CAFE", 26, 10.5, 12, "#e9c46a");
    text("挽きたて", 68, 10.5, 8, "#e9c46a", { weight: 800 });
    [["HOT", "R", "#c1121f"], ["HOT", "L", "#c1121f"], ["ICE", "R", "#1e88e5"], ["ICE", "L", "#1e88e5"]].forEach(([kind, size, color], k) => {
      const x = 14 + k * 23;
      disc(x, 36, 9.5, 9.5, color);
      text(size, x, 36.5, 11, "#ffffff");
      text(kind, x, 51, 6.5, "#ffffff", { weight: 800 });
    });
    // Spout recess
    rounded(16, 58, w - 32, h - 62, 4, "#07080a");
    fill("#3a3d45", w / 2 - 7, 58, 14, 8);
    fill("#c9ced6", 22, h - 7, w - 44, 3);
  });
  sprite("micro", 0, (w, h) => {
    fill("#e9ecee", 0, 0, w, h);
    rounded(4, 5, 64, h - 10, 3, "#14161a");
    rounded(8, 9, 56, h - 18, 2, "#23272e");
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.rotate(-0.4);
    fill("#ffffff", -10, 34, 80, 6);
    ctx.restore();
    fill("#c9ced3", 69, 7, 3, h - 14);
    fill("#10151c", 75, 6, 18, 9);
    text("1500W", 84, 11, 5.5, "#7cf7a0", { weight: 800 });
    for (let k = 0; k < 6; k++) rounded(75 + (k % 2) * 10, 19 + Math.floor(k / 2) * 9, 8, 6, 1.5, k === 5 ? "#c1121f" : "#9aa1a8");
    rounded(76, 47, 16, 5, 2, "#1e88e5");
  });
  sprite("reg", 0, (w, h) => {
    fill("#0d1117", 0, 0, w, h);
    fill("#1f6feb", 0, 0, w, 11);
    text("お会計", w / 2, 6, 7, "#ffffff", { weight: 800 });
    text("¥0", w - 5, 24, 16, "#7cf7a0", { align: "right" });
    text("ありがとうございます", w / 2, 40, 5.5, "#c9d1d9", { weight: 700, max: w - 6 });
  });
  sprite("poster", 0, (w, h) => {
    fill("#fff8e1", 0, 0, w, h);
    fill("#c1121f", 0, 0, w, 24);
    text("アルバイト", w / 2, 8, 9, "#ffffff");
    text("募集中", w / 2, 18, 9, "#ffe14d");
    text("STAFF", w / 2, 37, 14, "#1d3557");
    text("WANTED", w / 2, 51, 12, "#1d3557");
    rounded(8, 60, w - 16, 16, 3, "#ffe14d");
    text("時給 ¥1,200〜", w / 2, 68.5, 8, "#c1121f", { max: w - 20 });
    text("深夜歓迎 · 週1日〜OK", w / 2, 86, 6, "#3a2a1a", { weight: 800, max: w - 8 });
  });
  sprite("camera", 0, (w, h) => {
    fill("#ffd60a", 0, 0, w, h);
    for (let x = -h; x < w; x += 12) {
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.moveTo(x, 6);
      ctx.lineTo(x + 6, 6);
      ctx.lineTo(x + 12, 0);
      ctx.lineTo(x + 6, 0);
      ctx.fill();
    }
    text("防犯カメラ作動中", w / 2, 22, 10, "#111", { max: w - 6 });
    text("SECURITY CAMERA 24H", w / 2, 37, 6.5, "#111", { weight: 800, max: w - 6 });
  });
  sprite("kuji", 0, (w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    ["#ff5d8f", "#ffc400", "#49e08a", "#4cc9f0", "#b14dff"].forEach((color, k) => g.addColorStop(k / 4, color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    fill("#ffffff", 4, 4, w - 8, h - 8);
    text("くじ", 26, 22, 22, "#c1121f");
    text("1回 ¥700", 26, 44, 8.5, "#1d3557");
    ["A賞", "B賞", "C賞", "D賞", "E賞", "F賞"].forEach((prize, k) => {
      const x = 52 + (k % 3) * 24, y = 9 + Math.floor(k / 3) * 23;
      rounded(x, y, 21, 20, 3, ["#ffd166", "#f28482", "#84a59d", "#cdb4db", "#90dbf4", "#b9fbc0"][k]);
      text(prize, x + 10.5, y + 10.5, 8, "#22223b");
    });
  });
  sprite("takuhai", 0, (w, h) => {
    fill("#1d3557", 0, 0, w, h);
    text("宅配便", w / 2, 11, 12, "#ffffff");
    text("PARCELS · 受付", w / 2, 24.5, 6.5, "#ffd166", { weight: 800 });
  });
  // "Wait here" floor sticker (a cut-out disc)
  sprite("foot", 0, (w, h) => {
    disc(w / 2, h / 2, w / 2 - 1, h / 2 - 1, "#1faa59");
    disc(w / 2, h / 2, w / 2 - 5, h / 2 - 5, "#ffffff");
    for (const s of [-1, 1]) {
      disc(w / 2 + s * 8, h / 2 + 4, 5, 10, "#1faa59");
      disc(w / 2 + s * 8, h / 2 - 11, 4, 3.5, "#1faa59");
    }
    text("こちらでお待ちください", w / 2, h - 11, 4.6, "#1faa59", { max: w - 20 });
  });
}
