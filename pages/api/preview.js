import { request } from "../../shared/datocms";

export const POST_QUERY = `
query Post($slug: String) {
  article(filter: {slug: {eq: $slug }}) {
    slug
  }
}`;

export default async function handler(req, res) {
  if (
    process.env.NODE_ENV === "production" &&
    req.query.secret !== process.env.PREVIEW_TOKEN
  ) {
    return res.status(401).json({ message: "Invalid token" });
  }

  res.setPreviewData({});
  res.writeHead(307, { Location: "/" });
  res.end();
}
