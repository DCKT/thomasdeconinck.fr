import Image from "next/image";
import Link from "next/link";
import { BlogPosts } from "app/components/posts";
import KonbiniScene from "app/components/konbini/konbini-scene";
import { DoorChime } from "app/components/konbini/door-chime";
import { getBlogPosts, getPixelArtPosts, shortDate, sortByDate } from "app/blog/utils";
import { getShelfGames } from "app/lib/steam";
import { getMangaShelf } from "app/lib/komga";
import { SPOTS } from "app/lib/skins";

/** Just what the walk-mode shelves need (titles + links), not the post bodies. */
function shelf(posts: ReturnType<typeof getBlogPosts>) {
  return sortByDate(posts).map((p) => ({ slug: p.slug, title: p.metadata.title, date: shortDate(p.metadata.publishedAt) }));
}

export default async function Page() {
  const [games, manga] = await Promise.all([getShelfGames(), getMangaShelf()]);
  const aisles = [
    { href: "/blog", jp: "雑誌", title: "Blog", text: `${getBlogPosts().length} articles, mostly technical` },
    { href: "/pixel-art", jp: "ガチャ", title: "Pixel Art", text: `${getPixelArtPosts().length} tiny drawings` },
    { href: "/pixel-editor", jp: "コピー機", title: "Pixel Editor", text: "Draw your own, in the browser" },
    { href: "/games", jp: "自販機", title: "Games", text: "Mini games, insert coin" },
  ];

  return (
    <main>
      <section className="hero">
        <KonbiniScene data={{ posts: shelf(getBlogPosts()), pixelArt: shelf(getPixelArtPosts()), games, manga }} />
        <div className="hero-scrim" aria-hidden="true" />
        <nav className="tags" aria-label="Store sections">
          {SPOTS.map((spot, i) => (
            <Link key={spot.id} href={spot.href} className="tag" data-spot={spot.id} title={spot.hint}>
              <span className="tag-body" style={{ "--i": i } as React.CSSProperties}>
                <small>{spot.jp}</small>
                {spot.label}
              </span>
            </Link>
          ))}
          <DoorChime index={SPOTS.length} />
        </nav>
        <div className="hero-copy">
          <p className="eyebrow">24時間営業 · Open 24/7</p>
          <h1>Thomas Deconinck</h1>
          <p className="hero-lede">
            Developer, functional programming fan, serial side-project starter. Step inside, the shelves are stocked
            with articles.
          </p>
        </div>
      </section>

      <div className="page page-wide">
        <section id="about" className="about">
          <Image
            src="/Cat.png"
            alt="Pixel art cat, the store mascot"
            width={96}
            height={96}
            unoptimized
            className="about-cat"
          />
          <div>
            <p className="eyebrow">店長 · Store manager</p>
            <h2>Hi there</h2>
            <p>
              Developer enthusiast from more than a decade, I like learning new languages, my favorites being mostly
              functional. <a href="https://rescript-lang.org/">ReScript</a> is the favorite and the one that I use the
              most (side projects and day to day work).
            </p>
            <p>
              Like many developers, I really enjoy doing side projects and not finishing them. After using an IDE like
              Sublime Text and VSCode, I recently switched to Neovim, embracing the Vim motions!
            </p>
            <p>
              Sometimes, I like to write articles about things I discovered or learned but it&apos;s not recurrent.
            </p>
          </div>
        </section>

        <section className="aisle">
          <h2 className="aisle-sign">
            <span>
              New arrivals <small>新商品</small>
            </span>
            <Link href="/blog" className="aisle-count">
              All posts →
            </Link>
          </h2>
          <BlogPosts limit={5} />
        </section>

        <section className="aisle">
          <h2 className="aisle-sign">
            <span>
              Aisles <small>売り場</small>
            </span>
          </h2>
          <div className="aisles">
            {aisles.map((aisle) => (
              <Link key={aisle.href} href={aisle.href} className="aisle-card">
                <small>{aisle.jp}</small>
                <strong>{aisle.title}</strong>
                <span>{aisle.text}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
