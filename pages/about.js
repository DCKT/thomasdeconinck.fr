import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { request } from "../shared/datocms";
import clsx from "clsx";
import Link from "next/link";
import Navigation from "../components/Navigation";
import Seo from "../components/Seo";
import { MENU_QUERY } from "../shared/queries";
import markdownToHtml from "../shared/markdownToHtml";

const ABOUT_QUERY = `
query AboutPage($locale: SiteLocale) {
  aboutPage(locale: $locale) {
    description
    pictureOfMe {
      responsiveImage(imgixParams: {fm: jpg, w: 256, h: 256, fit: crop, crop: faces }) {
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

    seo {
      description
      title
      twitterCard
    }
  }

  _site {
    favicon {
      url
    }
  }
}
`;

export async function getStaticProps({ locale }) {
  const {
    aboutPage: { seo, pictureOfMe, description },
    _site: {
      favicon: { url: faviconUrl },
    },
  } = await request({
    query: ABOUT_QUERY,
    variables: { locale },
  });
  const {
    menu: { navContent },
  } = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  const htmlDescription = await markdownToHtml(description);

  return {
    props: {
      menu: navContent,
      seo: seo,
      pictureOfMe: pictureOfMe.responsiveImage,
      description: htmlDescription,
      faviconUrl,
    },
  };
}

export default function About({
  menu,
  seo,
  pictureOfMe,
  description,
  faviconUrl,
}) {
  let { locale } = useRouter();

  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        favicon={faviconUrl}
      />

      <Navigation links={menu} />

      <div className="max-w-screen-md mx-auto pt-10 md:pt-24">
        <div
          className="relative w-64 h-64 mx-auto rounded-full animate-rollingStone"
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
              alt={pictureOfMe.alt}
              loading="lazy"
              width={pictureOfMe.width}
              height={pictureOfMe.height}
              className="block rounded-full border-8 mx-auto shadow-lg border-gray-100 dark:border-gray-200"
            />
          </picture>
        </div>

        <div className="max-w-screen-sm mx-auto text-gray-900 dark:text-gray-400 about-presentation mt-10 pb-10">
          <div dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      </div>
    </>
  );
}
