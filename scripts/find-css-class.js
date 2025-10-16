#!/usr/bin/env node

/**
 * CSS Class Finder
 * Usage: node scripts/find-css-class.js <class-name>
 * Example: node scripts/find-css-class.js number
 */

const fs = require('fs');
const path = require('path');

const className = process.argv[2];

if (!className) {
  console.log('Usage: node scripts/find-css-class.js <class-name>');
  console.log('Example: node scripts/find-css-class.js number');
  process.exit(1);
}

console.log(`🔍 Searching for CSS class: "${className}"\n`);

// Find all CSS files
function findCSSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findCSSFiles(fullPath, files);
    } else if (item.endsWith('.css') || item.endsWith('.module.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Search for class in file
function searchInFile(filePath, className) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const matches = [];

  lines.forEach((line, index) => {
    if (line.includes(`.${className}`) || line.includes(`"${className}"`)) {
      matches.push({
        line: index + 1,
        content: line.trim()
      });
    }
  });

  return matches;
}

const projectRoot = path.resolve(__dirname, '..');
const cssFiles = findCSSFiles(projectRoot);

let found = false;

for (const file of cssFiles) {
  const matches = searchInFile(file, className);

  if (matches.length > 0) {
    found = true;
    const relativePath = path.relative(projectRoot, file);

    console.log(`📁 ${relativePath}`);
    matches.forEach(match => {
      console.log(`   Line ${match.line}: ${match.content}`);
    });
    console.log('');
  }
}

if (!found) {
  console.log(`❌ No CSS class "${className}" found in any CSS files.`);
  console.log('\n💡 Tips:');
  console.log('- Try searching for partial class names');
  console.log('- Check if it\'s defined in a different file');
  console.log('- Look in JavaScript/TypeScript files for dynamic classes');
}