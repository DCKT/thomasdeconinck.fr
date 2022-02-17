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
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { Image } from "react-datocms";
import { FormattedMessage } from "react-intl";
import Seo from "../../components/Seo";
import readingTime from "reading-time";

export const POST_QUERY = `
query Post($slug: String, $locale: SiteLocale) {
  article(filter: {slug: {eq: $slug}}, locale: $locale) {
    title
    description
    content
    slug
    tags
    _publishedAt
    splash {
      author
      copyright
      responsiveImage(imgixParams: {fit: crop, w: 1280, h: 600, auto: format }) {
        srcSet
        webpSrcSet
        sizes
        src

        # size information (post-transformations)
        width
        height
        aspectRatio

        # SEO attributes
        alt
        title

        # background color placeholder or...
        bgColor

        # blur-up placeholder, JPEG format, base64-encoded
        base64
     }
   }
  }
  siteInformation {
    siteTitle
    siteDescription
  }
  _site {
    favicon {
      url
    }
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
    fallback: "blocking",
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
  const readingStats = readingTime(data.article.content);
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
      favicon: data._site.favicon.url,
      readingStats,
    },
  };
}

const getAbsoluteURL = (path) => {
  const baseURL =
    `https://${process.env.VERCEL_URL}` || "http://localhost:3000";
  return baseURL + path;
};

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
  splash,
  favicon,
  readingStats,
}) {
  const { locale, isFallback, asPath, basePath } = useRouter();

  if (isFallback) {
    return <div>Loading...</div>;
  }

  const twitterImage = getAbsoluteURL(
    `/api/canvas-image-builder?text=${encodeURIComponent(title)}`
  );

  return (
    <div className="blog-container">
      {preview ? (
        <div className="fixed top-0 left-0 p-4 bg-blue-200 rounded-br z-10">
          <a className="block underline text-center" href="/api/exit-preview">
            Exit
          </a>
          Preview mode enabled
        </div>
      ) : null}

      <Seo
        title={title}
        description={description}
        favicon={favicon}
        twitterImage={twitterImage}
      />

      <Navigation links={menu} />

      <div className="max-w-screen-lg mx-auto mt-20 pb-20 px-4">
        <Link href="/blog" passHref>
          <a className="flex flex-row items-center gap-4 text-lg dark:text-gray-300 mb-10 hover:text-purple-500 dark:hover:text-purple-300 group">
            <MdOutlineKeyboardBackspace className="border-2 rounded-full border-gray-800 dark:border-gray-200 block w-10 h-10 p-1 group-hover:border-purple-500 dark:group-hover:border-purple-300" />
            <FormattedMessage id="blogDetail.back" />
          </a>
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-4xl font-light leading-snug dark:text-gray-100">
          {title}
        </h1>
        <div className="flex flex-row gap-4 items-center">
          {_publishedAt ? (
            <small className="text-lg lg:text-2xl text-gray-500 dark:text-gray-400">
              {new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "full",
              }).format(new Date(_publishedAt))}
            </small>
          ) : null}
          <span className="text-lg text-gray-500 dark:text-gray-400">-</span>
          <small className="text-lg text-gray-500 dark:text-gray-400">
            <FormattedMessage
              id="blogDetail.readingTime"
              values={{ minutes: Math.round(readingStats.minutes) }}
            />
          </small>
        </div>
        <div className="flex flex-row flex-wrap gap-x-2 my-2">
          {tags.map((tag, i) => {
            return (
              <Link
                key={`tags-${i}`}
                href={`/blog/tags/${encodeURIComponent(tag)}`}
              >
                <a className="bg-purple-500 dark:bg-purple-400 text-white rounded py-1 px-2 text-sm hover:bg-purple-400 dark:hover:bg-purple-500">
                  {tag}
                </a>
              </Link>
            );
          })}
        </div>

        <Image
          data={splash.responsiveImage}
          className="rounded-lg mt-12 mb-6 xl:-mx-8"
        />

        <p className="text-sm text-center mb-20 text-gray-500 dark:text-gray-400">
          <FormattedMessage
            id="blogDetail.splash"
            values={{
              author: (chunk) => (
                <a
                  className="underline"
                  target="_blank"
                  href={`https://unsplash.com/${splash.copyright}?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText`}
                >
                  {splash.author}
                  toto
                </a>
              ),
              unsplash: (chunk) => (
                <a
                  className="underline"
                  target="_blank"
                  href="https://unsplash.com/s/photos/boat?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
                >
                  {chunk}
                </a>
              ),
            }}
          />
        </p>

        <HtmlContent content={content} />
      </div>
    </div>
  );
}
