import Head from "next/head";
import Navigation from "../../components/Navigation";
import { MENU_QUERY } from "../../shared/queries";
import { request } from "../../shared/datocms";
import React, { useState } from "react";
import { useDebounce } from "react-use";
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

const Card = ({ label, count, cost }) => {
  return (
    <div>
      <div className="dark:bg-gray-700 inline-flex flex-row items-center gap-4 rounded-lg border-4 shadow-lg dark:border-gray-500">
        <p className="text-2xl tracking-wider font-semibold p-4 dark:text-gray-300">
          {label}
        </p>
        <span className="border-l-4 text-4xl p-4 dark:text-gray-100 dark:border-gray-500">
          {count}
        </span>
      </div>
      {cost > 0 ? (
        <p className="dark:text-gray-400 font-light mt-2">
          <FormattedMessage id="labs.fnacCost" /> :{" "}
          <span className="dark:text-gray-200 tracking-wider">
            <FormattedNumber value={cost} style="currency" currency="EUR" />
          </span>
        </p>
      ) : (
        React.null
      )}
    </div>
  );
};

export default function FnacCardCalculator({ menu }) {
  const intl = useIntl();
  const [price, setPrice] = useState(null);
  const [result, setResult] = useState(null);

  useDebounce(
    () => {
      if (price) {
        let card150Count = Math.floor(price / 150);
        let card60Count = 0;
        let remain = price - 150 * card150Count;

        if (remain >= 60) {
          card60Count = Math.floor(remain / 60);
          remain = remain - 60 * card60Count;
        }

        setResult({
          card150Count,
          card60Count,
          remain,
        });
      } else {
        setResult(null);
      }
    },
    500,
    [price]
  );

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

      <div className="max-w-screen-md mx-auto mt-20 text-center">
        <h1 className="text-4xl dark:text-gray-200 mb-10">
          <FormattedMessage id="labs.fnacTitle" />
        </h1>

        <div className="flex flex-row justify-center items-center gap-2 ">
          <input
            type="number"
            className="border-2 rounded h-16 w-50 py-2 px-3 text-xl font-bold hover:border-purple-400"
            onChange={(event) => {
              const value = event.target.value;

              if (!!value) {
                setPrice(parseInt(value));
              }
            }}
          />
          <span className="text-4xl dark:text-gray-400">€</span>
        </div>

        {result ? (
          <div className="mt-20">
            <div className=" flex flex-row gap-8 justify-center">
              <Card
                label={"Carte 150€"}
                count={result.card150Count}
                cost={result.card150Count * 130}
              />
              <Card
                label={"Carte 60€"}
                count={result.card60Count}
                cost={result.card60Count * 50}
              />
            </div>
            <div className="">
              <div className="mt-8 flex flex-row gap-10 items-center justify-center">
                <h3 className="text-3xl dark:text-gray-400 font-light w-60 text-right">
                  <FormattedMessage id="labs.fnacRemain" />
                </h3>
                <span className="dark:text-white text-4xl">
                  <FormattedNumber
                    value={result.remain}
                    style="currency"
                    currency="EUR"
                  />
                </span>
              </div>
              <div className="mt-8 flex flex-row gap-10 items-center justify-center">
                <h3 className="text-3xl dark:text-gray-400 font-light w-60 text-right">
                  <FormattedMessage id="labs.fnacCostPrice" />
                </h3>
                <span className="dark:text-white text-4xl">
                  <FormattedNumber
                    value={
                      result.card150Count * 130 +
                      result.card60Count * 50 +
                      result.remain
                    }
                    style="currency"
                    currency="EUR"
                  />
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
