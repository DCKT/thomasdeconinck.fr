import { request } from "../../shared/datocms";

export const POST_QUERY = `
query Post($slug: String) {
  article(filter: {slug: {eq: $slug }}) {
    slug
  }
}`;

export default async function handler(req, res) {
  if (req.query.secret !== process.env.PREVIEW_TOKEN || !req.query.slug) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const post = await request({
    query: POST_QUERY,
    variables: { slug: req.query.slug, locale: "fr" },
    preview: true,
  });

  if (!post) {
    return res.status(401).json({ message: "Invalid slug" });
  }

  res.setPreviewData({});

  res.redirect(`/blog/${post.article.slug}`);
}
