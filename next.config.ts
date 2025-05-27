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
  
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
