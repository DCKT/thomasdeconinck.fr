import { formatDate, getPixelArtPosts } from "app/blog/utils";
import Link from "next/link";

export const metadata = {
  title: "Pixel art",
  description: "Place where I put some of my pixel art projects",
};

export default function Page() {
  let allBlogs = getPixelArtPosts();
  return (
    <section>
      <h1 className="font-semibold text-4xl mb-8 font-title">Pixel art</h1>
      <div>
        {allBlogs
          .sort((a, b) => {
            if (
              new Date(a.metadata.publishedAt) >
              new Date(b.metadata.publishedAt)
            ) {
              return -1;
            }
            return 1;
          })
          .map((post) => (
            <Link
              key={post.slug}
              className="flex flex-col space-y-1 mb-4 hover:underline"
              href={`/pixel-art/${post.slug}`}
            >
              <div className="w-full flex flex-col md:grid md:grid-cols-3 space-x-0 md:space-x-2">
                <p className="text-neutral-600 tabular-nums">
                  {formatDate(post.metadata.publishedAt, false)}
                </p>
                <p className="text-neutral-900 col-span-2 tracking-tight">
                  {post.metadata.title}
                </p>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
