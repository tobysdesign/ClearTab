'use client'

import { WeatherWidgetAlt } from '@/components/widgets/weather-widget-alt'

export default function WeatherTimelinePage() {
  return (
    <div className="container py-10">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Weather Timeline</h1>
        <p className="text-muted-foreground">
          A weather widget that displays temperature and conditions across different times of the day.
          Hover over each time period to see detailed weather information.
        </p>
        
        <div className="mt-8">
          <WeatherWidgetAlt />
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Usage</h2>
          <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
            {`import { WeatherWidgetAlt } from '@/components/widgets/weather-widget-alt'

export default function Page() {
  return <WeatherWidgetAlt />
}`}
          </pre>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Props</h2>
          <div className="space-y-2">
            <p><code>className</code> - Optional. Additional CSS classes to apply to the widget.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 