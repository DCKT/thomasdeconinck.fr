import { BlogPosts } from "app/components/posts";

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-3xl font-semibold tracking-tighter">Hi there</h1>
      <div className="flex flex-col gap-4">
        <p>
          {`Developer enthusiast from more than a decade, I like learning new languages, my favorites being mostly functional. `}
          <a href="https://rescript-lang.org/" className="underline">
            ReScript
          </a>{" "}
          is the favorite and the one that I use the most (side projects and day
          to day work).
        </p>
        <p>
          Like many developers, I really enjoy doing side projects and not
          finishing them. After using an IDE like Sublime Text and VSCode, I
          recently switched to Neovim, embracing the Vim motions !
        </p>
        <p>
          Sometimes, I like to write articles about things I discovered or
          learned but it's not recurrent.
        </p>
      </div>
      <div className="my-8">
        <h2 className="text-xl font-semibold tracking-tighter mb-4">
          Latest posts
        </h2>
        <BlogPosts limit={5} />
      </div>
    </section>
  );
}
