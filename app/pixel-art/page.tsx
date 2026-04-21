import { formatDate, getPixelArtPosts } from "app/blog/utils";
import Link from "next/link";

export const metadata = {
  title: "Pixel art",
  description: "Place where I put some of my pixel art projects",
};

export default function Page() {
  let allPosts = getPixelArtPosts();
  return (
    <section>
      <div
        className="mb-8 px-5 py-4"
        style={{
          backgroundColor: "#d4a84b",
          border: "4px solid #2a1810",
          outline: "2px solid #c0392b",
          outlineOffset: "-8px",
          boxShadow: "5px 5px 0 #2a1810",
        }}
      >
        <h1
          className="text-4xl text-center"
          style={{
            fontFamily: "var(--font-display)",
            color: "#2a1810",
            letterSpacing: "0.08em",
          }}
        >
          Pixel Art
        </h1>
      </div>
      <div className="flex flex-col gap-3">
        {allPosts
          .sort((a, b) =>
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
              ? -1
              : 1
          )
          .map((post) => (
            <Link
              key={post.slug}
              href={`/pixel-art/${post.slug}`}
              className="block"
              style={{ textDecoration: "none" }}
            >
              <div className="vintage-card flex flex-col md:flex-row md:items-center gap-2 p-3">
                <span
                  className="text-xs font-bold px-2 py-0.5 shrink-0"
                  style={{
                    backgroundColor: "#c0392b",
                    color: "#f4e8d0",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {formatDate(post.metadata.publishedAt, false)}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#2a1810" }}>
                  {post.metadata.title}
                </span>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
