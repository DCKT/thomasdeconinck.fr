import { AllArticlesDocument } from "graphql/generated";
import { MetadataRoute } from "next";
import { request } from "shared/datocms";
import { defaultLocale, locales } from "shared/navigation";

// const LABS_FOLDER_PATH = path.resolve("./app", "labs");

function getUrl(pathname: string, locale: string) {
  return `https://thomasdeconinck.fr/${locale}${pathname}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: getUrl("/", defaultLocale),
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          locales.map((locale) => [locale, getUrl("/", locale)])
        ),
      },
    },
    {
      url: getUrl("/about", defaultLocale),
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          locales.map((locale) => [locale, getUrl("/about", locale)])
        ),
      },
    },
  ];

  const { articles } = await request({
    query: AllArticlesDocument,
  });

  const sitemapArticles: MetadataRoute.Sitemap = articles
    .map((article) =>
      article.slugs!.map((slug) => ({
        url: getUrl(`/blog/${slug?.slug}`, slug.locale!),
        lastModified: article._updatedAt,
      }))
    )
    .flat();

  return [...base, ...sitemapArticles];
}
