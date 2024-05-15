import { request } from "../../../shared/datocms.ts";
import { Link } from "shared/navigation";
import React from "react";
import {
  BlogIndexDocument,
  BlogIndexSEODocument,
  BlogIndexSEOQuery,
} from "graphql/generated.ts";
import { Metadata } from "next";
import { useLocale } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Image } from "react-datocms";
import TagLink from "components/TagLink.tsx";
import { isAfter } from "date-fns";
import { first } from "lodash";
import UpdatedArticleTag from "components/UpdatedArticleTag.tsx";

export async function generateMetadata(): Promise<Metadata> {
  const { blogIndex } = await request<BlogIndexSEOQuery>({
    query: BlogIndexSEODocument,
  });

  return {
    title: blogIndex?.seo?.title,
    description: blogIndex?.seo?.description,
  };
}

async function getArticles(locale: string) {
  const { latestArticles, nextArticles } = await request({
    query: BlogIndexDocument,
    variables: { locale, enableDraft: process.env.NODE_ENV === "development" },
  });

  return {
    latestArticles: latestArticles,
    articles: nextArticles,
  };
}

export default async function Blog({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations("BlogIndex");
  const { latestArticles, articles } = await getArticles(locale);

  const [firstArticle, ...otherLatestArticles] = latestArticles;

  return (
    <div>
      <section className=" bg-[#fcf5ec] p-4 lg:px-8 lg:py-12 ">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-4 lg:gap-12">
          <Link
            href={`/blog/${firstArticle.slug}`}
            className="group cursor-pointer bg-white shadow-md hover:shadow-xl transition duration-200 ease-in-out rounded-lg p-6  self-center  md:w-1/2 flex flex-col gap-4 max-w-[550px] mx-auto"
          >
            <div className="overflow-hidden rounded-lg shadow-lg">
              <Image
                data={firstArticle.splash!.responsiveImage!}
                className="rounded-lg !max-w-none group-hover:scale-110 transition-transform ease-in-out duration-150"
              />
            </div>

            <div>
              <div className="flex flex-row flex-wrap gap-3 items-center mb-3">
                {firstArticle.tags?.split(",").map((tag) => (
                  <TagLink key={`first-article-${tag}`} tag={tag} />
                ))}
              </div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
                {firstArticle.title}
              </h1>
              <div className="flex flex-row flex-wrap items-center gap-2 mt-1">
                <p className="text-gray-600 text-sm first-letter:capitalize">
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "full",
                  }).format(new Date(firstArticle._firstPublishedAt!))}
                </p>
                {isAfter(
                  firstArticle._updatedAt,
                  firstArticle._firstPublishedAt!
                ) ? (
                  <UpdatedArticleTag updatedAt={firstArticle._updatedAt} />
                ) : null}
              </div>
            </div>
          </Link>

          <div className="md:w-1/2 flex flex-col justify-around gap-2">
            {otherLatestArticles.map(
              ({
                slug,
                splash,
                title,
                tags,
                description,
                _firstPublishedAt,
              }) => {
                return (
                  <Link
                    href={`/blog/${slug}`}
                    key={title}
                    className="group relative flex flex-row items-center gap-4"
                  >
                    <div className="block md:border-2 rounded-lg md:p-2 w-1/4  md:w-[40%] flex-shrink-0 overflow-hidden">
                      <Image
                        data={splash!.responsiveImage!}
                        className="rounded-lg block w-full group-hover:scale-110 transition-transform ease-in-out duration-150"
                      />
                    </div>

                    <div className="w-full flex flex-col">
                      <div className="flex flex-row flex-wrap gap-3 items-center mt-3 lg:mt-0 md:mb-2 order-3 md:order-none">
                        {tags?.split(",").map((tag) => (
                          <TagLink tag={tag} key={`other-article-${tag}`} />
                        ))}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:underline">
                        {title}
                      </h2>
                      <small className="text-gray-600 text-sm first-letter:capitalize">
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "full",
                        }).format(new Date(_firstPublishedAt!))}
                      </small>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        </div>
      </section>
      <section className="mt-12 max-w-screen-xl mx-auto px-4 pb-10">
        <h2 className="text-3xl font-light mb-8">{t("allArticles")}</h2>

        <div className="flex flex-col gap-8">
          {articles.map(
            ({ slug, splash, title, tags, description, _firstPublishedAt }) => {
              return (
                <Link
                  href={`/blog/${slug}`}
                  key={title}
                  className="relative flex flex-row items-center gap-4 md:gap-8 group"
                >
                  <div className="hidden md:block border-2 border-slate-200  rounded-lg p-2 w-1/3 flex-shrink-0 overflow-hidden">
                    <Image
                      data={splash!.responsiveImage!}
                      className="rounded-lg block w-full group-hover:scale-110 transition-transform ease-in-out duration-150"
                    />
                  </div>

                  <div className="w-full flex flex-col">
                    <div className="flex flex-row flex-wrap gap-3 items-center mt-3 lg:mt-0 md:mb-2 order-3 md:order-none">
                      {tags?.split(",").map((tag) => (
                        <TagLink tag={tag} key={`all-articles-${tag}`} />
                      ))}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:underline">
                      {title}
                    </h2>
                    <small className="text-gray-600 text-sm first-letter:capitalize">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "full",
                      }).format(new Date(_firstPublishedAt!))}
                    </small>
                    <p className="mt-4 text-slate-800 hidden md:block">
                      {description}
                    </p>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
}
