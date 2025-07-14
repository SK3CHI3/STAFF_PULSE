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

  // Netlify-optimized configuration
  images: {
    // Let Netlify Image CDN handle optimization
    loader: 'default',
    formats: ['image/webp', 'image/avif'],
  },

  // Enable trailing slashes for better Netlify compatibility
  trailingSlash: false,

  // Headers for better performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
        ],
      },
    ];
  },

  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
