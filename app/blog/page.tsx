import { PostAisles } from "app/components/posts";
import { PageHead } from "app/components/page-head";
import { getBlogPosts } from "app/blog/utils";

export const metadata = {
  title: "Blog",
  description: "Mostly technical things",
};

export default function Page() {
  return (
    <main className="page">
      <PageHead jp="雑誌コーナー · Magazine rack" title="Blog">
        Mostly technical things: ReScript, Effect, terminals and side projects.
      </PageHead>
      <PostAisles posts={getBlogPosts()} basePath="/blog" />
    </main>
  );
}
