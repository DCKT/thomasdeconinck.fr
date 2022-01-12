import { request } from "../../../shared/datocms";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect } from "react";
import flatten from "lodash/flatten";
import uniq from "lodash/uniq";
import Navigation from "../../../components/Navigation";
import { MENU_QUERY } from "../../../shared/queries";
import ArticleListItem from "../../../components/ArticleListItem";
import clsx from "clsx";
import Image from "next/image";
import { FormattedMessage } from "react-intl";
import Seo from "../../../components/Seo";
import { useIntl } from "react-intl";

const TAGGED_POSTS_QUERY = `
query Posts($tag: String!, $locale: SiteLocale) {
  allArticles(filter: {tags: {matches: {pattern: $tag}}}, locale: $locale) {
    title
    description
    slug
    _publishedAt
    splash {
      responsiveImage(imgixParams: {fm: jpg, w: 450, h: 500, fit: crop }) {
       srcSet
       webpSrcSet
       src
       alt
       width
       height
       aspectRatio
       base64
     }
   }
  }
  _site {
    favicon {
      url
    }
  }
}`;

const ALL_TAG_QUERY = `
query AllArticles {
  allArticles {
    tags
  }
}`;

export async function getStaticPaths() {
  const data = await request({
    query: ALL_TAG_QUERY,
  });

  return {
    paths: uniq(
      flatten(data.allArticles.map(({ tags }) => tags.split(",")))
    ).map((tag) => ({
      params: {
        tag: tag.trim(),
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params, locale }) {
  const menuData = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  const data = await request({
    query: TAGGED_POSTS_QUERY,
    variables: { tag: params.tag, locale },
  });

  return {
    props: {
      menu: menuData.menu.navContent,
      articles: data.allArticles,
      faviconUrl: data._site.favicon.url,
    },
  };
}

export default function Tag({ articles, menu, faviconUrl }) {
  const { query, locale } = useRouter();
  const intl = useIntl();
  const { tag } = query;

  return (
    <div className="blog-container">
      <Seo
        title={intl.formatMessage(
          {
            id: "tags.title",
          },
          {
            tag,
          }
        )}
        description={intl.formatMessage(
          {
            id: "tags.description",
          },
          {
            tag,
          }
        )}
        favicon={faviconUrl}
      />

      <Navigation links={menu} />

      <div className="mt-16 max-w-screen-xl mx-auto px-4 pb-10">
        <h1 className="text-4xl font-bold mt-8 dark:text-gray-100 text-center mb-20">
          <FormattedMessage
            defaultMessage="Articles about <tag>tag</tag>"
            id="blog.tagsTitle"
            values={{
              tag: (_) => (
                <span className="text-purple-500 dark:text-purple-300">
                  {tag}
                </span>
              ),
            }}
          />
        </h1>

        <div className="grid md:grid-flow-row sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10">
          {articles.map(
            (
              {
                title,
                description,
                _publishedAt,
                slug,
                splash: { responsiveImage },
              },
              i
            ) => {
              return (
                <div
                  key={slug}
                  className={clsx("flex flex-col shadow-xl", {
                    "border-t border-gray-400 dark:border-gray-700 pt-4 md:border-0 md:pt-0":
                      i > 0,
                  })}
                >
                  <Link href={`/blog/${slug}`} passHref>
                    <a
                      className={
                        "relative md:h-[500px] rounded-lg cursor-pointer blog-item z-10"
                      }
                      style={{
                        backgroundImage: `url(${responsiveImage.base64})`,
                        backgroundSize: "cover",
                      }}
                    >
                      <picture className="absolute left-0 top-0 w-full rounded-lg hidden md:block mb-4 h-full">
                        <source
                          srcSet={responsiveImage.webpSrcSet}
                          type="image/webp"
                        />
                        <source srcSet={responsiveImage.srcSet} />
                        <img
                          src={responsiveImage.src}
                          alt={responsiveImage.alt}
                          loading="lazy"
                          className="block rounded-lg border dark:border-0 w-full h-full "
                        />
                      </picture>

                      <div className="flex  flex-col md:bg-[rgba(24,24,24,0.7)] md:absolute bottom-0 p-4  rounded-t-lg md:rounded-t-none rounded-b-lg w-full">
                        <small className="text-base font-light text-gray-900 md:text-gray-300 dark:text-gray-100 mb-2 block">
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: "full",
                          }).format(new Date(_publishedAt))}
                        </small>
                        <h3 className="text-xl font-semibold text-gray-900 md:text-gray-100 dark:text-gray-100 order-first md:order-none">
                          {title}
                        </h3>
                        <p className="md:hidden text-lg md:text-base text-gray-900 dark:text-gray-300">
                          {description}
                        </p>
                      </div>
                    </a>
                  </Link>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
