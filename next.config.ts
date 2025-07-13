import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizeCss: true, // Re-enabled after installing critters dependency
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configure for Netlify deployment
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
