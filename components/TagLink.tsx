import { Link } from "shared/navigation";

export default function TagLink({ tag }: { tag: string }) {
  let parsedTag = tag.trim();

  return (
    <Link
      href={`/blog/tags/${encodeURIComponent(parsedTag)}`}
      className="bg-slate-900 px-3 py-0.5 text-sm rounded-full text-white hover:bg-orange-400 "
    >
      {parsedTag}
    </Link>
  );
}
