import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'standalone' output for Electron desktop app
  output: "standalone",
  
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Required for static files in standalone mode
  images: {
    unoptimized: true,
  },
  
  // Ensure native modules and their dependencies are properly bundled
  serverExternalPackages: ['@prisma/client', '@prisma/engines', 'prisma'],
};

export default nextConfig;
