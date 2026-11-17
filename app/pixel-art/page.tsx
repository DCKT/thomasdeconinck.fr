import { PixelArtPosts } from "app/components/posts";
import { PageHead } from "app/components/page-head";

export const metadata = {
  title: "Pixel art",
  description: "Place where I put some of my pixel art projects",
};

export default function Page() {
  return (
    <main className="page">
      <PageHead jp="ガチャコーナー · Capsule toys" title="Pixel Art">
        Place where I put some of my pixel art projects.
      </PageHead>
      <PixelArtPosts />
    </main>
  );
}
