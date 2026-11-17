import "server-only";

/**
 * Komga (self-hosted manga server), server side only.
 *   NEXT_KOMGA_URL     → e.g. https://komga.example.com (must be reachable from the server / Vercel)
 *   NEXT_KOMGA_API_KEY → Komga ▸ Account settings ▸ API keys (sent as X-API-Key)
 *   NEXT_KOMGA_TAG     → the series tag to put on the shelf (default "konbini")
 * Results are cached for an hour, under the "komga" cache tag: POST /api/revalidate
 * refreshes them immediately (see app/api/revalidate/route.ts).
 */
const BASE = process.env.NEXT_KOMGA_URL?.replace(/\/+$/, "");
const KEY = process.env.NEXT_KOMGA_API_KEY;
const TAG = process.env.NEXT_KOMGA_TAG || "konbini";
const HOUR = 60 * 60;
export const KOMGA_TAG = "komga";
const MAX = 18;
/** "Authors" that are really tools which wrote the file metadata (e.g. Kindle Comic Converter). */
const NOT_AUTHORS = new Set(["kcc", "kindle comic converter", "calibre"]);

export type MangaItem = {
  id: string;
  title: string;
  authors: string[];
  volumes: number;
  read: number;
  status: string;
  year?: number;
  summary?: string;
};

type Series = {
  id: string;
  name: string;
  booksCount: number;
  booksReadCount: number;
  metadata: { title?: string; titleSort?: string; status?: string; summary?: string };
  booksMetadata: { authors?: { name: string; role: string }[]; releaseDate?: string | null; summary?: string };
};

const headers = (accept: string) => ({ "X-API-Key": KEY!, Accept: accept });

/** Series tagged NEXT_KOMGA_TAG, alphabetical. Empty when Komga is not configured or unreachable. */
export async function getMangaShelf(): Promise<MangaItem[]> {
  if (!BASE || !KEY) return [];
  try {
    const res = await fetch(`${BASE}/api/v1/series/list?unpaged=true`, {
      method: "POST",
      headers: { ...headers("application/json"), "Content-Type": "application/json" },
      body: JSON.stringify({ condition: { allOf: [{ tag: { operator: "is", value: TAG } }] } }),
      next: { revalidate: HOUR, tags: [KOMGA_TAG] },
    });
    if (!res.ok) return [];
    const page = (await res.json()) as { content: Series[] };
    return page.content
      .map((s): MangaItem => {
        const authors = (s.booksMetadata.authors ?? []).filter((a) => !NOT_AUTHORS.has(a.name.trim().toLowerCase()));
        const writers = authors.filter((a) => a.role === "writer");
        return {
          id: s.id,
          title: s.metadata.title || s.name,
          authors: Array.from(new Set((writers.length ? writers : authors).map((a) => a.name))).slice(0, 2),
          volumes: s.booksCount,
          read: s.booksReadCount,
          status: s.metadata.status ?? "",
          year: s.booksMetadata.releaseDate ? Number(s.booksMetadata.releaseDate.slice(0, 4)) : undefined,
          summary: (s.metadata.summary || s.booksMetadata.summary || "").slice(0, 220) || undefined,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

/** The series cover, only for series that are on the shelf (never an open proxy to the library). */
export async function getMangaCover(id: string): Promise<ArrayBuffer | null> {
  if (!BASE || !KEY || !/^[A-Za-z0-9]+$/.test(id)) return null;
  const shelf = await getMangaShelf();
  if (!shelf.some((m) => m.id === id)) return null;
  try {
    // The thumbnail endpoint only produces JPEG: asking for JSON gets a 406
    const res = await fetch(`${BASE}/api/v1/series/${id}/thumbnail`, {
      headers: headers("image/jpeg"),
      next: { revalidate: HOUR, tags: [KOMGA_TAG] },
    });
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}
