# CLAUDE.md - AI Assistant Instructions

**CONTEXT**: This file provides comprehensive guidance for AI assistants (Claude Code, GPT, etc.) when working with this Next.js codebase. Follow these instructions exactly to maintain consistency and prevent common architectural issues.

**PRIORITY**: Read the "🚨 CRITICAL RULES" sections first. These prevent major issues that break functionality.

## Project Overview

"Bye" is a comprehensive AI-powered personal dashboard and productivity application with multiple deployment targets:

- **Web Application**: Next.js-based dashboard with AI assistant, notes, tasks, calendar integration, and weather widgets
- **Chrome Extension**: Same functionality as a new tab replacement (builds to static files)
- **Multi-platform**: Optimized for both web and mobile experiences

*Note: The `/cui` directory contains a Claude Code Web UI for development purposes - this can be ignored for main application development.*

## Essential Commands

### Development
```bash
npm run dev          # Start Next.js development server
npm run build        # Build web application
npm run start        # Start production server
```

### Chrome Extension
```bash
npm run build-extension    # Build extension (sets IS_EXTENSION=true)
npm run package-extension  # Create zip file for Chrome Web Store
./scripts/build-extension.sh  # Complete extension build script
```

### Database
```bash
npm run migrate      # Run Drizzle database migrations
```

### Testing
```bash
npm run test         # Run Playwright tests
npx playwright test  # Run specific Playwright tests
```

### Code Quality
```bash
npm run lint         # ESLint (ignored during builds)
npm run typecheck    # TypeScript checking
```

## Architecture Overview

### Core Stack
- **Framework**: Next.js 15+ with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: CSS Modules with CSS custom properties for theming (NO TAILWIND)
- **Auth**: NextAuth.js with session management
- **AI Integration**: Chrome Gemini Nano (built-in local AI)
- **State Management**: Zustand for client state, React Query for server state
- **Icons**: Custom SVG components (optimized for Chrome extension)
- **Editor**: Quill with bubble theme (replacing BlockNote for performance)
- **Date Utilities**: Native JavaScript Date methods (replacing date-fns)

### Key Directories

#### `/app` - Next.js App Router
- **`/api`**: Server-side API routes (AI, auth, calendar, tasks, notes, weather)
- **`/style-guide`**: Complete UI component style guide and documentation
- **`/settings`**: Settings pages for accounts, calendar, weather configuration

#### `/components` - Reusable Components
- **`/ui`**: Base UI components (buttons, dialogs, forms, dock, widgets)
- **`/dashboard`**: Dashboard-specific components (bento grid, dock content)
- **`/settings`**: Settings-related components
- **`/widgets`**: Widget implementations (tasks, notes, weather, countdown)
- **`/ai`**: AI chat overlay and integration components
- **`/icons`**: Custom SVG icon components (replacing lucide-react/react-icons)

#### `/server` - Backend Services
- **Database**: Drizzle ORM setup and migrations
- **LLM Integration**: OpenAI and memory services (Mem0)
- **External APIs**: Google Calendar, weather services

#### `/cui` - Development Tool
Claude Code Web UI for development - can be ignored for main application work.

#### `/shared` - Shared Types and Schemas
- **`schema.ts`**: Drizzle database schema with Zod validation
- **Calendar types and utilities**

#### `/lib` - Utility Libraries
- **`date-utils.ts`**: Native JavaScript date utilities (replacing date-fns)
- **`google-api-service.ts`**: Optimized Google APIs client (replacing full googleapis)
- **`supabase-lite.ts`**: Lightweight Supabase client for extensions
- **`ai-service.ts`**: Chrome Gemini Nano integration for local AI processing

### Database Schema (Drizzle + PostgreSQL)
- **Users & Authentication**: NextAuth.js tables
- **Notes**: Rich text content (Quill Delta format)
- **Tasks**: Due dates, important (boolean), status
- **Settings**: User preferences, API keys, display settings
- **Memory Storage**: AI conversation memory and context

### Styling System
- **CSS Custom Properties**: Theme-aware color system
- **CSS Modules**: Component-scoped styles (primary styling method)
- **Design System**: Documented in `/app/style-guide`
- **BANNED**: Tailwind CSS, inline styles, !important declarations, and @apply directives
- **RULE**: No inline styles, no !important, no Tailwind

# AI DEVELOPMENT WORKFLOW

## STEP-BY-STEP PROCESS FOR AI ASSISTANTS

### 1. ANALYSIS PHASE
**Before writing any code:**
```bash
# Search for existing patterns
grep -r "similar-component" components/
# Check for existing providers
grep -r "Provider" app/providers.tsx
# Find styling patterns
find . -name "*.module.css" | head -5
```

### 2. COMPONENT CREATION CHECKLIST
**For every new component:**
- [ ] Check `/app/style-guide` for existing components
- [ ] Create `ComponentName.tsx` + `ComponentName.module.css`
- [ ] Import styles: `import styles from './ComponentName.module.css'`
- [ ] Use TypeScript: Import types from `/shared/schema.ts`
- [ ] Add to style guide documentation if reusable

### 3. CSS/STYLING MANDATORY PROCESS
**EVERY styling change must follow this pattern:**

```tsx
// ❌ NEVER DO THIS
<div className="flex items-center gap-2" style={{padding: '8px'}}>

// ✅ ALWAYS DO THIS
<div className={styles.container}>
```

```css
/* ComponentName.module.css */
.container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}
```

**FORBIDDEN PATTERNS:**
- ❌ `className="flex items-center"` (Tailwind)
- ❌ `style={{display: 'flex'}}` (inline styles)
- ❌ `@apply flex items-center` (CSS @apply)

### 4. STATE MANAGEMENT CHECKLIST
**For any context or state changes:**
- [ ] Check if provider already exists in `/app/providers.tsx`
- [ ] NEVER create duplicate providers
- [ ] Add localStorage persistence for user preferences
- [ ] Add console logs to track state flow during development

### Icon Usage
- **DO**: Use custom SVG components from `/components/icons/`
- **DON'T**: Import from lucide-react or react-icons (removed for performance)
- **Pattern**: `import { IconName } from '@/components/icons'`
- **Performance**: Tree-shakeable, zero bundle overhead

### Date Handling
- **DO**: Use utilities from `/lib/date-utils.ts`
- **DON'T**: Import from date-fns (removed for performance)
- **Native**: Prefer `Intl.DateTimeFormat`, `Date` methods when possible
- **Performance**: 38MB → ~2KB bundle savings

### Layout and Overflow
- Viewport should not be exceeded
- Widgets should handle internal scrolling (overflow-y: scroll)
- Dashboard uses bento grid layout with drag/drop functionality

### Key Integration Patterns

#### AI Chat Integration
- Mini AI chat overlay available throughout app
- Context-aware responses using notes, tasks, and calendar data
- Hashtag-based commands (#note, #task) for quick actions

#### Widget System
- Modular widget architecture in `/components/widgets`
- Each widget handles its own data fetching and state
- Widgets integrate with AI for smart suggestions and automation

#### Chrome Extension Build
- Environment variable `IS_EXTENSION=true` triggers static export
- Different asset handling and CSP for extension environment
- Popup interface matches web app functionality
- Lightweight dependencies optimized for <50MB bundle size
- Uses custom SVG icons, native date utilities, markdown editor

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key

### Optional Integrations
- `TOMORROW_IO_API_KEY`: Weather data
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Calendar integration

### Removed Dependencies
- ~~`OPENAI_API_KEY`~~: Replaced with Chrome Gemini Nano (no API key needed)
- ~~`MEM0_API_KEY`~~: Memory handled locally with Chrome storage

## Testing Strategy

- **Playwright**: End-to-end testing for web and extension builds
- **Component Testing**: Key widget and dashboard functionality

## Deployment Targets

### Web (Vercel/Production)
- Standard Next.js deployment with PostgreSQL
- CSP headers and security configuration
- Image optimization enabled

### Chrome Extension
- Static export build (`npm run build-extension`)
- Manifest v3 configuration
- Extension-specific security policies
- Optimized for performance: <50MB bundle, fast loading
- Uses lightweight alternatives to heavy dependencies

## Common Development Tasks

### Adding New Widgets
1. Create component in `/components/widgets/`
2. Add to widget configuration system
3. Update bento grid integration
4. Add to style guide documentation

### Database Changes
1. Modify `/shared/schema.ts`
2. Generate migration: `drizzle-kit generate`
3. Run migration: `npm run migrate`

### AI Feature Integration
- Use Chrome Gemini Nano via `/lib/ai-service.ts`
- Context should include relevant user data (notes, tasks, calendar)
- Local AI processing for privacy and performance
- No external API dependencies or keys required

## Performance Considerations

### Chrome Extension Optimization (Priority)
- **Bundle size target**: <50MB (down from 583MB dependencies)
- **Custom SVG icons**: Replacing lucide-react (41MB) + react-icons (83MB)
- **Native date utilities**: Replacing date-fns (38MB) with ~2KB utilities
- **Lightweight editor**: Replacing BlockNote (29MB) with Quill (~500KB)
- **Optimized clients**: Lightweight Supabase/Google API clients

### General Performance
- Image optimization (WebP/AVIF) - disabled for extension builds
- Code splitting for animations and vendor chunks
- React Query for efficient data fetching and caching
- Dynamic imports for heavy dependencies (googleapis)

# ARCHITECTURAL RULES & ANTI-PATTERNS

# 🚨 CRITICAL RULES - READ FIRST

## AI ASSISTANT WORKFLOW
**BEFORE making ANY changes, follow this checklist:**

1. **Check existing patterns** - Search for similar components/functionality first
2. **Verify provider hierarchy** - Never duplicate contexts (see Context Rules below)
3. **Follow CSS standards** - All styling must use CSS Modules (see Component Standards)
4. **Test state flow** - Add console logs to verify data flow works
5. **Use TypeScript** - Leverage existing types from `/shared/schema.ts`

## IMMEDIATE ACTION ITEMS
**When you encounter these patterns, fix them immediately:**

- ❌ `className="flex items-center"` → ✅ Use CSS Modules
- ❌ `style={{display: 'flex'}}` → ✅ Move to `.module.css` file
- ❌ Duplicate `<LayoutProvider>` → ✅ Remove, use existing in `/app/providers.tsx`
- ❌ Different input heights → ✅ Standardize to 32px + border
- ❌ Missing `key` props on conditional renders → ✅ Add `key={stateValue}`

## 🚨 CRITICAL: COMMON ISSUES TO PREVENT

### Context Provider Duplication (MAJOR ISSUE)
**NEVER create duplicate providers** - This causes state isolation and broken functionality.

**❌ FORBIDDEN Pattern:**
```tsx
// app/providers.tsx
<LayoutProvider>
  // app/page.tsx
  <LayoutProvider>  // ❌ DUPLICATE - breaks state sharing
```

**✅ CORRECT Pattern:**
- Context providers should exist ONLY in `/app/providers.tsx`
- Individual pages should NEVER wrap with duplicate providers
- Check if provider already exists before creating new ones

### CSS Styling Consistency (ONGOING MIGRATION)
**MANDATORY**: All components must use CSS Modules with consistent patterns.

**❌ FORBIDDEN - Mixed Styling:**
```tsx
// Different inputs with different borders
.input1 { border: 1px solid rgba(255,255,255,0.2); }
.input2 { border: none; }
.input3 { border: 1px solid #ccc; }
```

**✅ COPY-PASTE INPUT TEMPLATES:**

```css
/* TEMPLATE 1: Standard inputs (date, select, small text) - 32px height */
.standardInput {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
  color: white;
  outline: none;
  transition: all 0.2s ease;
}

.standardInput:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

/* TEMPLATE 2: Text inputs (larger content areas) */
.textInput {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: white;
  outline: none;
  transition: all 0.2s ease;
}

.textInput:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}
```

**COPY-PASTE BUTTON TEMPLATES:**

```css
/* PRIMARY BUTTON - For create/save actions */
.primaryButton {
  background: white;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primaryButton:hover {
  background: #f0f0f0;
}

/* SECONDARY BUTTON - For edit/cancel actions */
.secondaryButton {
  background: #131313;
  color: white;
  border: 1px solid #4E4E4E;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondaryButton:hover {
  background: #252525;
  border-color: #6E6E6E;
}
```

### Component Re-rendering Issues
**ALWAYS add keys** to components that switch layouts or have conditional rendering.

**❌ Problem Pattern:**
```tsx
{layout === 'two-row' ? <TwoRowLayout /> : <SingleRowLayout />}
```

**✅ Solution Pattern:**
```tsx
<motion.div key={layout}>
  {layout === 'two-row' ?
    <PanelGroup key="two-row-layout"> :
    <PanelGroup key="single-row-layout">
  }
</motion.div>
```

## STATE MANAGEMENT RULES

### Context Architecture
1. **Single Source of Truth**: Each context should exist in ONE place only
2. **Provider Hierarchy**: All providers in `/app/providers.tsx` in dependency order:
   ```tsx
   <QueryProvider>
     <SupabaseAuthProvider>
       <LayoutProvider>
         <TooltipProvider>
           <ChatProvider>
   ```
3. **No Nested Duplicates**: Pages should NEVER wrap with existing providers

### LocalStorage Integration
**REQUIRED for user preferences**: All user settings must persist.

**✅ COPY-PASTE LOCALSTORAGE PATTERN:**
```tsx
// TEMPLATE: LocalStorage state hook
const [state, setState] = useState(() => {
  // Initialize from localStorage if available (client-side)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('your-key-here')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return defaultValue
      }
    }
  }
  return defaultValue
})

// Auto-save to localStorage when state changes
useEffect(() => {
  localStorage.setItem('your-key-here', JSON.stringify(state))
}, [state])
```

**USAGE EXAMPLES:**
```tsx
// Layout preference
const [layout, setLayout] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('layout-preference')
    if (saved === 'single-row' || saved === 'two-row') {
      return saved
    }
  }
  return 'two-row'
})

// Settings
const [settings, setSettings] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('user-settings')
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) }
      } catch {
        return defaultSettings
      }
    }
  }
  return defaultSettings
})
```

## COMPONENT STANDARDS

### Input Component Consistency
**ALL inputs must follow the same visual pattern:**

1. **Standard Height**: 32px + border (except text inputs with padding)
2. **Border**: `1px solid rgba(255, 255, 255, 0.2)`
3. **Background**: `rgba(255, 255, 255, 0.1)`
4. **Focus State**: `background: rgba(255, 255, 255, 0.15)`
5. **Typography**: `font-size: 14px; color: white`

### Button Styling Standards
**Follow design guide button patterns:**

```css
/* Primary Button (create/save actions) */
.primaryButton {
  background: white;
  color: #1a1a1a;
  padding: 8px 16px;
  border-radius: 8px;
}

/* Secondary Button (edit/cancel actions) */
.secondaryButton {
  background: #131313;
  color: white;
  border: 1px solid #4E4E4E;
  padding: 8px 16px;
  border-radius: 8px;
}
```

### CSS Module Requirements
**MANDATORY for all components:**

1. **File Structure**: `ComponentName.tsx` + `ComponentName.module.css`
2. **Import Pattern**: `import styles from './ComponentName.module.css'`
3. **Usage**: `className={styles.className}` (never inline)
4. **No Globals**: Use CSS custom properties for theming

## DEBUGGING GUIDELINES

### Adding Debug Information
**When state isn't updating visually:**

**✅ COPY-PASTE DEBUG PATTERNS:**

```tsx
// TEMPLATE: Debug state changes
const [state, setState] = useState(initialValue)

// Add this to track state updates
useEffect(() => {
  console.log('ComponentName: State changed to:', state, 'at', Date.now())
}, [state])

// Add this to track context consumption
const { contextValue } = useContext(SomeContext)
console.log('ComponentName: Context value:', contextValue)

// Add this to track re-renders
console.log('ComponentName: Component rendered with props:', props)
```

**DEBUG CHECKLIST:**
1. **Add console logs** to track state flow
2. **Check React DevTools** → Components tab → Find your provider
3. **Verify context consumption** matches provider location
4. **Check for duplicate providers** in the component tree
5. **Add keys to conditional renders** that switch layouts

### Layout Switching Issues
**Common fixes for layout not changing:**

1. **Add keys** to force re-renders: `key={layoutState}`
2. **Check provider duplication** in component tree
3. **Verify state updates** with console logs
4. **Use React.StrictMode** to catch issues early

## FILE ORGANIZATION

### Component Location Rules
1. **Base UI components**: `/components/ui/` (buttons, inputs, modals)
2. **Feature components**: `/components/widgets/`, `/components/settings/`
3. **Page components**: `/app/` (minimal, mostly layouts)
4. **Shared utilities**: `/lib/` (no component logic)

### Naming Conventions
1. **Components**: PascalCase (`ComponentName.tsx`)
2. **CSS Modules**: PascalCase + `.module.css`
3. **Utilities**: camelCase (`utilityName.ts`)
4. **Constants**: UPPER_SNAKE_CASE

## PERFORMANCE PATTERNS

### React Query Integration
**REQUIRED for all API calls:**

**✅ COPY-PASTE REACT QUERY PATTERNS:**

```tsx
// TEMPLATE: Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
})

// TEMPLATE: Mutation (for POST/PUT/DELETE)
const mutation = useMutation({
  mutationFn: (newData) => updateResource(newData),
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['resource'] })
  },
  onError: (error) => {
    console.error('Mutation error:', error)
  }
})

// Usage
const handleUpdate = () => {
  mutation.mutate(formData)
}

// TEMPLATE: Dependent query
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
})

const { data: userSettings } = useQuery({
  queryKey: ['user-settings', user?.id],
  queryFn: () => fetchUserSettings(user.id),
  enabled: !!user?.id, // Only run when user exists
})
```

**API ENDPOINT PATTERNS:**
```tsx
// TEMPLATE: API function
async function fetchResource(id: string) {
  const response = await fetch(`/api/resource/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch resource')
  }
  return response.json()
}

// TEMPLATE: API route (/app/api/resource/route.ts)
export async function GET(request: Request) {
  try {
    const data = await getResourceFromDB()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    )
  }
}
```

### Bundle Size Management
1. **Dynamic imports** for heavy components
2. **Tree shaking** with named exports
3. **Avoid barrel exports** for large libraries
4. **Use custom icons** instead of icon libraries

# AI ASSISTANT QUICK REFERENCE

## 🎯 IMMEDIATE LOOKUPS

### When Creating Components:
```bash
# Check existing patterns
ls components/ui/
ls components/widgets/
ls components/settings/
```

### When Adding State:
```bash
# Check existing providers
grep -r "Provider" app/providers.tsx
grep -r "createContext" hooks/
```

### When Styling:
```bash
# Find CSS patterns
find . -name "*.module.css" | head -10
grep -r "standardInput\|primaryButton" . --include="*.css"
```

### When Adding API Calls:
```bash
# Check existing API routes
ls app/api/
grep -r "useQuery\|useMutation" components/
```

## 🚀 OPTIMIZATION FOR AI EFFICIENCY

### Copy-Paste Code Templates
All major patterns above include **ready-to-use templates** that can be copied directly without modification.

### Searchable Keywords
- `TEMPLATE:` - Copy-paste code blocks
- `❌ FORBIDDEN` - What never to do
- `✅ COPY-PASTE` - Exact patterns to follow
- `🚨 CRITICAL` - Issues that break functionality

### Hierarchical Information
1. **Critical rules first** (prevents breaking changes)
2. **Step-by-step workflows** (prevents missed steps)
3. **Copy-paste templates** (reduces errors)
4. **Specific examples** (shows exact implementation)

## TESTING REQUIREMENTS

### Essential Tests
1. **Layout switching**: Verify provider context works
2. **State persistence**: Check localStorage integration
3. **Component rendering**: Ensure consistent styling
4. **API integration**: Mock external services

### Debug Commands
```bash
# Start development server
npm run dev

# Check TypeScript
npm run typecheck

# Run tests
npm run test
```
