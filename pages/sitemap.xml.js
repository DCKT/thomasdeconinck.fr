import { ALL_ARTICLES_QUERY } from "../shared/queries";
import { request } from "../shared/datocms";
import { globby } from "globby";
import path from "path";

function generateSiteMap({ blogArticlesPaths, labsPaths }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://thomasdeconinck.fr</loc>
     </url>
     <url>
       <loc>https://thomasdeconinck.fr/about</loc>
     </url>
     ${blogArticlesPaths
       .map((path) => {
         return `
       <url>
           <loc>${`https://thomasdeconinck.fr/blog${path}`}</loc>
       </url>
     `;
       })
       .join("")}
     ${labsPaths
       .map((path) => {
         return `
       <url>
           <loc>${`https://thomasdeconinck.fr/labs${path}`}</loc>
       </url>
     `;
       })
       .join("")}
   </urlset>
 `;
}

function Sitemap() {}

const LABS_FOLDER_PATH = path.resolve("./pages", "labs");

export async function getServerSideProps({ res }) {
  const { articles } = await request({
    query: ALL_ARTICLES_QUERY,
  });

  const blogArticlesPaths = articles
    .map(({ slugs }) => slugs)
    .flat()
    .map(
      ({ locale, slug }) => `${locale === "fr" ? "" : `/${locale}`}/${slug}`
    );

  const labsPaths = await (
    await globby([`${LABS_FOLDER_PATH}/**/*.js`])
  ).map((path) => {
    return path
      .replace(LABS_FOLDER_PATH, "")
      .replace("/index.js", "")
      .replace(".js", "");
  });

  res.setHeader("Content-Type", "text/xml");

  res.write(generateSiteMap({ blogArticlesPaths, labsPaths }));
  res.end();

  return { props: {} };
}

export default Sitemap;
