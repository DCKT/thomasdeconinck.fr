import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "shared/navigation";

export default createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
});

export const config = {
  // Match only internationalized pathnames
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/", "/(fr|en)/:path*"],
};
