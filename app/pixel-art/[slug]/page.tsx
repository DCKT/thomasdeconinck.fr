import { notFound } from "next/navigation";
import { Article, articleMetadata } from "app/components/article";
import { getPixelArtPosts } from "app/blog/utils";

export async function generateStaticParams() {
  return getPixelArtPosts().map((post) => ({ slug: post.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getPixelArtPosts().find((post) => post.slug === slug);
  if (!post) return;
  return articleMetadata(post, "/pixel-art");
}

export default async function PixelArtPost({ params }: { params: Params }) {
  const { slug } = await params;
  const posts = getPixelArtPosts();
  const post = posts.find((post) => post.slug === slug);
  if (!post) notFound();

  return <Article post={post} posts={posts} basePath="/pixel-art" section="Pixel Art" />;
}
