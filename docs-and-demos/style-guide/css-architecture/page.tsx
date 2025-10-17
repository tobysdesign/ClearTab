import React from 'react'

export default function CSSArchitecturePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">CSS Architecture</h1>
        <p className="text-muted-foreground mt-2">
          KISS-based semantic CSS architecture with container queries and responsive design
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Core Principles</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>KISS (Keep It Simple, Stupid):</strong> Avoid over-abstraction, use semantic class names</li>
          <li><strong>Container Queries:</strong> Dashboard responsiveness based on container size, not viewport</li>
          <li><strong>Semantic Classes:</strong> Human-readable, inspector-friendly class names</li>
          <li><strong>No Tailwind Utilities:</strong> Replace with semantic classes in touched components</li>
          <li><strong>Native Focus:</strong> Use browser default focus styles, no custom CSS</li>
          <li><strong>Motion Respect:</strong> Honor prefers-reduced-motion settings</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">CSS Variables</h2>
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-sm">
{`:root {
  /* Spacing scale */
  --space-1: 0.25rem; /* 3px */
  --space-2: 0.5rem;  /* 6px */
  --space-3: 0.75rem; /* 9px */
  --space-4: 1rem;    /* 12px */
  --radius-2: 8px;

  /* Fluid typography (12px base) */
  --font-size-100: clamp(12px, 0.72rem + 0.2vw, 14px);
  --font-size-200: clamp(13px, 0.78rem + 0.3vw, 16px);
  --font-size-300: clamp(14px, 0.82rem + 0.4vw, 18px);
}`}
          </pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Layout Classes</h2>
        
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Dashboard Structure</h3>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm">
{`.dashboard { 
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  block-size: 100svh;
  padding: env(safe-area-inset-top) var(--space-4) env(safe-area-inset-bottom);
  container-type: inline-size;
  overflow: hidden; /* NO dashboard scrolling */
}

.dashboard-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: var(--space-4);
  inline-size: 100%;
  container-type: inline-size;
  overflow: hidden; /* NO grid scrolling */
}`}
            </pre>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Widget Shell</h3>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm">
{`.widget { 
  display: flex; 
  flex-direction: column; 
  min-block-size: 0; 
  border-radius: var(--radius-2);
  background: var(--surface, #121212);
  overflow: hidden; /* NO widget scrolling - only content scrolls */
}

.widget-header { 
  padding: var(--space-3) var(--space-4); 
  font-size: var(--font-size-200);
}

.widget-content { 
  padding: var(--space-3) var(--space-4);
  overflow-y: auto; 
  min-block-size: 0; 
  block-size: 100%;
}`}
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Container Queries</h2>
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-sm">
{`/* Dashboard responds to container size, not viewport */
@container (min-width: 48rem) { /* ~768px context */
  .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
}
@container (min-width: 80rem) { /* ~1280px context */
  .dashboard-grid { grid-template-columns: repeat(3, 1fr); }
}`}
          </pre>
        </div>
        <p className="text-sm text-muted-foreground">
          This allows the dashboard to adapt when resized, independent of device size. 
          Perfect for focusing on widgets or minimizing others.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Modal Structure</h2>
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-sm">
{`.modal-header {
  padding: var(--space-4);
  border-bottom: 1px solid hsl(var(--color-border));
}

.modal-body {
  padding: var(--space-4);
  overflow-y: auto;
  min-block-size: 0;
}

.modal-footer {
  padding: var(--space-4);
  border-top: 1px solid hsl(var(--color-border));
}`}
          </pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Scrolling</h2>
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-sm">
{`.list { 
  overflow-y: auto; 
  min-block-size: 0; 
}`}
          </pre>
        </div>
        <p className="text-sm text-muted-foreground">
          All lists and content panes scroll vertically when needed. 
          The dashboard and widgets do NOT scroll - only their internal content scrolls.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Motion & Accessibility</h2>
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-sm">
{`@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { 
    animation-duration: 0.01ms !important; 
    animation-iteration-count: 1 !important; 
    transition-duration: 0.01ms !important; 
  }
}`}
          </pre>
        </div>
        <p className="text-sm text-muted-foreground">
          Respects user motion preferences. Uses native browser focus styles.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage Examples</h2>
        
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Dashboard Layout</h3>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm">
{`<div className="dashboard">
  <div className="dashboard-grid">
    <WidgetContainer>
      <WidgetHeader title="Notes" />
      <WidgetContent>
        {/* Content that scrolls */}
      </WidgetContent>
    </WidgetContainer>
  </div>
</div>`}
            </pre>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Modal Structure</h3>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm">
{`<div className="modal">
  <div className="modal-header">
    <h2>Settings</h2>
  </div>
  <div className="modal-body">
    {/* Scrollable content */}
  </div>
  <div className="modal-footer">
    <button>Save</button>
  </div>
</div>`}
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Migration Notes</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Tailwind utilities removed from touched components</li>
          <li>Inline styles converted to CSS variables where appropriate</li>
          <li>Widget components use unified WidgetContainer/WidgetHeader/WidgetContent</li>
          <li>Dashboard uses container queries for responsive behavior</li>
          <li>All scrolling content uses overflow-y: auto</li>
          <li>Typography uses 12px base with fluid scaling</li>
        </ul>
      </section>
    </div>
  )
}
