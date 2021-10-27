import { request } from "../../shared/datocms";
import markdownToHtml from "../../shared/markdownToHtml";
import Bio from "../../components/Bio";
import Link from "next/link";
import ArticleListItem from "../../components/ArticleListItem";
import Head from "next/head";
import { useRouter } from "next/router";
import { MENU_QUERY } from "../../shared/queries";
import Navigation from "../../components/Navigation";

const HOMEPAGE_QUERY = `
query HomePage($limit: IntType, $locale: SiteLocale) {
  allArticles(first: $limit, locale: $locale, orderBy: _publishedAt_DESC) {
    title
    description
    slug
    _publishedAt
  }
  siteInformation(locale: $locale) {
    siteTitle
    siteDescription
  }
}
`;

export async function getStaticProps({ locale }) {
  const data = await request({
    query: HOMEPAGE_QUERY,
    variables: { limit: 10, locale },
  });

  const menuData = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  const siteDescription = await markdownToHtml(
    data.siteInformation.siteDescription
  );

  return {
    props: {
      articles: data.allArticles,
      menu: menuData.menu.navContent,
      siteInformation: {
        ...data.siteInformation,
        siteDescription,
        metaDescription: siteDescription.replace(/(<([^>]+)>)/gi, ""),
      },
    },
  };
}

export default function Home({ siteInformation, articles, menu }) {
  let { locale } = useRouter();
  return (
    <div className="blog-container">
      <Head>
        <title>{siteInformation.siteTitle}</title>
        <meta name="description" content={siteInformation.metaDescription} />
      </Head>

      <Navigation links={menu} />

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
