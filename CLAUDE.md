# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Styling**: Tailwind CSS with CSS custom properties for theming
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
- **Tailwind**: Utility-first with custom extensions
- **CSS Modules**: Component-scoped styles when needed
- **Design System**: Documented in `/app/style-guide`

## Development Guidelines

### Component Creation
1. Check `/app/style-guide` first - use existing components when possible
2. New components should follow established patterns and be added to style guide
3. Use Vaul for modals, drawers, and popovers
4. Avoid long inline Tailwind classes - use CSS classes with `@apply` or reusable components

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
