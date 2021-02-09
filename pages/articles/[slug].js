import { request } from "../../shared/datocms";
import markdownToHtml from "../../shared/markdownToHtml";
import Bio from "../../shared/Bio";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect } from "react";
import flatten from "lodash/flatten";
import DarkModeToggler from "../../shared/DarkModeToggler";

const POST_QUERY = `
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

const TEST_QUERY = `
query AllArticles {
  articles: allArticles {
    slugs: _allSlugLocales {
      locale
      slug: value
    }
  }
}
`;

export async function getStaticPaths() {
  const data = await request({
    query: TEST_QUERY,
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

export async function getStaticProps({ params, locale }) {
  const data = await request({
    query: POST_QUERY,
    variables: { slug: params.slug, locale },
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
    },
  };
}

export default function Article({
  title,
  content,
  description,
  tags,
  _publishedAt,
  siteInformation,
}) {
  const { locale } = useRouter();

  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
  }).format(new Date(_publishedAt));

  return (
    <div className="blog-container">
      <Head>
        <title>{title}</title>
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="description" content={description} />
        <meta
          property="og:site_name"
          content={siteInformation.siteInformation}
        />
        <meta property="og:description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="follow, index" />
        <meta charSet="utf-8" />
      </Head>

      <div className="flex flex-row justify-center items-center mb-4">
        <h4 className="text-lg font-bold mr-4">
          <Link href="/">{siteInformation.siteTitle}</Link>
        </h4>
        <DarkModeToggler />
      </div>

      <h1 className="text-4xl font-bold leading-snug">{title}</h1>
      <div className="flex flex-row flex-wrap gap-x-2 mt-6 mb-2">
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
      <small>{formattedDate}</small>

      <main
        className="html mt-8"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <div className="mt-10 border-t pt-6 border-gray-500">
        <Bio content={siteInformation.siteDescription} />
      </div>
    </div>
  );
}
