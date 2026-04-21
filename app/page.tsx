import { BlogPosts } from "app/components/posts";

export default function Page() {
  return (
    <section>
      {/* Hero title card */}
      <div
        className="mb-10 p-6"
        style={{
          backgroundColor: "#d4a84b",
          border: "4px solid #2a1810",
          outline: "2px solid #c0392b",
          outlineOffset: "-8px",
          boxShadow: "5px 5px 0 #2a1810",
        }}
      >
        <h1
          className="text-5xl text-center"
          style={{
            fontFamily: "var(--font-display)",
            color: "#2a1810",
            letterSpacing: "0.08em",
            textShadow: "2px 2px 0 rgba(192,57,43,0.3)",
          }}
        >
          Hi there
        </h1>
      </div>

      {/* Intro card */}
      <div
        className="p-5 flex flex-col gap-4 mb-10"
        style={{
          border: "3px solid #2a1810",
          backgroundColor: "#f4e8d0",
          boxShadow: "4px 4px 0 #2a1810",
        }}
      >
        <p>
          {`Developer enthusiast from more than a decade, I like learning new languages, my favorites being mostly functional. `}
          <a
            href="https://rescript-lang.org/"
            className="underline font-bold"
            style={{ color: "#c0392b", textDecorationColor: "#c0392b" }}
          >
            ReScript
          </a>{" "}
          is the favorite and the one that I use the most (side projects and day
          to day work).
        </p>
        <p>
          Like many developers, I really enjoy doing side projects and not
          finishing them. After using an IDE like Sublime Text and VSCode, I
          recently switched to Neovim, embracing the Vim motions!
        </p>
        <p>
          Sometimes, I like to write articles about things I discovered or
          learned but it&apos;s not recurrent.
        </p>
      </div>

      {/* Latest posts */}
      <div>
        <h2
          className="text-2xl mb-4"
          style={{
            fontFamily: "var(--font-display)",
            color: "#2a1810",
            letterSpacing: "0.06em",
            borderBottom: "3px solid #2a1810",
            paddingBottom: "6px",
          }}
        >
          Latest Posts
        </h2>
        <BlogPosts limit={5} />
      </div>
    </section>
  );
}
