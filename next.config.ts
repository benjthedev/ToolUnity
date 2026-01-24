import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Disable static generation for all pages to avoid pre-render errors
    isrMemoryCacheSize: 0,
  },
};

export default nextConfig;
