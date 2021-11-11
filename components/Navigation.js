import React from "react";
import Link from "next/link";
import { HiMenu } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import clsx from "clsx";
import { useSsr, useLocalStorage, useDarkMode } from "../shared/hooks";
import { BsSunFill, BsMoonStarsFill } from "react-icons/bs";

const DarkModeToggler = () => {
  const { isServer, isBrowser } = useSsr();

  // useEffect & useLayoutEffect can't be used on server side
  if (isServer) {
    return null;
  }

  const [darkModeEnabled, toggleDarkMode] = useDarkMode();

  return (
    <label
      htmlFor="dmcheck"
      className={clsx(
        "select-none relative w-14 h-6 border dark:border-gray-700 rounded-full flex items-center cursor-pointer transition-colors ease-in duration-150 bg-gray-50 dark:bg-gray-700"
      )}
    >
      <input
        className="dmcheck absolute opacity-0"
        type="checkbox"
        checked={darkModeEnabled}
        onChange={(_) => toggleDarkMode()}
        id="dmcheck"
      />
      <div
        className={clsx(
          "border dark:border-gray-500 inline-block w-8 h-8 rounded-full absolute shadow bg-white dark:bg-gray-800 transition-all ease-in duration-250",
          {
            "left-0": !darkModeEnabled,
            "translate-x-6": darkModeEnabled,
          }
        )}
      >
        <BsSunFill
          size={16}
          color="#374151"
          className={clsx(
            "transition-opacity ease-in-out duration-150 absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2",
            {
              "opacity-0": !!darkModeEnabled,
            }
          )}
        />
        <BsMoonStarsFill
          size={16}
          color="#F9FAFB"
          className={clsx(
            "transition-opacity ease-in-out duration-150 absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2",
            {
              "opacity-0": !darkModeEnabled,
            }
          )}
        />
      </div>
    </label>
  );
};

export default function Navigation({ links }) {
  const { isBrower } = useSsr();
  let [isMenuVisible, setMenuVisible] = React.useState(false);

  React.useEffect(
    function handleMenuVisibility() {
      if (isMenuVisible) {
        document.body.classList.add("menu--open");
      } else {
        document.body.classList.remove("menu--open");
      }
    },
    [isMenuVisible]
  );

  return (
    <nav className="relative flex items-center md:items-start justify-between py-8 px-4 lg:px-0 max-w-screen-lg 2xl:max-w-screen-2xl mx-auto">
      <Link href="/" passHref>
        <a className="font-bold text-2xl menu-link dark:text-white tracking-wider">
          Thomas Deconinck
        </a>
      </Link>

      <button
        className="border-2 border-black rounded-full md:hidden relative w-12 h-12 dark:border-gray-300 dark:text-gray-300"
        onClick={(e) => {
          e.preventDefault();
          setMenuVisible((v) => !v);
        }}
      >
        <HiMenu
          size={32}
          className={clsx(
            "absolute left-1/2 top-1/2 -translate-x-2/4 -translate-y-2/4 transition-opacity ease-in-out duration-150 ",
            {
              "opacity-100": !isMenuVisible,
              "opacity-0": isMenuVisible,
            }
          )}
        />
        <IoMdClose
          size={32}
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
          "absolute  md:h-auto top-full  left-0 w-full md:w-auto md:static flex flex-col md:flex-row items-center md:items-start md:gap-12  transition-all ease-in-out duration-200",
          {
            "h-[100vh] opacity-100 z-40 bg-white dark:bg-gray-900":
              isMenuVisible,
            "h-0 z-[-1] md:z-auto opacity-0 md:opacity-100": !isMenuVisible,
          }
        )}
      >
        {links.map(({ label, url }) => {
          return (
            <li
              key={label}
              className="border-t md:border-none w-full md:w-auto dark:border-gray-500"
            >
              <Link href={url} passHref>
                <a className="tracking-wider text-xl p-4 md:p-0 inline-block h-full md:h-auto menu-link w-full dark:text-gray-300 dark:hover:text-white">
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
  );
}
