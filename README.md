# ClearTab App

A modern note-taking and task management application with AI integration and responsive dashboard.

## Local Setup

### Prerequisites
- Node.js 20+
- pnpm (installed via corepack)

### Environment Setup
1. Copy the environment template:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   - Supabase configuration
   - Database URLs
   - API keys for AI/weather services

### Installation
```bash
# Install dependencies
corepack enable && pnpm install

# Run development server
pnpm dev
```

### Development Scripts
- `pnpm dev` - Start development server on port 3000
- `pnpm dev:3001` - Start development server on port 3001 (for comparison)
- `pnpm build` - Build for production
- `pnpm start` - Start production server

## CSS Architecture Refactor

This project has been refactored to use a KISS-based CSS architecture with:
- Semantic, inspector-friendly class names
- Container-query driven responsiveness
- 12px base typography with fluid scaling
- Native focus styles and motion preferences
- Unified widget and modal structures

### Compare Baseline vs Refactor

To compare the original implementation with the CSS refactor:

1. **Baseline Setup** (Original):
   ```bash
   # Create worktree for baseline
   git worktree add ../cleartabAPP-baseline baseline-css
   
   # Install and run baseline
   cd ../cleartabAPP-baseline
   corepack enable && pnpm install
   cp env.example .env.local
   # Fill in your .env.local values
   pnpm dev
   ```

2. **Refactor Setup** (Current):
   ```bash
   # In main project directory
   pnpm dev:3001
   ```

3. **Compare**:
   - Baseline: http://localhost:3000
   - Refactor: http://localhost:3001
   
   Compare:
   - Dashboard layout and responsiveness
   - Widget behavior and scrolling
   - Modal structures (settings, etc.)
   - Typography and spacing
   - Container query behavior (resize dashboard area)

### Key Changes

#### CSS Architecture
- **Variables**: Semantic spacing and typography scale
- **Layout**: Container queries for dashboard responsiveness
- **Widgets**: Unified `.widget`, `.widget-header`, `.widget-content` structure
- **Modals**: Standardized `.modal`, `.modal-header`, `.modal-body`, `.modal-footer`
- **Scrolling**: Dashboard and widgets do NOT scroll - only internal content scrolls with `overflow-y: auto`

#### Components Updated
- `components/dashboard/` - Container query layout
- `components/widgets/` - Unified widget shell
- `components/ui/` - Semantic classes, removed Tailwind utilities
- `app/globals.css` - New CSS architecture foundation

#### Responsive Behavior
- Dashboard adapts to container size, not viewport
- Perfect for focusing on specific widgets
- Independent of device size - context-driven breakpoints

### Style Guide
Visit `/style-guide/css-architecture` for complete documentation of the new CSS system.

## Development Container

The project includes a `.devcontainer` for consistent development environment:

```bash
# Open in VS Code with Dev Containers extension
code .
# Select "Reopen in Container"
```

The container includes:
- Node.js 20
- pnpm
- Pre-configured VS Code extensions
- Automatic dependency installation

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── style-guide/       # Component documentation
│   └── globals.css        # CSS architecture
├── components/
│   ├── dashboard/         # Dashboard layout components
│   ├── widgets/           # Widget components
│   ├── settings/          # Settings components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
└── shared/                # Shared types and schemas
```

## Contributing

1. Follow the KISS principle for CSS
2. Use semantic class names
3. Prefer container queries over media queries for components
4. Respect motion preferences and accessibility
5. Document new components in the style guide

## License

Private project - All rights reserved.