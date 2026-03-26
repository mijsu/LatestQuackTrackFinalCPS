import type { NextConfig } from "next";

const isMobile = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  // Use 'standalone' for both mobile and web - runs as a server
  output: "standalone",
  
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Required for static files
  images: {
    unoptimized: true,
  },
  
  // For static export, we need trailing slashes
  trailingSlash: false,
};

export default nextConfig;
