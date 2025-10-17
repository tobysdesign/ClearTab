#!/bin/bash

# Exit on error
set -e

# 1. Build the Next.js app for extension
echo "Building Next.js app for extension..."
IS_EXTENSION=true npm run build

# 2. Rename the _next directory
echo "Renaming _next directory..."
mv out/_next out/next

# 3. Update references in the generated files
echo "Updating references to /_next/..."
find out -name "*.html" -exec sed -i '' 's/\/_next\//\/next\//g' {} +
find out -name "*.js" -exec sed -i '' 's/\/_next\//\/next\//g' {} +
find out -name "*.css" -exec sed -i '' 's/\/_next\//\/next\//g' {} +


# 4. Copy the manifest file
echo "Copying manifest file..."
cp manifest.extension.json out/manifest.json

# 5. Copy the icons
echo "Copying icons..."
cp -r chrome-extension/icons out/

# 6. Package the extension
echo "Packaging extension..."
# Remove the existing zip file if it exists
rm -f extension.zip
zip -r extension.zip out

echo "Extension build complete! Find the packaged extension in extension.zip"
