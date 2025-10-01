const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const config = {
  outputDir: path.join(__dirname, "../dist/extension"),
  nextExportDir: path.join(__dirname, "../out"),
  extensionFiles: [
    "manifest.json",
    "background.js",
    "popup.html",
    "popup.js",
    "icons",
  ],
};

console.log("🚀 Starting optimized Chrome extension build...");

// Clean up previous builds
console.log("🧹 Cleaning previous builds...");

// Preserve existing icons before cleaning
const iconsBackupDir = path.join(__dirname, "../icons-backup-temp");
const existingIconsDir = path.join(config.outputDir, "icons");

if (fs.existsSync(existingIconsDir)) {
  console.log("💾 Backing up existing icons...");
  if (fs.existsSync(iconsBackupDir)) {
    fs.rmSync(iconsBackupDir, { recursive: true });
  }
  fs.cpSync(existingIconsDir, iconsBackupDir, { recursive: true });
}

if (fs.existsSync(config.outputDir)) {
  fs.rmSync(config.outputDir, { recursive: true });
}
if (fs.existsSync(config.nextExportDir)) {
  fs.rmSync(config.nextExportDir, { recursive: true });
}
fs.mkdirSync(config.outputDir, { recursive: true });

// Restore icons if they existed
if (fs.existsSync(iconsBackupDir)) {
  console.log("🔄 Restoring backed up icons...");
  const restoredIconsDir = path.join(config.outputDir, "icons");
  fs.mkdirSync(restoredIconsDir, { recursive: true });
  fs.cpSync(iconsBackupDir, restoredIconsDir, { recursive: true });
  fs.rmSync(iconsBackupDir, { recursive: true });
}

// Replace server actions with extension stubs
const actionsDir = path.join(__dirname, "../lib/actions");
const settingsStubsFile = path.join(actionsDir, "extension-stubs.ts");
const aiStubsFile = path.join(actionsDir, "ai-stubs.ts");
const settingsFile = path.join(actionsDir, "settings.ts");
const aiFile = path.join(actionsDir, "ai.ts");
const settingsBackup = path.join(actionsDir, "settings.ts.backup");
const aiBackup = path.join(actionsDir, "ai.ts.backup");

console.log("🔄 Replacing server actions with extension stubs...");
if (fs.existsSync(settingsFile)) {
  fs.renameSync(settingsFile, settingsBackup);
}
if (fs.existsSync(aiFile)) {
  fs.renameSync(aiFile, aiBackup);
}
if (fs.existsSync(settingsStubsFile)) {
  fs.copyFileSync(settingsStubsFile, settingsFile);
}
if (fs.existsSync(aiStubsFile)) {
  fs.copyFileSync(aiStubsFile, aiFile);
}

// Build with optimized settings
console.log("⚡ Building Next.js app with optimizations...");
try {
  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      IS_EXTENSION: "true",
      NODE_ENV: "production",
      NODE_OPTIONS: "--max-old-space-size=4096",
      NEXT_CONFIG_FILE: "./next.config.extension.js",
    },
    timeout: 120000, // 2 minute timeout
  });
  console.log("✅ Next.js build completed successfully!");
} catch (error) {
  console.error("❌ Error building Next.js app:", error.message);

  // Restore original files
  console.log("🔄 Restoring original files...");
  if (fs.existsSync(settingsBackup)) {
    fs.renameSync(settingsBackup, settingsFile);
  }
  if (fs.existsSync(aiBackup)) {
    fs.renameSync(aiBackup, aiFile);
  }
  process.exit(1);
}

// Restore original files
console.log("🔄 Restoring original files...");
if (fs.existsSync(settingsBackup)) {
  fs.renameSync(settingsBackup, settingsFile);
}
if (fs.existsSync(aiBackup)) {
  fs.renameSync(aiBackup, aiFile);
}

// Copy export to extension directory
console.log("📦 Copying files to extension directory...");
try {
  const files = fs.readdirSync(config.nextExportDir);
  files.forEach((file) => {
    const src = path.join(config.nextExportDir, file);
    const dest = path.join(config.outputDir, file);

    if (fs.lstatSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  });
} catch (error) {
  console.error("❌ Error copying files:", error);
  process.exit(1);
}

// Copy extension-specific files
console.log("🔧 Copying extension-specific files...");
const publicDir = path.join(__dirname, "../public");

config.extensionFiles.forEach((file) => {
  const src = path.join(publicDir, file);
  const dest = path.join(config.outputDir, file);

  if (fs.existsSync(src)) {
    if (fs.lstatSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  ${file} not found in public directory`);
  }
});

// Create zip file
console.log("🗜️  Creating extension zip file...");
try {
  const zipPath = path.join(__dirname, "../dist/bye-extension.zip");

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  execSync(`cd ${config.outputDir} && zip -r ${zipPath} .`, {
    stdio: "inherit",
  });
  console.log(`✅ Extension zip created at: ${zipPath}`);
} catch (error) {
  console.error("❌ Error creating zip file:", error);
}

console.log("🎉 Chrome extension build completed successfully!");
console.log(`📁 Extension files: ${config.outputDir}`);
console.log("");
console.log("To test the extension:");
console.log("1. Open Chrome and navigate to chrome://extensions");
console.log('2. Enable "Developer mode"');
console.log(`3. Click "Load unpacked" and select: ${config.outputDir}`);
console.log("");
console.log("🚀 Your extension is ready to use!");
