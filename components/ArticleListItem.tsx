import { Link } from "shared/navigation";

export type ArticleListItemProps = {
  title: string;
  description: string;
  date: string;
  slug: string;
  splash: {
    webpSrcSet: string;
    src: string;
    alt: string;
  };
};

export default function ArticleListItem({
  title,
  description,
  date,
  slug,
  splash,
}: ArticleListItemProps) {
  const formattedDate = new Intl.DateTimeFormat("fr", {
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
          className="rounded shadow-lg border"
        />
      </picture>
      <h3 className="text-2xl md:text-xl font-semibold mb-1 text-orange-500">
        <Link href={`/blog/${slug}`}>{title}</Link>
      </h3>
      <small className="text-xs">{formattedDate}</small>
      <p className="text-md">{description}</p>
    </div>
  );
}
