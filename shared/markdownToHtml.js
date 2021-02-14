import remark from "remark";
import html from "remark-html";
import prism from "remark-prism";
import slug from "remark-slug";
import headings from "remark-autolink-headings";
import externalLinks from "remark-external-links";

export default async function markdownToHtml(markdown) {
  const result = await remark()
    .use(slug)
    .use(externalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] })
    .use(headings, {
      behavior: "wrap",
    })
    .use(html)
    .use(prism)
    .process(markdown);
  return result.toString();
}
