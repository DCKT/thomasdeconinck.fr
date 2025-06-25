import { BlogPosts } from "app/components/posts";

export const metadata = {
  title: "Blog",
  description: "Mostly technical things",
};

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-4xl mb-8 font-title">My Blog</h1>
      <BlogPosts />
    </section>
  );
}
