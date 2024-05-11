import { createSharedPathnamesNavigation } from "next-intl/navigation";

export const defaultLocale = "fr" as const;
export const locales = ["fr", "en"] as const;
export const localePrefix = "always"; // Default

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales, localePrefix });
