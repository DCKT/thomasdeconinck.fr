import Head from "next/head";
import Navigation from "../../components/Navigation";
import { MENU_QUERY } from "../../shared/queries";
import { request } from "../../shared/datocms";
import React, { useState } from "react";
import { useBoolean, useDebounce } from "react-use";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { addYears, differenceInDays, isAfter } from "date-fns";
import Link from "next/link";
import { MdOutlineKeyboardBackspace } from "react-icons/md";

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

export default function IsChristmasSoon({ menu }) {
  const intl = useIntl();
  const today = new Date();
  const christmas = new Date(`${today.getFullYear()}-12-25`);

  const numberOfDaysBeforeChristmas = isAfter(today, christmas)
    ? differenceInDays(christmas, addYears(christmas, 1))
    : -differenceInDays(today, christmas);

  const expression = () => {
    if (numberOfDaysBeforeChristmas > 30) {
      return "😴";
    } else if (numberOfDaysBeforeChristmas > 15) {
      return "😳";
    } else if (numberOfDaysBeforeChristmas > 10) {
      return "😁";
    } else if (numberOfDaysBeforeChristmas > 1) {
      return "😗";
    } else {
      return "🥳";
    }
  };

  return (
    <>
      <Head>
        <title>
          {intl.formatMessage({
            id: "labs.christmasSoonTitle",
          })}
        </title>
        <meta
          name="description"
          content={intl.formatMessage({
            id: "labs.christmasSoonDescription",
          })}
        />
      </Head>
      <Navigation links={menu} />

      <div className="max-w-screen-md mx-auto mt-20 text-center">
        <Link href="/labs" passHref>
          <a className="flex flex-row items-center gap-4 text-lg dark:text-gray-300 mb-10 hover:text-purple-500 dark:hover:text-purple-300 group">
            <MdOutlineKeyboardBackspace className="border-2 rounded-full border-gray-800 dark:border-gray-200 block w-10 h-10 p-1 group-hover:border-purple-500 dark:group-hover:border-purple-300" />
            <FormattedMessage id="labs.back" defaultMessage="Back to the lab" />
          </a>
        </Link>
        <h1 className="text-4xl dark:text-gray-200 mb-10 font-light">
          <FormattedMessage id="labs.christmasSoonTitle" />
        </h1>

        <h3 className="dark:text-gray-200 text-3xl">
          <FormattedMessage
            id="labs.christmasSoonInXDays"
            defaultMessage={"Still {number} days before christmas"}
            values={{ number: numberOfDaysBeforeChristmas }}
          />
          <span className="ml-4">{expression()}</span>
        </h3>
      </div>
    </>
  );
}
