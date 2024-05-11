import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");
  return (
    <main className="h-full flex md:items-center justify-center">
      <div className="flex flex-col md:flex-row items-center md:justify-center md:-mt-[200px]">
        <div>
          <h2 className="text-xl md:text-4xl font-light mb-4">{t("title")}</h2>
          <Link href="/" className="underline">
            {t("back")}
          </Link>
        </div>
        <Image src={"/lost.gif"} width={400} height={400} alt="Lost" />
      </div>
    </main>
  );
}
