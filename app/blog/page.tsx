import { BlogPosts } from "app/components/posts";

export const metadata = {
  title: "Blog",
  description: "Mostly technical things",
};

export default function Page() {
  return (
    <section>
      <div
        className="mb-8 px-5 py-4"
        style={{
          backgroundColor: "#d4a84b",
          border: "4px solid #2a1810",
          outline: "2px solid #c0392b",
          outlineOffset: "-8px",
          boxShadow: "5px 5px 0 #2a1810",
        }}
      >
        <h1
          className="text-4xl text-center"
          style={{
            fontFamily: "var(--font-display)",
            color: "#2a1810",
            letterSpacing: "0.08em",
          }}
        >
          My Blog
        </h1>
      </div>
      <BlogPosts />
    </section>
  );
}
