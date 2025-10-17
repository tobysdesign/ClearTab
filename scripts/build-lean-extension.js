const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const config = {
  outputDir: path.join(__dirname, "../dist/extension"),
  publicDir: path.join(__dirname, "../public"),
  appDir: path.join(__dirname, "../app/extension-simple"),
};

console.log("Building Lean Chrome Extension (Notes & Schedule only)...");

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

// Copy the lean HTML file as index.html
const htmlSource = path.join(config.publicDir, "extension-lean.html");
const htmlDest = path.join(config.outputDir, "index.html");
if (fs.existsSync(htmlSource)) {
  let htmlContent = fs.readFileSync(htmlSource, 'utf8');

  // Create inline JavaScript bundle for the extension
  const extensionJs = `
    // Chrome Extension App Bundle
    (function() {
      // Extension Storage API
      ${fs.readFileSync(path.join(__dirname, '../lib/extension-storage.ts'), 'utf8')
        .replace(/export interface/g, 'interface')
        .replace(/export const/g, 'const')
        .replace(/export class/g, 'class')
        .replace(/import.*?;/g, '')}

      // Simple React-like app
      const app = document.getElementById('root');

      // Initialize
      window.addEventListener('DOMContentLoaded', async () => {
        const storage = new ExtensionStorage();
        await storage.initializeWithSampleData();

        // Create Notes section
        const notesSection = document.createElement('div');
        notesSection.style.cssText = 'padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 100vh;';

        // Notes widget
        const notesWidget = document.createElement('div');
        notesWidget.style.cssText = 'background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; overflow-y: auto;';
        notesWidget.innerHTML = '<h2 style="margin-bottom: 20px;">Notes</h2><div id="notes-list"></div>';

        // Schedule widget
        const scheduleWidget = document.createElement('div');
        scheduleWidget.style.cssText = 'background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; overflow-y: auto;';
        scheduleWidget.innerHTML = '<h2 style="margin-bottom: 20px;">Schedule</h2><div id="schedule-list"></div>';

        notesSection.appendChild(notesWidget);
        notesSection.appendChild(scheduleWidget);

        app.innerHTML = '';
        app.appendChild(notesSection);

        // Load and display data
        async function refreshData() {
          const notes = await storage.getNotes();
          const schedule = await storage.getScheduleEvents();

          const notesList = document.getElementById('notes-list');
          notesList.innerHTML = notes.map(note =>
            '<div style="padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 8px;">' +
            '<strong>' + (note.title || 'Untitled') + '</strong>' +
            '</div>'
          ).join('') || '<p style="color: #666;">No notes yet</p>';

          const scheduleList = document.getElementById('schedule-list');
          scheduleList.innerHTML = schedule.map(event =>
            '<div style="padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 8px;">' +
            '<strong>' + event.title + '</strong><br>' +
            '<small style="color: #999;">' + new Date(event.start).toLocaleString() + '</small>' +
            '</div>'
          ).join('') || '<p style="color: #666;">No events scheduled</p>';
        }

        refreshData();
      });
    })();
  `;

  // Replace the script tag with inline JavaScript
  htmlContent = htmlContent.replace(
    '<script src="/extension-bundle.js"></script>',
    `<script>${extensionJs}</script>`
  );

  fs.writeFileSync(htmlDest, htmlContent);
  console.log("✓ Created index.html with inline JavaScript");
}

// Restore or copy icons
const iconsDest = path.join(config.outputDir, "icons");
if (fs.existsSync(tempIconsBackup)) {
  fs.mkdirSync(iconsDest, { recursive: true });
  fs.cpSync(tempIconsBackup, iconsDest, { recursive: true });
  fs.rmSync(tempIconsBackup, { recursive: true });
  console.log("✓ Restored backed up icons");
}

// Copy manifest and other required files
const manifest = {
  "manifest_version": 3,
  "name": "Bye - Personal Dashboard",
  "version": "1.0.0",
  "description": "A lean personal dashboard with Notes and Schedule",
  "icons": {
    "16": "icons/16.png",
    "48": "icons/48.png",
    "128": "icons/128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/16.png",
      "48": "icons/48.png",
      "128": "icons/128.png"
    }
  },
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  "permissions": ["storage"],
  "host_permissions": []
};

fs.writeFileSync(
  path.join(config.outputDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log("✓ Created manifest.json");

// Create a simple popup
const popupHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 300px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #09090B;
      color: #fafafa;
    }
    h1 {
      font-size: 18px;
      margin: 0 0 8px 0;
    }
    p {
      font-size: 14px;
      color: #a1a1aa;
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>Bye Dashboard</h1>
  <p>Notes & Schedule</p>
  <p style="margin-top: 12px;">Open a new tab to use your dashboard.</p>
</body>
</html>`;

fs.writeFileSync(path.join(config.outputDir, "popup.html"), popupHtml);
console.log("✓ Created popup.html");

console.log("\n✅ Lean extension build complete!");
console.log(`Output: ${config.outputDir}`);
console.log("\nTo install:");
console.log("1. Open Chrome and go to chrome://extensions/");
console.log("2. Enable 'Developer mode'");
console.log("3. Click 'Load unpacked'");
console.log(`4. Select the folder: ${config.outputDir}`);