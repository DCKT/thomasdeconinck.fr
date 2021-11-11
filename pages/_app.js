import { IntlProvider } from "react-intl";
import { useRouter } from "next/router";
import { useMemo } from "react";
import "../styles/globals.css";
import "../styles/prism-theme.css";

import French from "../locales/fr.json";
import English from "../locales/en.json";

function MyApp({ Component, pageProps }) {
  const { locale } = useRouter();
  const [shortLocale] = locale ? locale.split("-") : ["en"];

  const messages = useMemo(
    function handleLocale() {
      switch (shortLocale) {
        case "fr":
          return French;
        case "en":
          return English;
        default:
          return French;
      }
    },
    [shortLocale]
  );

  return (
    <IntlProvider locale={shortLocale} messages={messages} onError={() => null}>
      <Component {...pageProps} />
    </IntlProvider>
  );
}

export default MyApp;
