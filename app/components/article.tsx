import Link from "next/link";
import { CustomMDX } from "app/components/mdx";
import { formatDate, getBlogPosts, readingTime, sortByDate } from "app/blog/utils";
import { baseUrl } from "app/sitemap";

type Post = ReturnType<typeof getBlogPosts>[number];

export function articleMetadata(post: Post, basePath: string) {
  const { title, publishedAt: publishedTime, summary: description, image } = post.metadata;
  const ogImage = image ? image : `${baseUrl}/og?title=${encodeURIComponent(title)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${baseUrl}${basePath}/${post.slug}`,
      images: [{ url: ogImage }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

/** Shared article layout for blog + pixel-art posts. */
export function Article({
  post,
  posts,
  basePath,
  section,
}: {
  post: Post;
  posts: Post[];
  basePath: string;
  section: string;
}) {
  const sorted = sortByDate(posts);
  const index = sorted.findIndex((p) => p.slug === post.slug);
  const newer = sorted[index - 1];
  const older = sorted[index + 1];

  return (
    <main className="page">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}${basePath}/${post.slug}`,
            author: { "@type": "Person", name: "Thomas Deconinck" },
          }),
        }}
      />
      <header className="article-head">
        <Link href={basePath} className="back">
          ← {section}
        </Link>
        <h1 className="title" style={{ viewTransitionName: `post-title-${post.slug}` }}>
          {post.metadata.title}
        </h1>
        <p className="meta">
          <time dateTime={post.metadata.publishedAt}>{formatDate(post.metadata.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingTime(post.content)} min read</span>
        </p>
      </header>

      <article className="prose">
        <CustomMDX source={post.content} />
      </article>

      <nav className="pager" aria-label="More posts">
        {older ? (
          <Link href={`${basePath}/${older.slug}`}>
            <small>← Older</small>
            <span>{older.metadata.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link href={`${basePath}/${newer.slug}`} className="pager-next">
            <small>Newer →</small>
            <span>{newer.metadata.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
