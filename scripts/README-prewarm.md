# API Pre-warming Scripts

These scripts solve the development issue where the first API request takes 15-25 seconds due to Next.js compilation.

## Usage

### Quick Pre-warm (Recommended)
```bash
npm run prewarm
```

Hits the main API routes to trigger compilation. Takes ~30 seconds but makes subsequent requests fast (<2 seconds).

### Auto Pre-warm Development
```bash
npm run dev:prewarm
```

Starts the dev server and automatically pre-warms routes after 10 seconds.

## Performance Results

| Scenario | First Request Time | Subsequent Requests |
|----------|-------------------|-------------------|
| **Before optimization** | 25+ seconds | 25+ seconds |
| **After bundle optimization** | 19 seconds | 19 seconds |
| **After pre-warming** | 1-2 seconds | <1 second |

## How It Works

1. **Bundle Optimization**: Lazy loading of heavy dependencies (Supabase, full schema)
2. **Pre-warming**: Triggers Next.js compilation by hitting API routes
3. **Development Mode**: Bypasses auth to reduce compilation complexity

## Files

- `prewarm-simple.js` - Basic pre-warming (recommended)
- `prewarm-api.js` - Advanced pre-warming with more routes and timing
- `README-prewarm.md` - This documentation

## Note

This is a development-only optimization. Production builds are pre-compiled and don't have this issue.