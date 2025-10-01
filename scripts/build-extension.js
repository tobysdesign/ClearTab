const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const config = {
  outputDir: path.join(__dirname, "../dist/extension"),
  publicDir: path.join(__dirname, "../public"),
  nextBuildDir: path.join(__dirname, "../.next"),
  nextExportDir: path.join(__dirname, "../out"),
  extensionFiles: [
    "manifest.json",
    "background.js",
    "popup.html",
    "popup.js",
    "icons",
  ],
};

// Create output directory
console.log("Creating output directory...");

// Preserve existing icons before cleaning
const iconsBackupDir = path.join(__dirname, "../icons-backup-temp");
const existingIconsDir = path.join(config.outputDir, "icons");

if (fs.existsSync(existingIconsDir)) {
  console.log("Backing up existing icons...");
  if (fs.existsSync(iconsBackupDir)) {
    fs.rmSync(iconsBackupDir, { recursive: true });
  }
  fs.cpSync(existingIconsDir, iconsBackupDir, { recursive: true });
}

if (fs.existsSync(config.outputDir)) {
  fs.rmSync(config.outputDir, { recursive: true });
}
fs.mkdirSync(config.outputDir, { recursive: true });

// Restore icons if they existed
if (fs.existsSync(iconsBackupDir)) {
  console.log("Restoring backed up icons...");
  const restoredIconsDir = path.join(config.outputDir, "icons");
  fs.mkdirSync(restoredIconsDir, { recursive: true });
  fs.cpSync(iconsBackupDir, restoredIconsDir, { recursive: true });
  fs.rmSync(iconsBackupDir, { recursive: true });
}

// Temporarily move API and auth routes out of the way for extension build
const apiDir = path.join(__dirname, "../app/api");
const authDir = path.join(__dirname, "../app/auth");
const apiBackupDir = path.join(__dirname, "../api-backup-temp");
const authBackupDir = path.join(__dirname, "../auth-backup-temp");

// Replace server actions with extension stubs
const actionsDir = path.join(__dirname, "../lib/actions");
const settingsStubsFile = path.join(actionsDir, "extension-stubs.ts");
const aiStubsFile = path.join(actionsDir, "ai-stubs.ts");
const settingsFile = path.join(actionsDir, "settings.ts");
const aiFile = path.join(actionsDir, "ai.ts");
const settingsBackup = path.join(actionsDir, "settings.ts.backup");
const aiBackup = path.join(actionsDir, "ai.ts.backup");

console.log("Temporarily moving API and auth routes...");
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, apiBackupDir);
}
if (fs.existsSync(authDir)) {
  fs.renameSync(authDir, authBackupDir);
}

console.log("Replacing server actions with extension stubs...");
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

// Build Next.js app
console.log("Building Next.js app...");
try {
  execSync("IS_EXTENSION=true npm run build", {
    stdio: "inherit",
    env: { ...process.env, IS_EXTENSION: "true" },
  });
  // export happens automatically due to output: 'export' in next.config.js when IS_EXTENSION=true
} catch (error) {
  console.error("Error building Next.js app:", error);
  // Restore API, auth routes, and server actions
  if (fs.existsSync(apiBackupDir)) {
    fs.renameSync(apiBackupDir, apiDir);
  }
  if (fs.existsSync(authBackupDir)) {
    fs.renameSync(authBackupDir, authDir);
  }
  if (fs.existsSync(settingsBackup)) {
    fs.renameSync(settingsBackup, settingsFile);
  }
  if (fs.existsSync(aiBackup)) {
    fs.renameSync(aiBackup, aiFile);
  }
  process.exit(1);
}

// Restore API, auth routes, and server actions
console.log("Restoring API, auth routes, and server actions...");
if (fs.existsSync(apiBackupDir)) {
  fs.renameSync(apiBackupDir, apiDir);
}
if (fs.existsSync(authBackupDir)) {
  fs.renameSync(authBackupDir, authDir);
}
if (fs.existsSync(settingsBackup)) {
  fs.renameSync(settingsBackup, settingsFile);
}
if (fs.existsSync(aiBackup)) {
  fs.renameSync(aiBackup, aiFile);
}

// Copy Next.js export to extension directory
console.log("Copying Next.js export to extension directory...");
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
  console.error("Error copying Next.js export:", error);
  process.exit(1);
}

// Copy extension files
console.log("Copying extension files...");
config.extensionFiles.forEach((file) => {
  const src = path.join(config.publicDir, file);
  const dest = path.join(config.outputDir, file);

  try {
    if (fs.existsSync(src)) {
      if (fs.lstatSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
    } else {
      console.warn(`Warning: File not found: ${src}`);
    }
  } catch (error) {
    console.error(`Error copying ${file}:`, error);
  }
});

// Generate icons if they don't exist
if (!fs.existsSync(path.join(config.outputDir, "icons", "icon-128.png"))) {
  console.log("Generating icons...");
  try {
    execSync("node scripts/generate-icons.js", { stdio: "inherit" });

    // Copy generated icons
    const iconsDir = path.join(config.publicDir, "icons");
    const destIconsDir = path.join(config.outputDir, "icons");

    if (!fs.existsSync(destIconsDir)) {
      fs.mkdirSync(destIconsDir, { recursive: true });
    }

    fs.readdirSync(iconsDir).forEach((file) => {
      if (file.endsWith(".png")) {
        fs.copyFileSync(
          path.join(iconsDir, file),
          path.join(destIconsDir, file),
        );
      }
    });
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

// Create a zip file for Chrome Web Store
console.log("Creating extension zip file...");
try {
  const zipPath = path.join(__dirname, "../dist/bye-extension.zip");

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  execSync(`cd ${config.outputDir} && zip -r ${zipPath} .`, {
    stdio: "inherit",
  });
  console.log(`Extension zip created at: ${zipPath}`);
} catch (error) {
  console.error("Error creating zip file:", error);
}

console.log("Extension build complete!");
console.log(`Output directory: ${config.outputDir}`);
console.log("To test the extension:");
console.log("1. Open Chrome and navigate to chrome://extensions");
console.log('2. Enable "Developer mode"');
console.log(
  `3. Click "Load unpacked" and select the directory: ${config.outputDir}`,
);
