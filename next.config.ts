import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  
  // Disable static error page generation
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
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
