import { useTranslations } from "next-intl";

export default function UpdatedArticleTag(props: { updatedAt: string }) {
  const t = useTranslations("UpdatedArticleTag");

  return (
    <small className="bg-orange-100 border border-orange-200  self-start px-1 py-0.5 rounded text-sm text-orange-600 first-letter:capitalize">
      {t("updated", {
        date: new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "full",
        }).format(new Date(props.updatedAt)),
      })}
    </small>
  );
}
