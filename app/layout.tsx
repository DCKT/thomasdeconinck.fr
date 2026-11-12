import "./global.css";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "./components/header";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";
import { DEFAULT_SKIN, SKIN_IDS } from "./lib/skins";

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

export const viewport: Viewport = {
  themeColor: "#090b17",
};

/* Applies saved skin / sound / motion preferences before first paint (no flash, no hydration mismatch).
   Motion defaults to the OS "reduce motion" setting until the visitor picks one. */
const skinScript = `try{var d=document.documentElement,s=localStorage.getItem("skin");if(${JSON.stringify(SKIN_IDS)}.indexOf(s)>-1)d.dataset.skin=s;if(localStorage.getItem("sound")==="off")d.dataset.sound="off";var m=localStorage.getItem("motion");d.dataset.motion=m==="on"||m==="off"?m:matchMedia("(prefers-reduced-motion: reduce)").matches?"off":"on"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-skin={DEFAULT_SKIN}
      data-sound="on"
      data-motion="on"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: skinScript }} />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
