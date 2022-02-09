import { request } from "../../shared/datocms";
import Link from "next/link";
import ArticleListItem from "../../components/ArticleListItem";
import Seo from "../../components/Seo";
import Head from "next/head";
import { useRouter } from "next/router";
import { MENU_QUERY } from "../../shared/queries";
import Navigation from "../../components/Navigation";
import clsx from "clsx";
import { Image } from "react-datocms";
import { FormattedMessage } from "react-intl";
import React from "react";
import axios from "axios";
import { BiErrorCircle } from "react-icons/bi";

const BLOG_INDEX_QUERY = `
query BlogIndex($locale: SiteLocale) {
  blogIndex(locale: $locale) {
    seo {
      title
      description
    }
  }

  latestArticle: allArticles(first: 1, locale: $locale, orderBy: _publishedAt_DESC) {
    title
    description
    slug
    _publishedAt
    splash {
      responsiveImage(imgixParams: {fm: jpg, w: 850, h: 850 }) {
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
  
  nextArticles: allArticles(skip:1, first:5, locale: $locale, orderBy: _firstPublishedAt_DESC) {
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
}
`;

export async function getStaticProps({ locale, preview }) {
  const {
    blogIndex,
    latestArticle,
    nextArticles,
    _site: {
      favicon: { url: faviconUrl },
    },
  } = await request({
    query: BLOG_INDEX_QUERY,
    variables: { locale },
    preview,
  });

  const menuData = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  return {
    props: {
      latestArticle: latestArticle[0],
      nextArticles: nextArticles,
      menu: menuData.menu.navContent,
      seo: blogIndex.seo,
      faviconUrl,
    },
  };
}

export default function Home({
  latestArticle,
  nextArticles,
  menu,
  seo,
  faviconUrl,
}) {
  let [articles, setArticles] = React.useState(nextArticles);
  let [pageIndex, setPageIndex] = React.useState(0);
  let previousIndex = React.useRef(pageIndex);
  let [loadingMoreArticles, setLoadingMoreArticles] = React.useState(false);
  let [loadingError, setLoadingError] = React.useState(null);
  let [shouldHideMoreArticle, setShouldHideMoreArticle] = React.useState(false);
  let { locale } = useRouter();

  React.useEffect(async () => {
    if (previousIndex.current != pageIndex) {
      previousIndex.current = pageIndex;
      setLoadingMoreArticles(true);

      try {
        const { data } = await axios.post("/api/load-more-articles", {
          locale: locale,
          pageIndex: pageIndex,
        });

        if (data.length < 5) {
          setShouldHideMoreArticle((_) => true);
        }

        setLoadingError((_) => false);
        setArticles((articles) => articles.concat(data));
      } catch (err) {
        console.log(err);
        setLoadingError((_) => true);
        setLoadingMoreArticles(false);
      }
    }
  }, [pageIndex, loadingMoreArticles, loadingError]);

  return (
    <div className="blog-container">
      <Seo
        title={seo.title}
        description={seo.description}
        favicon={faviconUrl}
      />

      <Navigation links={menu} />

      <div className="mt-24 max-w-screen-xl mx-auto px-4 pb-10">
        <Link href={`/blog/${latestArticle.slug}`} passHref>
          <a className="relative flex flex-row items-center gap-8 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg blog-featured-article cursor-pointer">
            <Image
              data={latestArticle.splash.responsiveImage}
              className="rounded-lg hidden md:block dark:shadow-lg md:w-[450px] lg:w-[550px] xl:w-[650px] xl:h-[400px]"
            />

            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {latestArticle.title}
              </h1>
              <small className="text-base md:text-xs lg:text-base dark:text-gray-400">
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "full",
                }).format(new Date(latestArticle._publishedAt))}
              </small>
              <p className="text-lg md:text-base text-gray-900 dark:text-gray-300  mt-4 lg:mt-10">
                {latestArticle.description}
              </p>
            </div>
          </a>
        </Link>

        <h2 className="text-2xl md:text-5xl font-light dark:text-gray-200 my-8 md:my-12 lg:mt-28 lg:mb-36">
          <FormattedMessage id="blogIndex.latestArticle" />
        </h2>

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
                <div key={slug} className={clsx("flex flex-col shadow-xl")}>
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
                      <Image
                        data={responsiveImage}
                        className="hidden md:block rounded-lg border dark:border-0 w-full h-full "
                      />

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

          {shouldHideMoreArticle ? null : (
            <button
              onClick={(_) => {
                if (!loadingMoreArticles) {
                  setPageIndex((i) => i + 1);
                }
              }}
              className={clsx([
                "flex flex-row md:flex-col gap-4 justify-center items-center blog-item blog-loadmore md:h-[500px] z-10 relative p-4 bg-gradient-to-r rounded-lg from-purple-400 to-purple-700 transition-all ease-in-out duration-150 cursor-pointer",
                "md:dark:text-white ",
              ])}
            >
              <p className="md:text-4xl leading-9 uppercase">
                <FormattedMessage id="blog.loadMore" />
              </p>

              {loadingMoreArticles ? (
                <div>
                  <svg
                    className="animate-spin h-10 w-10 text-white mx-auto "
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : null}

              {loadingError ? (
                <p className="w-3/4 flex flex-col gap-2">
                  <BiErrorCircle size={30} className="mx-auto" />
                  <FormattedMessage id="blog.loadingMorePostError" />{" "}
                </p>
              ) : (
                React.null
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
