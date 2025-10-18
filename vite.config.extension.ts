import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // Use relative paths for extension compatibility
  base: "./",

  // Environment and feature flags
  define: {
    "process.env.IS_EXTENSION": '"true"',
    "process.env.NODE_ENV": '"production"',
  },

  // Path resolution optimized for extension
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/components": path.resolve(__dirname, "components"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/hooks": path.resolve(__dirname, "hooks"),
      "@/shared": path.resolve(__dirname, "shared"),
    },
  },

  // Build configuration optimized for Chrome extension performance
  build: {
    outDir: "dist/extension-vite",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "extension/index.html"),
        popup: path.resolve(__dirname, "extension/popup.html"),
        background: path.resolve(__dirname, "extension/background.ts"),
        "extension-init": path.resolve(
          __dirname,
          "extension/extension-init.js",
        ),
      },

      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }
          if (chunkInfo.name === "extension-init") {
            return "extension-init.js";
          }
          return "[name].js";
        },
        chunkFileNames: "chunks/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/[name].[ext]";
          }
          return "assets/[name].[ext]";
        },
      },
    },

    // Performance optimizations
    target: "chrome91",
    minify: "terser",
    sourcemap: false,
    assetsInlineLimit: 4096,

    // Reduce bundle size
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // CSS processing
  css: {
    postcss: "./postcss.config.js",
  },

  // Dependency optimization for faster builds and smaller bundles
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion", "zustand"],
    exclude: ["next", "googleapis"],
  },
});
