const fs = require("fs");
const path = require("path");

// Configuration
const config = {
  outputDir: path.join(__dirname, "..", "dist", "extension"),
  publicDir: path.join(__dirname, "..", "public"),
};

console.log("Building Chrome Extension (Simple Static Build)...");

// Backup existing icons before cleaning
const tempIconsBackup = path.join(__dirname, "..", "temp-icons-backup");
const existingIcons = path.join(config.outputDir, "icons");

if (fs.existsSync(existingIcons)) {
  console.log("Backing up existing icons...");
  if (fs.existsSync(tempIconsBackup)) {
    fs.rmSync(tempIconsBackup, { recursive: true });
  }
  fs.cpSync(existingIcons, tempIconsBackup, { recursive: true });
}

// Create output directory
if (fs.existsSync(config.outputDir)) {
  fs.rmSync(config.outputDir, { recursive: true });
}
fs.mkdirSync(config.outputDir, { recursive: true });

// Copy essential extension files
const filesToCopy = [
  "manifest.json",
  "background.js",
  "popup.html",
  "popup.js",
];

// First, copy extension.html as index.html
const extensionHtmlSource = path.join(config.publicDir, "extension.html");
const indexHtmlDest = path.join(config.outputDir, "index.html");
if (fs.existsSync(extensionHtmlSource)) {
  fs.copyFileSync(extensionHtmlSource, indexHtmlDest);
  console.log("✓ Copied extension.html as index.html");
}

// Restore or copy icons
const iconsDest = path.join(config.outputDir, "icons");

// First try to restore backed up icons
if (fs.existsSync(tempIconsBackup)) {
  fs.mkdirSync(iconsDest, { recursive: true });
  fs.cpSync(tempIconsBackup, iconsDest, { recursive: true });
  fs.rmSync(tempIconsBackup, { recursive: true });
  console.log("✓ Restored backed up icons");
} else {
  // Otherwise try to copy from public folder
  const iconsSource = path.join(config.publicDir, "icons");
  if (fs.existsSync(iconsSource)) {
    if (!fs.existsSync(iconsDest)) {
      fs.mkdirSync(iconsDest, { recursive: true });
    }
    fs.cpSync(iconsSource, iconsDest, { recursive: true });
    console.log("✓ Copied icons from public");
  } else {
    console.log("⚠ No icons found to copy - you may need to add them manually");
  }
}

// Copy individual files
filesToCopy.forEach((file) => {
  const src = path.join(config.publicDir, file);
  const dest = path.join(config.outputDir, file);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  } else if (file === "background.js") {
    // Create a simple background.js if it doesn't exist
    fs.writeFileSync(dest, `
// Chrome Extension Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Bye extension installed');
});

// Handle new tab creation
chrome.tabs.onCreated.addListener((tab) => {
  console.log('New tab created');
});
`);
    console.log("✓ Created background.js");
  } else if (file === "popup.html") {
    // Create a simple popup.html if it doesn't exist
    fs.writeFileSync(dest, `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 300px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    h1 {
      font-size: 18px;
      margin: 0 0 8px 0;
    }
    p {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>Bye Dashboard</h1>
  <p>Your productivity hub is ready.</p>
  <p style="margin-top: 12px;">Open a new tab to see your dashboard.</p>
</body>
</html>
`);
    console.log("✓ Created popup.html");
  } else if (file === "popup.js") {
    // Create an empty popup.js
    fs.writeFileSync(dest, "// Popup script\n");
    console.log("✓ Created popup.js");
  }
});

console.log("\n✅ Extension build complete!");
console.log(`Output: ${config.outputDir}`);
console.log("\nTo install:");
console.log("1. Open Chrome and go to chrome://extensions/");
console.log("2. Enable 'Developer mode'");
console.log("3. Click 'Load unpacked'");
console.log(`4. Select the folder: ${config.outputDir}`);
