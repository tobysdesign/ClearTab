const fs = require('fs');
const path = require('path');
const glob = require('glob');
const crypto = require('crypto');

const OUT_DIR = path.join(__dirname, '../out');
const NEXT_DIR = path.join(OUT_DIR, '_next');
const NEW_NEXT_DIR = path.join(OUT_DIR, 'next');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');
const STATIC_JS_DIR = path.join(NEW_NEXT_DIR, 'static', 'chunks'); // Use existing chunks dir

function computeSha256(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
}

async function fixExtensionBuild() {
    console.log('🔧 Fixing Chrome Extension build (MV3 Compliant)...');

    // 1. Rename _next to next
    if (fs.existsSync(NEXT_DIR)) {
        console.log('  Moving _next -> next');
        if (fs.existsSync(NEW_NEXT_DIR)) {
            fs.rmSync(NEW_NEXT_DIR, { recursive: true, force: true });
        }
        fs.renameSync(NEXT_DIR, NEW_NEXT_DIR);
    } else if (!fs.existsSync(NEW_NEXT_DIR)) {
        console.warn('  ⚠️ _next directory not found (already moved?)');
    } else {
        console.log('  _next already renamed to next');
    }

    // Ensure target dir for extracted scripts exists
    if (!fs.existsSync(STATIC_JS_DIR)) {
        // It should exist if build is standard Next.js, but just in case
        fs.mkdirSync(STATIC_JS_DIR, { recursive: true });
    }

    // 2. Replace references in ALL text files (HTML, JS, CSS, JSON)
    // We need to fix paths like /_next/, "_next/", etc.
    console.log('  Patching paths in text files...');
    const textFiles = glob.sync('**/*.{html,js,css,json}', { cwd: OUT_DIR });

    let patchCount = 0;

    textFiles.forEach(file => {
        const filePath = path.join(OUT_DIR, file);

        // Skip if directory
        if (fs.lstatSync(filePath).isDirectory()) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Robust replacements for _next -> next
        // 1. Absolute paths: /_next/ -> /next/
        content = content.replace(/\/_next\//g, '/next/');

        // 2. Relative paths or inside strings: "_next/" -> "next/"
        // Be careful not to break things, but "_next/" is specific enough.
        content = content.replace(/\"_next\//g, '"next/');
        content = content.replace(/\'_next\//g, "'next/");

        // 3. CSS urls: url(/_next/...) or url(_next/...)
        // (Handled by 1 if absolute, handle relative now)
        // regex for url(_next/...)
        content = content.replace(/url\(_next\//g, 'url(next/');

        if (content !== originalContent) {
            patchCount++;
        }

        // HTML SPECIAL HANDLING: CSP Hash Extraction
        if (file.endsWith('.html')) {
            // Strip Meta CSP
            const metaCspRegex = /<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi;
            content = content.replace(metaCspRegex, '');

            // Extract scripts
            const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
            content = content.replace(scriptRegex, (match, attributes, scriptContent) => {
                if (/src\s*=/i.test(attributes)) return match;
                if (!scriptContent.trim()) return match;

                const hash = computeSha256(scriptContent);
                const filename = `inline-${hash}.js`;
                const localPath = path.join(STATIC_JS_DIR, filename);
                const webPath = `/next/static/chunks/${filename}`;

                fs.writeFileSync(localPath, scriptContent);

                let isJs = true;
                const typeMatch = /type=["']([^"']+)["']/i.exec(attributes);
                if (typeMatch) {
                    const type = typeMatch[1].toLowerCase();
                    if (type !== 'text/javascript' && type !== 'module' && type !== 'application/javascript') {
                        isJs = false;
                    }
                }

                if (isJs) {
                    return `<script src="${webPath}"${attributes}></script>`;
                } else {
                    return match;
                }
            });
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
        }
    });

    console.log(`  Patched paths in ${patchCount} files.`);

    // 3. Update manifest.json with strict CSP (No hashes)
    if (fs.existsSync(MANIFEST_PATH)) {
        console.log(`  Updating manifest.json with strict CSP...`);
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

        manifest.content_security_policy = {
            extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
        };

        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    }

    console.log('✅ Extension build fixed (MV3 Compliant)!');
}

fixExtensionBuild();
