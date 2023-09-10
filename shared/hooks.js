import React from "react";

export function useLocalStorage(key) {
  const [item, setItem] = React.useState(null);
  const setItemToLocalStorage = React.useCallback(
    (value) => {
      window.localStorage.setItem(key, JSON.stringify(value));
      setItem((_) => value);
    },
    [key]
  );

  React.useLayoutEffect(() => {
    const isBrowser =
      typeof window !== "undefined" &&
      window.document &&
      window.document.documentElement;

    if (isBrowser) {
      setItem((_) => JSON.parse(window.localStorage.getItem(key)));
    }
  }, [key]);

  return [item, setItemToLocalStorage];
}

export function useDarkMode() {
  const [hasActivatedDarkMode, setHasActivatedDarkMode] =
    useLocalStorage("@dck-dark-mode");

  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const toggle = React.useCallback(() => {
    setHasActivatedDarkMode(!darkModeEnabled);
    setDarkModeEnabled((_) => !darkModeEnabled);
  }, [darkModeEnabled]);

  React.useLayoutEffect(() => {
    const isBrowser =
      typeof window !== "undefined" &&
      window.document &&
      window.document.documentElement;
    if (isBrowser) {
      if (
        typeof hasActivatedDarkMode != "undefined" &&
        hasActivatedDarkMode != null
      ) {
        setDarkModeEnabled((_) => hasActivatedDarkMode);
      } else if (window.matchMedia) {
        setDarkModeEnabled(
          (_) => window.matchMedia("(prefers-color-scheme: dark)").matches
        );
      }
    }
  }, [hasActivatedDarkMode]);

  React.useLayoutEffect(() => {
    if (darkModeEnabled) {
      document.body.parentElement.classList.add("dark");
    } else {
      document.body.parentElement.classList.remove("dark");
    }
  }, [darkModeEnabled]);

  return [darkModeEnabled, toggle];
}
