/**
 * Manhole cover cards, sold in booster packs at the counter. Data and rules only:
 * the set, the rarities, how a pack is filled and the binder kept in localStorage.
 *
 * Photos: Wikimedia Commons and Flickr (see public/cards/manhole/CREDITS.md), cropped square,
 * except the "no derivatives" ones, which are only letterboxed.
 */

// ── Rarity ──────────────────────────────────────────────────────────────────
export type CardRarityId = "C" | "U" | "R" | "HR" | "SR";

export type CardRarity = {
  id: CardRarityId;
  label: string;
  jp: string;
  /** Printed in the corner of the card, as on the real thing. */
  symbol: string;
};

export const CARD_RARITIES: Record<CardRarityId, CardRarity> = {
  C: { id: "C", label: "Common", jp: "コモン", symbol: "●" },
  U: { id: "U", label: "Uncommon", jp: "アンコモン", symbol: "◆" },
  R: { id: "R", label: "Rare", jp: "レア", symbol: "★" },
  HR: { id: "HR", label: "Holo rare", jp: "ホロレア", symbol: "★" },
  SR: { id: "SR", label: "Secret rare", jp: "シークレット", symbol: "★★" },
};
export const RARITY_ORDER: CardRarityId[] = ["C", "U", "R", "HR", "SR"];

// ── The set ─────────────────────────────────────────────────────────────────
/** What the cover shows: it picks the colour of the card frame. */
export type CardKind = "castle" | "flower" | "festival" | "sea" | "town" | "nature" | "collab";
export const CARD_KINDS: Record<CardKind, { jp: string; label: string }> = {
  castle: { jp: "城", label: "Castle" },
  flower: { jp: "花", label: "Flower" },
  festival: { jp: "祭", label: "Festival" },
  sea: { jp: "海", label: "Sea" },
  town: { jp: "町", label: "Town" },
  nature: { jp: "山", label: "Nature" },
  collab: { jp: "協", label: "Collab" },
};

export type Card = {
  /** Number in the set, from 1. */
  no: number;
  slug: string;
  name: string;
  jp: string;
  prefecture: string;
  kind: CardKind;
  rarity: CardRarityId;
  text: string;
  image: string;
  /** Attribution of the photo. */
  author: string;
  license: string;
  source: string;
  /** False for "no derivatives" photos, shown whole on a dark background. */
  cropped: boolean;
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;

type Row = [
  slug: string,
  name: string,
  jp: string,
  prefecture: string,
  kind: CardKind,
  text: string,
  author: string,
  license: string,
  /** A Commons file name, or the full URL of the photo page. */
  file: string,
];

/** Listed in set order: commons first, the secret rares last. */
const SET: Record<CardRarityId, Row[]> = {
  C: [
    ["himeji-castle", "Himeji", "姫路市", "Hyōgo", "castle", "Himeji Castle, the White Heron, cast in iron.", "Pierre5018", "CC BY 4.0", "Couvercle à Himeji, Japon, 2024-04 (1).jpg"],
    ["himeji-herons", "Himeji", "姫路市", "Hyōgo", "nature", "White herons, the city bird, skimming over the reeds.", "Pierre5018", "CC BY 4.0", "Couvercle à Himeji, Japon, 2024-04 (2).jpg"],
    ["akita", "Akita", "秋田市", "Akita", "festival", "Kantō festival: bamboo poles hung with dozens of paper lanterns.", "掬茶", "CC BY-SA 3.0", "Manhole cover in Akita, Akita.jpg"],
    ["nagaizumi", "Nagaizumi", "長泉町", "Shizuoka", "nature", "Mount Fuji, a waterfall and blossoms: the whole town on one lid.", "Halowand", "CC BY-SA 4.0", "Manhole cover of Nagaizumi, Shizuoka.jpg"],
    ["tsuruga", "Tsuruga", "敦賀市", "Fukui", "sea", "Old pines leaning over Tsuruga Bay.", "rumpleteaser", "CC BY 2.0", "Manhole Cover Tsuruga (6062576592).jpg"],
    ["matsuyama-camellia", "Matsuyama", "松山市", "Ehime", "flower", "Camellia, the city flower, in its quieter colours.", "VKaeru", "CC BY-SA 3.0", "Manhole flowers Matsuyama.jpg"],
    ["owase", "Owase", "尾鷲市", "Mie", "sea", "“Clean Owase”: three panels for a port town's emblems.", "VKaeru", "CC BY-SA 3.0", "Manhole Owase.jpg"],
    ["sasayama", "Sasayama", "篠山", "Hyōgo", "nature", "Lilies below the hills of Tamba.", "VKaeru", "CC BY-SA 3.0", "Manhole Sasayama.jpg"],
    ["uwajima-bulls", "Uwajima", "宇和島市", "Ehime", "festival", "Tōgyū, bull sumo: bull against bull, no matador.", "VKaeru", "CC BY-SA 3.0", "Manhole Uwajima.jpg"],
    ["nagano", "Nagano", "長野市", "Nagano", "flower", "Apples and apple blossoms. “SEWERAGE”, it says, proudly.", "nan_says", "CC BY 2.0", "Nagano manhole cover; April 2009.jpg"],
  ],
  U: [
    ["yoshinogari", "Yoshinogari", "吉野ヶ里町", "Saga", "castle", "Watchtowers and stilt houses of the Yayoi-era settlement.", "Pierre5018", "CC BY 4.0", "Couvercle à Yoshinogari, Japon, 2024-04.jpg"],
    ["yokote", "Yokote", "横手市", "Akita", "festival", "Kamakura snow huts glowing under Yokote Castle.", "掬茶", "CC BY-SA 3.0", "Manhole cover in Yokote, Akita.jpg"],
    ["hodogaya", "Yokohama · Hodogaya", "横浜市保土ケ谷区", "Kanagawa", "town", "Ekiden runners racing through the old Tōkaidō post town.", "Thirteen-fri", "CC BY-SA 3.0", "Manhole covers in Yokohama.jpg"],
    ["furusato-mura", "Akita Furusato-mura", "秋田ふるさと村", "Akita", "town", "The theme park's mascot, dashing across the lid.", "掬茶", "CC BY-SA 3.0", "Manhole cover in Akita Furusato-mura.jpg"],
    ["itoigawa", "Itoigawa", "糸魚川市", "Niigata", "flower", "A wreath of red blossoms around the city crest.", "そらみみ", "CC BY-SA 4.0", "Manhole cover of Itoigawa, Niigata.jpg"],
    ["matsuyama", "Matsuyama", "松山市", "Ehime", "flower", "“Let's all build a Matsuyama that is good to live in.”", "VKaeru", "CC BY-SA 3.0", "Manhole flowers Matsuyama 2.jpg"],
    ["ogori", "Yamaguchi · Ogōri", "山口市小郡", "Yamaguchi", "town", "A steam locomotive puffing under the cherry blossoms.", "Yamaguchi Yoshiaki", "CC BY-SA 2.0", "SLマンホール (2252804806).jpg"],
  ],
  R: [
    ["beppu", "Beppu", "別府市", "Ōita", "flower", "“Flower City”: azaleas ringed with bamboo.", "Pierre5018", "CC BY 4.0", "Couvercle à Beppu, Japon, 2024-05.jpg"],
    ["uwajima-ushioni", "Uwajima", "宇和島市", "Ehime", "festival", "Ushi-oni, the ox demon paraded through the summer festival.", "VKaeru", "CC BY-SA 3.0", "Manhole Uwajima 4.jpg"],
    ["tottori", "Tottori", "鳥取市", "Tottori", "festival", "Shan-shan festival: umbrellas trimmed with bells, spinning.", "㭍月例祭", "Public domain", "Shanshan manhall.jpg"],
    ["yuzawa", "Yuzawa", "湯沢市", "Akita", "festival", "The poet Ono no Komachi, a daimyō procession and an Akita dog.", "掬茶", "CC BY-SA 3.0", "Manhole cover in Yuzawa, Akita.jpg"],
    ["nakatsu", "Nakatsu", "中津市", "Ōita", "castle", "Nakatsu Castle above its moat.", "VKaeru", "CC BY-SA 3.0", "Manhole Nakatsu.jpg"],
    ["abashiri", "Abashiri", "網走", "Hokkaidō", "town", "The red-brick Hokkaidō Government Office, with snowflakes.", "VKaeru", "CC BY-SA 3.0", "Manhole Hokkaido.jpg"],
  ],
  HR: [
    ["kodaira", "Kodaira", "小平市", "Tōkyō", "town", "Zelkova trees, rooftops, and Mount Fuji on the horizon.", "chidorian", "CC BY-SA 2.0", "Kodaira manhole.jpg"],
    ["kumamoto", "Kumamoto", "熊本市", "Kumamoto", "flower", "Higo camellia, the city flower, in full red.", "そらみみ", "CC BY-SA 4.0", "Manhole cover of Kumamoto, Kumamoto.jpg"],
    ["matsumoto", "Matsumoto", "松本市", "Nagano", "festival", "Temari: handballs wound in silk thread, the city's craft.", "HAL-Guandu", "CC BY-SA 4.0", "Manhole-cover-matsumoto-colour.jpg"],
    ["osaka", "Ōsaka", "大阪市", "Ōsaka", "castle", "Ōsaka Castle among cherry blossoms and waves.", "Mo13Jan", "CC0", "Osaka Suminoeku Manhole Cover.jpg"],
    ["entei-ikaruga", "Ikaruga · Entei", "斑鳩町", "Nara", "collab", "Poké Lid: Entei, on the path to Hōryū-ji. ©Pokémon", "jpellgen", "CC BY-NC-ND 2.0", "https://www.flickr.com/photos/jpellgen/53230779795"],
    ["pichu-kyoto", "Kyōto · Pichu", "京都市", "Kyōto", "collab", "Poké Lid: Pichu, Igglybuff and Cleffa under the Maruyama Park cherry tree. ©Pokémon", "Sergiy Galyonkin", "CC BY-SA 2.0", "https://www.flickr.com/photos/sergesegal/54149078570"],
    ["expo-2025", "Ōsaka · Expo 2025", "大阪・関西万博", "Ōsaka", "collab", "Myaku-Myaku, the Expo mascot, all eyes and red cells.", "dlovins99", "CC0", "https://www.flickr.com/photos/eosuchian/54249319575"],
  ],
  SR: [
    ["hakodate", "Hakodate", "函館市", "Hokkaidō", "sea", "Three dancing squid. The city fish is, of course, the squid.", "Mo13Jan", "CC0", "Hakodate Squid Manhole Cover.jpg"],
    ["tokorozawa", "Tokorozawa", "所沢市", "Saitama", "town", "A 1910s Farman III biplane over Japan's first airfield.", "tokoro koko · design: Tokorozawa City", "CC BY-SA 3.0", "Manhole cover Tokorozawa colored.jpg"],
    ["pikachu-nintendo-museum", "Uji · Pikachu", "宇治市", "Kyōto", "collab", "Poké Lid: Pikachu bursting out of a Game Boy, at the Nintendo Museum. ©Pokémon", "jpellgen", "CC BY-NC-ND 2.0", "https://www.flickr.com/photos/jpellgen/54161450277"],
    ["gundam-odawara", "Odawara · Gundam", "小田原市", "Kanagawa", "collab", "RX-78-2 Gundam standing guard by Odawara Castle. ©Sotsu·Sunrise", "jpellgen", "CC BY-NC-ND 2.0", "https://www.flickr.com/photos/jpellgen/53223939344"],
  ],
};

export const CARDS: Card[] = RARITY_ORDER.flatMap((rarity) => SET[rarity].map((row) => ({ row, rarity }))).map(
  ({ row: [slug, name, jp, prefecture, kind, text, author, license, file], rarity }, i) => ({
    no: i + 1,
    slug,
    name,
    jp,
    prefecture,
    kind,
    rarity,
    text,
    image: `/cards/manhole/${slug}.jpg`,
    author,
    license,
    source: file.startsWith("https://") ? file : commons(file),
    cropped: !license.includes("ND"),
  }),
);

export const cardNumber = (card: Card) => `${String(card.no).padStart(3, "0")}/${String(CARDS.length).padStart(3, "0")}`;

// ── Boosters ────────────────────────────────────────────────────────────────
/** One card as pulled: `foil` is a reverse holo (the frame shines instead of the picture). */
export type Pulled = { card: Card; foil: boolean };

export const PACK = {
  size: 5,
  commons: 3,
  /** The last card of a pack is always rare or better. */
  rareSlot: [
    { rarity: "R", weight: 68 },
    { rarity: "HR", weight: 26 },
    { rarity: "SR", weight: 6 },
  ] as { rarity: CardRarityId; weight: number }[],
  /** Chance that the uncommon comes as a reverse holo. */
  reverseHolo: 0.25,
  price: 0,
} as const;

const SLOT_TOTAL = PACK.rareSlot.reduce((n, s) => n + s.weight, 0);
export const slotOdds = (weight: number) => `${Math.round((weight / SLOT_TOTAL) * 100)}%`;

const byRarity = (rarity: CardRarityId) => CARDS.filter((c) => c.rarity === rarity);

function draw<T>(pool: T[], count: number, random: () => number): T[] {
  const left = [...pool];
  const out: T[] = [];
  while (out.length < count && left.length) out.push(left.splice(Math.floor(random() * left.length), 1)[0]);
  return out;
}

/** Fills a pack in the order it is revealed: commons, the uncommon, then the rare slot. */
export function openPack(random = Math.random, forced?: CardRarityId): Pulled[] {
  let rarity = forced;
  if (!rarity || !PACK.rareSlot.some((s) => s.rarity === rarity)) {
    let n = random() * SLOT_TOTAL;
    rarity = PACK.rareSlot.find((s) => (n -= s.weight) < 0)?.rarity ?? "R";
  }
  return [
    ...draw(byRarity("C"), PACK.commons, random).map((card) => ({ card, foil: false })),
    ...draw(byRarity("U"), 1, random).map((card) => ({ card, foil: random() < PACK.reverseHolo })),
    ...draw(byRarity(rarity), 1, random).map((card) => ({ card, foil: false })),
  ];
}

/** Does the picture (or, for a reverse holo, the frame) shine? */
export const isShiny = ({ card, foil }: Pulled) => foil || card.rarity === "HR" || card.rarity === "SR";

// ── Binder ──────────────────────────────────────────────────────────────────
/** Per card slug: how many regular copies, how many reverse holos. */
export type Binder = { packs: number; cards: Record<string, [regular: number, foil: number]> };

const STORAGE_KEY = "konbini:manhole-cards";
const EMPTY: Binder = { packs: 0, cards: {} };

export function loadBinder(): Binder {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw || typeof raw !== "object" || typeof raw.cards !== "object" || !raw.cards) return EMPTY;
    const cards: Binder["cards"] = {};
    for (const card of CARDS) {
      const entry = raw.cards[card.slug];
      if (Array.isArray(entry)) cards[card.slug] = [Number(entry[0]) || 0, Number(entry[1]) || 0];
    }
    return { packs: Number(raw.packs) || 0, cards };
  } catch {
    return EMPTY;
  }
}

export function saveBinder(binder: Binder) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(binder));
  } catch {
    // Private mode or a full disk: the binder just lasts for this visit
  }
}

export function addPack(binder: Binder, pulls: Pulled[]): Binder {
  const cards = { ...binder.cards };
  for (const { card, foil } of pulls) {
    const [regular, shiny] = cards[card.slug] ?? [0, 0];
    cards[card.slug] = foil ? [regular, shiny + 1] : [regular + 1, shiny];
  }
  return { packs: binder.packs + 1, cards };
}

export const owned = (binder: Binder, card: Card) => {
  const [regular, foil] = binder.cards[card.slug] ?? [0, 0];
  return regular + foil;
};
export const ownedCount = (binder: Binder) => CARDS.filter((card) => owned(binder, card) > 0).length;
