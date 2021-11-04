import Link from "next/link";

export default function ArticleListItem({
  title,
  description,
  date,
  slug,
  locale,
  splash,
}) {
  const formattedDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
  }).format(new Date(date));

  return (
    <div className="mb-6">
      <picture className="rounded hidden md:block shadow-lg">
        <source
          media="(min-width: 768px)"
          srcSet={splash.webpSrcSet}
          type="image/webp"
        />
        <img
          src={splash.src}
          alt={splash.alt}
          className="rounded shadow-lg border dark:border-0"
        />
      </picture>
      <h3 className="text-2xl md:text-xl font-semibold mb-1 text-orange dark:text-orange">
        <Link href={`/blog/${slug}`}>{title}</Link>
      </h3>
      <small className="text-xs">{formattedDate}</small>
      <p className="text-md">{description}</p>
    </div>
  );
}
