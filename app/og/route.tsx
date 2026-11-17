import { ImageResponse } from "next/og";

export function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "Thomas Deconinck";

  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full bg-white">
        <div tw="flex h-8 w-full" style={{ backgroundColor: "#00a041" }} />
        <div tw="flex h-3 w-full bg-white" />
        <div tw="flex h-6 w-full" style={{ backgroundColor: "#0096d6" }} />
        <div tw="flex flex-col flex-1 justify-between p-16">
          <div tw="flex text-3xl font-bold" style={{ color: "#00803a" }}>
            Thomas Mart · Open 24/7
          </div>
          <h2 tw="flex text-6xl font-bold tracking-tight text-left" style={{ color: "#15171c" }}>
            {title}
          </h2>
          <div tw="flex text-2xl" style={{ color: "#666c78" }}>
            thomasdeconinck.fr
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
