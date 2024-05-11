import { request } from "../../../shared/datocms";
import React from "react";
import { Link } from "shared/navigation";
import markdownToHtml from "../../../shared/markdownToHtml";
import {
  LabsIndexDocument,
  LabsIndexSEODocument,
  LabsIndexSEOQuery,
} from "graphql/generated";
import { useLocale } from "next-intl";
import { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const { labsIndex } = await request<LabsIndexSEOQuery>({
    query: LabsIndexSEODocument,
  });

  return {
    title: labsIndex?.seo?.title,
    description: labsIndex?.seo?.description,
  };
}

async function getData(locale: string) {
  const { labsIndex } = await request({
    query: LabsIndexDocument,
    variables: { locale },
  });

  const htmlPresentation = await markdownToHtml(labsIndex?.presentation || "");

  return {
    // presentationPicture: labsIndex?.presentationPicture.responsiveImage,
    presentation: htmlPresentation,
    title: labsIndex?.title,
    items: labsIndex?.items ?? [],
  };
}

export default async function LabsIndex({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const { presentation, title, items } = await getData(locale);
  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="flex flex-row gap-8 items-center bg-white p-8 rounded-lg shadow-lg">
        <div className="flex-grow-0">
          <h1 className="text-4xl mb-2">{title}</h1>
          <div
            dangerouslySetInnerHTML={{ __html: presentation }}
            className="text-lg tracking-wider "
          />
        </div>
      </div>
    </div>
  );
}
