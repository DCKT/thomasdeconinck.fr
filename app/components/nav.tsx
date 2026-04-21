"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AnimationToggle from "./animation-toggle";

const navItems = {
  "/": { name: "Home" },
  "/blog": { name: "Blog" },
  "/pixel-art": { name: "Pixel Art" },
  "/games": { name: "Games" },
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="mb-12">
      <nav
        className="flex flex-row items-center px-3 py-2"
        style={{
          backgroundColor: "#c0392b",
          border: "3px solid #2a1810",
          boxShadow: "3px 3px 0 #2a1810",
        }}
        id="nav"
      >
        <Image
          alt=""
          unoptimized
          src="/Cat.gif"
          width={36}
          height={30}
          className="mr-3 shrink-0"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="flex flex-row items-center flex-wrap gap-1">
          {Object.entries(navItems).map(([path, { name }], i, arr) => (
            <span key={path} className="flex items-center">
              <Link
                href={path}
                className="text-cream text-sm font-bold tracking-wide py-0.5 px-2 transition-colors"
                style={{
                  fontFamily: "var(--font-display)",
                  backgroundColor:
                    pathname === path ? "#d4a84b" : "transparent",
                  color: pathname === path ? "#2a1810" : "#f4e8d0",
                  border: pathname === path ? "2px solid #2a1810" : "2px solid transparent",
                  letterSpacing: "0.06em",
                }}
              >
                {name}
              </Link>
              {i < arr.length - 1 && (
                <span
                  className="mx-1 text-mustard font-bold text-xs select-none"
                  style={{ color: "#d4a84b" }}
                >
                  ✦
                </span>
              )}
            </span>
          ))}
        </div>
        <AnimationToggle />
      </nav>
    </aside>
  );
}
