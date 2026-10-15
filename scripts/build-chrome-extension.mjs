#!/usr/bin/env node
/*
 * Builds the ClearTab Chrome extension: the dashboard as an MV3 new tab page.
 *
 *   npm run build-extension                  dist/chrome-extension/, talks to https://cleartab.app
 *   npm run build-extension:local            same, but talks to http://localhost:3000 (npm run dev)
 *   npm run package-extension                dist/chrome-extension-store/ + dist/cleartab-extension-<version>.zip
 *                                            for the Web Store (separate folder, so the unpacked dev build is untouched)
 *
 * Options: --api=<origin> (server the extension calls), --zip (store package: no "key").
 *
 * Load dist/chrome-extension/ at chrome://extensions (Developer mode -> Load unpacked). Dev
 * builds carry the public key in scripts/chrome-extension-dev-key.txt, so the unpacked
 * extension always gets the same id; that id has to be in the server's EXTENSION_IDS.
 *
 * Why a staging copy: the extension is a static export (next build with output: "export"),
 * which can't contain API routes, middleware or server actions, and Next always builds into
 * ./.next even then, which would clobber a running dev server. So the app is copied to a
 * temp folder without the server-only parts and built there against this project's
 * node_modules. The export is then made loadable by Chrome: _next/ renamed (Chrome rejects
 * top-level names starting with "_"), inline scripts moved to files (MV3's CSP blocks
 * them), and a manifest written.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGE = path.join(os.tmpdir(), "cleartab-extension-build");
const DIST = path.join(ROOT, "dist", process.argv.includes("--zip") ? "chrome-extension-store" : "chrome-extension");
const DEV_KEY_FILE = path.join(ROOT, "scripts", "chrome-extension-dev-key.txt");

const args = process.argv.slice(2);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const zip = args.includes("--zip");
const apiBase = new URL(option("api") || process.env.EXTENSION_API_BASE_URL || "https://cleartab.app").origin;

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const log = (message) => console.log(`\x1b[36m[extension]\x1b[0m ${message}`);

// Not copied to the staging folder: server-only code, build output, tooling, secrets, and
// leftovers of the old extension in public/
const EXCLUDE = new Set([
  "node_modules", ".git", ".next", "out", "dist", ".vercel", ".turbo", ".cache",
  "app/api", "app/auth", "middleware.ts",
  "docs", "docs-and-demos", "browser-tools-mcp", "cui", "src", "supabase", "migrations",
  "scripts", "tests", "test-results", "playwright-report", "coverage", "storybook-static",
  "public/manifest.json", "public/background.js", "public/popup.html", "public/popup.js",
  "public/extension.html", "public/extension-lean.html", "public/extension-template.html",
  "public/5day.png", "public/Edit_task_maybe.png", "public/dibs.svg",
  "public/icon-192.png", "public/icon-512.png",
]);
const excluded = (relative) =>
  EXCLUDE.has(relative) ||
  path.basename(relative) === ".DS_Store" ||
  /^\.env/.test(path.basename(relative)) ||
  relative.startsWith("node_modules/");

function stage() {
  log(`Staging app in ${STAGE}`);
  fs.mkdirSync(STAGE, { recursive: true });
  // Keep .next (webpack cache) between builds; everything else is copied fresh
  for (const entry of fs.readdirSync(STAGE)) {
    if (entry !== ".next" && entry !== "node_modules") fs.rmSync(path.join(STAGE, entry), { recursive: true, force: true });
  }
  fs.cpSync(ROOT, STAGE, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(ROOT, source).split(path.sep).join("/");
      return relative === "" || !excluded(relative);
    },
  });
  if (!fs.existsSync(path.join(STAGE, "node_modules"))) {
    fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(STAGE, "node_modules"), "dir");
  }

  // One route: the dashboard (app/tab/page.tsx) becomes the root page, the new tab
  const app = path.join(STAGE, "app");
  const dashboard = fs.readFileSync(path.join(app, "tab", "page.tsx"), "utf8");
  for (const entry of fs.readdirSync(app, { withFileTypes: true })) {
    if (entry.isDirectory()) fs.rmSync(path.join(app, entry.name), { recursive: true });
  }
  for (const file of ["manifest.ts", "page.bak"]) fs.rmSync(path.join(app, file), { force: true });
  fs.writeFileSync(path.join(app, "page.tsx"), dashboard);
}

function build() {
  log(`Building (API: ${apiBase})`);
  // Never hand server secrets to the client build, even if they're in this shell
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/SECRET|DATABASE_URL|API_KEY|CLIENT_ID|TOKEN|PASSWORD/i.test(key)) delete env[key];
  }
  execFileSync(process.execPath, [path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "build", "--no-lint"], {
    cwd: STAGE,
    stdio: "inherit",
    env: {
      ...env,
      NODE_ENV: "production",
      IS_EXTENSION: "true",
      NEXT_PUBLIC_API_BASE_URL: apiBase,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

function makeLoadable() {
  log("Making the export loadable by Chrome");
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.cpSync(path.join(STAGE, "out"), DIST, { recursive: true });

  // Chrome refuses extensions with top-level names starting with "_": rename _next/ to
  // next/ and point every reference at it; drop the rest (_not-found etc.), unused here
  fs.renameSync(path.join(DIST, "_next"), path.join(DIST, "next"));
  for (const entry of fs.readdirSync(DIST)) {
    if (entry.startsWith("_")) fs.rmSync(path.join(DIST, entry), { recursive: true, force: true });
  }
  for (const file of walk(DIST)) {
    if (!/\.(html|js|css|txt|json)$/.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const next = text.replaceAll("/_next/", "/next/");
    if (next !== text) fs.writeFileSync(file, next);
  }

  // MV3 only runs scripts from files in the extension: move each inline <script> into its
  // own file, in place, so order and timing stay the same
  const inlineDir = path.join(DIST, "inline");
  fs.mkdirSync(inlineDir, { recursive: true });
  let moved = 0;
  for (const file of walk(DIST).filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8").replace(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
      (tag, attributes, code) => {
        // Next lists one CSS chunk as a <script> too (the vendors splitChunks group); it
        // only errors, and the same file is already linked as a stylesheet
        if (/\bsrc\s*=\s*"[^"]+\.css"/.test(attributes)) return "";
        if (/\bsrc\s*=/.test(attributes)) return tag;
        const type = attributes.match(/\btype\s*=\s*["']?([^"'\s>]+)/)?.[1];
        // JSON / data blocks aren't executed, so they can stay
        if (type && !/^(text\/javascript|module)$/i.test(type)) return tag;
        if (!code.trim()) return "";
        const name = `${createHash("sha256").update(code).digest("hex").slice(0, 16)}.js`;
        fs.writeFileSync(path.join(inlineDir, name), code);
        moved += 1;
        return `<script${attributes} src="/inline/${name}"></script>`;
      },
    );
    fs.writeFileSync(file, html);
  }
  log(`Moved ${moved} inline scripts to files`);
}

function extensionId(publicKeyBase64) {
  const der = Buffer.from(publicKeyBase64, "base64");
  const hex = createHash("sha256").update(der).digest("hex").slice(0, 32);
  return [...hex].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
}

function writeManifest() {
  const devKey = zip ? null : fs.readFileSync(DEV_KEY_FILE, "utf8").trim();
  const manifest = {
    manifest_version: 3,
    name: "ClearTab",
    short_name: "ClearTab",
    version: pkg.version,
    description: "Your notes, tasks, calendar and weather in every new tab.",
    chrome_url_overrides: { newtab: "index.html" },
    // identity: the sign-in window; storage: the sign-in token (this device only)
    permissions: ["identity", "storage"],
    // Lets the new tab call the ClearTab API without CORS
    host_permissions: [`${apiBase}/*`],
    // "Your own backend" transcription can point at any server. We don't know that origin at
    // build time, so it's requested at runtime (chrome.permissions.request) when the user saves
    // a proxy URL — see lib/chrome-extension-utils.ts requestHostPermission.
    optional_host_permissions: ["https://*/*", "http://*/*"],
    icons: { 16: "icons/16.png", 48: "icons/48.png", 128: "icons/128.png" },
    minimum_chrome_version: "116",
    ...(devKey && { key: devKey }),
  };
  fs.writeFileSync(path.join(DIST, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return devKey ? extensionId(devKey) : null;
}

// Fails the build if Chrome would refuse the folder or the page would break under MV3
function verify() {
  const problems = [];
  const files = walk(DIST);
  const topLevel = fs.readdirSync(DIST).filter((entry) => entry.startsWith("_"));
  if (topLevel.length) problems.push(`top-level names starting with "_": ${topLevel.join(", ")}`);

  for (const file of files.filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    for (const [, attributes] of html.matchAll(/<script\b([^>]*)>/g)) {
      const type = attributes.match(/\btype\s*=\s*["']?([^"'\s>]+)/)?.[1];
      if (!/\bsrc\s*=/.test(attributes) && (!type || /^(text\/javascript|module)$/i.test(type))) {
        problems.push(`inline script left in ${path.relative(DIST, file)}`);
      }
    }
    for (const [, url] of html.matchAll(/(?:src|href)="(\/[^"#?]+)/g)) {
      if (!fs.existsSync(path.join(DIST, decodeURIComponent(url)))) problems.push(`${path.relative(DIST, file)} links to missing ${url}`);
    }
  }
  for (const file of files.filter((f) => /\.(html|js|css)$/.test(f))) {
    if (fs.readFileSync(file, "utf8").includes("/_next/")) problems.push(`"/_next/" still referenced in ${path.relative(DIST, file)}`);
  }
  if (!fs.existsSync(path.join(DIST, "index.html"))) problems.push("index.html missing");

  if (problems.length) {
    console.error(`\n\x1b[31m[extension] Build isn't loadable:\x1b[0m\n  ${[...new Set(problems)].join("\n  ")}`);
    process.exit(1);
  }
  const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  log(`Checked ${files.length} files (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
}

function packageZip() {
  const target = path.join(ROOT, "dist", `cleartab-extension-${pkg.version}.zip`);
  fs.rmSync(target, { force: true });
  execFileSync("zip", ["-qrX", target, "."], { cwd: DIST, stdio: "inherit" });
  log(`Web Store package: ${path.relative(ROOT, target)}`);
}

stage();
build();
makeLoadable();
const id = writeManifest();
verify();
if (zip) packageZip();

log(`Done: ${path.relative(ROOT, DIST)}/`);
if (id) {
  log(`Unpacked extension id: ${id}`);
  log(`The server at ${apiBase} needs EXTENSION_IDS to include it.`);
}
