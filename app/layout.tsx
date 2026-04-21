import "./global.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/rubik-doodle-shadow";
import "@fontsource/rubik-doodle-shadow/400.css";
import "@fontsource/rye";
import "@fontsource/rye/400.css";
import "@fontsource/special-elite";
import "@fontsource/special-elite/400.css";
import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Footer from "./components/footer";
import FilmOverlay from "./components/film-overlay";
import { baseUrl } from "./sitemap";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Thomas Deconinck",
    template: "%s | Thomas Deconinck",
  },
  description: "Personal website",
  openGraph: {
    title: "Thomas Deconinck",
    description: "Personal website",
    url: baseUrl,
    siteName: "Thomas Deconinck",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const cx = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(" ");

/* Prevents flash of unstyled typewriter font on first load */
const fontModeScript = `
(function(){
  try{
    var m=localStorage.getItem('fontMode');
    if(m==='typewriter') document.documentElement.classList.add('body-typewriter');
  }catch(e){}
})();
`;

/* Applies film animation preference before first paint to avoid flash */
const filmModeScript = `
(function(){
  try{
    var stored=localStorage.getItem('filmAnimation');
    var prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var enabled = stored === null ? !prefersReduced : stored === 'true';
    if(!enabled) document.documentElement.classList.add('no-film');
  }catch(e){}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cx(
        "text-ink bg-cream",
        GeistSans.variable,
        GeistMono.variable,
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontModeScript }} />
        <script dangerouslySetInnerHTML={{ __html: filmModeScript }} />
      </head>
      <body className="antialiased max-w-xl mt-8 mx-auto">
        <main className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
          <Navbar />
          {children}
          <Footer />
          <Analytics />
          <SpeedInsights />
        </main>
        <FilmOverlay />
      </body>
    </html>
  );
}
