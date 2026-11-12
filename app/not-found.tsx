import Link from "next/link";
import { PageHead } from "app/components/page-head";

export default function NotFound() {
  return (
    <main className="page">
      <PageHead jp="売り切れ · Sold out" title="404">
        This shelf is empty: the page you are looking for does not exist.
      </PageHead>
      <Link href="/" className="back">
        ← Back to the store
      </Link>
    </main>
  );
}
