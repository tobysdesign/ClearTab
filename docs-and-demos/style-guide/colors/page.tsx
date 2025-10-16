export default function ColorsPage() {
  const colorSections = [
    {
      title: "Base Colors",
      description: "Core colors used throughout the application",
      colors: [
        { name: "Background", css: "bg-background", hex: "#151515", hsl: "0 0% 8.2%" },
        { name: "Foreground", css: "text-foreground", hex: "#c2c2c2", hsl: "0 0% 76%" },
        { name: "Primary", css: "bg-primary text-primary-foreground", hex: "#c2c2c2", hsl: "0 0% 76%" },
        { name: "Secondary", css: "bg-secondary text-secondary-foreground", hex: "#bfbfbf", hsl: "0 0% 75%" },
      ]
    },
    {
      title: "Text Colors", 
      description: "Text hierarchy and semantic colors",
      colors: [
        { name: "Primary Text", css: "text-foreground", hex: "#c2c2c2", hsl: "0 0% 76%" },
        { name: "Secondary Text", css: "text-secondary", hex: "#bfbfbf", hsl: "0 0% 75%" },
        { name: "Muted Text", css: "text-muted-foreground", hex: "#616161", hsl: "0 0% 38%" },
      ]
    },
    {
      title: "Pink Palette",
      description: "Brand and accent colors in pink tones", 
      colors: [
        { name: "Almost Pink", css: "bg-almost-pink", hex: "#efd8ec", hsl: "322 29% 92%" },
        { name: "Light Pink", css: "bg-light-pink", hex: "#ffb1ef", hsl: "312 100% 85%" },
        { name: "Brand Pink", css: "bg-brand-pink", hex: "#fd5fa8", hsl: "326 97% 66%" },
        { name: "Dark Pink", css: "bg-dark-pink text-white", hex: "#16030d", hsl: "310 58% 5%" },
      ]
    },
    {
      title: "UI Elements",
      description: "Interface component colors",
      colors: [
        { name: "Card", css: "bg-card text-card-foreground", hex: "#151515", hsl: "0 0% 8.2%" },
        { name: "Muted", css: "bg-muted text-muted-foreground", hex: "#262626", hsl: "0 0% 14.9%" },
        { name: "Accent", css: "bg-accent text-accent-foreground", hex: "#262626", hsl: "0 0% 14.9%" },
        { name: "Border", css: "border-2 border-border bg-background", hex: "#27272a", hsl: "240 3.7% 15.9%" },
      ]
    },
    {
      title: "Status Colors",
      description: "Semantic colors for states and feedback",
      colors: [
        { name: "Destructive", css: "bg-destructive text-destructive-foreground", hex: "#dc2626", hsl: "0 62.8% 30.6%" },
        { name: "Success", css: "bg-green-600 text-white", hex: "#16a34a", hsl: "142 76% 36%" },
        { name: "Warning", css: "bg-yellow-600 text-white", hex: "#ca8a04", hsl: "45 93% 47%" },
        { name: "Info", css: "bg-neutral-700 text-white", hex: "#333333", hsl: "0 0% 20%" },
      ]
    }
  ]

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-4">Colors</h1>
        <p className="text-muted-foreground text-lg">
          Complete color palette and design tokens used throughout the application.
        </p>
      </div>

      {colorSections.map((section) => (
        <div key={section.title} className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
            <p className="text-muted-foreground">{section.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.colors.map((color) => (
              <div key={color.name} className="space-y-3">
                {/* Color Swatch */}
                <div className={`h-24 w-full rounded-lg border ${color.css} flex items-center justify-center`}>
                  <span className="text-sm font-medium opacity-75">
                    {color.name}
                  </span>
                </div>
                
                {/* Color Info */}
                <div className="space-y-1">
                  <h3 className="font-medium">{color.name}</h3>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>
                      <span className="font-mono">{color.hex}</span>
                    </div>
                    <div>
                      <span className="font-mono">hsl({color.hsl})</span>
                    </div>
                    <div className="bg-muted p-1 rounded font-mono text-xs">
                      {color.css}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Usage Examples */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Usage Examples</h2>
          <p className="text-muted-foreground">Examples of how to use colors in components</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold">Text Hierarchy</h3>
            <div className="bg-card p-4 rounded-lg border space-y-2">
              <h4 className="text-foreground text-lg font-semibold">Primary Heading</h4>
              <p className="text-foreground">This is primary body text using foreground color.</p>
              <p className="text-muted-foreground">This is secondary text using muted foreground.</p>
              <p className="text-brand-pink">This is accent text using brand pink.</p>
            </div>
          </div>

          {/* Button Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold">Button Variants</h3>
            <div className="bg-card p-4 rounded-lg border space-y-3">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium">
                Primary Button
              </button>
              <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium">
                Secondary Button
              </button>
              <button className="bg-brand-pink text-white px-4 py-2 rounded-md font-medium">
                Brand Button
              </button>
              <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-medium">
                Destructive Button
              </button>
            </div>
          </div>

          {/* Card Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold">Card Variants</h3>
            <div className="space-y-3">
              <div className="bg-card border p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Default Card</h4>
                <p className="text-muted-foreground">Using card background with border</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Muted Card</h4>
                <p className="text-muted-foreground">Using muted background</p>
              </div>
            </div>
          </div>

          {/* Status Examples */}
          <div className="space-y-4">
            <h3 className="font-semibold">Status Indicators</h3>
            <div className="space-y-3">
              <div className="bg-green-600 text-white px-3 py-1 rounded text-sm inline-block">
                Success
              </div>
              <div className="bg-yellow-600 text-white px-3 py-1 rounded text-sm inline-block">
                Warning
              </div>
              <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm inline-block">
                Error
              </div>
              <div className="bg-neutral-700 text-white px-3 py-1 rounded text-sm inline-block">
                Info
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Variables Reference */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">CSS Variables</h2>
          <p className="text-muted-foreground">Use these CSS variables in your custom styles</p>
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-sm text-foreground overflow-x-auto">
{`/* Base Colors */
--background: 0 0% 8.2%;
--foreground: 0 0% 76%;
--primary: 0 0% 76%;
--secondary: 0 0% 75%;
--muted-foreground: 0 0% 38%;

/* Pink Palette */
--almost-pink: 322 29% 92%;
--light-pink: 312 100% 85%;
--dark-pink: 310 58% 5%;
--brand-pink: 326 97% 66%;

/* Usage */
.custom-element {
  background-color: hsl(var(--brand-pink));
  color: hsl(var(--foreground));
}`}
          </pre>
        </div>
      </div>
    </div>
  )
} 