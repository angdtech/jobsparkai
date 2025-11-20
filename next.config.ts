import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration
  poweredByHeader: false,
  compress: true,
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    optimizePackageImports: ['@supabase/auth-ui-react'],
  },
};

export default nextConfig;
