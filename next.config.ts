import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    ppr: false,
  },
  output: 'standalone',
};

export default nextConfig;
