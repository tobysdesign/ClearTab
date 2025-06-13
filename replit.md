# AI Productivity Dashboard

## Overview

This is a full-stack React + Express application that provides a privacy-respecting productivity dashboard with AI capabilities. The application features a dark mode bento box widget layout with humanistic AI chat integration, built with modern web technologies and deployed on Replit with PostgreSQL database support.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Framework**: TailwindCSS with shadcn/ui component library for consistent design
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Background**: Authentic reactbits.dev silk shader using Three.js + WebGL for visual appeal

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules for type safety
- **Session Management**: Express sessions with in-memory storage for development
- **Authentication**: Username/password with Passport.js sessions (simple implementation)

### Database Architecture
- **Primary Database**: PostgreSQL (Neon/Supabase compatible)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon serverless driver with WebSocket support

## Key Components

### Core Widgets
1. **Notes Widget**: Collapsible rich text editor with two-letter preview cards
2. **Tasks Widget**: Kanban-style task management (todo/inprogress/review)
3. **Calendar Widget**: Google Calendar integration with upcoming events display
4. **Weather Widget**: Multi-city weather data from Tomorrow.io API
5. **AI Chat**: Contextual assistant with Cmd+K shortcut activation

### AI Services Integration
- **OpenAI GPT-4o**: Primary AI model for chat and content analysis
- **Mem0**: Emotional memory storage for AI personality development
- **Emotional Intelligence**: Content analysis for mood tracking and insights

### Authentication System
- Simple username/password authentication
- Session-based auth with Express sessions
- Optional Google OAuth integration (configured but not primary)
- Development mode bypasses authentication for easier testing

### UI Components
- **Bento Grid Layout**: Resizable widget containers with drag-and-drop
- **Dark Mode Theme**: System/manual theme switching with CSS variables
- **Component Library**: Custom shadcn/ui implementation with emotional face icons
- **Responsive Design**: Mobile-first approach with breakpoint-aware components

## Data Flow

### User Authentication Flow
1. Landing page with signup/login forms
2. Session creation on successful authentication
3. Redirect to dashboard with authenticated state
4. Development mode skips auth for rapid iteration

### Widget Data Flow
1. React Query manages all server state with automatic caching
2. Widgets fetch data independently with error boundaries
3. Real-time updates through periodic refetching
4. Optimistic UI updates for immediate feedback

### AI Chat Flow
1. User input captured through chat overlay or keyboard shortcut
2. Message sent to Express backend with user context
3. OpenAI API integration for response generation
4. Mem0 service stores emotional metadata (not raw content)
5. Chat history auto-expires after 3 days for privacy

### Database Operations
1. Drizzle ORM handles all database interactions
2. Type-safe queries with TypeScript schema validation
3. Connection pooling through Neon serverless driver
4. Migration management through Drizzle Kit CLI

## External Dependencies

### Core Dependencies
- **React Ecosystem**: react@18.3.1, react-dom, @vitejs/plugin-react
- **UI Framework**: tailwindcss@3.4.14, @radix-ui components, lucide-react
- **Backend**: express@4.21.1, typescript@5.6.3, drizzle-orm@0.36.4
- **Three.js**: three@0.169.0, @react-three/fiber@8.18.0 for WebGL background

### AI Services
- **OpenAI**: Direct API integration for GPT-4o model
- **Mem0**: mem0ai package for emotional memory storage
- **Tomorrow.io**: Weather API for environmental context

### Database & Auth
- **Neon**: @neondatabase/serverless for PostgreSQL connection
- **Drizzle**: drizzle-kit@0.28.1 for migrations and schema management
- **Sessions**: express-session with configurable storage

### Development Tools
- **Vite**: Fast development server with HMR
- **TypeScript**: Full type coverage across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Replit Integration**: Custom Vite plugins for development environment

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for seamless Replit development
- **Hot Module Replacement**: Vite HMR for rapid development iteration
- **Database**: Automatic PostgreSQL provisioning through Replit
- **Environment Variables**: Development defaults with production overrides

### Production Deployment
- **Primary Target**: Vercel with automatic GitHub integration
- **Alternative**: Self-hosted with Docker support
- **Database**: Neon or Supabase PostgreSQL with connection pooling
- **Build Process**: Vite production build with Express server bundling

### Environment Configuration
```env
# Required Production Variables
DATABASE_URL=postgresql://...
SESSION_SECRET=random-secret-key
OPENAI_API_KEY=sk-...

# Optional Enhancement Variables
MEM0_API_KEY=mem0-api-key
TOMORROW_IO_API_KEY=weather-api-key
GOOGLE_CLIENT_ID=google-oauth-id
GOOGLE_CLIENT_SECRET=google-oauth-secret
```

### Build & Deployment Commands
- **Development**: `npm run dev` (starts both frontend and backend)
- **Build**: `npm run build` (creates production bundle)
- **Production**: `npm run start` (serves built application)
- **Database**: `npm run db:push` (applies schema changes)

## Changelog

```
Changelog:
- June 13, 2025. Initial setup
- June 13, 2025. Fixed Yoopta editor backgrounds - removed all blue colors and backgrounds with aggressive CSS overrides in index.css
- June 13, 2025. Completely eliminated all blue colors from UI using nuclear CSS overrides targeting all blue variants, button components, and CSS variables
- June 13, 2025. Settings modal converted to use VAUL pattern (framer-motion) matching AI chat drawer for unified theming and consistent black styling
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Styling preference: No aggressive CSS overrides or !important declarations - clean styling approach preferred.
Color preference: No blue colors - use dark gray/black theme throughout.
```