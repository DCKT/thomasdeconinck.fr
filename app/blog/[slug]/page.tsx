import { notFound } from "next/navigation";
import { CustomMDX } from "app/components/mdx";
import { formatDate, getBlogPosts } from "app/blog/utils";
import { baseUrl } from "app/sitemap";

export async function generateStaticParams() {
  let posts = getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  let { slug } = await params;
  let post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) return;

  let { title, publishedAt: publishedTime, summary: description, image } = post.metadata;
  let ogImage = image ? image : `${baseUrl}/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    openGraph: {
      title, description, type: "article", publishedTime,
      url: `${baseUrl}/blog/${post.slug}`,
      images: [{ url: ogImage }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function Blog({ params }: { params: Params }) {
  let { slug } = await params;
  let post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) notFound();

  return (
    <section>
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
            url: `${baseUrl}/blog/${post.slug}`,
            author: { "@type": "Person", name: "Thomas Deconinck" },
          }),
        }}
      />

      {/* Title banner */}
      <div
        className="mb-6 px-5 py-4"
        style={{
          backgroundColor: "#d4a84b",
          border: "4px solid #2a1810",
          outline: "2px solid #c0392b",
          outlineOffset: "-8px",
          boxShadow: "5px 5px 0 #2a1810",
        }}
      >
        <h1
          className="title text-3xl text-center"
          style={{
            fontFamily: "var(--font-display)",
            color: "#2a1810",
            letterSpacing: "0.04em",
          }}
        >
          {post.metadata.title}
        </h1>
      </div>

      {/* Date chip */}
      <div className="flex mb-8">
        <span
          className="text-xs font-bold px-3 py-1"
          style={{
            backgroundColor: "#c0392b",
            color: "#f4e8d0",
            fontFamily: "var(--font-display)",
            border: "2px solid #2a1810",
            letterSpacing: "0.06em",
          }}
        >
          {formatDate(post.metadata.publishedAt)}
        </span>
      </div>

      <article className="prose">
        <CustomMDX source={post.content} options={{ scope: { filename: post.slug } }} />
      </article>
    </section>
  );
}
