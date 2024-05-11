import { LabsIndexDocument } from "graphql/generated";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Image } from "react-datocms";
import { request } from "shared/datocms";
import { Link } from "shared/navigation";

async function getData(locale: string) {
  const { labsIndex } = await request({
    query: LabsIndexDocument,
    variables: { locale },
  });

  return {
    items: labsIndex?.items ?? [],
  };
}

export default async function LabsLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations("LabsIndex");
  const { items } = await getData(locale);

  return (
    <div className="flex flex-row h-[calc(100%-99px)] blueprint p-8">
      <div className="flex flex-col bg-white self-start w-[320px] flex-shrink-0 overflow-y-auto p-4 rounded-lg shadow-lg">
        <h1 className="font-semibold text-2xl border-b-2 mb-2">
          {t("projects")}
        </h1>
        {items.map(({ slug, name, githubLink, externalLink, icon }) => {
          let link = externalLink || `/labs/${slug}`;

          return (
            <div
              key={slug}
              className="flex flex-row border-b py-3 last:border-none"
            >
              <div className="flex flex-col">
                <Link
                  href={link}
                  className="text-lg text-slate-800 hover:underline"
                >
                  {name}
                </Link>

                {githubLink ? (
                  <Link
                    href={githubLink}
                    target={"_blank"}
                    className="text-sm underline text-slate-600"
                  >
                    Github
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <main className="w-full h-full p-4 ">{children}</main>
    </div>
  );
}
