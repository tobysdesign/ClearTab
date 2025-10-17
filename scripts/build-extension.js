const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Load environment variables from .env.local
const loadEnvVars = () => {
  const envPath = path.join(__dirname, "../.env.local");
  const env = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split('\n');

    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine && !cleanLine.startsWith('#')) {
        const [key, value] = cleanLine.split('=');
        if (key && value) {
          env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }

  return env;
};

const envVars = loadEnvVars();

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

// NOTE: We no longer move API routes - the build handles this via IS_EXTENSION env var
// The Next.js config will exclude API routes when IS_EXTENSION=true

// Replace server actions with extension stubs
const actionsDir = path.join(__dirname, "../lib/actions");
const settingsStubsFile = path.join(actionsDir, "extension-stubs.ts");
const aiStubsFile = path.join(actionsDir, "ai-stubs.ts");
const settingsFile = path.join(actionsDir, "settings.ts");
const aiFile = path.join(actionsDir, "ai.ts");
const settingsBackup = path.join(actionsDir, "settings.ts.backup");
const aiBackup = path.join(actionsDir, "ai.ts.backup");

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
  // Restore server actions on error
  if (fs.existsSync(settingsBackup)) {
    fs.renameSync(settingsBackup, settingsFile);
  }
  if (fs.existsSync(aiBackup)) {
    fs.renameSync(aiBackup, aiFile);
  }
  process.exit(1);
}

// Restore server actions only (API routes are not moved anymore)
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
    let dest = path.join(config.outputDir, file);

    // Rename _next to next to avoid Chrome extension restriction
    if (file === "_next") {
      dest = path.join(config.outputDir, "next");
    }

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

// Fix _next references in HTML files
console.log("Fixing _next references in HTML files...");
const htmlFiles = [
  path.join(config.outputDir, "index.html"),
  path.join(config.outputDir, "404.html"),
  path.join(config.outputDir, "settings/index.html"),
  path.join(config.outputDir, "login/index.html"),
  path.join(config.outputDir, "logout/index.html"),
  path.join(config.outputDir, "404/index.html"),
];

htmlFiles.forEach((htmlFile) => {
  if (fs.existsSync(htmlFile)) {
    try {
      let content = fs.readFileSync(htmlFile, "utf8");
      content = content.replace(/_next/g, "next");
      fs.writeFileSync(htmlFile, content);
    } catch (error) {
      console.error(`Error updating ${htmlFile}:`, error);
    }
  }
});

// Modify the actual Next.js export to work as an extension
console.log("Modifying Next.js export for extension compatibility...");
const createExtensionHTML = () => {
  // Read the actual Next.js generated HTML
  const originalIndexPath = path.join(config.outputDir, "index.html");
  let htmlContent = "";

  try {
    htmlContent = fs.readFileSync(originalIndexPath, "utf8");
    console.log("Successfully read original Next.js HTML");
  } catch (error) {
    console.error("Could not read original Next.js HTML:", error);
    return;
  }

  // Create external environment variables script
  const envScriptContent = `// Extension environment variables
window.__EXTENSION_ENV__ = {
    NEXT_PUBLIC_SUPABASE_URL: "${envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
    IS_EXTENSION: "true"
};`;

  // Create external theme script (to replace inline theme script)
  const themeScriptContent = `// Theme initialization script
(function() {
    try {
        var d = document.documentElement;
        var c = d.classList;
        c.remove('light', 'dark');
        var e = localStorage.getItem('theme');
        if (e) {
            c.add(e || '');
        } else {
            c.add('dark');
        }
        if (e === 'light' || e === 'dark' || !e) {
            d.style.colorScheme = e || 'dark';
        }
    } catch (t) {
        console.warn('Theme initialization failed:', t);
    }
})();`;

  // Create external initialization script with better error handling
  const initScriptContent = `// Extension initialization script
window.IS_EXTENSION = true;

// Global error handler to catch connection errors
window.addEventListener('error', function(event) {
    if (event.error && event.error.message &&
        (event.error.message.includes('Connection closed') ||
         event.error.message.includes('WebSocket') ||
         event.error.message.includes('Failed to fetch'))) {
        console.warn('Extension: Caught connection error, continuing offline:', event.error.message);
        event.preventDefault();
        return false;
    }
});

// Handle unhandled promise rejections (like connection failures)
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason &&
        (event.reason.message?.includes('Connection closed') ||
         event.reason.message?.includes('WebSocket') ||
         event.reason.message?.includes('Failed to fetch'))) {
        console.warn('Extension: Caught connection promise rejection, continuing offline:', event.reason.message);
        event.preventDefault();

        // Show offline indicator
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
        return;
    }
});

// Force remove loading screens and show the app
window.addEventListener('DOMContentLoaded', function() {
    // Remove ALL loading screens after a short delay
    setTimeout(function() {
        // Remove the initial loader
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.remove();
            console.log('Extension: Removed initial loading screen');
        }

        // Also remove any secondary loaders
        const loaders = document.querySelectorAll('[style*="z-index:9999"]');
        loaders.forEach(function(el) {
            if (el.style.display !== 'none') {
                el.remove();
                console.log('Extension: Removed additional loading screen');
            }
        });

        // Make sure the main content is visible
        const mainContent = document.querySelector('.layout_mainContent__0mFuc');
        if (mainContent) {
            mainContent.style.opacity = '1';
            mainContent.style.visibility = 'visible';
        }
    }, 2000); // Give React some time to try hydrating
});

console.log('Extension initialization script loaded');`;

  // Remove erroneous script tags that reference CSS files
  console.log("Cleaning up erroneous CSS-as-script tags...");
  htmlContent = htmlContent.replace(/<script src="[^"]*\.css"[^>]*><\/script>/g, '');

  // Remove async attribute from critical scripts to ensure proper loading order
  console.log("Fixing script loading order...");
  // Remove async from webpack and main scripts
  htmlContent = htmlContent.replace(/<script src="([^"]*webpack[^"]*)"[^>]*async[^>]*>/g, '<script src="$1">');
  htmlContent = htmlContent.replace(/<script src="([^"]*main[^"]*)"[^>]*async[^>]*>/g, '<script src="$1">');
  htmlContent = htmlContent.replace(/<script src="([^"]*vendors[^"]*)"[^>]*async[^>]*>/g, '<script src="$1">');

  // Extract all inline scripts and save them as external files
  const inlineScripts = [];
  let scriptCounter = 1;

  console.log("Extracting inline scripts...");

  // Find and extract inline scripts (not src-based scripts)
  htmlContent = htmlContent.replace(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/g, (match, attributes, content) => {
    if (content.trim()) {
      const scriptFilename = `inline-script-${scriptCounter}.js`;
      const scriptPath = path.join(config.outputDir, scriptFilename);

      // Clean up the content and make it extension-safe
      let cleanContent = content.trim();

      // Wrap potentially problematic scripts with try-catch
      if (cleanContent.includes('self._next_f') || cleanContent.includes('!function()')) {
        cleanContent = `try {\n${cleanContent}\n} catch(e) {\n  console.warn('Extension: Script execution error:', e);\n}`;
      }

      fs.writeFileSync(scriptPath, cleanContent);
      console.log(`Extracted inline script to: ${scriptFilename}`);

      scriptCounter++;
      return `<script src="/${scriptFilename}"${attributes}></script>`;
    }
    return match;
  });

  // Add offline indicator and extension styles to head
  const extensionStyles = `
    <style>
        .extension-offline-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f59e0b;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
            z-index: 10000;
        }
    </style>`;

  htmlContent = htmlContent.replace('</head>', `${extensionStyles}</head>`);

  // Add offline indicator to body start
  const offlineIndicator = '<div class="extension-offline-indicator" id="offline-indicator">Offline Mode</div>';
  htmlContent = htmlContent.replace(/(<body[^>]*>)/, `$1${offlineIndicator}`);

  // Add our external scripts at the beginning of head for early loading
  const externalScripts = `
    <!-- Extension environment variables -->
    <script src="/extension-env.js"></script>
    <!-- Extension theme initialization -->
    <script src="/extension-theme.js"></script>
    <!-- Extension initialization script -->
    <script src="/extension-init.js"></script>
  `;

  // Insert our scripts right after the opening <head> tag
  htmlContent = htmlContent.replace('<head>', `<head>${externalScripts}`);

  // Write the modified HTML
  fs.writeFileSync(originalIndexPath, htmlContent);

  // Write the external scripts
  const envScriptPath = path.join(config.outputDir, "extension-env.js");
  fs.writeFileSync(envScriptPath, envScriptContent);

  const themeScriptPath = path.join(config.outputDir, "extension-theme.js");
  fs.writeFileSync(themeScriptPath, themeScriptContent);

  const initScriptPath = path.join(config.outputDir, "extension-init.js");
  fs.writeFileSync(initScriptPath, initScriptContent);

  console.log(`Successfully modified Next.js HTML for extension compatibility`);
  console.log(`Extracted ${scriptCounter - 1} inline scripts to external files`);
};

// Replace the complex Next.js generated HTML with a simpler version
if (fs.existsSync(path.join(config.outputDir, "index.html"))) {
  createExtensionHTML();
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
