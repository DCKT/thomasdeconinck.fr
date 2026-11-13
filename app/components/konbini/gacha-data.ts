/**
 * The gachapon bank on the sidewalk: where it stands, what each machine sells and
 * what comes out. Shared by the world builder, the atlas painter, the camera
 * controller and the HUD, so it holds data only.
 */

/** Machines are stacked `cols` × `rows`, facing the street (+z). World units. */
export const GACHA = {
  cols: 3,
  rows: 2,
  /** Left edge of the bank, bottom of the lowest machines, front faces. */
  x0: 4.19,
  y0: 0.22,
  front: 0.67,
  /** Pitch of one machine. */
  w: 0.54,
  h: 0.82,
  depth: 0.44,
} as const;

export const GACHA_COUNT = GACHA.cols * GACHA.rows;
/** The one the "Turn the handle" button uses until a machine is clicked: top row, centre. */
export const DEFAULT_MACHINE = 4;

/** Bottom-centre of machine `i` (row 0 is the bottom row). */
export function machineBase(i: number) {
  return {
    x: GACHA.x0 + ((i % GACHA.cols) + 0.5) * GACHA.w,
    y: GACHA.y0 + Math.floor(i / GACHA.cols) * GACHA.h,
  };
}

/** One capsule series per machine: the display card artwork and the machine's trim. */
export const GACHA_SERIES = [
  { jp: "ドットフルーツ", en: "PIXEL FRUITS", color: 0xe63946, dark: 0x9d0208 },
  { jp: "ねこだらけ", en: "CAT CLUB", color: 0xffb703, dark: 0xe85d04 },
  { jp: "レトロゲーム", en: "RETRO GAMES", color: 0x4cc9f0, dark: 0x3a0ca3 },
  { jp: "おにぎり", en: "ONIGIRI PALS", color: 0x52b788, dark: 0x1b4332 },
  { jp: "コンビニ", en: "KONBINI MINI", color: 0xf72585, dark: 0x7209b7 },
  { jp: "キーキャップ", en: "KEYCAPS", color: 0x9d4edd, dark: 0x3c096c },
] as const;

// ── Rarity ──────────────────────────────────────────────────────────────────
export type RarityId = "B" | "A" | "S" | "SSS";

export type Rarity = {
  id: RarityId;
  label: string;
  jp: string;
  /** Relative odds: the chances are weight / sum of weights. */
  weight: number;
  /** How long the capsule rattles before it pops (ms): the rarer, the longer the suspense. */
  suspense: number;
  /** Sparkles thrown out when it opens. */
  sparkles: number;
};

export const RARITIES: Rarity[] = [
  { id: "B", label: "Common", jp: "ノーマル", weight: 60, suspense: 420, sparkles: 0 },
  { id: "A", label: "Rare", jp: "レア", weight: 27, suspense: 650, sparkles: 8 },
  { id: "S", label: "Super rare", jp: "スーパーレア", weight: 10, suspense: 1000, sparkles: 16 },
  { id: "SSS", label: "Legendary", jp: "伝説", weight: 3, suspense: 1700, sparkles: 28 },
];

const TOTAL_WEIGHT = RARITIES.reduce((n, r) => n + r.weight, 0);
export const odds = (r: Rarity) => `${Math.round((r.weight / TOTAL_WEIGHT) * 100)}%`;

export function rollRarity(random = Math.random): Rarity {
  let n = random() * TOTAL_WEIGHT;
  for (const rarity of RARITIES) {
    n -= rarity.weight;
    if (n < 0) return rarity;
  }
  return RARITIES[0];
}

// ── Prizes ──────────────────────────────────────────────────────────────────
export type Prize = { name: string; image: string };

/** Placeholder prizes (the pixel art already on the site), until the real content is decided. */
export const PRIZES: Record<RarityId, Prize[]> = {
  B: [
    { name: "Strawberry", image: "/2025-06-25-fruits/Fraise.png" },
    { name: "Cherry", image: "/2025-06-25-fruits/Cerise.png" },
    { name: "Apple", image: "/2025-06-25-fruits/Pomme.png" },
    { name: "Banana", image: "/2025-06-25-fruits/Banane.png" },
    { name: "Lemon", image: "/2025-06-25-fruits/Citron.png" },
    { name: "Orange", image: "/2025-06-25-fruits/Orange.png" },
  ],
  A: [
    { name: "Watermelon", image: "/2025-06-25-fruits/Pasteque.png" },
    { name: "Grapes", image: "/2025-06-25-fruits/Raisin.png" },
  ],
  S: [{ name: "Game Boy Advance SP", image: "/2025-06-30-gba-sp/GBA.png" }],
  SSS: [{ name: "Totoro", image: "/2025-06-28-another-character-attempt/Totoro.png" }],
};

export function pickPrize(rarity: RarityId, random = Math.random): Prize {
  const pool = PRIZES[rarity];
  return pool[Math.floor(random() * pool.length)];
}

/** Colours a capsule's lid can have. Deliberately unrelated to what is inside. */
export const CAPSULE_COLORS = ["#e63946", "#f4a261", "#ffd166", "#2a9d8f", "#4cc9f0", "#f72585", "#8ac926", "#9d4edd"];
