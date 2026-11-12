import "server-only";
import { FAVORITE_GAMES, HIDDEN_STEAM_GAMES, type FavoriteGame } from "./favorite-games";
import type { IconName } from "app/components/konbini/pixel-icons";

/**
 * Steam Web API, server side only: the key never reaches the browser.
 *   NEXT_STEAM_API_KEY → https://steamcommunity.com/dev/apikey
 *   NEXT_STEAM_ID      → your SteamID64 (17 digits) or your custom profile URL name
 * Your profile's "Game details" must be public. Results are cached for a day.
 */
const KEY = process.env.NEXT_STEAM_API_KEY;
const ID = process.env.NEXT_STEAM_ID;
const DAY = 60 * 60 * 24;
const API = "https://api.steampowered.com";
const CDN = "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps";

/** What the konbini shelf needs for one game. Serializable: it is passed to the client. */
export type ShelfGame = Omit<FavoriteGame, "steamAppId"> & {
  /** Cover candidates, best first (tall library art, then the store header). */
  covers?: string[];
  hours?: number;
  storeUrl?: string;
};

type OwnedGame = { appid: number; name: string; playtime_forever: number; rtime_last_played?: number };

async function steam<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const query = new URLSearchParams({ key: KEY!, format: "json", ...params });
  try {
    const res = await fetch(`${API}/${path}?${query}`, { next: { revalidate: DAY } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

async function steamId(): Promise<string | null> {
  if (!ID) return null;
  if (/^\d{17}$/.test(ID)) return ID;
  const data = await steam<{ response: { success: number; steamid?: string } }>("ISteamUser/ResolveVanityURL/v1/", {
    vanityurl: ID,
  });
  return data?.response.success === 1 ? (data.response.steamid ?? null) : null;
}

async function ownedGames(): Promise<OwnedGame[]> {
  if (!KEY) return [];
  const id = await steamId();
  if (!id) return [];
  const data = await steam<{ response: { games?: OwnedGame[] } }>("IPlayerService/GetOwnedGames/v1/", {
    steamid: id,
    include_appinfo: "1",
    include_played_free_games: "1",
  });
  return data?.response.games ?? [];
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const ICONS: IconName[] = ["sword", "star", "heart", "ghost", "gem", "controller"];
const PALETTES: [string, string][] = [
  ["#e63946", "#1d3557"],
  ["#2a9d8f", "#264653"],
  ["#f4a261", "#6d2e46"],
  ["#4cc9f0", "#3a0ca3"],
  ["#8ac926", "#1b4332"],
  ["#ffd166", "#9c2a2a"],
];
const SHELLS = ["#3a3d45", "#8a8f98", "#d1d5db", "#4b5563"];

function fromSteam(game: OwnedGame): Pick<ShelfGame, "covers" | "hours" | "storeUrl"> {
  return {
    covers: [`${CDN}/${game.appid}/library_600x900.jpg`, `${CDN}/${game.appid}/header.jpg`],
    hours: Math.round(game.playtime_forever / 60),
    storeUrl: `https://store.steampowered.com/app/${game.appid}/`,
  };
}

/**
 * The games shelf: your hand-picked favourites first (enriched with Steam data when
 * you own them there), then topped up with your most played Steam games.
 */
export async function getShelfGames(limit = 8): Promise<ShelfGame[]> {
  const owned = await ownedGames();
  const byId = new Map(owned.map((g) => [g.appid, g]));
  const byName = new Map(owned.map((g) => [normalize(g.name), g]));
  const used = new Set<number>();
  const hidden = new Set(HIDDEN_STEAM_GAMES.map(normalize));

  const picked: ShelfGame[] = FAVORITE_GAMES.map(({ steamAppId, ...game }) => {
    const match = (steamAppId && byId.get(steamAppId)) || byName.get(normalize(game.title));
    if (!match) return game;
    used.add(match.appid);
    return { ...game, ...fromSteam(match) };
  });

  const mostPlayed = owned
    .filter((g) => !used.has(g.appid) && !hidden.has(normalize(g.name)) && g.playtime_forever >= 120)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, Math.max(0, limit - picked.length))
    .map((g, i): ShelfGame => ({
      title: g.name,
      platform: "Steam",
      icon: ICONS[g.appid % ICONS.length],
      palette: PALETTES[g.appid % PALETTES.length],
      shell: SHELLS[i % SHELLS.length],
      label: "#f5f5f2",
      ...fromSteam(g),
    }));

  return [...picked, ...mostPlayed].slice(0, limit);
}
