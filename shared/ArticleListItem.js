import Link from "next/link";

export default function ArticleListItem({
  title,
  description,
  date,
  slug,
  locale,
}) {
  const formattedDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
  }).format(new Date(date));

  return (
    <div className="mb-6">
      <h3 className="text-2xl font-bold mb-1 text-orange dark:text-orange">
        <Link href={`/blog/${slug}`}>{title}</Link>
      </h3>
      <small className="text-xs">{formattedDate}</small>
      <p className="text-md">{description}</p>
    </div>
  );
}
