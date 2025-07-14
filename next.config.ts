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
  // Netlify deployment optimizations
  trailingSlash: false,
  // Let Netlify handle image optimization automatically
  // No need to set images.unoptimized = true

  // Ensure proper hydration and client-side routing
  reactStrictMode: true,

  // Add headers for better caching control
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
