import { BsSunFill, BsMoonStarsFill } from "react-icons/bs";
import clsx from "clsx";
import { useSsr, useLocalStorage, useDarkMode } from "./hooks";
import React from "react";

export default function DarkModeToggler() {
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
}
