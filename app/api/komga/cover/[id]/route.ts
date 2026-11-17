import { getMangaCover } from "app/lib/komga";

/** Same-origin manga covers for the konbini's comics shelf (see app/lib/komga.ts). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cover = await getMangaCover(id);
  if (!cover) return new Response("Not found", { status: 404 });
  return new Response(cover, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
