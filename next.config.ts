import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "otakudesu.blog",
      },
      {
        protocol: "https",
        hostname: "**.otakudesu.**",
      },
    ],
  },
};

export default nextConfig;
