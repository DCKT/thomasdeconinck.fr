import { request } from "../../shared/datocms";
import markdownToHtml from "../../shared/markdownToHtml";
import Bio from "../../shared/Bio";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect } from "react";
import flatten from "lodash/flatten";
import uniq from "lodash/uniq";
import ArticleListItem from "../../shared/ArticleListItem";

const TAGGED_POSTS_QUERY = `
query Posts($tag: String!) {
  allArticles(filter: {tags: {matches: {pattern: $tag}}}) {
    title
    description
    slug
    _publishedAt
  }
  siteInformation {
    siteTitle
    siteDescription
  }
}`;

const TEST_QUERY = `
query AllArticles {
  allArticles {
    tags
  }
}`;

export async function getStaticPaths() {
  const data = await request({
    query: TEST_QUERY,
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

export async function getStaticProps({ params }) {
  const data = await request({
    query: TAGGED_POSTS_QUERY,
    variables: { tag: params.tag },
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
      },
    },
  };
}

export default function Tag({ articles, siteInformation }) {
  const router = useRouter();
  const { tag } = router.query;

  return (
    <div className="blog-container">
      <Head>
        <title>{siteInformation.siteTitle}</title>
        <meta name="description" content={siteInformation.siteDescription} />
      </Head>

      <Link href="/">
        <h3 className="text-gray-700 dark:text-gray-200 text-2xl lg:text-3xl text-center mt-4 mb-8 font-bold cursor-pointer">
          {siteInformation.siteTitle}
        </h3>
      </Link>

      <Bio content={siteInformation.siteDescription} />

      <h1 className="text-4xl font-bold mt-8">Articles : {tag}</h1>

      <div className="mt-16">
        {articles.map(({ title, description, _publishedAt, slug }, i) => {
          return (
            <ArticleListItem
              key={i}
              title={title}
              description={description}
              date={_publishedAt}
              slug={slug}
            />
          );
        })}
      </div>
    </div>
  );
}
