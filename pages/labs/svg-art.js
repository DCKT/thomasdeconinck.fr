import Head from "next/head";
import Navigation from "../../components/Navigation";
import { MENU_QUERY } from "../../shared/queries";
import { request } from "../../shared/datocms";
import React, { useState } from "react";
import { useBoolean, useDebounce } from "react-use";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";

export async function getStaticProps({ locale }) {
  const {
    menu: { navContent },
  } = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  return {
    props: {
      menu: navContent,
    },
  };
}

export default function FnacCardCalculator({ menu }) {
  const intl = useIntl();

  return (
    <>
      <Head>
        <title>
          {intl.formatMessage({
            id: "labs.fnacTitle",
          })}
        </title>
        <meta
          name="description"
          content={intl.formatMessage({
            id: "labs.fnacDescription",
          })}
        />
      </Head>
      <Navigation links={menu} />

      <div className="max-w-[800px] h-[600px] mx-auto border">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
          <defs>
            <linearGradient id="grad1" x1="70%" y1="0%" x2="50%" y2="20%">
              <stop
                offset="0%"
                style={{
                  stopColor: "rgb(255,255,0)",
                  stopOpacity: 1,
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: "rgb(255,0,0)",
                  stopOpacity: 1,
                }}
              />
            </linearGradient>
          </defs>
          <circle cx="400" cy="275" r="150" fill="url(#grad1)" />
        </svg>
      </div>
    </>
  );
}
