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
      responsiveImage(imgixParams: {fm: jpg, w: 200, h: 200, }) {
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
    items: item {
      name
      slug
      githubLink
      externalLink
      icon {
        responsiveImage(imgixParams: {fm: jpg, w: 196, h: 196}) {
          srcSet
          webpSrcSet
          src
          alt
          title
          width
          height
          aspectRatio
        }
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
    labsIndex: { seo, presentationPicture, presentation, title, items },
    _site: {
      favicon: { url: faviconUrl },
    },
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
      items,
      faviconUrl,
    },
  };
}

export default function LabsIndex({
  menu,
  seo,
  presentation,
  presentationPicture,
  title,
  items,
  faviconUrl,
}) {
  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        favicon={faviconUrl}
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

        <div className="flex flex-col gap-8 mt-20 pb-10">
          {items.map(({ slug, name, icon, githubLink, externalLink }) => {
            let link = externalLink || `/${slug}`;
            return (
              <div key={slug} className="flex flex-row gap-8 items-center">
                <Link href={link} passHref>
                  <a target={"_blank"}>
                    <Image
                      data={icon.responsiveImage}
                      className="w-32 flex-shrink-0"
                    />
                  </a>
                </Link>

                <div className="flex flex-col">
                  <Link href={link} passHref>
                    <a target={"_blank"} className="text-2xl text-purple-300">
                      {name}
                    </a>
                  </Link>

                  <Link href={githubLink} passHref>
                    <a target={"_blank"} className="underline text-purple-300">
                      <FormattedMessage id="labs.sourceCode" />
                    </a>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
