import { Link } from "shared/navigation";
import { request } from "shared/datocms";
import markdownToHtml from "shared/markdownToHtml";
import HtmlContent from "components/HtmlContent";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { Image } from "react-datocms";
import readingTime from "reading-time";
import {
  AllArticlesDocument,
  AllArticlesQuery,
  GetArticleBySlugDocument,
  GetArticleBySlugQuery,
  GetArticleSEOBySlugDocument,
  GetArticleSEOBySlugQuery,
} from "graphql/generated";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { create, flatten, update } from "lodash";
import { Metadata } from "next";

import TagLink from "components/TagLink";
import { isAfter } from "date-fns";
import UpdatedArticleTag from "components/UpdatedArticleTag";

export async function generateStaticParams() {
  const { articles } = await request<AllArticlesQuery>({
    query: AllArticlesDocument,
  });

  return flatten(
    articles.map(({ slugs }) => {
      return slugs!.map(({ locale, slug }) => ({ slug, locale }));
    })
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { article } = await request<GetArticleSEOBySlugQuery>({
    query: GetArticleSEOBySlugDocument,
  });

  return {
    title: article?.title,
    description: article?.description,
  };
}

async function getArticle(slug: string, locale: string) {
  const data = await request<GetArticleBySlugQuery>({
    query: GetArticleBySlugDocument,
    variables: {
      slug: slug,
      locale,
      enableDraft: process.env.NODE_ENV === "development",
    },
  });

  const content = await markdownToHtml(data?.article!.content);
  const readingStats = readingTime(data?.article!.content);

  return {
    title: data.article!.title,
    tags: (data.article!.tags || "").split(",").map((tag) => tag.trim()),
    content,
    readingStats,
    firstPublishedAt: data.article!._firstPublishedAt,
    updatedAt: data.article!._updatedAt,
    splash: data.article!.splash,
  };
}

// const getAbsoluteURL = (path: string) => {
//   const baseURL =
//     `https://${process.env.VERCEL_URL}` || "http://localhost:3000";
//   return baseURL + path;
// };

export default async function Article({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  unstable_setRequestLocale(locale);
  const {
    title,
    tags,
    firstPublishedAt,
    updatedAt,
    content,
    readingStats,
    splash,
  } = await getArticle(slug, locale);
  const t = await getTranslations("BlogArticle");

  // const twitterImage = getAbsoluteURL(
  //   `/api/canvas-image-builder?text=${encodeURIComponent(title)}`
  // );

  return (
    <div className="blog-container">
      <div className="bg-orangeLight py-4 lg:py-8">
        <div className="max-w-[1400px] mx-auto px-4">
          <header className="flex flex-col gap-4 max-w-screen-lg mx-auto">
            <Link
              href="/blog"
              className="flex flex-row items-center gap-4 text-lg  hover:text-orange-500  group"
            >
              <MdOutlineKeyboardBackspace className="border-2 rounded-full border-gray-800  block w-8 h-8 p-1 group-hover:border-orange-500 " />
              {t("back")}
            </Link>
            <div className="">
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-semibold leading-snug ">
                {title}
              </h1>
              <div className="flex flex-col flex-wrap sm:flex-row md:gap-4 md:items-center">
                {firstPublishedAt ? (
                  <small className="text-lg text-gray-500 first-letter:capitalize">
                    {t("published", {
                      date: new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "full",
                      }).format(new Date(firstPublishedAt)),
                    })}
                  </small>
                ) : null}
                {isAfter(updatedAt, firstPublishedAt!) ? (
                  <UpdatedArticleTag updatedAt={updatedAt} />
                ) : (
                  <span className="text-lg text-gray-500 ">-</span>
                )}
                <small className="text-lg text-gray-500 ">
                  {t("readingTime", { time: Math.round(readingStats.minutes) })}
                </small>
              </div>

              <div className="flex flex-row flex-wrap gap-x-2 my-2">
                {tags.map((tag) => (
                  <TagLink key={`tags-${tag}`} tag={tag} />
                ))}
              </div>
            </div>
          </header>

          <div className="my-4 lg:my-8 flex flex-col gap-2 ">
            <Image
              data={splash!.responsiveImage!}
              className="rounded-xl mx-auto shadow-2xl"
            />

            <p className="text-xs text-center  text-gray-500 ">
              <a
                className="underline"
                target="_blank"
                href={`https://unsplash.com/${splash?.copyright}?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText`}
              >
                {t("unsplashCredit", {
                  name: splash?.author,
                })}
              </a>
            </p>
          </div>
        </div>
      </div>

      <section className="max-w-screen-lg mx-auto px-4 pb-16">
        <HtmlContent content={content} />
      </section>
    </div>
  );
}
