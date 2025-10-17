/** @type {import('next').NextConfig} */
const isExtensionBuild =
  process.env.IS_EXTENSION === "true" && process.env.NODE_ENV === "production";

const nextConfig = {
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: process.env.NODE_ENV === "development",
  serverExternalPackages: ["sharp"],
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "framer-motion", "@blocknote/core", "@blocknote/react", "@blocknote/mantine"],
  },
  turbopack: {},
  typedRoutes: false,
  // Disable StrictMode for BlockNote compatibility
  reactStrictMode: false,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
    SESSION_SECRET: process.env.SESSION_SECRET || "your-secret-key",
    IS_EXTENSION: String(isExtensionBuild),
  },
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: isExtensionBuild, // Disable image optimization for extension build
  },
  // Support for Chrome extension static export
  output: isExtensionBuild ? "export" : undefined,
  distDir: isExtensionBuild ? "out" : ".next",
  basePath: isExtensionBuild ? "" : undefined,
  // Extension build specific settings
  ...(isExtensionBuild && {
    trailingSlash: true,
  }),
  async headers() {
    // Skip headers for extension build
    if (isExtensionBuild) {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.jsdelivr.net unpkg.com static.hotjar.com;
              style-src 'self' 'unsafe-inline' fonts.googleapis.com;
              img-src 'self' data: blob: cdn.jsdelivr.net unpkg.com lottie.host lh3.googleusercontent.com;
              font-src 'self' data: fonts.gstatic.com;
              connect-src 'self' cdn.jsdelivr.net unpkg.com lottie.host static.hotjar.com *.supabase.co;
              media-src 'self';
              object-src 'none';
              frame-src 'self';
            `.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
    pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'route.ts'],
  webpack: (config, { dev, isServer }) => {

    // Optimize webpack caching to reduce serialization warnings
    if (dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: require('path').resolve(__dirname, '.next/cache/webpack'),
        buildDependencies: {
          config: [__filename],
        },
      };

      // Suppress cache serialization warnings in development
      config.infrastructureLogging = {
        level: "error",
      };

      // Speed up development builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };

      // Don't try to externalize for API routes - causes issues
      // Let dynamic imports handle the optimization instead
    }

    // Ensure Yjs and related packages are treated as singletons
    const yjsPath = require.resolve("yjs");

    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: yjsPath,
      "y-prosemirror": require.resolve("y-prosemirror"),
      // y-protocols resolution for different module systems
      "y-protocols$": require.resolve("y-protocols/sync"),
      "y-protocols/sync": require.resolve("y-protocols/sync"),
      "y-protocols/awareness": require.resolve("y-protocols/awareness"),
      "y-protocols/auth": require.resolve("y-protocols/auth"),
    };

    // Note: resolve.dedupe is handled differently in modern webpack versions
    // The aliases above should be sufficient to prevent multiple instances

    // Note: Removed optimization.usedExports as it conflicts with Next.js 15's cacheUnaffected
    // Next.js handles optimization internally

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
            },
            animations: {
              test: /[\\/]public[\\/]animations[\\/]/,
              name: "animations",
              chunks: "all",
              priority: 20,
            },
          },
        },
      };
    }

    // Add support for Chrome extension environment
    if (isExtensionBuild) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
