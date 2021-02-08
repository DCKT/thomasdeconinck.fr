import { request } from "../shared/datocms";
import markdownToHtml from "../shared/markdownToHtml";
import Bio from "../shared/Bio";
import Link from "next/link";
import ArticleListItem from "../shared/ArticleListItem";
import Head from "next/head";
import { useRouter } from "next/router";

const HOMEPAGE_QUERY = `
query HomePage($limit: IntType, $locale: SiteLocale) {
  allArticles(first: $limit, locale: $locale) {
    title
    description
    slug
    _publishedAt
  }
  siteInformation(locale: $locale) {
    siteTitle
    siteDescription
  }
}`;

export async function getStaticProps({ locale }) {
  const data = await request({
    query: HOMEPAGE_QUERY,
    variables: { limit: 10, locale },
  });

  const siteDescription = await markdownToHtml(
    data.siteInformation.siteDescription
  );

  return {
    props: {
      articles: data.allArticles,
      siteInformation: {
        ...data.siteInformation,
        siteDescription,
        metaDescription: siteDescription.replace(/(<([^>]+)>)/gi, ""),
      },
    },
  };
}

export default function Home({ siteInformation, articles }) {
  let { locale } = useRouter();
  return (
    <div className="blog-container">
      <Head>
        <title>{siteInformation.siteTitle}</title>
        <meta name="description" content={siteInformation.metaDescription} />
      </Head>

      <h1 className="text-gray-700 dark:text-gray-200 text-4xl lg:text-5xl text-center mt-4 mb-8 font-bold">
        {siteInformation.siteTitle}
      </h1>

      <Bio content={siteInformation.siteDescription} />

      <div className="mt-16">
        {articles.map(({ title, description, _publishedAt, slug }, i) => {
          return (
            <ArticleListItem
              key={i}
              title={title}
              description={description}
              date={_publishedAt}
              slug={slug}
              locale
            />
          );
        })}
      </div>
    </div>
  );
}
