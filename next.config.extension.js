/** @type {import('next').NextConfig} */
// Optimized configuration specifically for Chrome extension builds

const nextConfig = {
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Extension-specific optimizations
  output: 'export',
  distDir: 'out',
  trailingSlash: true,

  // Disable features not needed in extension
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: false, // Let Chrome handle compression

  // Aggressive optimization for extension
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      'lucide-react'
    ],
    // Disable server-side features
    serverComponentsExternalPackages: [],
  },

  // Disable image optimization for extension
  images: {
    unoptimized: true,
  },

  // Webpack optimizations for faster builds
  webpack: (config, { dev, isServer }) => {
    // Don't process these heavy dependencies for extension
    config.resolve.alias = {
      ...config.resolve.alias,
      // Replace heavy dependencies with lighter alternatives
      '@supabase/supabase-js': require.resolve('./lib/extension-supabase-stub.js'),
      'framer-motion': require.resolve('./lib/extension-motion-stub.js'),
    }

    // Optimize bundle splitting for extension
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 0,
          cacheGroups: {
            default: false,
            vendors: false,
            // Create smaller, more focused chunks
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 10,
            },
            widgets: {
              name: 'widgets',
              test: /[\\/]components[\\/]widgets[\\/]/,
              chunks: 'all',
              priority: 9,
            },
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              chunks: 'all',
              priority: 8,
            },
          },
        },
      }
    }

    // Exclude server-only packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      'google-auth-library': false,
      'googleapis': false,
    };

    return config
  },

  // Environment variables for extension
  env: {
    IS_EXTENSION: 'true',
    NODE_ENV: 'production',
  },
}

module.exports = nextConfig
