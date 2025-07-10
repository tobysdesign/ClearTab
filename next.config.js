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
  // Disable StrictMode for BlockNote compatibility
  reactStrictMode: false,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-secret-key',
    IS_EXTENSION: process.env.IS_EXTENSION || false
  },
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: process.env.IS_EXTENSION === 'true', // Disable image optimization for extension build
  },
  // Support for Chrome extension static export
  output: process.env.IS_EXTENSION === 'true' ? 'export' : undefined,
  distDir: process.env.IS_EXTENSION === 'true' ? 'out' : '.next',
  // Adjust asset prefix for extension
  assetPrefix: process.env.IS_EXTENSION === 'true' ? '.' : undefined,
  basePath: process.env.IS_EXTENSION === 'true' ? '' : undefined,
  async headers() {
    // Skip headers for extension build
    if (process.env.IS_EXTENSION === 'true') {
      return [];
    }
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.jsdelivr.net unpkg.com static.hotjar.com;
              style-src 'self' 'unsafe-inline' fonts.googleapis.com;
              img-src 'self' data: blob: cdn.jsdelivr.net unpkg.com lottie.host;
              font-src 'self' data: fonts.gstatic.com;
              connect-src 'self' cdn.jsdelivr.net unpkg.com lottie.host static.hotjar.com;
              media-src 'self';
              object-src 'none';
              frame-src 'self';
            `.replace(/\n/g, ''),
          },
        ],
      },
    ];
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
    
    // Add support for Chrome extension environment
    if (process.env.IS_EXTENSION === 'true') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    
    return config
  },
}

module.exports = nextConfig