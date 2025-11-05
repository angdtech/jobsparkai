import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration
  poweredByHeader: false,
  compress: true,
  
  // Turbopack configuration
  turbo: {
    root: '/Users/angelinadyer/Development/jobsparkai-main'
  },
  
  // Temporarily disable linting for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // DETAILED ERROR DEBUGGING (like PHP's display_errors + error_reporting)
  productionBrowserSourceMaps: true,
  serverExternalPackages: [],
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Enable detailed source maps for debugging
      config.devtool = 'eval-source-map'
      
      // Enable more detailed error information
      config.optimization = {
        ...config.optimization,
        minimize: false
      }
    }
    return config
  },
};

export default nextConfig;
