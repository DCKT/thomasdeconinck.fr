import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import markdownToHtml from "../shared/markdownToHtml";
import { request } from "../shared/datocms";
import clsx from "clsx";
import Link from "next/link";
import Navigation from "../components/Navigation";
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
    xlResPicture: picture {
      responsiveImage(imgixParams: {fm: jpg, w: 850, h: 850 }) {
        srcSet
        webpSrcSet
        src
        title
      }
    }
    lgResPicture : picture {
      responsiveImage(imgixParams: {fm: jpg, w: 700, h: 700 }) {
        srcSet
        webpSrcSet
      }
    }
    lowResPicture: picture {
      responsiveImage(imgixParams: {fm: jpg, w: 500, h: 500 }) {
        src
        alt
      }
    }
  }
}
`;

export async function getStaticProps({ locale }) {
  const {
    homepage: {
      hello,
      xlResPicture,
      lgResPicture,
      lowResPicture,
      seo,
      presentation,
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
      xlResPicture: xlResPicture.responsiveImage,
      lgResPicture: lgResPicture.responsiveImage,
      lowResPicture: lowResPicture.responsiveImage,
      seo: seo,
      menu: menu.navContent,
    },
  };
}

export default function Home({
  hello,
  xlResPicture,
  lgResPicture,
  lowResPicture,
  presentation,
  menu,
  seo,
}) {
  let { locale } = useRouter();

  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Head>

      <Navigation links={menu} />

      <div className="max-w-screen-lg 2xl:max-w-screen-2xl mx-auto pt-10 md:pt-10 lg:pt-24 xl:pt-28 flex items-center justify-between px-4 lg:px-0 lg:flex-row flex-col-reverse">
        <div className="text-center lg:text-left ">
          <p
            className={
              "2xl:text-[6rem] lg:text-[4rem] text-[3rem] italic mt-10 lg:mt-0 dark:text-gray-100 tracking-wider"
            }
          >
            {hello}
          </p>

          <div
            className="2xl:text-[2.3rem] lg:text-[1.75rem] text-[1.50rem] font-light dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: presentation }}
          />
        </div>
        <picture className="md:w-[700px] xl:w-[850px] mr-0  lg:-mr-40 animate-upScale motion-reduce:transition-none motion-reduce:transform-none">
          <source
            media="(min-width: 1280px)"
            srcSet={xlResPicture.webpSrcSet}
            type="image/webp"
          />
          <source media="(min-width: 1280px)" srcSet={xlResPicture.srcSet} />

          <source
            media="(min-width: 768px)"
            srcSet={lgResPicture.webpSrcSet}
            type="image/webp"
          />
          <source media="(min-width: 768px)" srcSet={lgResPicture.srcSet} />
          <source
            media="(min-width: 768px)"
            srcSet={lgResPicture.webpSrcSet}
            type="image/webp"
          />
          <source media="(min-width: 768px)" srcSet={lgResPicture.srcSet} />
          <img src={lowResPicture.src} alt={lowResPicture.alt} loading="lazy" />
        </picture>
      </div>
    </>
  );
}
