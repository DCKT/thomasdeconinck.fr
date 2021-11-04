import { request } from "../../shared/datocms";
import Bio from "../../components/Bio";
import Link from "next/link";
import ArticleListItem from "../../components/ArticleListItem";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { MENU_QUERY } from "../../shared/queries";
import Navigation from "../../components/Navigation";

const BLOG_INDEX_QUERY = `
query BlogIndex($limit: IntType, $locale: SiteLocale) {
  allArticles(first: $limit, locale: $locale, orderBy: _publishedAt_DESC) {
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
     }
   }
  }
}
`;

export async function getStaticProps({ locale }) {
  const data = await request({
    query: BLOG_INDEX_QUERY,
    variables: { limit: 4, locale },
  });

  const menuData = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  return {
    props: {
      articles: data.allArticles,
      menu: menuData.menu.navContent,
    },
  };
}

export default function Home({ articles, menu }) {
  let { locale } = useRouter();
  const [latestArticle, ...nextArticles] = articles;

  return (
    <div className="blog-container">
      {/* <Head>
        <title>{siteInformation.siteTitle}</title>
        <meta name="description" content={siteInformation.metaDescription} />
      </Head> */}

      <Navigation links={menu} />

      <div className="mt-16 max-w-screen-xl mx-auto px-4">
        <div className="flex flex-row items-center gap-8 mb-12 lg:mb-20">
          <Link href={`/blog/${latestArticle.slug}`}>
            <picture className="rounded hidden md:block shadow-lg cursor-pointer">
              <source
                media="(min-width: 768px)"
                srcSet={latestArticle.splash.responsiveImage.webpSrcSet}
                type="image/webp"
              />
              <img
                src={latestArticle.splash.responsiveImage.src}
                alt={latestArticle.splash.responsiveImage.alt}
                className="rounded shadow-lg border dark:border-0"
              />
            </picture>
          </Link>
          <div>
            <Link href={`/blog/${latestArticle.slug}`}>
              <h1 className="text-2xl md:text-2xl font-semibold dark:text-gray-100 cursor-pointer">
                {latestArticle.title}
              </h1>
            </Link>
            <small className="text-xs lg:text-base dark:text-gray-500">
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "full",
              }).format(new Date(latestArticle._publishedAt))}
            </small>
            <p className="text-lg md:text-base dark:text-gray-300 mt-2">
              {latestArticle.description}
            </p>
          </div>
        </div>

        <div className="grid grid-flow-col md:grid-flow-row grid-rows-3 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10">
          {nextArticles.map(
            ({ title, description, _publishedAt, slug, splash }) => {
              return (
                <div key={slug}>
                  <Link href={`/blog/${slug}`}>
                    <picture className="rounded hidden md:block shadow mb-4">
                      <source
                        media="(min-width: 768px)"
                        srcSet={splash.responsiveImage.webpSrcSet}
                        type="image/webp"
                      />
                      <img
                        src={splash.responsiveImage.src}
                        alt={splash.responsiveImage.alt}
                        className="rounded shadow border dark:border-0"
                      />
                    </picture>
                  </Link>

                  <small className="text-base font-light dark:text-gray-500 mb-2">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "full",
                    }).format(new Date(_publishedAt))}
                  </small>
                  <h3 className="text-2xl md:text-xl font-semibold dark:text-gray-100">
                    <Link href={`/blog/${slug}`}>{title}</Link>
                  </h3>
                  <p className="sm:hidden text-lg md:text-base dark:text-gray-300">
                    {description}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
