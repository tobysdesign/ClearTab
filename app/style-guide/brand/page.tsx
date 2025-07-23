import { AnimatedTobyLogo } from '@/components/ui/animated-toby-logo'

export default function BrandPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Brand</h1>
        <p className="text-muted-foreground">
          Brand elements and animated logo components.
        </p>
      </div>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Animated Toby Logo</h2>
          <p className="text-sm text-muted-foreground mb-6">
            An animated logo that transforms between binary mode (10101) and brand mode (t0.by).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Mode */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Brand Mode (t0.by)</h3>
            <div className="bg-card border rounded-lg p-8 flex items-center justify-center">
              <div className="w-48">
                <AnimatedTobyLogo mode="brand" color="#ffffff" />
              </div>
            </div>
          </div>

          {/* Binary Mode */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Binary Mode (10101)</h3>
            <div className="bg-card border rounded-lg p-8 flex items-center justify-center">
              <div className="w-48">
                <AnimatedTobyLogo mode="binary" color="#ffffff" />
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Interactive Demo</h3>
          <div className="bg-card border rounded-lg p-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="w-64">
                <AnimatedTobyLogo mode="brand" color="#FA531C" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                The logo automatically animates between modes with smooth spring transitions.
              </p>
            </div>
          </div>
        </div>

        {/* Color Variations */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Color Variations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black border rounded-lg p-6 flex items-center justify-center">
              <div className="w-24">
                <AnimatedTobyLogo mode="brand" color="#ffffff" />
              </div>
            </div>
            <div className="bg-white border rounded-lg p-6 flex items-center justify-center">
              <div className="w-24">
                <AnimatedTobyLogo mode="brand" color="#000000" />
              </div>
            </div>
            <div className="bg-[#FA531C] border rounded-lg p-6 flex items-center justify-center">
              <div className="w-24">
                <AnimatedTobyLogo mode="brand" color="#ffffff" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-neutral-700 to-neutral-900 border rounded-lg p-6 flex items-center justify-center">
              <div className="w-24">
                <AnimatedTobyLogo mode="brand" color="#ffffff" />
              </div>
            </div>
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Usage Guidelines</h3>
          <div className="bg-muted/50 border rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Props</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code>mode</code>: "brand" | "binary" - Controls the logo transformation</li>
                <li><code>color</code>: string - Color of the logo elements (default: "#ffffff")</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use brand mode for primary branding and marketing materials</li>
                <li>• Use binary mode for technical contexts or as an easter egg</li>
                <li>• Ensure sufficient contrast between logo color and background</li>
                <li>• Maintain aspect ratio when scaling</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 