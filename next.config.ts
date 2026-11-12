import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { viewTransition: true },
  images: {
    // Steam covers, pixelated on the konbini's game shelf
    remotePatterns: [{ protocol: "https", hostname: "shared.akamai.steamstatic.com", pathname: "/store_item_assets/steam/apps/**" }],
  },
};

export default config;
