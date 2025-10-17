#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ASCII icon mapping
const iconMap = {
  'settings': '*',
  'cog': '*',
  'x': '×',
  'close': '×',
  'check': '✓',
  'check-circle': '✓',
  'plus': '+',
  'minus': '-',
  'chevron-down': '▼',
  'chevron-up': '▲',
  'chevron-left': '◀',
  'chevron-right': '▶',
  'calendar': '◊',
  'clock': '◯',
  'edit': '✎',
  'pencil': '✎',
  'trash': '⌫',
  'delete': '⌫',
  'menu': '≡',
  'grip-vertical': '≡',
  'star': '★',
  'heart': '♥',
  'info': 'ⓘ',
  'warning': '⚠',
  'search': '🔍',
  'filter': '⧩',
  'sort': '⇅',
  'refresh': '⟲',
  'home': '⌂',
  'user': '👤',
  'mail': '✉',
  'phone': '☎',
  'link': '🔗',
  'external-link': '↗',
  'download': '⬇',
  'upload': '⬆',
  'file': '📄',
  'folder': '📁',
  'image': '🖼',
  'video': '🎥',
  'audio': '🔊',
  'volume': '🔊',
  'bell': '🔔',
  'sun': '☀',
  'moon': '🌙',
  'eye': '👁',
  'eye-off': '⨯',
  'lock': '🔒',
  'unlock': '🔓',
  'key': '🔑',
  'shield': '🛡',
  'arrow-left': '←',
  'arrow-right': '→',
  'arrow-up': '↑',
  'arrow-down': '↓',
  'corner-down-left': '↵',
  'maximize': '⛶',
  'minimize': '⊖',
  'more-horizontal': '⋯',
  'more-vertical': '⋮'
};

function getIconChar(iconName) {
  // Clean up icon name (remove prefixes, suffixes)
  const cleanName = iconName.toLowerCase()
    .replace(/icon$/, '')
    .replace(/^lucide-/, '')
    .replace(/-icon$/, '');

  return iconMap[cleanName] || '•'; // Default fallback
}

function replaceIconsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;

  // Remove lucide-react imports
  const importRegex = /import\s+(\w+)\s+from\s+['"](lucide-react\/dist\/esm\/icons\/[\w-]+|lucide-react)['"]\s*;?\n?/g;
  const imports = [...content.matchAll(importRegex)];

  if (imports.length > 0) {
    console.log(`Found ${imports.length} lucide imports in ${filePath}`);

    // Replace imports with comment
    newContent = newContent.replace(importRegex, '');

    // Add comment if we removed imports
    if (!newContent.includes('// Icons replaced with ASCII placeholders')) {
      const firstImport = newContent.indexOf('import');
      if (firstImport !== -1) {
        newContent = newContent.slice(0, firstImport) +
          '// Icons replaced with ASCII placeholders\n' +
          newContent.slice(firstImport);
      }
    }

    // Replace icon components with ASCII characters
    imports.forEach(([fullMatch, iconName]) => {
      const iconChar = getIconChar(iconName);

      // Replace JSX usage: <IconName ... /> with <span ...>char</span>
      const jsxRegex = new RegExp(`<${iconName}([^>]*?)\\s*\\/>`, 'g');
      newContent = newContent.replace(jsxRegex, `<span$1>${iconChar}</span>`);

      // Replace JSX usage: <IconName ...>...</IconName> with <span ...>char</span>
      const jsxOpenCloseRegex = new RegExp(`<${iconName}([^>]*?)>.*?<\\/${iconName}>`, 'g');
      newContent = newContent.replace(jsxOpenCloseRegex, `<span$1>${iconChar}</span>`);
    });

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Updated ${filePath}`);
  }
}

// Find all TypeScript/React files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'out/**', '.next/**', 'docs/**']
});

console.log(`Processing ${files.length} files...`);

files.forEach(replaceIconsInFile);

console.log('✅ Icon replacement complete! Run npm run dev to test.');