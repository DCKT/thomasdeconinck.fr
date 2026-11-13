import type { Skin } from "app/lib/skins";

/** One 2D canvas holds every texture of the scene: a single upload, a single bind. */
export const ATLAS_W = 2048;
export const ATLAS_H = 1280;

type Rect = readonly [x: number, y: number, w: number, h: number];

const R = {
  sign: [0, 0, 2048, 192],
  logo: [0, 200, 256, 256],
  vend1: [264, 200, 256, 448],
  vend2: [528, 200, 256, 448],
  gacha: [792, 200, 192, 256],
  poster1: [992, 200, 192, 256],
  poster2: [1192, 200, 192, 256],
  nobori: [1392, 200, 128, 352],
  glow: [1528, 200, 128, 128],
  sky: [1664, 200, 16, 512],
  cigarettes: [792, 460, 592, 248],
  fried: [1688, 200, 352, 96],
  steam: [1688, 300, 352, 96],
  staff: [1688, 400, 192, 96],
} as const satisfies Record<string, Rect>;
/** From here down, the atlas holds walk-mode artwork, painted lazily and uploaded on its own. */
export const EXTRA_Y = 720;

export const rectUv = ([x, y, w, h]: Rect) => [
  (x + 1) / ATLAS_W,
  (y + 1) / ATLAS_H,
  (x + w - 1) / ATLAS_W,
  (y + h - 1) / ATLAS_H,
];

export const UV = Object.fromEntries(
  Object.entries(R).map(([k, r]) => [k, rectUv(r)]),
) as Record<keyof typeof R, number[]>;

export const FONT = `system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif`;
const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
const CANDY = ["#e63946", "#f4a261", "#ffd166", "#2a9d8f", "#4cc9f0", "#f72585", "#8ac926", "#7b2cbf"];

export function paintAtlas(canvas: HTMLCanvasElement, skin: Skin) {
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, ATLAS_W, ATLAS_H);
  ctx.textBaseline = "middle";

  const region = (r: Rect, draw: (w: number, h: number) => void) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(r[0], r[1], r[2], r[3]);
    ctx.clip();
    ctx.translate(r[0], r[1]);
    draw(r[2], r[3]);
    ctx.restore();
  };

  const bands = (w: number, h: number) => {
    ctx.fillStyle = skin.sign.bg;
    ctx.fillRect(0, 0, w, h);
    for (const [a, b, color] of skin.sign.bands) {
      ctx.fillStyle = color;
      ctx.fillRect(0, a * h, w, (b - a) * h);
    }
  };

  /** Draws the wordmark centred on `cx`, optionally on a solid plate. */
  const wordmark = (cx: number, cy: number, size: number, plateH: number) => {
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = "left";
    const widths = skin.sign.words.map(([t]) => ctx.measureText(t).width);
    const total = widths.reduce((a, b) => a + b, 0);
    if (skin.sign.plate) {
      ctx.fillStyle = skin.sign.plate;
      ctx.fillRect(cx - total / 2 - size * 0.45, cy - plateH / 2, total + size * 0.9, plateH);
    }
    let x = cx - total / 2;
    skin.sign.words.forEach(([text, color], i) => {
      ctx.fillStyle = color;
      ctx.fillText(text, x, cy + size * 0.04);
      x += widths[i];
    });
  };

  const [c1, c2, c3] = skin.colors.map(hex);
  const ink = skin.sign.plate ? c1 : skin.sign.bg;

  region(R.sign, (w, h) => {
    bands(w, h);
    wordmark(w / 2, h / 2, h * 0.62, h);
    // Side plates, like the "ATM" / "酒 たばこ" panels on real fascias.
    const side = (cx: number, text: string) => {
      ctx.font = `800 ${h * 0.36}px ${FONT}`;
      ctx.textAlign = "center";
      const tw = ctx.measureText(text).width + h * 0.5;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - tw / 2, h * 0.2, tw, h * 0.6);
      ctx.fillStyle = ink;
      ctx.fillText(text, cx, h * 0.52);
    };
    side(w * 0.13, "ブログ ATM");
    side(w * 0.87, "24H 営業中");
  });

  region(R.logo, (w, h) => {
    bands(w, h);
    ctx.fillStyle = skin.sign.plate ?? skin.sign.bg;
    ctx.fillRect(w * 0.14, h * 0.14, w * 0.72, h * 0.72);
    ctx.textAlign = "center";
    ctx.fillStyle = skin.sign.words[0][1];
    ctx.font = `900 ${h * 0.42}px ${FONT}`;
    ctx.fillText("24", w / 2, h * 0.43);
    ctx.fillStyle = skin.sign.words.at(-1)![1];
    ctx.font = `900 ${h * 0.15}px ${FONT}`;
    ctx.fillText("OPEN", w / 2, h * 0.72);
  });

  const vending = (r: Rect, body: string, text: string, label: string, seed: number) =>
    region(r, (w, h) => {
      ctx.fillStyle = body;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#f2fbff";
      ctx.fillRect(16, 18, w - 32, 236);
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 6; i++) {
          const x = 28 + i * 35;
          const y = 30 + row * 76;
          ctx.fillStyle = CANDY[(i * 3 + row * 5 + seed) % CANDY.length];
          ctx.fillRect(x, y, 22, 46);
          ctx.fillStyle = "rgba(255,255,255,.55)";
          ctx.fillRect(x + 3, y + 4, 4, 38);
          ctx.fillStyle = (i + row + seed) % 4 ? "#2563eb" : "#e11d48";
          ctx.fillRect(x + 4, y + 54, 14, 6);
        }
      }
      ctx.textAlign = "center";
      ctx.fillStyle = text;
      ctx.font = `900 46px ${FONT}`;
      ctx.fillText(label, w / 2, 300);
      ctx.font = `700 18px ${FONT}`;
      ctx.fillText("¥100 · INSERT COIN", w / 2, 338);
      ctx.fillStyle = "rgba(0,0,0,.75)";
      ctx.fillRect(28, 372, w - 56, 48);
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.fillRect(w - 58, 276, 26, 8);
    });
  vending(R.vend1, "#d7263d", "#ffffff", "GAMES", 0);
  vending(R.vend2, "#f4f6f8", "#1d4ed8", "DRINKS", 3);

  region(R.gacha, (w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#dff3ff";
    ctx.fillRect(14, 12, w - 28, 138);
    for (let i = 0; i < 16; i++) {
      const x = 34 + (i % 5) * 31 + ((i * 7) % 9);
      const y = 132 - Math.floor(i / 5) * 30 - ((i * 5) % 11);
      ctx.fillStyle = CANDY[(i * 3) % CANDY.length];
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillRect(x - 15, y - 2, 30, 4);
    }
    ctx.fillStyle = c1 === "#ffffff" ? c2 : c1;
    ctx.fillRect(0, 160, w, h - 160);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = `900 30px ${FONT}`;
    ctx.fillText("PIXEL", w / 2 - 28, 196);
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText("ガチャ ¥300", w / 2 - 28, 228);
    ctx.beginPath();
    ctx.arc(w - 36, 208, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.fillRect(w - 40, 190, 8, 36);
  });

  const poster = (r: Rect, bg: string, fg: string, big: string, small: string) =>
    region(r, (w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = fg;
      ctx.textAlign = "center";
      ctx.font = `900 62px ${FONT}`;
      ctx.fillText(big, w / 2, h * 0.4);
      ctx.font = `800 26px ${FONT}`;
      ctx.fillText(small, w / 2, h * 0.72);
    });
  poster(R.poster1, c1 === "#ffffff" ? c2 : c1, "#ffffff", "新刊", "NEW POSTS");
  poster(R.poster2, "#ffd166", "#c1121f", "おでん", "¥100 〜");

  region(R.nobori, (w, h) => {
    ctx.fillStyle = c3 === "#ffffff" ? c1 : c3;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, 14);
    ctx.textAlign = "center";
    ctx.font = `900 50px ${FONT}`;
    "ブログ更新中".split("").forEach((ch, i) => ctx.fillText(ch, w / 2, 52 + i * 54));
  });

  region(R.glow, (w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.25, "#888");
    g.addColorStop(0.6, "#222");
    g.addColorStop(1, "#000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  // Cigarette wall behind the counter: numbered slots, like the real thing
  region(R.cigarettes, (w, h) => {
    ctx.fillStyle = "#2a2622";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.font = `800 15px ${FONT}`;
    ctx.fillText("たばこ TOBACCO", 10, 14);
    ctx.textAlign = "right";
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText("20歳未満の者の喫煙は法律で禁止されています", w - 10, 14);
    const packs = ["#f5f5f0", "#1d3557", "#c1121f", "#e9c46a", "#2a9d8f", "#6d6875", "#fefae0", "#3a86ff", "#111", "#8d99ae"];
    const cols = 14, rows = 4;
    const cw = (w - 16) / cols, ch = (h - 34) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 8 + c * cw, y = 30 + r * ch;
        const color = packs[(c * 7 + r * 3) % packs.length];
        ctx.fillStyle = color;
        ctx.fillRect(x + 4, y + 2, cw - 8, ch - 20);
        ctx.fillStyle = packs[(c * 3 + r * 5 + 4) % packs.length];
        ctx.fillRect(x + 4, y + 2 + (ch - 20) * 0.55, cw - 8, (ch - 20) * 0.22);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x + 6, y + ch - 16, cw - 12, 12);
        ctx.fillStyle = "#111";
        ctx.textAlign = "center";
        ctx.font = `700 10px ${FONT}`;
        ctx.fillText(String(r * cols + c + 1), x + cw / 2, y + ch - 9);
      }
    }
  });

  const card = (r: Rect, bg: string, big: string, small: string) =>
    region(r, (w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, h - 8, w, 8);
      ctx.textAlign = "left";
      ctx.font = `900 34px ${FONT}`;
      ctx.fillText(big, 16, h * 0.38);
      ctx.font = `700 20px ${FONT}`;
      ctx.fillText(small, 16, h * 0.74);
    });
  card(R.fried, "#d62828", "揚げ物 HOT SNACKS", "からあげ ¥238 · チキン ¥220");
  card(R.steam, "#e76f51", "中華まん · おでん", "肉まん ¥160 · おでん ¥100〜");
  region(R.staff, (w, h) => {
    ctx.fillStyle = "#f1f1ee";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.font = `900 30px ${FONT}`;
    ctx.fillText("STAFF ONLY", w / 2, h * 0.38);
    ctx.font = `700 16px ${FONT}`;
    ctx.fillText("関係者以外立入禁止", w / 2, h * 0.74);
  });

  region(R.sky, (w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#03050c");
    g.addColorStop(0.55, "#0a0f24");
    g.addColorStop(0.8, "#1a1a3c");
    g.addColorStop(0.87, "#2a2148");
    g.addColorStop(0.915, "#090b17"); // == fog colour, hides the horizon seam
    g.addColorStop(1, "#090b17");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
