"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SkinSwitcher } from "./skin-switcher";
import { SoundToggle } from "./sound-toggle";
import { MotionToggle } from "./motion-toggle";

const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/pixel-art", label: "Pixel Art" },
  { href: "/pixel-editor", label: "Editor" },
  { href: "/games", label: "Games" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="stripes" aria-hidden="true" />
      <div className="site-bar">
        <Link href="/" className="wordmark" aria-label="Thomas Mart — home">
          <span className="wordmark-badge">24</span>
          <span>
            Thomas<b>Mart</b>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="site-tools">
          <MotionToggle />
          <SoundToggle />
          <SkinSwitcher />
        </div>
      </div>
    </header>
  );
}
