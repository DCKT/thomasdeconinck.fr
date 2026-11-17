import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { KOMGA_TAG } from "app/lib/komga";
import { STEAM_TAG } from "app/lib/steam";

const TAGS = [KOMGA_TAG, STEAM_TAG];

function authorized(request: Request) {
  const expected = process.env.NEXT_REVALIDATE_TOKEN;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = new TextEncoder().encode(given), b = new TextEncoder().encode(expected ?? "");
  // constant-time comparison, so the token can't be guessed byte by byte
  return Boolean(expected) && a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Refreshes the konbini's external data right away (otherwise: Komga hourly, Steam daily).
 *   curl -X POST -H "Authorization: Bearer $NEXT_REVALIDATE_TOKEN" https://…/api/revalidate?tag=komga
 * Without ?tag, everything is refreshed.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const tag = new URL(request.url).searchParams.get("tag");
  if (tag && !TAGS.includes(tag)) return Response.json({ error: `Unknown tag, use one of: ${TAGS.join(", ")}` }, { status: 400 });
  const tags = tag ? [tag] : TAGS;
  // expire: 0 → the next visit fetches fresh data instead of serving the stale copy once more
  for (const t of tags) revalidateTag(t, { expire: 0 });
  return Response.json({ revalidated: tags, at: new Date().toISOString() });
}
