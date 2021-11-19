import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkPrism from "remark-prism";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import rehypeHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeRewrite from "rehype-rewrite";

export default async function markdownToHtml(markdown) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkPrism, {
      transformInlineCode: true,
      plugins: [
        "line-numbers",
        "autolinker",
        "command-line",
        "data-uri-highlight",
        "diff-highlight",
        "inline-color",
        "keep-markup",
        "treeview",
      ],
    })
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: ["noopener", "noreferrer"],
    })
    .use(rehypeRewrite, {
      rewrite: (node, index, parent) => {
        if (node.tagName === "img") {
          node.properties = { ...node.properties, lazyLoad: true };
        }
      },
    })
    .use(rehypeHeadings, {
      behavior: "wrap",
    })
    .use(rehypeStringify)
    .process(markdown)
    .then((file) => String(file));

  return result;
}
