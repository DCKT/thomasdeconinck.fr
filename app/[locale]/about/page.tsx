import React from "react";
import { request } from "../../../shared/datocms";
import markdownToHtml from "../../../shared/markdownToHtml";
import { Metadata } from "next";
import {
  AboutPageDocument,
  AboutPageQuery,
  AboutPageSEODocument,
  AboutPageSEOQuery,
} from "graphql/generated";
import { unstable_setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const { aboutPage } = await request<AboutPageSEOQuery>({
    query: AboutPageSEODocument,
  });

  return {
    title: aboutPage?.seo?.title,
    description: aboutPage?.seo?.description,
  };
}

async function getPageData(locale: string) {
  const { aboutPage } = await request<AboutPageQuery>({
    query: AboutPageDocument,
    variables: { locale },
  });

  const htmlDescription = await markdownToHtml(aboutPage!.description);

  return {
    pictureOfMe: aboutPage!.pictureOfMe.responsiveImage!,
    description: htmlDescription,
  };
}

export default async function About({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const { pictureOfMe, description } = await getPageData(locale);

  return (
    <>
      <div className="max-w-screen-md mx-auto pt-10 md:pt-24">
        <div
          className="relative w-64 h-64 mx-auto rounded-2xl animate-upScale"
          style={{
            backgroundImage: `url(${pictureOfMe.base64})`,
            backgroundSize: "cover",
          }}
        >
          <div style={{ paddingTop: 100 / pictureOfMe.aspectRatio }} />

          <picture className="absolute left-0 top-0 w-full">
            <source srcSet={pictureOfMe.webpSrcSet} type="image/webp" />
            <source srcSet={pictureOfMe.srcSet} />
            <img
              src={pictureOfMe.src}
              alt={pictureOfMe.alt || ""}
              loading="lazy"
              width={pictureOfMe.width}
              height={pictureOfMe.height}
              className="block rounded-2xl  mx-auto shadow-lg "
            />
          </picture>
        </div>

        <div className="max-w-screen-sm mx-auto text-gray-900  about-presentation mt-10 pb-10 px-4">
          <div dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      </div>
    </>
  );
}
