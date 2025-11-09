import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration
  poweredByHeader: false,
  compress: true,
  
  // Disable static optimization completely
  output: 'standalone',
  
  // Temporarily disable linting for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    optimizePackageImports: ['@supabase/auth-ui-react'],
  },
};

export default nextConfig;
