import type { IconName } from "app/components/konbini/pixel-icons";

/**
 * Games on the konbini's game shelf (walk mode), shown as cartridges.
 * Up to 8 get a printed label; edit freely. When the game is in your Steam library
 * (matched by title, or by `steamAppId`), its cover becomes a pixelated label and
 * your playtime is shown. The shelf is then topped up with your most played Steam games.
 *   icon / palette → generated pixel-art label: [primary, secondary] colours
 *   shell / label  → cartridge plastic + sticker colours
 *   image          → optional: your own pixel-art label instead (e.g. "/games/celeste.png")
 */
export type FavoriteGame = {
  title: string;
  platform: string;
  year?: number;
  note?: string;
  icon: IconName;
  palette: [string, string];
  shell: string;
  label: string;
  image?: string;
  steamAppId?: number;
};

export const FAVORITE_GAMES: FavoriteGame[] = [
  {
    title: "Cuphead",
    platform: "PC · Switch · consoles",
    year: 2017,
    note: "The 1930s cartoon look that inspired the previous version of this site.",
    icon: "cup",
    palette: ["#d62828", "#3a3a3a"],
    shell: "#e8e2d0",
    label: "#f4e8d0",
  },
  {
    title: "MOUSE: P.I. For Hire",
    platform: "PC · consoles",
    note: "Rubber-hose noir. Same love for old cartoons.",
    icon: "magnifier",
    palette: ["#2a1810", "#c0392b"],
    shell: "#3a3d45",
    label: "#d4a84b",
  },
];
