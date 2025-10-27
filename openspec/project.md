# Project Context

## Purpose
ClearTab is a productivity surface that spans both the web (Next.js dashboard/new-tab experience) and a Chrome extension. The goal is to deliver a shared set of widgets (notes, tasks, schedule, countdown, etc.) that feel identical across surfaces. Current focus: extracting reusable UI primitives into `@cleartab/ui`, stabilising the web app, and bootstrapping the extension on top of the shared library.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Ladle for component previews, Vite+CRX for the extension build.
- **Styling:** CSS Modules + custom semantic utility classes (`widget-*`). Tailwind exists but new work should prefer authored CSS modules.
- **Backend/Data:** Supabase (Postgres + Auth), Drizzle ORM (`lib/db-minimal.ts` for lean API handlers).
- **State/Data Fetching:** React Query, custom hooks (`useNotes`, `useTaskModal`).
- **Tooling:** pnpm workspaces, `packages/ui` shared component package, ESLint flat config, Playwright (smoke tests, placeholder today).

## Project Conventions

### Code Style
- TypeScript first. Use explicit types for API responses (`ActionResponse<T>`), discriminated unions for status objects, and `const` asserts for enums.
- Prefer the `@` alias for absolute imports and `@cleartab/ui` for shared primitives. Avoid deep relative chains.
- Styling via CSS Modules (and `styles/widget-globals.css`) with semantic class names; avoid inline styles except for dynamic measurements.
- Components are function-based, hooks encapsulate side effects, and `useCallback`/`useMemo` guard expensive calculations.
- Keep console logging structured (e.g., `[api] GET …`, `NotesWidget:`) for easier tracing.

### Architecture Patterns
- **Shared UI Package:** All reusable UI (buttons, widget shells, loaders, tokens) lives in `packages/ui` so the web app and extension consume a single source.
- **Feature Widgets:** Higher-level widgets (notes/tasks) live in `components/widgets`. As they stabilise, migrate them into the shared package.
- **API Routes:** Next.js API layers use `lib/db-minimal.ts` (Drizzle + Supabase tables) to avoid bundling the entire schema. External integrations (Google Calendar) stay in `/app/api/**`.
- **Extension:** `chrome-extension/` contains the Vite/CRX build, reusing `@cleartab/ui` for visuals and a lightweight Supabase handshake for auth.
- **Docs/Stories:** Ladle stories showcase widgets in isolation (`stories/**` or `packages/ui/src/components/**` depending on context).

### Testing Strategy
- **Current:** Manual testing + Ladle stories. API utilities log latency for Supabase requests. Playwright is installed but not yet part of CI.
- **Planned:** Add Ladle stories for each widget/state, then wire a Playwright smoke suite covering dashboard load, note editing, and extension sync.

### Git Workflow
- Single trunk (`main`). Use descriptive feature branches (e.g., `feature/move-widget-container`) and keep commits focused (shared UI move, API fix, etc.).
- Rebase or merge via PR; include context in commit body especially for large refactors.
- Tag milestone branches/releases when cutting extension builds.

## Domain Context
- ClearTab replaces the browser’s default new tab with a curated dashboard (notes, tasks, schedule, countdown, weather, etc.).
- A Chrome extension mirrors the same widgets for quick interactions without loading the full site.
- reliability matters: notes autosave, tasks optimistically update, Google Calendar sync must provide status feedback.

## Important Constraints
- Avoid Tailwind utility sprawl in new code; use CSS modules + semantic helpers.
- Shared UI cannot depend on Next.js server APIs—keep it pure React/TypeScript.
- Supabase/Postgres is the canonical data store. All DB access goes through Drizzle schema definitions.
- Extension code must stay Chrome-safe (no Node-only APIs, minimal dependencies).
- Design consistency: all widgets should use the same `widget-*` shell classes (`widget-background`, `widget-header`, etc.).

## External Dependencies
- **Supabase:** Auth + Postgres, accessed via `@supabase/supabase-js`, `lib/supabase/server`, and Drizzle schema.
- **Google APIs:** Calendar sync via OAuth; tokens managed in Supabase tables (`user`, `connectedAccounts`).
- **OpenAI / Chrome Nano AI:** Future AI features rely on Chrome’s on-device APIs with OpenAI fallback.
- **Radix / Framer Motion / React Hook Form / Zod:** UI primitives, animation, form handling, and schema validation.
- **Chrome APIs:** `chrome.identity`, `chrome.storage`, `chrome.runtime` used by the extension (`lib/chrome-extension-utils.ts`).
