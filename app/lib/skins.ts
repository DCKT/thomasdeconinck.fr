export type SkinId = "seven" | "lawson" | "famima";

type Band = [from: number, to: number, color: string];
type Word = [text: string, color: string];

export type Skin = {
  id: SkinId;
  label: string;
  /** Fascia sign artwork: background, horizontal bands (0..1 of height), wordmark. */
  sign: { bg: string; bands: Band[]; plate: string | null; words: Word[] };
  /** Three brand colours used on props (uniform, mats, banners…). */
  colors: [number, number, number];
  /** Colour of the light spilling out of the store (linear rgb multipliers). */
  light: [number, number, number];
  glow: number;
};

/**
 * Skins are colour schemes *inspired by* the big three konbini chains.
 * No logos or brand names are reproduced: the sign always reads "Thomas Mart".
 * The matching CSS variables live in global.css under [data-skin="…"].
 */
export const SKINS: Record<SkinId, Skin> = {
  seven: {
    id: "seven",
    label: "Orange, green & red stripes",
    sign: {
      bg: "#ffffff",
      bands: [
        [0.1, 0.3, "#f58220"],
        [0.4, 0.6, "#00a650"],
        [0.7, 0.9, "#ee1c25"],
      ],
      plate: "#ffffff",
      words: [
        ["THOMAS", "#ee1c25"],
        [" MART", "#00a650"],
      ],
    },
    colors: [0x00a650, 0xf58220, 0xee1c25],
    light: [1.0, 0.95, 0.84],
    glow: 0xffe2c0,
  },
  lawson: {
    id: "lawson",
    label: "Blue & white",
    sign: {
      bg: "#0068b7",
      bands: [
        [0, 0.07, "#ffffff"],
        [0.9, 1, "#e4007f"],
      ],
      plate: null,
      words: [["THOMAS MART", "#ffffff"]],
    },
    colors: [0x0068b7, 0xffffff, 0xe4007f],
    light: [0.8, 0.9, 1.0],
    glow: 0x9fd0ff,
  },
  famima: {
    id: "famima",
    label: "Green, white & blue",
    sign: {
      bg: "#ffffff",
      bands: [
        [0, 0.4, "#00a041"],
        [0.76, 1, "#0096d6"],
      ],
      plate: "#ffffff",
      words: [
        ["Thomas", "#0096d6"],
        ["Mart", "#00a041"],
      ],
    },
    colors: [0x00a041, 0x0096d6, 0xffffff],
    light: [0.86, 1.0, 0.92],
    glow: 0xb8ffd9,
  },
};

export const SKIN_IDS = Object.keys(SKINS) as SkinId[];
export const DEFAULT_SKIN: SkinId = "famima";
export const SKIN_EVENT = "skinchange";
export const MOTION_EVENT = "motionchange";

export function isSkin(value: unknown): value is SkinId {
  return typeof value === "string" && value in SKINS;
}

/** Where the "Click me" box floats: just above the sliding doors. */
export const DOOR_SPOT = { id: "door", pos: [0, 2.15, 0.25] } as const;

/** A place in the 3D store that links to a page. `pos` is in world units. */
export const SPOTS = [
  { id: "blog", href: "/blog", label: "Blog", jp: "雑誌", hint: "Magazine rack", pos: [-3.5, 2.05, 0.1] },
  { id: "pixel-art", href: "/pixel-art", label: "Pixel Art", jp: "ガチャ", hint: "Capsule toys", pos: [-7.1, 2.0, 0.4] },
  { id: "editor", href: "/pixel-editor", label: "Editor", jp: "コピー機", hint: "Copy machine", pos: [2.7, 1.75, -0.4] },
  { id: "games", href: "/games", label: "Games", jp: "自販機", hint: "Vending machines", pos: [7.5, 2.3, 0.4] },
  { id: "about", href: "/#about", label: "About", jp: "店長", hint: "The store manager", pos: [1.75, 0.8, 1.6] },
] as const satisfies readonly {
  id: string;
  href: string;
  label: string;
  jp: string;
  hint: string;
  pos: readonly [number, number, number];
}[];
