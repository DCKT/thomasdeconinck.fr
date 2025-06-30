"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = {
  "/": {
    name: "home",
  },
  "/blog": {
    name: "blog",
  },
  "/pixel-art": {
    name: "pixel art",
  },
  "/games": {
    name: "games",
  },
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="-ml-[8px] mb-16 tracking-tight">
      <div className="lg:sticky lg:top-20">
        <nav
          className="flex flex-row items-start relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative"
          id="nav"
        >
          <div className="flex flex-row space-x-0 pr-10">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className={`transition-all hover:text-neutral-900 hover:underline flex align-middle relative py-1 px-2 m-1 ${pathname === path ? "underline" : ""}`}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
