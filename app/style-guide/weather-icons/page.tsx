'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { WeatherWidgetAlt } from '@/components/widgets/weather-widget-alt'

// This is a placeholder as we don't know where the original icons are.
const WeatherIcons = { Placeholder: () => <div>Icon</div> }

type WeatherIconComponent = () => React.JSX.Element
type WeatherIconsType = Record<string, WeatherIconComponent>

export default function WeatherIconsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Weather Icons</h1>
        <p className="text-muted-foreground">
          A collection of animated weather icons used throughout the application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(WeatherIcons as WeatherIconsType).map(([name, Icon]) => (
          <Card key={name} className="p-6 bg-card-gradient">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 flex items-center justify-center">
                <Icon />
              </div>
              <h3 className="text-lg font-medium">{name}</h3>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 