import { request } from "shared/datocms";
import "styles/globals.css";
import { MenuDocument, MenuQuery } from "graphql/generated";
import Navigation from "components/Navigation";
import { Lato } from "next/font/google";
import { locales } from "shared/navigation";
import { unstable_setRequestLocale } from "next-intl/server";

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
  variable: "--font-lato",
});

async function getNavigationLinks(locale: string) {
  const { menu } = await request<MenuQuery>({
    query: MenuDocument,
    variables: { locale },
  });

  return menu?.navContent || [];
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const links = await getNavigationLinks(locale);
  return (
    <html lang={locale} className={`${lato.variable}`}>
      <body>
        <Navigation links={links} />
        {children}
      </body>
    </html>
  );
}
