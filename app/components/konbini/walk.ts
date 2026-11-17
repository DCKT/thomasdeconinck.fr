/**
 * Walk mode: first-person konbini. This module (plus the HUD) is only downloaded
 * when the visitor hovers / clicks the "Click me" box, so the home page stays light.
 */
import type { SKINS, SkinId } from "app/lib/skins";
import { FONT, rectUv } from "./atlas-base";
import { CARDS } from "./cards-data";
import type { MangaItem } from "app/lib/komga";
import type { ShelfGame } from "app/lib/steam";
import { mangaCoverUrl, PRINTS, type InteractionId } from "./interactions";
import { drawIcon, drawPixelated, loadCover } from "./pixel-icons";
import type { CameraPose, SceneExtra, SceneHandle } from "./scene";
import { startAmbience, stopAmbience } from "./ambience";
import { topUv } from "./atlas-base";
import { ANIM, Bag, KIND, mulberry32, NO_ANIM, NO_UV } from "./bag";
import { SPR } from "./sprites";
import { CEIL } from "./store";

type Skin = (typeof SKINS)[SkinId];
type Vec3 = [number, number, number];
type Rect = [x0: number, z0: number, x1: number, z1: number];

/**
 * Stand in a zone, look the right way (`facing` = direction you look along), press E.
 * The first match wins, so specific spots come before broad ones.
 */
/** Left part of the games aisle: its right edge follows the shelf layout (see prepareWalk). */
const MANGA_ZONE: Rect = [-4.35, -3.98, -1.4, -3.02];

const INTERACTIONS: { id: InteractionId; zone: Rect; facing: [number, number] }[] = [
  { id: "blog", zone: [-5.6, -2.15, -1.15, -0.85], facing: [0, 1] },
  { id: "editor", zone: [1.5, -1.75, 2.62, -1.03], facing: [0, 1] },
  { id: "games", zone: [2.85, -1.75, 3.62, -1.03], facing: [0, 1] },
  { id: "kiosk", zone: [3.85, -1.4, 4.65, -0.85], facing: [0, 1] },
  { id: "icecream", zone: [4.3, -1.4, 5.0, -0.2], facing: [1, 0] },
  { id: "fried", zone: [2.6, -2.45, 3.62, -1.5], facing: [1, 0] },
  { id: "about", zone: [2.6, -3.1, 3.62, -2.45], facing: [1, 0] },
  { id: "cards", zone: [2.6, -4.75, 3.62, -4.2], facing: [1, 0] },
  { id: "oden", zone: [2.6, -4.2, 3.62, -3.1], facing: [1, 0] },
  { id: "coffee", zone: [2.6, -5.45, 3.62, -4.6], facing: [1, 0] },
  { id: "pixel-art", zone: [-1.25, -3.98, 1.95, -3.02], facing: [0, 1] },
  { id: "manga", zone: MANGA_ZONE, facing: [0, -1] },
  { id: "favorites", zone: [-4.35, -3.98, 1.95, -3.02], facing: [0, -1] },
  { id: "drinks", zone: [-5.05, -6.2, -4.35, -1.35], facing: [-1, 0] },
  { id: "onigiri", zone: [-5.05, -6.2, 3.8, -4.82], facing: [0, -1] },
  { id: "snacks", zone: [-4.35, -6.2, 1.95, -4.82], facing: [0, 1] },
  { id: "snacks", zone: [-4.35, -2.18, 1.95, -0.85], facing: [0, -1] },
];

/** Solid furniture and walls, in the XZ plane. Mirrors world.ts. */
const SOLIDS: Rect[] = [
  [-7, -8, -5.95, 1], [5.95, -8, 7, 1], [-7, -8, 7, -6.95], // walls
  [-7, -0.06, -1.1, 1], [1.1, -0.06, 7, 1], [-1.1, 0.02, 1.1, 1], // storefront, doors
  [-5.85, -0.85, -1.25, -0.4], [-4.85, -1.5, -4.35, -1.2], // magazine rack + reader
  [1.62, -1.03, 2.58, -0.37], [2.92, -1.03, 3.68, -0.37], // copy machine, ATM
  [3.82, -5.45, 5.95, -1.45], [3.7, -6.95, 5.95, -5.45], // counter + clerk, staff corner
  [4.0, -0.8, 4.5, -0.3], [5.25, -1.4, 5.95, -0.15], // ticket kiosk, ice cream chest
  [-5.95, -6.95, -5.25, -1.35], // drink fridges
  [-5.25, -6.95, 3.8, -6.18], // chilled cases
  [-4.35, -3.02, 1.95, -2.18], [-4.35, -4.82, 1.95, -3.98], // gondolas
  [1.93, -2.98, 2.38, -2.22], [1.93, -4.78, 2.38, -4.02], // end caps
  [-5.8, -1.25, -5.25, -0.85], // baskets
  [0.25, -5.78, 0.75, -5.42], // customer at the onigiri
  [0.8, -0.78, 1.25, -0.42], // wet floor sign
];

const RADIUS = 0.25;
const EYE = 1.6;
const WALK_FOV = (70 * Math.PI) / 180;
const START: Vec3 = [0, EYE, -0.8];

// ── Interior extras (lazy geometry + atlas art, painted below y = 720) ──────
const SIGN_TEXTS = [
  ["雑誌", "BLOG"],
  ["ドリンク", "DRINKS"],
  ["おにぎり・弁当", "ONIGIRI"],
  ["お菓子", "SNACKS"],
  ["ドット絵", "PIXEL ART"],
  ["ゲーム・コミック", "GAMES · MANGA"],
  ["スイーツ", "SWEETS"],
  ["レジ", "REGISTER"],
  ["コピー・ATM", "EDITOR · GAMES"],
] as const;
const signRect = (i: number) => [(i % 5) * 408, 720 + Math.floor(i / 5) * 88, 400, 80] as const;
const cartRect = (i: number) => [i * 100, 896, 96, 96] as const;
const printRect = (i: number) => [800 + i * 100, 896, 96, 96] as const;
const mangaRect = (i: number) => [i * 84, 1000, 80, 120] as const;
const MAX_MANGA = 18;
/** "Staff pick" boards standing on top of the two personal shelves. */
const TOPPERS = ["FAVORITE GAMES", "FAVORITE MANGA"] as const;
const topperRect = (i: number) => [i * 408, 1128, 400, 80] as const;
const MAX_CARTS = 8;
/** The blog on the magazine rack: one cover per article, in the atlas's second lazy band. */
const MAX_COVERS = 18;
const coverRect = (i: number) => [i * 108, 1900, 104, 146] as const;
const COVER_INKS = [
  ["#c1121f", "#ffffff", "#ffd166"], ["#1d3557", "#f1faee", "#4cc9f0"], ["#ffd60a", "#111111", "#e63946"],
  ["#2a9d8f", "#ffffff", "#e9c46a"], ["#f1faee", "#1d3557", "#e63946"], ["#3a0ca3", "#ffffff", "#f72585"],
  ["#f28482", "#22223b", "#ffffff"], ["#111318", "#ffffff", "#49e08a"],
] as const;
/**
 * The manhole card display at the counter (see cards-data.ts): banner, wrapper,
 * the four cards shown off on the top tier and the poster on the counter front.
 */
type AtlasRect = readonly [x: number, y: number, w: number, h: number];
const CARD_SIGN: AtlasRect = [816, 1128, 480, 152];
const CARD_PACK: AtlasRect = [1304, 1128, 88, 148];
const cardFaceRect = (i: number): AtlasRect => [1400 + i * 108, 1128, 104, 146];
const CARD_POSTER: AtlasRect = [1840, 1128, 200, 152];
/** The chase cards, to make you want a pack: the collab secret rares and holos. */
const SHOWCASE = [
  { slug: "pichu-kyoto", name: "PICHU", frame: "#ffe14d" },
  { slug: "pikachu-nintendo-museum", name: "PIKACHU", frame: "#e2a81c" },
  { slug: "gundam-odawara", name: "GUNDAM", frame: "#e2a81c" },
  { slug: "hakodate", name: "HAKODATE", frame: "#4fb3d1" },
] as const;
const showcaseSrc = (slug: string) => `/cards/manhole/${slug}.jpg`;
const RAINBOW = ["#ff5d8f", "#ffc400", "#49e08a", "#4cc9f0", "#b14dff"];

/**
 * The staff-pick shelf: top of gondola 2, facing the middle aisle. Favourite games sit
 * towards the main aisle, favourite manga right next to them on the left, filler carts after.
 */
const SHELF = { y: 1.36, edge: -4.02, left: -4.22, gap: 0.4, bookW: 0.15, bookH: 0.225, bookPitch: 0.165 } as const;
function shelfLayout() {
  const span = (featured.length - 1) * SHELF.gap;
  const mid = Math.min(1.0, 1.62 - span / 2);
  const first = mid - span / 2;
  const gamesStart = featured.length ? first - SHELF.gap / 2 : mid;
  const gamesEnd = featured.length ? first + span + SHELF.gap / 2 : mid;
  const mangaEnd = gamesStart - 0.08;
  const books = Math.min(manga.length, Math.max(0, Math.floor((mangaEnd - SHELF.left) / SHELF.bookPitch)));
  const mangaStart = mangaEnd - books * SHELF.bookPitch;
  return { mid, first, gamesStart, gamesEnd, books, mangaStart, mangaEnd };
}

/** Hanging signs: `axis` = the direction their faces point; `a` / `b` = text on the + / - side. */
const SIGNS: { x: number; z: number; axis: "x" | "z"; a: number; b: number }[] = [
  { x: -4.6, z: -1.3, axis: "z", a: 0, b: 0 },
  { x: -4.85, z: -3.9, axis: "x", a: 1, b: 1 },
  { x: -0.75, z: -5.75, axis: "z", a: 2, b: 2 },
  { x: -1.2, z: -2.6, axis: "z", a: 3, b: 4 },
  { x: -1.2, z: -4.4, axis: "z", a: 5, b: 6 },
  { x: 4.25, z: -3.45, axis: "x", a: 7, b: 7 },
  { x: 2.7, z: -1.45, axis: "z", a: 8, b: 8 },
];

/** Images (prints + custom cartridge labels) are fetched on entry; painted once loaded. */
const images = new Map<string, HTMLImageElement>();
function loadImages(srcs: string[]) {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          if (images.has(src)) return resolve();
          const img = new Image();
          img.onload = () => {
            images.set(src, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  );
}

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
const num = (css: string) => parseInt(css.slice(1), 16);
const brandOf = (skin: Skin) => (skin.colors[0] === 0xffffff ? skin.colors[1] : skin.colors[0]);
/** Set when walk mode starts (the data comes from the server: favourites + Steam). */
let featured: ShelfGame[] = [];
let manga: MangaItem[] = [];
let posts: { title: string; date: string }[] = [];
const covers = new Map<string, HTMLImageElement>();
const mangaCovers = new Map<string, HTMLImageElement>();

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Draws an image centred in a square, crisp (nearest neighbour), on white. */
function paintImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, [x, y, w, h]: readonly number[]) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);
  if (!img) return;
  const scale = Math.min((w - 8) / img.width, (h - 8) / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.imageSmoothingEnabled = true;
}

export const interior: SceneExtra = {
  paint(canvas, skin) {
    const ctx = canvas.getContext("2d")!;
    ctx.textBaseline = "middle";
    SIGN_TEXTS.forEach(([jp, en], i) => {
      const [x, y, w, h] = signRect(i);
      ctx.fillStyle = hex(brandOf(skin));
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y + h - 8, w, 8);
      ctx.textAlign = "left";
      ctx.font = `800 24px ${FONT}`;
      ctx.fillText(jp, x + 18, y + h / 2 - 4, 150);
      ctx.textAlign = "right";
      ctx.font = `900 ${en.length > 10 ? 26 : 32}px ${FONT}`;
      ctx.fillText(en, x + w - 18, y + h / 2 - 4, 200);
    });

    // Magazine covers: every article of the blog gets its own issue
    posts.slice(0, MAX_COVERS).forEach((post, i) => {
      const [x, y, w, h] = coverRect(i);
      const [bg, ink, pop] = COVER_INKS[i % COVER_INKS.length];
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = ink;
      ctx.textAlign = "left";
      ctx.font = `900 19px ${FONT}`;
      ctx.fillText("THOMAS", x + 6, y + 14, w - 40);
      ctx.font = `800 8px ${FONT}`;
      ctx.fillText(`週刊ブログ · ${post.date}`, x + 6, y + 29, w - 12);
      ctx.fillStyle = pop;
      ctx.fillRect(x + 6, y + 36, w - 12, 3);
      ctx.beginPath();
      ctx.arc(x + w - 17, y + 15, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.textAlign = "center";
      ctx.font = `900 8px ${FONT}`;
      ctx.fillText(`No.${posts.length - i}`, x + w - 17, y + 15.5, 20);
      // The headline, wrapped
      ctx.fillStyle = ink;
      ctx.textAlign = "left";
      ctx.font = `900 13px ${FONT}`;
      const lines: string[] = [];
      let line = "";
      for (const word of post.title.split(" ")) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > w - 12) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      lines.push(line);
      lines.slice(0, 6).forEach((text, k) => ctx.fillText(text, x + 6, y + 52 + k * 15, w - 12));
      ctx.fillStyle = pop;
      ctx.fillRect(x, y + h - 10, w, 10);
    });

    // Cartridge labels: the game's own pixel art if provided, else a generated one
    featured.forEach((game, i) => {
      const [x, y, w, h] = cartRect(i);
      if (game.image) {
        paintImage(ctx, images.get(game.image), [x, y, w, h]);
        return;
      }
      ctx.fillStyle = game.label;
      ctx.fillRect(x, y, w, h);
      const cover = covers.get(game.title);
      if (cover) drawPixelated(ctx, cover, x + 13, y + 1, 70, 24);
      else drawIcon(ctx, game.icon, game.palette, x + 18, y + 6, 5);
      ctx.fillStyle = "#1b1b1f";
      ctx.fillRect(x, y + h - 26, w, 26);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = `800 ${game.title.length > 12 ? 9 : 12}px ${FONT}`;
      ctx.fillText(game.title.toUpperCase(), x + w / 2, y + h - 13, w - 6);
    });

    PRINTS.forEach((print, i) => paintImage(ctx, images.get(print.src), printRect(i)));

    // Toppers: yellow staff-pick boards, so the personal shelves stand out from the stock
    TOPPERS.forEach((text, i) => {
      const [x, y, w, h] = topperRect(i);
      ctx.fillStyle = "#ffd60a";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#d62828";
      ctx.fillRect(x, y, w, 7);
      ctx.fillRect(x, y + h - 7, w, 7);
      ctx.textAlign = "center";
      ctx.fillStyle = "#d62828";
      ctx.font = `800 15px ${FONT}`;
      ctx.fillText("★ 店長のおすすめ · STAFF PICK ★", x + w / 2, y + 22);
      ctx.fillStyle = "#1b1b1f";
      ctx.font = `900 32px ${FONT}`;
      ctx.fillText(text, x + w / 2, y + 52);
    });

    // Manhole card display: banner, wrapper, the showcased cards and the counter poster
    {
      const [x, y, w, h] = CARD_SIGN;
      ctx.fillStyle = "#ffd60a";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#d62828";
      ctx.fillRect(x, y, w, 36);
      ctx.fillStyle = "#1b1b1f";
      ctx.fillRect(x, y + h - 36, w, 36);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 21px ${FONT}`;
      ctx.fillText("★ 新発売 · マンホールカード 第1弾 ★", x + w / 2, y + 19);
      ctx.fillStyle = "#ffd60a";
      ctx.fillText("BOOSTER PACKS · 5枚入り · ¥0 · レジにて", x + w / 2, y + h - 17, w - 20);
      ctx.fillStyle = "#1b1b1f";
      ctx.font = `900 58px ${FONT}`;
      ctx.fillText("MANHOLE CARDS", x + w / 2, y + 78, w - 28);
    }
    {
      const [x, y, w, h] = CARD_PACK;
      const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
      sheen.addColorStop(0, "#3346b0");
      sheen.addColorStop(0.5, "#1c2a78");
      sheen.addColorStop(1, "#0c1230");
      ctx.fillStyle = sheen;
      ctx.fillRect(x, y, w, h);
      // Crimped ends of the foil
      for (let i = 0; i < w; i += 4) {
        ctx.fillStyle = i % 8 ? "#aeb6c4" : "#e3e7ee";
        ctx.fillRect(x + i, y, 4, 12);
        ctx.fillRect(x + i, y + h - 9, 4, 9);
      }
      const cx = x + w / 2, cy = y + 60, r = 30;
      ["#f28c28", "#e63946", "#4cc9f0", "#52b788"].forEach((color, k) => {
        for (let n = k; n < 12; n += 4) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, r, (n * Math.PI) / 6, ((n + 1) * Math.PI) / 6);
          ctx.fill();
        }
      });
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#15171c";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffe14d";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.font = `900 15px ${FONT}`;
      ctx.fillText("マンホール", cx, y + 106, w - 8);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 18px ${FONT}`;
      ctx.fillText("CARDS", cx, y + 125, w - 8);
    }
    SHOWCASE.forEach((card, i) => {
      const [x, y, w, h] = cardFaceRect(i);
      // Holo border, coloured frame, the photo, a name plate and two stars
      const foil = ctx.createLinearGradient(x, y, x + w, y + h);
      RAINBOW.forEach((color, k) => foil.addColorStop(k / (RAINBOW.length - 1), color));
      ctx.fillStyle = foil;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = card.frame;
      ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
      ctx.fillStyle = "#15171c";
      ctx.textAlign = "left";
      ctx.font = `900 12px ${FONT}`;
      ctx.fillText(card.name, x + 10, y + 16, w - 20);
      ctx.fillStyle = "#20242e";
      ctx.fillRect(x + 9, y + 25, w - 18, w - 18);
      const img = images.get(showcaseSrc(card.slug));
      if (img) ctx.drawImage(img, x + 11, y + 27, w - 22, w - 22);
      ctx.fillStyle = "rgb(255 255 255 / 0.55)";
      ctx.fillRect(x + 10, y + w + 13, w - 20, 5);
      ctx.fillRect(x + 10, y + w + 22, w - 44, 5);
      ctx.fillStyle = "#15171c";
      ctx.font = `900 11px ${FONT}`;
      ctx.fillText("★★", x + 10, y + h - 12);
    });
    {
      const [x, y, w, h] = CARD_POSTER;
      ctx.fillStyle = "#1c2a78";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#ffd60a";
      ctx.fillRect(x, y, w, 6);
      ctx.fillRect(x, y + h - 6, w, 6);
      ctx.textAlign = "center";
      ctx.font = `800 13px ${FONT}`;
      ctx.fillText(`全${CARDS.length}種 · マンホールカード`, x + w / 2, y + 24);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 30px ${FONT}`;
      ctx.fillText("COLLECT", x + w / 2, y + 54);
      ctx.fillText(`ALL ${CARDS.length}!`, x + w / 2, y + 86);
      const foil = ctx.createLinearGradient(x + 20, 0, x + w - 20, 0);
      RAINBOW.forEach((color, k) => foil.addColorStop(k / (RAINBOW.length - 1), color));
      ctx.fillStyle = foil;
      ctx.fillRect(x + 16, y + 104, w - 32, 22);
      ctx.fillStyle = "#15171c";
      ctx.font = `900 13px ${FONT}`;
      ctx.fillText("★ HOLO & SECRET RARES ★", x + w / 2, y + 116, w - 40);
      ctx.fillStyle = "#ffd60a";
      ctx.font = `800 11px ${FONT}`;
      ctx.fillText("E · Buy a booster", x + w / 2, y + 137);
    }

    // Manga covers (full colour: they are book covers, not pixel art)
    manga.slice(0, MAX_MANGA).forEach((m, i) => {
      const [x, y, w, h] = mangaRect(i);
      const img = mangaCovers.get(m.id);
      ctx.fillStyle = "#f1ece2";
      ctx.fillRect(x, y, w, h);
      if (img) ctx.drawImage(img, x, y, w, h);
    });
  },

  build(skin) {
    const bag = new Bag();
    const rnd = mulberry32(11);
    const candy = [0xe63946, 0xf4a261, 0xffd166, 0x2a9d8f, 0x4cc9f0, 0xf72585, 0x8ac926, 0x7b2cbf];
    const pick = () => candy[Math.floor(rnd() * candy.length)];
    const brand = brandOf(skin);
    /** Things on the counter face the customer (-x). */
    const FACING_COUNTER = -Math.PI / 2;

    // Inside face of the rack: the blog, one issue per article, two copies deep
    const covers = Math.min(posts.length, MAX_COVERS);
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 14; i++) {
        const x = -5.62 + i * 0.315, y = 0.68 + row * 0.5;
        const uv = covers ? rectUv(coverRect((row * 14 + i) % covers)) : SPR.mag[(i + row) % SPR.mag.length];
        bag.box(x, y, -0.78, 0.26, 0.365, 0.02, 0xf4f4f0, 1, uv, Math.PI);
        bag.box(x, y + 0.012, -0.762, 0.26, 0.365, 0.014, 0xe9e9e4, 1);
      }
    }
    // Shelf strips under each tier
    for (const y of [0.64, 1.14]) bag.box(-3.55, y, -0.795, 4.5, 0.04, 0.02, 0xffffff, 1);

    const SIGN_Y = 2.5;
    // Hanging signs: two boxes back to back, with a gap so their faces never z-fight
    for (const sign of SIGNS) {
      for (const side of [1, -1]) {
        const uv = rectUv(signRect(side > 0 ? sign.a : sign.b));
        if (sign.axis === "z") {
          bag.box(sign.x, SIGN_Y, sign.z + side * 0.007, 1.6, 0.32, 0.01, 0xffffff, 1.1, uv, side > 0 ? 0 : Math.PI);
        } else {
          bag.box(sign.x + side * 0.007, SIGN_Y, sign.z, 1.6, 0.32, 0.01, 0xffffff, 1.1, uv, (side * Math.PI) / 2);
        }
      }
      for (const e of [-0.6, 0.6]) {
        if (sign.axis === "z") bag.box(sign.x + e, SIGN_Y + 0.32, sign.z, 0.012, CEIL - SIGN_Y - 0.32, 0.012, 0x9aa0a6, 0.8);
        else bag.box(sign.x, SIGN_Y + 0.32, sign.z + e, 0.012, CEIL - SIGN_Y - 0.32, 0.012, 0x9aa0a6, 0.8);
      }
    }

    // Staff-pick shelf, eye level: favourite games on little stands, favourite manga
    // face-out on their left, then filler carts
    const { y: shelfY, edge, gap } = SHELF;
    const { mid, first, gamesStart, gamesEnd, books, mangaStart, mangaEnd } = shelfLayout();
    featured.forEach((game, i) => {
      const x = first + i * gap;
      bag.box(x, shelfY, edge - 0.08, 0.3, 0.02, 0.14, 0xf5f7fa, 0.95); // acrylic stand
      // 0.26 tall so they clear the gondola's top cap (y 1.66)
      bag.box(x, shelfY + 0.02, edge - 0.085, 0.25, 0.26, 0.035, num(game.shell), 0.95);
      bag.box(x, shelfY + 0.255, edge - 0.085, 0.19, 0.02, 0.036, 0x1b1b1f, 0.9); // grip ridge
      bag.box(x, shelfY + 0.06, edge - 0.066, 0.2, 0.18, 0.004, 0xffffff, 1, rectUv(cartRect(i)));
      bag.box(x, shelfY - 0.05, edge + 0.002, 0.14, 0.03, 0.004, 0xffe94d, 1.1); // price tag
    });
    // Topper standing on the gondola, above the favourites
    bag.box(featured.length ? mid : 0.6, 1.69, -4.035, 1.7, 0.34, 0.02, 0xffffff, 1, rectUv(topperRect(0)));
    for (const e of [-0.7, 0.7]) bag.box((featured.length ? mid : 0.6) + e, 1.69, -4.06, 0.03, 0.06, 0.06, 0x9aa0a6, 0.7);
    // Manga, face-out, each with a little acrylic easel behind it and a price tag
    for (let i = 0; i < books; i++) {
      const x = mangaStart + (i + 0.5) * SHELF.bookPitch;
      bag.box(x, shelfY, edge - 0.09, 0.05, 0.16, 0.02, 0xe8eef2, 0.9); // easel
      bag.box(x, shelfY + 0.005, edge - 0.07, SHELF.bookW, SHELF.bookH, 0.025, 0xffffff, 1, rectUv(mangaRect(i)));
      bag.box(x, shelfY - 0.05, edge + 0.002, 0.1, 0.03, 0.004, 0xffe94d, 1.1);
    }
    if (books) {
      // Its own staff-pick board, kept clear of the games' one
      const cx = Math.min((mangaStart + mangaEnd) / 2, mid - 1.75);
      bag.box(cx, 1.69, -4.035, 1.7, 0.34, 0.02, 0xffffff, 1, rectUv(topperRect(1)));
      for (const e of [-0.7, 0.7]) bag.box(cx + e, 1.69, -4.06, 0.03, 0.06, 0.06, 0x9aa0a6, 0.7);
    }
    const start = books ? mangaStart : gamesStart;
    for (let x = -4.16; x < 1.8; x += 0.13) {
      if (x > start - 0.06 && x < gamesEnd + 0.06) continue;
      bag.box(x, shelfY, edge - 0.0425, 0.1, 0.12, 0.025, [0x8a8f98, 0x3a3d45, 0x6b7280, 0xd1d5db][Math.floor(rnd() * 4)], 0.95);
      bag.box(x, shelfY + 0.045, edge - 0.028, 0.08, 0.055, 0.004, pick(), 1);
    }

    // Pixel art prints on the back of gondola 1 (facing the middle aisle)
    PRINTS.forEach((_, i) => {
      const x = -0.9 + (i % 4) * 0.7;
      const y = i < 4 ? 0.95 : 0.56;
      bag.box(x, y, -2.69, 0.36, 0.36, 0.02, 0x2b2e35, 0.8);
      bag.box(x, y + 0.03, -2.702, 0.3, 0.3, 0.004, 0xffffff, 1, rectUv(printRect(i)), Math.PI);
    });

    // Shopping baskets, stacked in the corner between the rack and the coolers
    for (let i = 0; i < 5; i++) {
      const y = 0.16 + i * 0.07;
      bag.box(-5.52, y, -1.05, 0.46 - 0.004 * i, 0.2, 0.32, brand, 0.95);
      bag.box(-5.52, y + 0.2, -1.05, 0.48, 0.016, 0.34, 0x2b2e35, 0.8);
    }
    bag.box(-5.52, 0.66, -1.05, 0.36, 0.012, 0.02, 0x2b2e35, 0.8);
    for (const e of [-0.18, 0.18]) bag.box(-5.52 + e, 0.5, -1.05, 0.012, 0.17, 0.02, 0x2b2e35, 0.8);

    // Price tags along every shelf edge
    const tag = () => SPR.tag[Math.floor(rnd() * SPR.tag.length)];
    const tags = (x0: number, x1: number, y: number, z: number, step: number, back = false) => {
      for (let x = x0 + 0.1; x < x1 - 0.05; x += step) bag.box(x, y, z, 0.085, 0.03, 0.004, 0xffffff, 1.1, tag(), back ? Math.PI : 0);
    };
    for (const y of [0.28, 0.6, 0.92]) {
      tags(-4.3, 1.9, y - 0.053, -2.6 + 0.408, y > 0.9 ? 0.688 : 0.57);
      tags(-4.3, y > 0.3 ? -1.2 : 1.9, y - 0.053, -2.6 - 0.408, 0.5, true);
    }
    for (const y of [0.28, 0.64, 1.0, 1.36]) {
      tags(-4.3, 1.9, y - 0.053, -4.4 + 0.408, 0.39);
      tags(-4.3, 1.9, y - 0.053, -4.4 - 0.408, y > 0.3 && y < 1.3 ? 0.688 : 0.57, true);
    }
    for (const [y, front] of [[0.62, -6.2], [0.98, -6.32], [1.34, -6.42], [1.7, -6.52]]) tags(-5.25, 3.75, y - 0.048, front + 0.012, 0.34);
    // …and on the cooler rails, facing the aisle
    for (let level = 0; level < 5; level++) {
      for (let z = -6.2; z < -1.5; z += 0.39) {
        bag.box(-5.338, 0.277 + level * 0.43, z, 0.085, 0.03, 0.004, 0xffffff, 1.1, tag(), Math.PI / 2);
      }
    }
    // Shelf talkers sticking out of the shelves
    for (let i = 0; i < 14; i++) {
      const g = i % 2 ? -2.6 + 0.43 : -4.4 + 0.43;
      bag.box(-4.0 + rnd() * 5.6, 0.45 + Math.floor(rnd() * 3) * 0.33, g, 0.006, 0.1, 0.12, [0xe63946, 0xffd60a, brand, 0xff7b00][i % 4], 1.1);
    }
    // Promo cards clipped above the chilled case and the coolers
    [-4.4, -1.7, 0.1, 2.3].forEach((x, i) => bag.box(x, 2.1, -6.42, 0.44, 0.22, 0.006, 0xffffff, 1.15, SPR.pop[i]));
    [-2.3, -4.5].forEach((z, i) => bag.box(-5.236, 2.57, z, 0.4, 0.2, 0.006, 0xffffff, 1.15, SPR.pop[i * 2], Math.PI / 2));

    // Ceiling: tile grid, air conditioning, smoke detectors, speakers, security dome, mirror, exit sign
    const top = CEIL - 0.004;
    for (let x = -5.4; x < 6; x += 1.2) bag.box(x, top, -3.5, 0.012, 0.004, 6.9, 0xc9ced3, 0.9);
    for (let z = -6.3; z < 0; z += 0.6) {
      if (Math.abs(((z + 0.5) % 2) + 1) < 0.2) continue; // the light strips already draw these
      bag.box(0, top, z, 11.9, 0.004, 0.012, 0xc9ced3, 0.9);
    }
    for (const [x, z] of [[-2.8, -2.5], [1.8, -4.5]]) {
      bag.box(x, CEIL - 0.04, z, 0.84, 0.04, 0.84, 0xe6e8ea, 1);
      bag.box(x, CEIL - 0.045, z, 0.5, 0.01, 0.5, 0xd0d4d8, 0.9);
      for (const e of [-0.34, 0.34]) {
        bag.box(x + e, CEIL - 0.046, z, 0.07, 0.01, 0.66, 0x7d838a, 0.8);
        bag.box(x, CEIL - 0.046, z + e, 0.66, 0.01, 0.07, 0x7d838a, 0.8);
      }
    }
    for (const [x, z] of [[-0.5, -2.5], [3.5, -4.5], [-4, -4.6]]) bag.box(x, CEIL - 0.04, z, 0.12, 0.04, 0.12, 0xf5f5f2, 1, NO_UV, 0, KIND.tube);
    for (const [x, z] of [[-3.4, -4.5], [0.6, -2.5], [3.1, -2.5]]) {
      bag.box(x, CEIL - 0.02, z, 0.22, 0.02, 0.22, 0xe6e8ea, 1, NO_UV, 0, KIND.tube); // speakers (the jingle has to come from somewhere)
      bag.box(x, CEIL - 0.024, z, 0.16, 0.006, 0.16, 0x9aa0a6, 0.8, NO_UV, 0, KIND.tube);
    }
    bag.box(5.3, CEIL - 0.05, -1.0, 0.2, 0.05, 0.2, 0xf5f5f2, 1, NO_UV, 0, KIND.tube);
    bag.box(5.3, CEIL - 0.15, -1.0, 0.16, 0.16, 0.16, 0x15171c, 0.6, NO_UV, 0, KIND.ball);
    bag.box(5.7, 2.5, -6.7, 0.42, 0.42, 0.05, 0xdfe7ee, 1.25, NO_UV, -Math.PI / 4);
    bag.box(5.1, 2.32, -6.84, 0.42, 0.16, 0.03, 0x1faa59, 1.5);
    bag.box(5.1, 2.37, -6.825, 0.24, 0.06, 0.005, 0xffffff, 1.6);
    bag.box(5.884, 2.25, -0.8, 0.7, 0.34, 0.006, 0xffffff, 1.1, SPR.camera[0], -Math.PI / 2);

    // Counter extras: a donation box, carrier bags, the lottery board, where to queue
    bag.box(3.93, 1.16, -5.3, 0.14, 0.18, 0.14, 0xe9f5ff, 1.1);
    bag.box(3.93, 1.34, -5.3, 0.15, 0.02, 0.15, brand, 0.95);
    bag.box(4.55, 0.4, -5.38, 0.5, 0.5, 0.06, 0xf5f5f2, 0.95);
    bag.box(3.884, 0.24, -2.0, 0.78, 0.37, 0.008, 0xffffff, 1.15, SPR.kuji[0], FACING_COUNTER);
    bag.box(3.884, 0.3, -3.35, 0.56, 0.28, 0.008, 0xffffff, 1.15, SPR.pop[2], FACING_COUNTER);
    for (const [x, z] of [[3.42, -2.75], [2.82, -2.75], [3.42, -4.45]]) {
      bag.box(x, 0.161, z, 0.36, 0.002, 0.36, 0xffffff, 1, topUv(SPR.foot[0]), FACING_COUNTER, KIND.card);
    }
    // ── Manhole card boosters: the one thing on the counter that is really for sale ──
    // A three-tier stand in front of the second register. Everything faces the customer (-x).
    const cardZ = -4.5;
    const FACING = FACING_COUNTER;
    const tierX = (k: number) => 3.875 + k * 0.09;
    const tierTop = (k: number) => 1.19 + k * 0.115;
    for (let k = 0; k < 3; k++) {
      bag.box(tierX(k), 1.16, cardZ, 0.09, tierTop(k) - 1.16, 0.66, 0x15171c, 0.75);
      bag.box(tierX(k) - 0.046, tierTop(k) - 0.014, cardZ, 0.004, 0.014, 0.66, 0xffd60a, 1.4);
    }
    // Two rows of sealed packs: the printed wrapper in front, a few more lined up behind
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 5; i++) {
        const z = cardZ - 0.25 + i * 0.125;
        bag.box(tierX(k) - 0.022, tierTop(k), z, 0.1, 0.168, 0.008, 0xffffff, 1.25, rectUv(CARD_PACK), FACING);
        bag.box(tierX(k) + 0.006, tierTop(k), z, 0.048, 0.166, 0.098, [0x2b3a8c, 0x1c2a78][(i + k) % 2], 0.95);
        bag.box(tierX(k) + 0.006, tierTop(k) + 0.166, z, 0.05, 0.004, 0.1, 0xc3c9d4, 1.1);
      }
    }
    // Top tier: the chase cards in clear stands, turned a little towards each other
    SHOWCASE.forEach((_, i) => {
      const z = cardZ - 0.225 + i * 0.15;
      const turn = FACING + (i < 2 ? -0.22 : 0.22);
      bag.box(tierX(2) - 0.01, tierTop(2), z, 0.05, 0.012, 0.11, 0xdfe7ee, 1.3);
      bag.box(tierX(2) - 0.012, tierTop(2) + 0.012, z, 0.125, 0.175, 0.006, 0xffffff, 1.45, rectUv(cardFaceRect(i)), turn);
      bag.box(tierX(2) - 0.004, tierTop(2) + 0.012, z, 0.127, 0.177, 0.006, 0x1b2238, 0.9, NO_UV, turn);
    });
    // Backboard, a lit canopy and the banner on top
    bag.box(4.105, 1.16, cardZ, 0.014, 0.52, 0.7, 0x1c2a78, 0.95);
    for (const e of [-0.343, 0.343]) bag.box(4.0, 1.16, cardZ + e, 0.22, 0.52, 0.014, 0xffd60a, 1.15);
    bag.box(4.02, 1.672, cardZ, 0.2, 0.014, 0.7, 0x15171c, 0.8);
    bag.box(4.0, 1.662, cardZ, 0.1, 0.01, 0.62, 0xfff4c2, 2);
    bag.box(3.9, 1.69, cardZ, 0.76, 0.24, 0.014, 0xffffff, 1.5, rectUv(CARD_SIGN), FACING);
    bag.box(3.916, 1.685, cardZ, 0.02, 0.25, 0.78, 0xd62828, 1.1);
    // A "NEW" burst bobbing on the corner of the banner
    bag.anim = [ANIM.bob, 2.6, 0, 0.022];
    bag.box(3.89, 1.88, cardZ - 0.4, 0.014, 0.15, 0.15, 0xd62828, 1.5);
    bag.box(3.881, 1.92, cardZ - 0.4, 0.004, 0.07, 0.07, 0xffd60a, 1.7);
    bag.anim = NO_ANIM;
    // Poster on the front of the counter, right under the stand
    bag.box(3.884, 0.2, cardZ, 0.62, 0.47, 0.008, 0xffffff, 1.25, rectUv(CARD_POSTER), FACING);
    bag.box(3.889, 0.185, cardZ, 0.66, 0.5, 0.006, 0xffd60a, 1.1, NO_UV, FACING);
    // And a banner hung over the main aisle, readable from the door and from the back of the store
    for (const side of [1, -1]) {
      bag.box(3.08, 2.36, -3.95 + side * 0.007, 1.45, 0.46, 0.01, 0xffffff, 1.35, rectUv(CARD_SIGN), side > 0 ? 0 : Math.PI);
    }
    for (const e of [-0.6, 0.6]) bag.box(3.08 + e, 2.82, -3.95, 0.012, CEIL - 2.82, 0.012, 0x9aa0a6, 0.8);

    // Entrance: mat and a wet floor sign (rainy night)
    bag.box(0, 0.16, -0.55, 1.9, 0.012, 0.8, 0x3a3f47, 0.8);
    for (const dz of [-0.07, 0.07]) bag.box(1.02, 0.16, -0.6 + dz, 0.32, 0.58, 0.02, 0xffd60a, 1.05);
    bag.box(1.02, 0.52, -0.58, 0.18, 0.1, 0.005, 0x111111, 1);

    return new Float32Array(bag.data);
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: readonly number[], b: readonly number[], t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const bezier = (p0: readonly number[], p1: Vec3, p2: Vec3, p3: readonly number[], t: number): Vec3 => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [0, 1, 2].map((i) => a * p0[i] + b * p1[i] + c * p2[i] + d * p3[i]) as Vec3;
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function blocked(x: number, z: number) {
  for (const [x0, z0, x1, z1] of SOLIDS) {
    if (x > x0 - RADIUS && x < x1 + RADIUS && z > z0 - RADIUS && z < z1 + RADIUS) return true;
  }
  return false;
}

function inZone([x0, z0, x1, z1]: Rect, x: number, z: number) {
  return x > x0 && x < x1 && z > z0 && z < z1;
}

// ── Controller ──────────────────────────────────────────────────────────────
export type WalkHandle = {
  /** Uses whatever the player stands in front of. */
  interact: () => void;
  exit: () => void;
  /** Freezes movement while a panel is open. */
  setPaused: (paused: boolean) => void;
  /** On-screen D-pad: forward (-1..1) and turn (-1..1). */
  setVirtual: (forward: number, turn: number) => void;
  destroy: () => void;
};

export type WalkContent = { games: ShelfGame[]; manga: MangaItem[]; posts: { title: string; date: string }[] };

const prepared = new WeakSet<SceneHandle>();
/** Repainting the artwork costs a frame or two: never do it during the entrance / exit flights. */
let flying = false;
let pendingArt: SceneHandle | null = null;
function refreshArt(scene: SceneHandle) {
  if (flying) pendingArt = scene;
  else scene.refreshExtraArt();
}

/**
 * Builds the interior and starts fetching its images. Called on hover of the door box,
 * so that nothing heavy happens during the entrance flight. Safe to call twice.
 */
export function prepareWalk(scene: SceneHandle, content: WalkContent) {
  if (prepared.has(scene)) return;
  prepared.add(scene);
  featured = content.games.slice(0, MAX_CARTS);
  manga = content.manga.slice(0, MAX_MANGA);
  posts = content.posts;
  const { gamesStart, books } = shelfLayout();
  MANGA_ZONE[2] = books ? gamesStart - 0.04 : MANGA_ZONE[0];
  scene.setExtra(interior);
  // Images arrive a moment later: repaint only the artwork region once they are in
  const pending = [
    ...PRINTS.map((p) => p.src),
    ...SHOWCASE.map((card) => showcaseSrc(card.slug)),
    ...featured.flatMap((g) => (g.image ? [g.image] : [])),
  ];
  const coverLoads = featured.map(async (g) => {
    if (g.image || !g.covers || covers.has(g.title)) return;
    const img = await loadCover(g.covers);
    if (img) covers.set(g.title, img);
  });
  const mangaLoads = manga.map(async (m) => {
    const img = await loadImage(mangaCoverUrl(m.id));
    if (img) mangaCovers.set(m.id, img);
  });
  void Promise.all([loadImages(pending), ...coverLoads, ...mangaLoads]).then(() => refreshArt(scene));
}

export function startWalk(
  scene: SceneHandle,
  canvas: HTMLCanvasElement,
  opts: {
    reducedMotion: boolean;
    content: WalkContent;
    onPrompt: (id: InteractionId | null) => void;
    onInteract: (id: InteractionId) => void;
    onControl: () => void;
    /** Leaving has started: the HUD should get out of the way. */
    onRelease: () => void;
    onExit: () => void;
  },
): WalkHandle {
  prepareWalk(scene, opts.content);
  startAmbience();

  type Transition = { kind: "enter" | "exit"; t: number; duration: number; from: CameraPose };
  let transition: Transition | null = {
    kind: "enter",
    t: 0,
    duration: opts.reducedMotion ? 0.01 : 2.6,
    from: scene.getOrbitPose(),
  };

  const pos: Vec3 = [...START];
  let yaw = 0;
  let pitch = -0.011;
  /** Where the mouse / arrows want to look; the camera eases towards it (no jitter). */
  let aimYaw = yaw, aimPitch = pitch;
  let velX = 0, velZ = 0;
  let stride = 0;
  let door = 0;
  let paused = false;
  let prompt: InteractionId | null = null;
  const keys = new Set<string>();
  const virtual = { forward: 0, turn: 0 };
  let pose: CameraPose = transition.from;

  const walkPose = (): CameraPose => {
    const bob = opts.reducedMotion ? 0 : Math.sin(stride * 7) * 0.035 * Math.min(Math.hypot(velX, velZ) / 2, 1);
    const eye: Vec3 = [pos[0], EYE + bob, pos[2]];
    const cp = Math.cos(pitch);
    return {
      eye,
      target: [eye[0] - Math.sin(yaw) * cp, eye[1] + Math.sin(pitch), eye[2] - Math.cos(yaw) * cp],
      fov: WALK_FOV,
      near: 0.06,
    };
  };

  function setPrompt(next: InteractionId | null) {
    if (next !== prompt) {
      prompt = next;
      opts.onPrompt(next);
    }
  }

  function exit() {
    if (transition) return;
    keys.clear();
    setPrompt(null);
    opts.onRelease();
    transition = { kind: "exit", t: 0, duration: opts.reducedMotion ? 0.01 : 2.2, from: pose };
  }

  function tickTransition(tr: Transition, dt: number) {
    tr.t = Math.min(tr.t + dt / tr.duration, 1);
    const e = easeInOut(tr.t);
    const { from } = tr;
    if (tr.kind === "enter") {
      const end = walkPose();
      const eye = bezier(from.eye, [from.eye[0] * 0.35, 2.4, 7.5], [0, 1.7, 2.6], end.eye, e);
      const target = lerp3(from.target, end.target, smooth(0, 0.55, e));
      pose = { eye, target, fov: lerp(from.fov, WALK_FOV, e), near: lerp(from.near, end.near, smooth(0, 0.6, e)) };
    } else {
      const orbit = scene.getOrbitPose();
      const eye = bezier(from.eye, [0, EYE, -0.6], [orbit.eye[0] * 0.3, 2.2, 6], orbit.eye, e);
      const target = lerp3(from.target, orbit.target, smooth(0.25, 1, e));
      pose = { eye, target, fov: lerp(from.fov, orbit.fov, e), near: lerp(from.near, orbit.near, smooth(0.4, 1, e)) };
    }
    if (tr.t >= 1) {
      transition = null;
      if (tr.kind === "enter") {
        opts.onControl();
      } else {
        finish();
        opts.onExit();
      }
    }
  }

  function tickWalk(dt: number) {
    const k = (code: string) => (keys.has(code) ? 1 : 0);
    const forward = paused ? 0 : k("KeyW") + k("ArrowUp") - k("KeyS") - k("ArrowDown") + virtual.forward;
    const strafe = paused ? 0 : k("KeyD") - k("KeyA");
    const turn = paused ? 0 : k("ArrowRight") - k("ArrowLeft") + virtual.turn;
    const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 4.2 : 2.6;

    aimYaw -= turn * 2.1 * dt;
    const ease = opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 18);
    yaw += (aimYaw - yaw) * ease;
    pitch += (aimPitch - pitch) * ease;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let wx = fx * forward + rx * strafe;
    let wz = fz * forward + rz * strafe;
    const len = Math.hypot(wx, wz);
    if (len > 1) {
      wx /= len;
      wz /= len;
    }
    const a = 1 - Math.exp(-dt * 12);
    velX += (wx * speed - velX) * a;
    velZ += (wz * speed - velZ) * a;

    // Axis-separated moves let you slide along shelves instead of sticking to them
    const nx = pos[0] + velX * dt;
    if (!blocked(nx, pos[2])) pos[0] = nx;
    else velX = 0;
    const nz = pos[2] + velZ * dt;
    if (!blocked(pos[0], nz)) pos[2] = nz;
    else velZ = 0;
    stride += Math.hypot(velX, velZ) * dt;

    // Walking up to the doors means leaving
    if (pos[2] > -0.4 && Math.abs(pos[0]) < 1.1 && velZ > 0.3) {
      exit();
      return;
    }

    const lookX = -Math.sin(yaw), lookZ = -Math.cos(yaw);
    const spot = INTERACTIONS.find(
      (i) => inZone(i.zone, pos[0], pos[2]) && lookX * i.facing[0] + lookZ * i.facing[1] > 0.5,
    );
    setPrompt(spot?.id ?? null);
    pose = walkPose();
  }

  const tick = (dt: number) => {
    flying = transition !== null;
    if (!flying && pendingArt) {
      pendingArt.refreshExtraArt();
      pendingArt = null;
    }
    if (transition) tickTransition(transition, dt);
    else tickWalk(dt);

    // Automatic doors: open while the camera is near them
    const near = Math.abs(pose.eye[0]) < 2.2 && pose.eye[2] > -2.2 && pose.eye[2] < 4;
    door += ((near ? 1 : 0) - door) * (opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
    scene.setDoor(door);
    scene.setCamera(pose);
  };

  // ── Input ─────────────────────────────────────────────────────────────────
  const MOVE_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"];
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === "Escape") {
      exit();
      return;
    }
    if (transition || paused) return;
    if (MOVE_KEYS.includes(e.code)) {
      keys.add(e.code);
      e.preventDefault();
    } else if ((e.code === "KeyE" || e.code === "Enter" || e.code === "Space") && !e.repeat) {
      e.preventDefault();
      handle.interact();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
  const onBlur = () => keys.clear();

  let drag: { x: number; y: number; id: number } | null = null;
  const onPointerDown = (e: PointerEvent) => {
    if (transition) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId || paused) return;
    aimYaw -= (e.clientX - drag.x) * 0.005;
    aimPitch = Math.min(Math.max(aimPitch - (e.clientY - drag.y) * 0.004, -0.9), 0.9);
    drag.x = e.clientX;
    drag.y = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (drag?.id === e.pointerId) drag = null;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  scene.setTicker(tick);
  function finish() {
    stopAmbience();
    flying = false;
    if (pendingArt) {
      pendingArt.refreshExtraArt();
      pendingArt = null;
    }
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    scene.setTicker(null);
    scene.setCamera(null);
    scene.setDoor(0);
    scene.setReflection(true);
  }

  const handle: WalkHandle = {
    interact() {
      if (prompt && !transition && !paused) opts.onInteract(prompt);
    },
    exit,
    setPaused(value) {
      paused = value;
      keys.clear();
    },
    setVirtual(forward, turn) {
      virtual.forward = forward;
      virtual.turn = turn;
    },
    destroy: finish,
  };
  return handle;
}
