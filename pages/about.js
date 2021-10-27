import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { request } from "../shared/datocms";
import clsx from "clsx";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { MENU_QUERY } from "../shared/queries";

const ABOUT_QUERY = `
query AboutPage($locale: SiteLocale) {
  aboutPage(locale: $locale) {
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
}
`;

export async function getStaticProps({ locale }) {
  const data = await request({
    query: ABOUT_QUERY,
    variables: { locale },
  });
  const menuData = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  return {
    props: {
      menu: menuData.menu.navContent,
      seo: data.aboutPage.seo,
      pictureOfMe: data.aboutPage.pictureOfMe.responsiveImage,
    },
  };
}

export default function About({ menu, seo, pictureOfMe }) {
  let { locale } = useRouter();

  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Head>

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
      </div>
    </>
  );
}
