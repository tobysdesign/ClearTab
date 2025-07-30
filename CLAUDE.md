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
- **AI Integration**: OpenAI API for chat and productivity features
- **State Management**: Zustand for client state, React Query for server state

### Key Directories

#### `/app` - Next.js App Router
- **`/api`**: Server-side API routes (AI, auth, calendar, tasks, notes, weather)
- **`/style-guide`**: Complete UI component style guide and documentation
- **`/settings`**: Settings pages for accounts, calendar, weather configuration

#### `/components` - Reusable Components
- **`/ui`**: Base UI components (buttons, dialogs, forms, dock, widgets)
- **`/dashboard`**: Dashboard-specific components (bento grid, dock content)
- **`/settings`**: Settings-related components
- **`/widgets`**: Widget implementations (tasks, notes, weather, finance, countdown)
- **`/ai`**: AI chat overlay and integration components

#### `/server` - Backend Services
- **Database**: Drizzle ORM setup and migrations
- **LLM Integration**: OpenAI and memory services (Mem0)
- **External APIs**: Google Calendar, weather services

#### `/cui` - Development Tool
Claude Code Web UI for development - can be ignored for main application work.

#### `/shared` - Shared Types and Schemas
- **`schema.ts`**: Drizzle database schema with Zod validation
- **Calendar types and utilities**

### Database Schema (Drizzle + PostgreSQL)
- **Users & Authentication**: NextAuth.js tables
- **Notes**: Rich text content (BlockNote editor format)
- **Tasks**: Due dates, priorities, completion status
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

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `OPENAI_API_KEY`: OpenAI API for AI features

### Optional Integrations
- `MEM0_API_KEY`: AI memory service
- `TOMORROW_IO_API_KEY`: Weather data
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Calendar integration

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
- Use existing AI service patterns in `/lib/actions/ai.ts`
- Context should include relevant user data (notes, tasks, calendar)
- Follow established prompt patterns for consistency

## Performance Considerations
- Image optimization (WebP/AVIF) - disabled for extension builds
- Code splitting for animations and vendor chunks
- React Query for efficient data fetching and caching
- Package optimization for Tanstack Query and Framer Motion