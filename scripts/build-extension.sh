#!/bin/bash

# Build Chrome Extension

# Set environment variables
export IS_EXTENSION=true

# Create output directory
mkdir -p dist/extension

# Generate icons
echo "Generating icons..."
node scripts/generate-icons.js

# Build Next.js app for extension
echo "Building Next.js app for Chrome extension..."
npm run build

# Copy extension files
echo "Copying extension files..."
cp public/manifest.json dist/extension/
cp public/background.js dist/extension/
cp public/popup.html dist/extension/
cp public/popup.js dist/extension/
cp -r public/icons dist/extension/

# Create zip file
echo "Creating extension zip file..."
cd dist/extension && zip -r ../bye-extension.zip .

echo "Extension build complete!"
echo "Output: $(pwd)/../bye-extension.zip"
echo ""
echo "To test the extension:"
echo "1. Open Chrome and navigate to chrome://extensions"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select the directory: $(pwd)" 