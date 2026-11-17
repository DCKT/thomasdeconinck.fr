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
export type PrizePool = Record<RarityId, Prize[]>;

/** Placeholder prizes (the pixel art already on the site), until each machine gets its own. */
const PLACEHOLDER: PrizePool = {
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

/** Images from knowyourmeme.com, cropped square. */
const meme = (file: string) => `/gacha/meme/${file}`;

/** Pepe common, Risitas rare, rage comics super rare, Doge & surprised Pikachu legendary. */
const MEMES: PrizePool = {
  B: [
    { name: "Feels Good Man", image: meme("pepe-feels-good.png") },
    { name: "Sad Frog", image: meme("pepe-sad.jpg") },
    { name: "Smug Pepe", image: meme("pepe-smug.jpg") },
    { name: "PepeHands", image: meme("pepe-hands.png") },
    { name: "REEEE", image: meme("pepe-reee.jpg") },
  ],
  A: [
    { name: "Issou", image: meme("risitas-issou.jpg") },
    { name: "El Risitas", image: meme("risitas-laugh.jpg") },
    { name: "Jajaja", image: meme("risitas-jajaja.jpg") },
  ],
  S: [
    { name: "Trollface", image: meme("rage-troll.jpg") },
    { name: "Forever Alone", image: meme("rage-forever-alone.jpg") },
    { name: "Y U NO", image: meme("rage-y-u-no.jpg") },
    { name: "Me Gusta", image: meme("rage-me-gusta.jpg") },
    { name: "Challenge Accepted", image: meme("rage-challenge-accepted.jpg") },
    { name: "FFFUUUU", image: meme("rage-fuuu.jpg") },
  ],
  SSS: [
    { name: "Doge", image: meme("doge.jpg") },
    { name: "Surprised Pikachu", image: meme("pikachu-surprised.png") },
  ],
};

const manga = (file: string) => `/gacha/manga/${file}.jpg`;

/** Series covers downloaded once from Komga (the same library as the comics shelf). */
const MANGA: PrizePool = {
  B: [
    { name: "Chainsaw Man", image: manga("chainsaw-man") },
    { name: "L'Atelier des sorciers", image: manga("atelier-des-sorciers") },
  ],
  A: [
    { name: "Hunter × Hunter", image: manga("hunter-x-hunter") },
    { name: "One-Punch Man", image: manga("one-punch-man") },
    { name: "Frieren", image: manga("frieren") },
  ],
  S: [
    { name: "Slam Dunk", image: manga("slam-dunk") },
    { name: "Noragami", image: manga("noragami") },
  ],
  SSS: [
    { name: "Berserk", image: manga("berserk") },
    { name: "Vagabond", image: manga("vagabond") },
  ],
};

/** Status cats from http.cat, kept landscape so the code and its caption stay readable. */
const httpCat = (code: number, name: string): Prize => ({ name: `${code} ${name}`, image: `/gacha/cat/${code}.jpg` });

/** Everyday codes common, client errors rare, server meltdowns super rare, the joke codes legendary. */
const CATS: PrizePool = {
  B: [
    httpCat(200, "OK"),
    httpCat(201, "Created"),
    httpCat(204, "No Content"),
    httpCat(301, "Moved Permanently"),
    httpCat(304, "Not Modified"),
    httpCat(400, "Bad Request"),
    httpCat(404, "Not Found"),
  ],
  A: [
    httpCat(401, "Unauthorized"),
    httpCat(403, "Forbidden"),
    httpCat(405, "Method Not Allowed"),
    httpCat(408, "Request Timeout"),
    httpCat(429, "Too Many Requests"),
  ],
  S: [
    httpCat(500, "Internal Server Error"),
    httpCat(502, "Bad Gateway"),
    httpCat(503, "Service Unavailable"),
    httpCat(504, "Gateway Timeout"),
    httpCat(508, "Loop Detected"),
  ],
  SSS: [httpCat(418, "I'm a Teapot"), httpCat(420, "Enhance Your Calm")],
};

/** One capsule series per machine: the display card artwork, the machine's trim and what is inside. */
export type Series = { jp: string; en: string; color: number; dark: number; prizes: PrizePool };

export const GACHA_SERIES: Series[] = [
  { jp: "ドットフルーツ", en: "PIXEL FRUITS", color: 0xe63946, dark: 0x9d0208, prizes: PLACEHOLDER },
  { jp: "ねこだらけ", en: "CAT CLUB", color: 0xffb703, dark: 0xe85d04, prizes: CATS },
  { jp: "レトロゲーム", en: "RETRO GAMES", color: 0x4cc9f0, dark: 0x3a0ca3, prizes: PLACEHOLDER },
  { jp: "おにぎり", en: "ONIGIRI PALS", color: 0x52b788, dark: 0x1b4332, prizes: PLACEHOLDER },
  { jp: "マンガ", en: "MANGA", color: 0xe5383b, dark: 0x1b1b1b, prizes: MANGA },
  { jp: "ミーム", en: "MEMES", color: 0x6a994e, dark: 0x283618, prizes: MEMES },
];

/** How many different prizes a machine holds (the "全N種" on its card). */
export const prizeCount = (series: Series) => Object.values(series.prizes).reduce((n, pool) => n + pool.length, 0);

export function pickPrize(machine: number, rarity: RarityId, random = Math.random): Prize {
  const pool = GACHA_SERIES[machine].prizes[rarity];
  return pool[Math.floor(random() * pool.length)];
}

/** Colours a capsule's lid can have. Deliberately unrelated to what is inside. */
export const CAPSULE_COLORS = ["#e63946", "#f4a261", "#ffd166", "#2a9d8f", "#4cc9f0", "#f72585", "#8ac926", "#9d4edd"];
