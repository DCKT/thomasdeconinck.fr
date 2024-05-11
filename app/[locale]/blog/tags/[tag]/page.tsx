import { request } from "../../../../../shared/datocms";
import { Link } from "shared/navigation";
import clsx from "clsx";
import Image from "next/image";
import {
  AllArticlesTagsDocument,
  AllArticlesTagsQuery,
  PostsByTagDocument,
  PostsByTagQuery,
} from "graphql/generated";
import { uniq, flatten } from "lodash";
import { unstable_setRequestLocale } from "next-intl/server";

export async function generateStaticParams() {
  const { allArticles } = await request<AllArticlesTagsQuery>({
    query: AllArticlesTagsDocument,
  });

  return uniq(flatten(allArticles.map(({ tags }) => tags!.split(",")))).map(
    (tag) => ({
      tag: tag.trim(),
    })
  );
}

async function getArticlesByTag(tag: string, locale: string) {
  const data = await request<PostsByTagQuery>({
    query: PostsByTagDocument,
    variables: { tag: tag, locale },
  });

  return data.allArticles;
}

export default async function Tag({
  params: { locale, tag },
}: {
  params: { locale: string; tag: string };
}) {
  unstable_setRequestLocale(locale);
  const articles = await getArticlesByTag(tag, locale);

  return (
    <div className="blog-container">
      <div className="mt-16 max-w-screen-xl mx-auto px-4 pb-10">
        <h1 className="text-4xl font-bold mt-8  text-center mb-20">
          <span className="text-orange-500 ">{tag}</span>
        </h1>

        <div className="grid md:grid-flow-row sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10">
          {articles.map(
            ({ title, description, _createdAt, slug, splash }, i) => {
              return (
                <div
                  key={slug}
                  className={clsx("flex flex-col shadow-xl", {
                    "border-t border-gray-400  pt-4 md:border-0 md:pt-0": i > 0,
                  })}
                >
                  <Link
                    href={`/blog/${slug}`}
                    className={
                      "relative md:h-[500px] rounded-lg cursor-pointer blog-item z-10"
                    }
                    style={{
                      backgroundImage: `url(${splash?.responsiveImage?.base64})`,
                      backgroundSize: "cover",
                    }}
                  >
                    <picture className="absolute left-0 top-0 w-full rounded-lg hidden md:block mb-4 h-full">
                      <source
                        srcSet={splash?.responsiveImage?.webpSrcSet}
                        type="image/webp"
                      />
                      <source srcSet={splash?.responsiveImage?.srcSet} />
                      <img
                        src={splash?.responsiveImage?.src}
                        alt={splash?.responsiveImage?.alt || ""}
                        loading="lazy"
                        className="block rounded-lg border  w-full h-full "
                      />
                    </picture>

                    <div className="flex  flex-col md:bg-[rgba(24,24,24,0.7)] md:absolute bottom-0 p-4  rounded-t-lg md:rounded-t-none rounded-b-lg w-full">
                      <small className="text-base font-light text-gray-900 md:text-gray-300  mb-2 block">
                        {_createdAt
                          ? new Intl.DateTimeFormat("fr-FR", {
                              dateStyle: "full",
                            }).format(new Date(_createdAt))
                          : null}
                      </small>
                      <h3 className="text-xl font-semibold text-gray-900 md:text-gray-100  order-first md:order-none">
                        {title}
                      </h3>
                      <p className="md:hidden text-lg md:text-base text-gray-900 ">
                        {description}
                      </p>
                    </div>
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
