# Storybook Troubleshooting Guide

## "Failed to fetch dynamically imported module" Error

### Problem Description
Components fail to load in Storybook with the error:
```
Failed to fetch dynamically imported module: http://localhost:6006/src/stories/ComponentName.stories.tsx
```

### Root Cause
This error is typically **NOT** a JavaScript module issue, but rather a **CSS compilation failure**. Specifically, it occurs when:

1. CSS modules use Tailwind `@apply` directives
2. Tailwind CSS is not properly configured in the project
3. PostCSS/Vite cannot process the `@apply` syntax during build

### Symptoms
- Stories appear in Storybook sidebar but fail to load
- Error message mentions "Failed to fetch dynamically imported module"
- Browser console may show additional CSS compilation errors
- Storybook terminal output shows PostCSS errors like:
  ```
  [postcss] The `bg-popover` class does not exist. If `bg-popover` is a custom class, make sure it is defined within a `@layer` directive.
  ```

### Debugging Steps

1. **Check Storybook terminal output** for CSS/PostCSS errors:
   ```bash
   # Look for errors like this in the terminal:
   # [vite] Internal server error: [postcss] /path/to/file.module.css:3:11:
   # The `bg-popover` class does not exist
   ```

2. **Search for `@apply` directives** in CSS modules:
   ```bash
   grep -r "@apply" src/
   ```

3. **Check if Tailwind is configured**:
   ```bash
   ls tailwind.config.*  # Should exist if using Tailwind
   ```

### Solutions

#### Option 1: Replace @apply with CSS (Recommended)
Replace Tailwind `@apply` directives with standard CSS:

```css
/* ❌ Before: Using @apply (breaks without Tailwind) */
.content {
  @apply z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm;
}

/* ✅ After: Standard CSS (always works) */
.content {
  z-index: 50;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #1a1a1a;
  padding: 6px 12px;
  font-size: 14px;
  color: #e6e6e6;
}
```

#### Option 2: Configure Tailwind CSS (If using Tailwind)
If the project should use Tailwind, add proper configuration:

1. Install Tailwind:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   ```

2. Create `tailwind.config.js`:
   ```javascript
   module.exports = {
     content: ['./src/**/*.{js,ts,jsx,tsx}'],
     theme: { extend: {} },
     plugins: [],
   }
   ```

3. Create `postcss.config.js`:
   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

### Prevention
- Follow the project's CSS architecture (CSS Modules vs Tailwind)
- Avoid mixing `@apply` directives with CSS Modules unless Tailwind is properly configured
- Use consistent styling approaches across components

### Related Issues
- CSS compilation errors in build tools
- Module resolution failures
- Storybook configuration issues
- PostCSS plugin conflicts

---

## Example Fix: AddButton Component

### Problem
AddButton story failed to load due to tooltip CSS using `@apply` directives.

### Error Location
File: `src/components/ui/tooltip.module.css`
```css
.content{ @apply z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95; }
```

### Solution Applied
Replaced with standard CSS:
```css
.content {
  z-index: 50;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #1a1a1a;
  padding: 6px 12px;
  font-size: 14px;
  color: #e6e6e6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.content[data-state="open"] {
  opacity: 1;
  transform: scale(1);
}
```

### Result
- AddButton stories now load successfully
- Tooltip styling works correctly
- No more dynamic import errors