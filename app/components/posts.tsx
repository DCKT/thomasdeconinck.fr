import Link from "next/link";
import { getBlogPosts, getPixelArtPosts, readingTime, shortDate, sortByDate } from "app/blog/utils";

type Post = ReturnType<typeof getBlogPosts>[number];

/** A shelf of posts: date, title, summary and a "price tag" with the reading time. */
export function PostShelf({ posts, basePath }: { posts: Post[]; basePath: string }) {
  return (
    <ul className="shelf">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`${basePath}/${post.slug}`} className="shelf-item">
            <time dateTime={post.metadata.publishedAt}>{shortDate(post.metadata.publishedAt)}</time>
            <span className="shelf-text">
              <span className="shelf-title" style={{ viewTransitionName: `post-title-${post.slug}` }}>
                {post.metadata.title}
              </span>
              {post.metadata.summary && post.metadata.summary !== post.metadata.title && (
                <span className="shelf-summary">{post.metadata.summary}</span>
              )}
            </span>
            <span className="price">{readingTime(post.content)} min</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Posts grouped by year, like aisles. */
export function PostAisles({ posts, basePath }: { posts: Post[]; basePath: string }) {
  const years = new Map<string, Post[]>();
  for (const post of sortByDate(posts)) {
    const year = post.metadata.publishedAt.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), post]);
  }
  return (
    <>
      {Array.from(years, ([year, list]) => (
        <section key={year} className="aisle">
          <h2 className="aisle-sign">
            <span>{year}</span>
            <span className="aisle-count">{list.length} items</span>
          </h2>
          <PostShelf posts={list} basePath={basePath} />
        </section>
      ))}
    </>
  );
}

export function BlogPosts({ limit }: { limit?: number }) {
  return <PostShelf posts={sortByDate(getBlogPosts()).slice(0, limit)} basePath="/blog" />;
}

export function PixelArtPosts() {
  return <PostAisles posts={getPixelArtPosts()} basePath="/pixel-art" />;
}
