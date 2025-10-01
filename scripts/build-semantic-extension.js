#!/usr/bin/env node

/**
 * Build Script for Semantic CSS Chrome Extension
 * Builds extension with pure semantic markup and vanilla CSS
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const EXTENSION_DIR = path.join(__dirname, "../extension");
const BUILD_DIR = path.join(__dirname, "../extension-build");
const PUBLIC_DIR = path.join(__dirname, "../public");

console.log("🚀 Building Semantic CSS Chrome Extension...");

// Clean previous build
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  console.log("✅ Cleaned previous build");
}

// Create build directory
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Step 1: Copy static files from public directory
console.log("📁 Copying static files...");

// Copy manifest
const manifestSource = path.join(PUBLIC_DIR, "manifest.json");
const manifestDest = path.join(BUILD_DIR, "manifest.json");
if (fs.existsSync(manifestSource)) {
  fs.copyFileSync(manifestSource, manifestDest);
  console.log("✅ Copied manifest.json");
} else {
  console.error("❌ manifest.json not found in public directory");
  process.exit(1);
}

// Copy icons directory
const iconsSource = path.join(PUBLIC_DIR, "icons");
const iconsDest = path.join(BUILD_DIR, "icons");
if (fs.existsSync(iconsSource)) {
  fs.cpSync(iconsSource, iconsDest, { recursive: true });
  console.log("✅ Copied icons");
}

// Copy assets directory
const assetsSource = path.join(PUBLIC_DIR, "assets");
const assetsDest = path.join(BUILD_DIR, "assets");
if (fs.existsSync(assetsSource)) {
  fs.cpSync(assetsSource, assetsDest, { recursive: true });
  console.log("✅ Copied assets");
}

// Step 2: Copy CSS files
console.log("🎨 Copying CSS files...");

const cssSource = path.join(EXTENSION_DIR, "css");
const cssDest = path.join(BUILD_DIR, "css");
if (fs.existsSync(cssSource)) {
  fs.cpSync(cssSource, cssDest, { recursive: true });
  console.log("✅ Copied CSS files");
}

// Step 3: Copy HTML file
const htmlSource = path.join(EXTENSION_DIR, "index.html");
const htmlDest = path.join(BUILD_DIR, "index.html");
if (fs.existsSync(htmlSource)) {
  fs.copyFileSync(htmlSource, htmlDest);
  console.log("✅ Copied index.html");
}

// Step 4: Build TypeScript/React with esbuild
console.log("⚛️ Building React components...");

async function buildReact() {
  try {
    // Install esbuild if not available
    try {
      require.resolve("esbuild");
    } catch (e) {
      console.log("📦 Installing esbuild...");
      execSync("npm install esbuild --save-dev", { stdio: "inherit" });
    }

    const esbuild = require("esbuild");

    // Build configuration
    await esbuild.build({
      entryPoints: [path.join(EXTENSION_DIR, "index.tsx")],
      bundle: true,
      outfile: path.join(BUILD_DIR, "index.js"),
      format: "iife",
      target: "chrome90",
      minify: true,
      sourcemap: false,
      define: {
        "process.env.NODE_ENV": '"production"',
        global: "globalThis",
      },
      external: [],
      loader: {
        ".tsx": "tsx",
        ".ts": "ts",
        ".jsx": "jsx",
        ".js": "js",
      },
      // Include React and ReactDOM in bundle
      inject: [],
      platform: "browser",
      logLevel: "info",
    });

    console.log("✅ Built React components");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

// Execute the build
buildReact()
  .then(() => {
    // Step 5: Update HTML to use built CSS
    console.log("🔗 Updating HTML references...");

    let htmlContent = fs.readFileSync(htmlDest, "utf8");

    // Add CSS imports to HTML
    const cssImports = `
    <link rel="stylesheet" href="./css/extension.css">
    <link rel="stylesheet" href="./css/auth.css">
  `;

    htmlContent = htmlContent.replace("</head>", `${cssImports}</head>`);

    // Update script reference
    htmlContent = htmlContent.replace(
      '<script src="./index.js"></script>',
      '<script src="./index.js"></script>',
    );

    fs.writeFileSync(htmlDest, htmlContent);
    console.log("✅ Updated HTML references");

    // Step 6: Create package info
    const packageInfo = {
      name: "bye-semantic-extension",
      version: "1.0.0",
      description: "Semantic CSS Chrome Extension build",
      buildDate: new Date().toISOString(),
      buildType: "semantic-css",
    };

    fs.writeFileSync(
      path.join(BUILD_DIR, "build-info.json"),
      JSON.stringify(packageInfo, null, 2),
    );

    console.log("📦 Extension built successfully!");
    console.log(`📂 Build location: ${BUILD_DIR}`);
    console.log("");
    console.log("📋 Next steps:");
    console.log("1. Open Chrome and go to chrome://extensions/");
    console.log('2. Enable "Developer mode"');
    console.log(
      '3. Click "Load unpacked" and select the extension-build directory',
    );
    console.log("4. Open a new tab to test the extension");
    console.log("");
    console.log("✨ Semantic CSS extension is ready!");

    // Create zip for distribution (optional)
    console.log("📦 Creating distribution zip...");
    try {
      const archiver = require("archiver");
      const output = fs.createWriteStream(
        path.join(__dirname, "../bye-semantic-extension.zip"),
      );
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        console.log(
          `✅ Created bye-semantic-extension.zip (${archive.pointer()} bytes)`,
        );
      });

      archive.on("error", (err) => {
        console.log("⚠️ Zip creation failed (optional step):", err.message);
      });

      archive.pipe(output);
      archive.directory(BUILD_DIR, false);
      archive.finalize();
    } catch (error) {
      console.log("⚠️ Zip creation skipped (archiver not installed)");
    }
  })
  .catch((error) => {
    console.error("❌ Build process failed:", error);
    process.exit(1);
  });
