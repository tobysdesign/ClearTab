const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Starting minimal Chrome extension build...");

// Configuration
const config = {
  outputDir: path.join(__dirname, "../dist/extension"),
  tempDir: path.join(__dirname, "../temp-extension-build"),
};

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

// Clean previous builds
if (fs.existsSync(config.outputDir)) {
  fs.rmSync(config.outputDir, { recursive: true });
}
if (fs.existsSync(config.tempDir)) {
  fs.rmSync(config.tempDir, { recursive: true });
}

fs.mkdirSync(config.outputDir, { recursive: true });
fs.mkdirSync(config.tempDir, { recursive: true });

// Restore icons if they existed
if (fs.existsSync(iconsBackupDir)) {
  console.log("🔄 Restoring backed up icons...");
  const restoredIconsDir = path.join(config.outputDir, "icons");
  fs.mkdirSync(restoredIconsDir, { recursive: true });
  fs.cpSync(iconsBackupDir, restoredIconsDir, { recursive: true });
  fs.rmSync(iconsBackupDir, { recursive: true });
}

console.log("📦 Creating minimal extension build...");

// Copy only essential files for a minimal working extension
const essentialFiles = [
  "public/manifest.json",
  "public/icons",
  "app/globals.css",
];

// Create a minimal index.html
const minimalHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bye - Personal Dashboard</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }
        .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 2rem;
        }
        .message {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .cta {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px 30px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .cta:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        .widgets {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 3rem;
        }
        .widget {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .widget h3 {
            margin-top: 0;
            font-size: 1.3rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">👋 Bye</div>
        <div class="message">
            Your personal dashboard is getting ready!
        </div>
        <div class="message">
            This is a lightweight version. For full functionality, visit the web app.
        </div>
        <a href="http://localhost:3001" class="cta" target="_blank">
            Open Full Web App
        </a>

        <div class="widgets">
            <div class="widget">
                <h3>📝 Quick Notes</h3>
                <p>Take notes quickly with our full web interface</p>
            </div>
            <div class="widget">
                <h3>✅ Tasks</h3>
                <p>Manage your tasks and productivity</p>
            </div>
            <div class="widget">
                <h3>🤖 AI Assistant</h3>
                <p>Chat with AI for help and insights</p>
            </div>
            <div class="widget">
                <h3>📅 Calendar</h3>
                <p>View and manage your schedule</p>
            </div>
        </div>
    </div>

    <script>
        // Simple extension functionality
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Bye Chrome Extension loaded');

            // Add some basic interactivity
            const widgets = document.querySelectorAll('.widget');
            widgets.forEach(widget => {
                widget.addEventListener('click', function() {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 150);
                });
            });
        });
    </script>
</body>
</html>`;

// Write minimal files
fs.writeFileSync(path.join(config.outputDir, "index.html"), minimalHTML);

// Copy essential files
essentialFiles.forEach((file) => {
  const src = path.join(__dirname, "..", file);
  const dest = path.join(config.outputDir, path.basename(file));

  // Skip icons directory if we already restored them
  if (
    file === "public/icons" &&
    fs.existsSync(path.join(config.outputDir, "icons"))
  ) {
    console.log(`✅ Icons already restored, skipping copy of ${file}`);
    return;
  }

  if (fs.existsSync(src)) {
    if (fs.lstatSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  ${file} not found`);
  }
});

// Create background script
const backgroundScript = `
// Background script for Bye Chrome Extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Bye extension installed');
});

// Handle new tab override
chrome.tabs.onCreated.addListener((tab) => {
    if (tab.url === 'chrome://newtab/') {
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('index.html') });
    }
});
`;

fs.writeFileSync(
  path.join(config.outputDir, "background.js"),
  backgroundScript,
);

// Create zip file
console.log("🗜️  Creating extension zip...");
try {
  const zipPath = path.join(__dirname, "../dist/bye-extension-minimal.zip");
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  execSync(`cd ${config.outputDir} && zip -r ${zipPath} .`, {
    stdio: "inherit",
  });
  console.log(`✅ Minimal extension created: ${zipPath}`);
} catch (error) {
  console.error("❌ Error creating zip:", error);
}

console.log("🎉 Minimal extension build completed!");
console.log(`📁 Files: ${config.outputDir}`);
console.log("");
console.log("This minimal extension provides:");
console.log("• Beautiful new tab replacement");
console.log("• Quick access to full web app");
console.log("• Lightweight and fast loading");
console.log("");
console.log("To load the extension:");
console.log("1. Open chrome://extensions");
console.log("2. Enable Developer mode");
console.log(`3. Load unpacked: ${config.outputDir}`);
