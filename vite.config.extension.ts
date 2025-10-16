import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.IS_EXTENSION': '"true"',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    outDir: 'dist/extension',
    rollupOptions: {
      input: {
        main: 'extension/index.html',
        popup: 'extension/popup.html',
        background: 'extension/background.ts',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    target: 'esnext',
    minify: false, // Easier debugging
  },
  css: {
    postcss: './postcss.config.js',
  },
})