import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import DarkModeToggler from "../shared/DarkModeToggler";
import { request } from "../shared/datocms";
import { HiMenu } from "react-icons/hi";
import { GrClose } from "react-icons/gr";
import clsx from "clsx";
import Link from "next/link";

const HOMEPAGE_QUERY = `
query HomePage($locale: SiteLocale) {
  homepage(locale: $locale) {
    hello
  }
}
`;

const MENU_QUERY = `
  query Menu($locale: SiteLocale) {
    menu(locale: $locale) {
      navContent {
        label
        url
      }
    }
  }
`;

export async function getStaticProps({ locale }) {
  const data = await request({
    query: HOMEPAGE_QUERY,
    variables: { locale },
  });

  const menuData = await request({
    query: MENU_QUERY,
    variables: { locale },
  });

  return {
    props: {
      hello: data.homepage.hello,
      menu: menuData.menu.navContent,
    },
  };
}

export default function Home({ hello, menu }) {
  let { locale } = useRouter();
  let [isMenuVisible, setMenuVisible] = React.useState(false);

  return (
    <div
      className={clsx({
        "fixed w-full h-full overflow-y-hidden": isMenuVisible,
      })}
    >
      <nav className="relative flex items-center md:items-start justify-between py-8 px-4 md:px-0 max-w-screen-lg 2xl:max-w-screen-2xl mx-auto">
        <a href="" className="font-bold text-2xl menu-link">
          Thomas Deconinck
        </a>

        <button
          className="border-2 border-black rounded-full md:hidden relative w-12 h-12 "
          onClick={(e) => {
            e.preventDefault();
            setMenuVisible((v) => !v);
          }}
        >
          <HiMenu
            size={32}
            className={clsx(
              "absolute left-1/2 top-1/2 -translate-x-2/4 -translate-y-2/4 transition-opacity ease-in-out duration-150",
              {
                "opacity-100": !isMenuVisible,
                "opacity-0": isMenuVisible,
              }
            )}
          />
          <GrClose
            size={26}
            className={clsx(
              "absolute left-1/2 top-1/2 -translate-x-2/4 -translate-y-2/4 transition-opacity ease-in-out duration-150",
              {
                "opacity-100": isMenuVisible,
                "opacity-0": !isMenuVisible,
              }
            )}
          />
        </button>

        <ul
          className={clsx(
            "absolute h-[100vh] md:h-auto top-full bg-white left-0 w-full md:w-auto md:static flex flex-col md:flex-row items-center md:items-start md:gap-12  transition-all ease-in-out duration-200",
            {
              "opacity-100": isMenuVisible,
              "z-40": isMenuVisible,
              "z-[-1] md:z-auto opacity-0 md:opacity-100": !isMenuVisible,
            }
          )}
        >
          {menu.map(({ label, url }) => {
            return (
              <li
                key={label}
                className="border-t md:border-none w-full md:w-auto"
              >
                <Link href={url} passHref>
                  <a className="text-xl p-4 md:p-0 inline-block h-full md:h-auto menu-link w-full">
                    {label}
                  </a>
                </Link>
              </li>
            );
          })}

          <li>
            <DarkModeToggler />
          </li>
        </ul>
      </nav>

      <div className="max-w-screen-lg 2xl:max-w-screen-2xl mx-auto pt-40">
        <p className={clsx("2xl:text-[6rem] lg:text-[4rem] italic font-light")}>
          {hello}
        </p>
      </div>
    </div>
  );
}
