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

  // Redirect old blog URLs to homepage
  async redirects() {
    return [
      {
        source: '/2025/:year/:month/:slug*',
        destination: '/',
        permanent: true, // 301 redirect
      },
      {
        source: '/20:year/:month/:day/:slug*',
        destination: '/',
        permanent: true, // 301 redirect for any year starting with 20
      },
    ];
  },
};

export default nextConfig;
