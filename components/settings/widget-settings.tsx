"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'

interface WidgetOption {
  id: string
  name: string
  description: string
  enabled: boolean
}

const widgets: WidgetOption[] = [
  {
    id: 'weather',
    name: 'Weather Widget',
    description: 'Display current weather and forecast',
    enabled: true
  },
  {
    id: 'finance',
    name: 'Finance Widget',
    description: 'Show stock prices and financial data',
    enabled: true
  },
  {
    id: 'tasks',
    name: 'Tasks Widget',
    description: 'View and manage your tasks',
    enabled: true
  },
  {
    id: 'calendar',
    name: 'Calendar Widget',
    description: 'Display upcoming events and meetings',
    enabled: true
  },
  {
    id: 'notes',
    name: 'Notes Widget',
    description: 'Quick access to your notes',
    enabled: true
  }
]

export function WidgetSettings(): ReactNode {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Widget Layout</CardTitle>
          <CardDescription>Choose which widgets to display and their order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center space-x-4 rounded-lg border p-4"
                draggable
              >
                <div className="cursor-move">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">{widget.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {widget.description}
                  </p>
                </div>
                <Switch
                  id={`widget-${widget.id}`}
                  defaultChecked={widget.enabled}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 