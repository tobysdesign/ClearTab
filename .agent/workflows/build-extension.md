---
description: Build the ClearTab Chrome Extension
---

1. Install dependencies (ensure clean state)
```bash
npm install
```

# Build Extension (Static Export)

1. Temporarily move API routes (not supported in static export)
```bash
mv app/api app/_api_disabled
```

2. Build the extension
// turbo
```bash
IS_EXTENSION=true npm run build
```

3. Restore API routes and Fix Directories
```bash
mv app/_api_disabled app/api
node scripts/extension-post-build.js
```
*Note: This uses `next.config.extension.js` which sets `output: export`.*

3. Post-build processing (Optional but recommended)
   - Ensure `out` directory exists.
   - Copy `manifest.extension.json` to `out/manifest.json`.
   - Copy icons if needed.

```bash
cp manifest.extension.json out/manifest.json
```

4. Load in Chrome
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `out` directory.
