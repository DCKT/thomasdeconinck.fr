import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import markdownToHtml from "../shared/markdownToHtml";
import { request } from "../shared/datocms";
import clsx from "clsx";
import Link from "next/link";
import Navigation from "../components/Navigation";
import Seo from "../components/Seo";
import { MENU_QUERY } from "../shared/queries";
import { Image } from "react-datocms";

const HOMEPAGE_QUERY = `
query HomePage($locale: SiteLocale) {
  homepage(locale: $locale) {
    hello
    presentation
    seo: pageTitle {
      description
      title
      twitterCard
    }
    picture {
      responsiveImage(imgixParams: {fit: fill, w: 850, h: 850, auto: format }) {
        srcSet
        webpSrcSet
        sizes
        src

        # size information (post-transformations)
        width
        height
        aspectRatio
        alt
        title
     }
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
    homepage: { hello, picture, seo, presentation },
    _site: {
      favicon: { url: faviconUrl },
    },
  } = await request({
    query: HOMEPAGE_QUERY,
    variables: { locale },
  });

  const { menu } = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  const parsedPresentation = await markdownToHtml(presentation);

  return {
    props: {
      hello: hello,
      presentation: parsedPresentation,
      picture: picture.responsiveImage,
      seo: seo,
      menu: menu.navContent,
      faviconUrl,
    },
  };
}

export default function Home({
  hello,
  picture,
  presentation,
  menu,
  seo,
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

      <div className="max-w-screen-lg 2xl:max-w-screen-2xl mx-auto pt-10 md:pt-10 lg:pt-24 xl:pt-28 flex items-center justify-between px-4 lg:px-0 lg:flex-row flex-col-reverse">
        <div className="text-center lg:text-left ">
          <p
            className={
              "2xl:text-[6rem] lg:text-[4.5rem] text-[3rem] italic mt-10 lg:mt-0 dark:text-gray-100 tracking-wider"
            }
          >
            {hello}
          </p>

          <div
            className="2xl:text-[2.3rem] lg:text-[1.75rem] text-[1.50rem] font-light dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: presentation }}
          />
        </div>
        <Image
          data={picture}
          className="md:!w-[680px] xl:!w-[740px] 2xl:w-[850px] mr-0  lg:-mr-24  animate-upScale motion-reduce:transition-none motion-reduce:transform-none"
        />
      </div>
    </>
  );
}
