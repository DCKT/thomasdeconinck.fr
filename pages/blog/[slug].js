import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect } from "react";
import flatten from "lodash/flatten";
import Navigation from "../../components/Navigation";
import { request } from "../../shared/datocms";
import markdownToHtml from "../../shared/markdownToHtml";
import { ALL_ARTICLES_QUERY, MENU_QUERY } from "../../shared/queries";
import HtmlContent from "../../components/HtmlContent";

export const POST_QUERY = `
query Post($slug: String, $locale: SiteLocale) {
  article(filter: {slug: {eq: $slug}}, locale: $locale) {
    title
    description
    content
    slug
    tags
    _publishedAt
  }
  siteInformation {
    siteTitle
    siteDescription
  }
}`;

export async function getStaticPaths() {
  const data = await request({
    query: ALL_ARTICLES_QUERY,
  });

  return {
    paths: flatten(
      data.articles.map(({ slugs }) => {
        return slugs.map(({ locale, slug }) => ({ params: { slug }, locale }));
      })
    ),
    fallback: false,
  };
}

export async function getStaticProps({ params, locale, preview }) {
  const data = await request({
    query: POST_QUERY,
    variables: { slug: params.slug, locale },
    preview: preview,
  });

  const menuData = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  const content = await markdownToHtml(data.article.content);
  const siteDescription = await markdownToHtml(
    data.siteInformation.siteDescription
  );

  return {
    props: {
      ...data.article,
      tags: data.article.tags.split(",").map((tag) => tag.trim()),
      content,
      siteInformation: {
        ...data.siteInformation,
        siteDescription,
      },
      preview: !!preview,
      menu: menuData.menu.navContent,
    },
  };
}

export default function Article({
  title,
  content,
  description,
  slug,
  tags,
  _publishedAt,
  siteInformation,
  preview,
  menu,
}) {
  const { locale, isFallback, asPath } = useRouter();

  if (isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <div className="blog-container">
      {preview ? (
        <div className="fixed top-0 right-0 p-4 bg-blue-200 rounded-bl">
          <a className="block underline text-center" href="/api/exit-preview">
            Exit
          </a>
          Preview mode enabled
        </div>
      ) : null}
      <Head>
        <title>{title}</title>
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content={"https://blog.thomasdeconinck.fr/favicon.ico"}
        />
        <meta name="description" content={description} />
        <meta
          property="og:site_name"
          content={siteInformation.siteInformation}
        />
        <meta
          name="og:image"
          content={"https://blog.thomasdeconinck.fr/favicon.ico"}
        />
        <meta property="og:description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="follow, index" />
        <meta charSet="utf-8" />
      </Head>

      <Navigation links={menu} />

      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-4xl font-bold leading-snug">{title}</h1>
        <div className="flex flex-row justify-center flex-wrap gap-x-2 my-2">
          {tags.map((tag, i) => {
            return (
              <Link key={`tags-${i}`} href={`/tags/${encodeURIComponent(tag)}`}>
                <a className="bg-orange text-gray-700 rounded py-1 px-2 text-sm hover:opacity-75">
                  {tag}
                </a>
              </Link>
            );
          })}
        </div>

        {_publishedAt ? (
          <small>
            {new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "full",
            }).format(new Date(_publishedAt))}
          </small>
        ) : null}
      </div>

      <HtmlContent content={content} />
    </div>
  );
}
