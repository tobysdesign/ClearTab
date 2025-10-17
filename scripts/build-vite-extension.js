#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Vite extension...');

const startTime = Date.now();

try {
  // Build with Vite
  console.log('📦 Building with Vite...');
  execSync('npm run build-extension-vite', { stdio: 'inherit' });

  // Copy manifest
  console.log('📄 Copying manifest...');
  const manifestSrc = path.join(__dirname, '../extension/manifest.json');
  const manifestDest = path.join(__dirname, '../dist/extension-vite/manifest.json');

  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
  }

  // Copy icons if they exist
  console.log('🎨 Copying icons...');
  const iconsSrc = path.join(__dirname, '../public/icons');
  const iconsDest = path.join(__dirname, '../dist/extension-vite/icons');

  if (fs.existsSync(iconsSrc)) {
    if (!fs.existsSync(iconsDest)) {
      fs.mkdirSync(iconsDest, { recursive: true });
    }

    const icons = fs.readdirSync(iconsSrc);
    icons.forEach(icon => {
      if (icon.endsWith('.png')) {
        fs.copyFileSync(
          path.join(iconsSrc, icon),
          path.join(iconsDest, icon)
        );
      }
    });
  }

  const endTime = Date.now();
  const buildTime = (endTime - startTime) / 1000;

  console.log('✅ Vite extension build complete!');
  console.log(`⚡ Build time: ${buildTime}s`);
  console.log(`📁 Output: dist/extension-vite/`);
  console.log('');
  console.log('To test the extension:');
  console.log('1. Open Chrome → chrome://extensions');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select the dist/extension-vite/ directory');
  console.log('');
  console.log('To package for distribution:');
  console.log('npm run package-extension-vite');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}