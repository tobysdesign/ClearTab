import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // Use relative paths for extension compatibility
  base: './',

  // Environment and feature flags
  define: {
    'process.env.IS_EXTENSION': '"true"',
    'process.env.NODE_ENV': '"production"'
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
      '@cleartab/ui': path.resolve(__dirname, '../packages/ui/src'),
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
      },

      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      }
    },

    // Performance optimizations
    target: 'chrome91',
    minify: 'terser',
    sourcemap: false,

    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
});
