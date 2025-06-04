#!/usr/bin/env node
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Building frontend only for static deployment...');

try {
  // Create a minimal vite config for building
  const viteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
  `;
  
  fs.writeFileSync('temp-vite.config.js', viteConfig);
  
  // Build with the deployment config
  execSync('npx vite build --config vite.config.deploy.js', { 
    stdio: 'inherit', 
    cwd: __dirname 
  });
  
  // Cleanup
  fs.unlinkSync('temp-vite.config.js');
  
  console.log('Frontend build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}