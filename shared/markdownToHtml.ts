import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import rehypeHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeExpressiveCode, {
  PluginShikiOptions,
} from "rehype-expressive-code";
import jsGrammar from "tm-grammars/grammars/typescript.json";

let rescriptGrammar = {
  ...jsGrammar,
  name: "rescript",
  displayName: "rescript",
};

export default async function markdownToHtml(markdown: string) {
  const result = await unified()
    .use(remarkParse)

    .use(remarkRehype)

    .use(rehypeExpressiveCode, {
      themes: ["github-dark-dimmed"],
      shiki: {
        langs: [rescriptGrammar],
      } as any,
    })
    .use(rehypeSlug)
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: ["noopener", "noreferrer"],
    })

    // .use(rehypeRewrite, {
    //   rewrite: (node, index, parent) => {
    //     if (node.tagName === "img") {
    //       node.properties = { ...node.properties, lazyLoad: true };
    //     }
    //   },
    // })
    .use(rehypeHeadings, {
      behavior: "wrap",
    })
    .use(rehypeStringify)
    .process(markdown)
    .then((file) => String(file));

  return result;
}
