import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (req.headers.get("secret") !== process.env.NEXT_REVALIDATE_TOKEN) {
    return Response.json({ message: "Invalid token" }, { status: 401 });
  }

  const entity: any = await req.json();

  if (entity?.attributes?.slug) {
    revalidatePath(`/[locale]/blog`, "page");
    revalidatePath(`/fr/blog/${entity.attributes.slug.fr}`);
    revalidatePath(`/en/blog/${entity.attributes.slug.en}`);
    return Response.json({ revalidated: true, now: Date.now() });
  } else {
    return Response.json({
      revalidated: false,
      now: Date.now(),
      message: "Missing path to revalidate",
    });
  }
}
