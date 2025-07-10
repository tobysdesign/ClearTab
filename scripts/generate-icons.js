const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define icon sizes
const sizes = [16, 48, 128];

// Source SVG file
const svgPath = path.join(__dirname, '../public/icons/icon.svg');

// Check if the SVG file exists
if (!fs.existsSync(svgPath)) {
  console.error('Error: SVG file not found at', svgPath);
  process.exit(1);
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons for each size
sizes.forEach(size => {
  const outputPath = path.join(iconsDir, `icon-${size}.png`);
  
  try {
    // Check if ImageMagick is installed
    try {
      execSync('which convert', { stdio: 'ignore' });
    } catch (error) {
      console.error('Error: ImageMagick is not installed. Please install it first.');
      console.error('On macOS: brew install imagemagick');
      console.error('On Ubuntu/Debian: sudo apt-get install imagemagick');
      process.exit(1);
    }
    
    // Use ImageMagick to convert SVG to PNG
    execSync(`convert -background none -size ${size}x${size} ${svgPath} ${outputPath}`);
    console.log(`Generated ${size}x${size} icon: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating ${size}x${size} icon:`, error.message);
  }
});

console.log('Icon generation complete!'); 