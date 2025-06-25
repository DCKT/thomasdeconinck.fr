import Link from "next/link";
import { formatDate, getBlogPosts } from "app/blog/utils";

type BlogPostsProps = {
  limit?: number;
};
export function BlogPosts(props: BlogPostsProps) {
  let allBlogs = getBlogPosts();

  return (
    <div>
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1;
          }
          return 1;
        })
        .slice(0, props.limit ?? allBlogs.length)
        .map((post) => (
          <Link
            key={post.slug}
            className="flex flex-col space-y-1 mb-4 hover:underline"
            href={`/blog/${post.slug}`}
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
  );
}
