/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  serverExternalPackages: ['sharp'],
  experimental: {
    optimizePackageImports: ['@tanstack/react-query', 'framer-motion', 'lottie-react'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-secret-key'
  },
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            animations: {
              test: /[\\/]public[\\/]animations[\\/]/,
              name: 'animations',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig