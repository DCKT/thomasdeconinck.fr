import Link from "next/link";
import { formatDate, getBlogPosts } from "app/blog/utils";

type BlogPostsProps = {
  limit?: number;
};

export function BlogPosts(props: BlogPostsProps) {
  let allBlogs = getBlogPosts();

  return (
    <div className="flex flex-col gap-6">
      {allBlogs
        .sort((a, b) =>
          new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
            ? -1
            : 1,
        )
        .slice(0, props.limit ?? allBlogs.length)
        .map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block"
            style={{ textDecoration: "none" }}
          >
            <div className="vintage-card flex flex-col md:flex-row md:items-center gap-2 p-3">
              <span
                className="text-xs font-bold px-2 py-0.5 shrink-0 min-w-32 text-center"
                style={{
                  backgroundColor: "#c0392b",
                  color: "#f4e8d0",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.05em",
                  viewTransitionName: `post-date-${post.slug}`,
                }}
              >
                {formatDate(post.metadata.publishedAt, false)}
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color: "#2a1810",
                  viewTransitionName: `post-title-${post.slug}`,
                }}
              >
                {post.metadata.title}
              </span>
            </div>
          </Link>
        ))}
    </div>
  );
}
