import React from "react";
import markdownToHtml from "shared/markdownToHtml";
import { request } from "shared/datocms";
import { Metadata } from "next";
import { HomePageSEOQuery, HomePageSEODocument } from "graphql/generated";
import ZenGarden from "components/ZenGarden";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const { homepage } = await request<HomePageSEOQuery>({
    query: HomePageSEODocument,
  });

  return {
    title: homepage?.seo?.title,
    description: homepage?.seo?.description,
  };
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations("Index");
  return (
    <div className="flex flex-col  ">
      <ZenGarden />
      <div className="max-w-[800px] mx-auto relative -top-[120px] sm:top-0">
        <h1 className="text-2xl sm:text-5xl font-bold text-center mb-6 duration-75 text-slate-900">
          {t("developer")}
        </h1>
        <ul className="flex flex-row items-center gap-12 text-xl sm:text-2xl text-slate-900 ">
          <li className="slot">
            <p>JavaScript</p>
            <Image
              className="mx-auto mt-1"
              src={"/js-logo.png"}
              alt="JavaScript logo"
              width={50}
              height={50}
            />
          </li>
          <li className="slot">
            <p className="transform ">TypeScript</p>
            <Image
              className="mx-auto mt-1"
              src={"ts-logo.svg"}
              alt="TypeScript logo"
              width={50}
              height={50}
            />
          </li>
          <li className="slot">
            <p className="">ReScript</p>
            <Image
              className="mx-auto mt-1"
              src={"rescript-logo.svg"}
              alt="ReScript logo"
              width={50}
              height={50}
            />
          </li>
        </ul>
      </div>
    </div>
  );
}
