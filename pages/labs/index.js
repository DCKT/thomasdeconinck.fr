import Head from "next/head";
import Navigation from "../../components/Navigation";
import Seo from "../../components/Seo";
import { MENU_QUERY } from "../../shared/queries";
import { request } from "../../shared/datocms";
import React, { useState } from "react";
import { useBoolean, useDebounce } from "react-use";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { Image } from "react-datocms";
import Link from "next/link";
import markdownToHtml from "../../shared/markdownToHtml";

const QUERY = `
query LabsIndex($locale: SiteLocale) {
  labsIndex(locale: $locale) {
    seo {
      description
      title
      twitterCard
    }
    presentationPicture {
      responsiveImage(imgixParams: {fm: jpg, w: 256, h: 256, }) {
        srcSet
        webpSrcSet
        src
        alt
        title
        width
        height
        aspectRatio
        base64
      }
    }
    presentation
    title
  }
}
`;

export async function getStaticProps({ locale }) {
  const {
    labsIndex: { seo, presentationPicture, presentation, title },
  } = await request({
    query: QUERY,
    variables: { locale },
  });

  const {
    menu: { navContent },
  } = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  const htmlPresentation = await markdownToHtml(presentation);

  return {
    props: {
      menu: navContent,
      seo,
      presentationPicture: presentationPicture.responsiveImage,
      presentation: htmlPresentation,
      title,
    },
  };
}

export default function LabsIndex({
  menu,
  seo,
  presentation,
  presentationPicture,
  title,
}) {
  const experiments = [
    {
      title: "Fnac calculator",
      slug: "fnac-card-calculator",
    },
    {
      title: "Fnac calculator",
      slug: "fnac-card-calculator",
    },
    {
      title: "Fnac calculator",
      slug: "fnac-card-calculator",
    },
    {
      title: "Fnac calculator",
      slug: "fnac-card-calculator",
    },
    {
      title: "Fnac calculator",
      slug: "fnac-card-calculator",
    },
    {
      title: "Fnac calculator",
      slug: "fnac-card-calculator",
    },
  ];

  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        favicon={"https://blog.thomasdeconinck.fr/favicon.ico"}
      />
      <Navigation links={menu} />

      <div className="max-w-screen-md px-4 mx-auto mt-20">
        <div className="flex flex-row gap-8 items-center">
          <Image data={presentationPicture} />
          <div className="flex-grow-0 w-3/4">
            <h1 className="text-4xl dark:text-gray-100 mb-2">{title}</h1>
            <div
              dangerouslySetInnerHTML={{ __html: presentation }}
              className="text-lg tracking-wider dark:text-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-8 mt-20">
          {experiments.map(({ slug }) => {
            return (
              <Link key={slug} href={`/labs/${slug}`} passHref>
                <a className="group transform duration-200 ease-in-out hover:scale-110">
                  <img
                    src="http://placehold.it/140x140"
                    className="transition-shadow duration-200 ease-in-out rounded-lg shadow-lg w-full group-hover:shadow-xl"
                  />
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
