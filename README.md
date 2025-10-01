## ClearTab.app – Personal Productivity Dashboard

Modern, AI-powered personal dashboard and productivity app with notes, tasks, calendars, and widgets. Ships as a web app and a Chrome new-tab extension.

### Features
- Customizable dashboard (bento/widget layout) with internal scroll for long content
- Notes with rich text editor (BlockNote)
- Tasks with due dates, priorities, and quick actions
- AI assistant for context-aware actions (notes, tasks, calendar)
- Weather and multi-calendar timeline
- Chrome extension that replaces the new tab page

### Tech Stack
- Framework: Next.js 15 (App Router), React 18
- Database: PostgreSQL + Drizzle ORM
- Styling: Tailwind CSS + CSS Modules + CSS custom properties
- Auth/Session: Supabase SSR
- State: Zustand (client), TanStack Query (server state)
- Editor: BlockNote

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL database (local or hosted)

### Install
```bash
npm install
```

### Environment Variables
Create `.env.local` with at least:
```bash
DATABASE_URL=postgres://user:password@host:5432/db
OPENAI_API_KEY=sk-...

# Supabase (for SSR auth client)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Optional integrations
MEM0_API_KEY=...
TOMORROW_IO_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Database (Drizzle)
- Generate migration files (based on `shared/schema.ts`):
```bash
npx drizzle-kit generate
```
- Apply migrations:
```bash
node scripts/migrate.js
```
Notes:
- Migrations are emitted to `migrations/` per `drizzle.config.ts`.
- Ensure `DATABASE_URL` is set for both generation and running migrations.

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

---

## Chrome Extension (New Tab)
Build the extension assets and package a zip for the Chrome Web Store:
```bash
npm run build-extension
npm run package-extension
```
Then:
1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click “Load unpacked” and select `dist/extension`

---

## Style Guide and Components
- Refer to `app/style-guide` pages for canonical UI components and patterns
- New components should follow established patterns and be added to the style guide
- Viewport is not exceeded; widget content should scroll internally (overflow-y)

---

## Testing
End-to-end tests use Playwright. Run directly via:
```bash
npx playwright test
```

---

## Project Structure (high level)
- `app/` Next.js App Router pages and API routes
- `components/` Reusable UI, dashboard, widgets, AI, settings
- `server/` Backend services (LLM, calendar, storage) and db helpers
- `shared/` Database schema and shared types
- `scripts/` Build and tooling scripts (extension, migrations, etc.)

---

## License
[MIT](LICENSE)
