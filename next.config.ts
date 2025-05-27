import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  
  // Enable image optimization for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Optimize webpack for production
  webpack: (config, { dev }) => {
    if (!dev) {
      // Reduce bundle size in production
      config.optimization.splitChunks.cacheGroups.vendor = {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      }
    }
    return config
  }
};

export default nextConfig;
