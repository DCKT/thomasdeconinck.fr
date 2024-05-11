import Head from "next/head";
import React from "react";
import { addYears, differenceInDays, isAfter } from "date-fns";
import { Link } from "shared/navigation";
import { MdOutlineKeyboardBackspace } from "react-icons/md";

export default function IsChristmasSoon() {
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
        <title>C'est bientôt Noël ?</title>
        <meta
          name="description"
          content={"Découvrez combien de jours il reste avant Noël"}
        />
      </Head>

      <div className="max-w-screen-md mx-auto mt-20 text-center">
        <Link
          href="/labs"
          className="flex flex-row items-center gap-4 text-lg  mb-10 hover:text-purple-500 -300 group"
        >
          <MdOutlineKeyboardBackspace className="border-2 rounded-full border-gray-800  block w-10 h-10 p-1 group-hover:border-purple-500 " />
        </Link>
        <h1 className="text-4xl  mb-10 font-light">C'est bientôt Noël ?</h1>

        <h3 className="text-3xl">
          {numberOfDaysBeforeChristmas} jours avant Noël
          <span className="ml-4">{expression()}</span>
        </h3>
      </div>
    </>
  );
}
