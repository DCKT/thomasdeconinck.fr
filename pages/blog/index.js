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
  
  nextArticles: allArticles(skip:1, first:5, locale: $locale, orderBy: _publishedAt_DESC) {
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

export async function getStaticProps({ locale }) {
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
  let { locale } = useRouter();

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
          {nextArticles.map(
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
        </div>
      </div>
    </div>
  );
}
