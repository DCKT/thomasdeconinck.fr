import { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Pick a locale that is representative of the app
  const locale = "fr";

  const t = await getTranslations({
    namespace: "Manifest",
    locale,
  });

  return {
    name: t("name"),
    start_url: "/",
    theme_color: "#fff",
  };
}
