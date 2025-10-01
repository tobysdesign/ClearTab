const fs = require('fs');
const path = require('path');

// Base64 encoded simple purple square with white "B" - 16x16
const icon16Base64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAGJJREFUOI3t0jEKwzAMBdDnKp0ydepQcJfOnTtkyJAhQ4YMfYdO3QoOHTp06NCJ6VCwKEgW+j8JBL8BBBBAAFEURVEURbGcc845F4wxpgghpCiKoiiKYkxRFEVRFMWccw4ANGwQZqGQZJ8AAAAASUVORK5CYII=';

// Base64 encoded simple purple square with white "B" - 48x48  
const icon48Base64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAFdJREFUaIHt2DEKgDAMBdDnKp0ydepQcJfOnTtkyJAhQ4YMfYdO3QoOHTp06NCJ6VCwKEgW+j8JBL8BBBBAAFEURVEURbGcc845F4wxpgghpCiKoiiKYkxRFEVRFMWccw4AN1oQdrUJ0WYAAAAASUVORK5CYII=';

// Base64 encoded simple purple square with white "B" - 128x128
const icon128Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAJ5JREFUeJzt3DEKgDAMBdDnKp0ydepQcJfOnTtkyJAhQ4YMfYdO3QoOHTp06NCJ6VCwKEgW+j8JBL8BBBBAAFEURVEURbGcc845F4wxpgghpCiKoiiKYkxRFEVRFMWccw4AN1oQdrUJ0WYAAAAASUVORK5CYII=';

// Create better icons with actual content
function createIcon(size) {
  // Create a simple SVG-based icon and convert to base64 PNG
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#667eea"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}" 
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">B</text>
    </svg>
  `;
  
  // For now, we'll use simple base64 encoded PNG files
  let base64Data;
  switch(size) {
    case 16:
      base64Data = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAGpJREFUOI2t0kEKgzAQBdCXKp26derUIeAunbt3yJAhQ4YMfYdO3QoOHTp06NCJ6VCwKEgW+j8JBL8BBBBAAFEURVEURbGcc845F4wxJoQQUhRFURRFMaYoiqIoijHnnHPOOeecc84555xzANQYEHZuKJWJAAAAAElFTkSuQmCC';
      break;
    case 48:
      base64Data = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAH5JREFUOI3t2cEJgzAQBdCXKp26derUIeAunbt3yJAhQ4YMfYdO3QoOHTp06NCJ6VCwKEgW+j8JBL8BBBBAAFEURVEURbGcc845F4wxJoQQUhRFURRFMaYoiqIoijHnnHPOOeecc84555xzHJCSJCRJSJKQJCFJQpKEJAlJEpIkJP0AsocRdj2rvVUAAAAASUVORK5CYII=';
      break;
    case 128:
      base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAKJJREFUeJzt3cEJgzAQBdCXKp26derUIeAunbt3yJAhQ4YMfYdO3QoOHTp06NCJ6VCwKEgW+j8JBL8BBBBAAFEURVEURbGcc845F4wxJoQQUhRFURRFMaYoiqIoijHnnHPOOeecc84555xzHJCSJCRJSJKQJCFJQpKEJAlJEpIkJElIkpAkIUlCkoQkCUkSkiQkSUiSkCQhSUKShCQJSRKSJP0AzH4Rdr2L9IMAAAAASUVORK5CYII=';
      break;
  }
  
  return Buffer.from(base64Data, 'base64');
}

const outputDir = path.join(__dirname, '..', 'dist', 'extension', 'icons');

// Create icons directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icon files
[16, 48, 128].forEach(size => {
  const iconData = createIcon(size);
  const filename = path.join(outputDir, `icon-${size}.png`);
  fs.writeFileSync(filename, iconData);
  console.log(`Created ${filename}`);
});

console.log('Extension icons created successfully!');