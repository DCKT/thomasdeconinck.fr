import { notFound } from "next/navigation";
import { Article, articleMetadata } from "app/components/article";
import { getBlogPosts } from "app/blog/utils";

export async function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) return;
  return articleMetadata(post, "/blog");
}

export default async function Blog({ params }: { params: Params }) {
  const { slug } = await params;
  const posts = getBlogPosts();
  const post = posts.find((post) => post.slug === slug);
  if (!post) notFound();

  return <Article post={post} posts={posts} basePath="/blog" section="Blog" />;
}
