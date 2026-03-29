import type { NextConfig } from "next";

const isMobile = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  output: isMobile ? "export" : "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  images: {
    unoptimized: true,
  },

  trailingSlash: isMobile ? true : false,
};

export default nextConfig;
