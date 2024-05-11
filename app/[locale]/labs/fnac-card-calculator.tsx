import Head from "next/head";
import React, { useState } from "react";
import { useBoolean, useDebounce } from "react-use";

const Card = ({
  label,
  count,
  cost,
}: {
  label: string;
  count: number;
  cost: number;
}) => {
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
          Coût :
          <span className="dark:text-gray-200 tracking-wider">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(cost)}
          </span>
        </p>
      ) : null}
    </div>
  );
};

type Result = {
  card150Count: number;
  card60Count: number;
  remain: number;
};

export default function FnacCardCalculator() {
  const [price, setPrice] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [prior60, togglePrior60] = useBoolean(false);

  useDebounce(
    () => {
      if (price) {
        let priorCardCount = Math.floor(price / (prior60 ? 60 : 150));
        let otherCards = 0;
        let remain = price - (prior60 ? 60 : 150) * priorCardCount;

        if (remain >= (prior60 ? 150 : 60)) {
          otherCards = Math.floor(remain / (prior60 ? 150 : 60));
          remain = remain - (prior60 ? 150 : 60) * otherCards;
        }

        setResult({
          card150Count: prior60 ? otherCards : priorCardCount,
          card60Count: prior60 ? priorCardCount : otherCards,
          remain,
        });
      }
    },
    450,
    [price, prior60]
  );

  return (
    <>
      <Head>
        <title>Calculateur carte cadeau Fnac</title>
        <meta
          name="description"
          content={
            "Estimez rapidement combien de cartes cadeaux vous avez besoin sur un prix donné."
          }
        />
      </Head>

      <div className="max-w-screen-md mx-auto mt-20 text-center">
        <h1 className="text-4xl dark:text-gray-200 mb-10">
          Calculateur carte cadeau Fnac
        </h1>

        <div>
          <div className="flex flex-row justify-center items-center gap-2 ">
            <input
              type="number"
              className="border-2 rounded h-16 w-50 py-2 px-3 text-xl font-bold hover:border-purple-400"
              onChange={(event) => {
                const value = event.target.value;

                if (!!value) {
                  setPrice(parseInt(value));
                } else {
                  setPrice(null);
                }
              }}
            />
            <span className="text-4xl dark:text-gray-400">€</span>
          </div>

          <label
            htmlFor="use60CardFirst"
            className="mt-4 block dark:text-gray-400"
          >
            <input
              type="checkbox"
              id="use60CardFirst"
              className="mr-2"
              onChange={(_) => togglePrior60()}
            />
            Favoriser l'usage des cartes de 60€
          </label>
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
                  Restant
                </h3>
                <span className="dark:text-white text-4xl">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(result.remain)}
                </span>
              </div>
              <div className="mt-8 flex flex-row gap-10 items-center justify-center">
                <h3 className="text-3xl dark:text-gray-400 font-light w-60 text-right">
                  Coût de l'achat
                </h3>
                <span className="dark:text-white text-4xl">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(
                    result.card150Count * 130 +
                      result.card60Count * 50 +
                      result.remain
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
