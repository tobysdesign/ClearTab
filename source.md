# source.md  Clear Tab — Product Requirements Document & Context Source of Truth
 
## Overview
- **Objective**: Stabilise and future-proof ClearTab by extracting a shared UI system, relaunching the web app on top of it, and shipping a lightweight Chrome extension for rapid validation of cross-surface workflows.
- **Code Name**: MuddyTab
- **Primary Stakeholders**: Product (Ybot), Design (Ybot), Engineering (Codex assist), QA (TBD), Growth (TBD).
- **Status**: Draft

## Problem Statement
ClearTab’s current codebase evolved organically, mixing web-app and Chrome-extension concerns. The result is slow iteration, inconsistent UI, and fragile data sync. Designers and testers struggle to validate features across surfaces.

## Goals & Success Metrics
1. **Shared UI Library**
   - Components and tokens exposed via `@cleartab/ui`.
   - Storybook (or Ladle) available for validation.
   - Success metric: 100% of widgets used in both web & extension render from the shared package with a single source of truth.
2. **Web App Alignment**
   - Next.js app imports the shared library.
   - Core widgets (Notes, Tasks, Calendar) reach “confidence-inspiring” performance (TTFB < 1s for authenticated requests; perceived note switch < 150ms).
3. **Chrome Extension MVP**
   - Light Vite/CRX build consuming shared UI.
   - Supports login status display, notes list, and note editor.
   - Sync status indicator to visualise data flow between extension and web.
4. **Baseline Quality Gates**
   - ESLint (flat config) enforced.
   - Smoke tests (Playwright/Turbo pipeline) covering critical flows (load dashboard, open notes, edit note, sync to extension).
5. **Nano AI Demonstration**
   - Integrate Chrome built-in Nano AI APIs behind feature detection.
   - Provide at least one on-device AI interaction (e.g., note summary or insight) for hackathon demo.
   - Fallback to hosted model when Nano API unavailable to keep UX consistent.

## Non-Goals
- Rewriting the backend stack (Supabase + Drizzle remain).
- Shipping mobile clients.
- Replacing Next.js with a different SSR framework.

## Users & Personas
| Persona | Needs | Success Signal |
| --- | --- | --- |
| Productivity Explorer | Lightweight daily dashboard accessible from new tab and extension. | Seamless notes/tasks switching; zero lost edits. |
| Designer/Collaborator | Reliable design system to iterate quickly without React regressions. | Storybook views aligning with live app pixels. |
| QA/Support | Mechanism to verify data sync issues. | Extension “state inspector” exposes last sync time & queue. |

## Functional Requirements
### 1. UI Package (`packages/ui`)
- Exports: Bento layout, widget shells, buttons, typography scales, theme tokens.
- Shared CSS modules/tokens for design consistency (no Tailwind dependency).
- Per-component stories documenting usage & behavioural states (loading, error, empty).

### 2. Web App (`apps/web`)
- Imports UI package; no direct `../components` references.
- Notes widget: queue-based saves, cancel/undo delete, autosave resilience (done baseline).
- Task widget: consistent load performance and UI parity with notes.
- Telemetry: log API latency to surface Supabase bottlenecks.

### 3. Chrome Extension (`apps/extension`)
- Vite + CRX plugin configuration.
- Authentication handshake with Supabase (token reuse from browser).
- Components from `@cleartab/ui`.
- State inspector drawer: displays last sync timestamp, pending operations, error toasts.
- MVP focus on Notes (list, editor, optimistic delete) to validate sync.

### 4. Tooling & Infrastructure
- Turborepo (or PNPM workspaces) orchestrates build/test/lint per package.
- ESLint flat config shared via `packages/config`.
- Storybook (or Ladle) pipeline with Chromatic-like preview optional.
- Playwright smoke test: login, load notes, edit note, confirm toast.

## Technical Approach (High-Level)
1. **Monorepo Restructure**
   - Migrate current repo to workspace layout (`apps/`, `packages/`).
   - Update TypeScript paths, ESLint, Jest/Playwright configs to reflect new structure.
2. **Package Extraction**
   - Move reusable components into `packages/ui`; ensure tree-shakeable exports.
   - Create shared hooks (`packages/hooks`) for data access (notes/tasks).
   - Provide Tailwind preset used across both apps.
3. **Extension Build**
   - Scaffold `apps/extension` using Vite, with manifest v3.
   - Configure background/service worker if required for Supabase refresh tokens.
4. **Tooling Hardening**
   - Extend lint overrides (e.g., limit `no-explicit-any` to legacy `.d.ts`).
   - Add minimal Playwright test stored in root `apps/web/tests`.

  ## Milestones & Timeline (Draft)
| Milestone | Target | Deliverables |
| --- | --- | --- |
| M1: Workspace Bootstrap | Week 1 | Repo restructured; root builds pass. |
| M2: UI Package Extraction | Week 2 | `@cleartab/ui` powering web; Storybook baseline. |
| M3: Extension MVP | Week 3 | Notes render in Chrome extension; sync indicator present. |
| M4: Nano AI Demo | Week 4 | On-device AI interaction functioning where available, with hosted fallback. |
| M5: Quality Gate | Week 5 | Lint + smoke tests in CI; performance instrumentation. |
| M6: User Feedback Loop | Week 6 | Collect alpha feedback; plan follow-up backlog. |

## Risks & Mitigations
- **Data sync complexity**: Divergent state models between extension & web → adopt shared hooks + offline queue with tests.
- **Design drift**: Without Storybook, UI diverges → enforce Storybook updates as part of component PR template.
- **Performance regressions**: Monorepo restructure may slow builds → use Turborepo caching, guard `npm run lint/test` on CI.
- **Auth quirks in extension**: Supabase session handling may need secure background script → plan time for token refresh flow.

## Open Questions
1. Do we need offline-first support in the extension for MVP, or will “read-only + sync on focus” suffice?
2. Which metrics define “confidence-inspiring” for non-notes widgets (tasks, calendar)?
3. Is there appetite for theming/custom skins in the shared UI package during Gemini scope?

## Next Actions
1. Finalise workspace tooling (PNPM vs npm, Turborepo vs Nx).
2. Prioritise lint rule strategy (`no-explicit-any` overrides vs targeted fixes).
3. Schedule extension auth spike to understand Supabase token handling in MV3 contexts.
4. Draft Storybook component inventory covering existing widgets.
5. Capture Supabase performance baselines (notes/tasks query response times).
6. Codify styling rules: no inline styles, minimal semantic class names, helpers allowed, and phase out Tailwind usage in favour of authored CSS modules.

---

_This PRD is a living document. Update as Gemini scopes evolve or new constraints emerge._
