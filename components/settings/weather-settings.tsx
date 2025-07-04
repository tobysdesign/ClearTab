"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ReactNode } from 'react'

export function WeatherSettings(): ReactNode {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Weather Preferences</CardTitle>
          <CardDescription>Configure your weather display settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="location">Default Location</Label>
            <Input id="location" placeholder="Enter city or coordinates" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="units">Temperature Units</Label>
            <Select defaultValue="celsius">
              <SelectTrigger id="units">
                <SelectValue placeholder="Select units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celsius">Celsius (°C)</SelectItem>
                <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Notifications</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="severe-weather" className="cursor-pointer">
                  Severe Weather Alerts
                </Label>
                <Switch id="severe-weather" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-forecast" className="cursor-pointer">
                  Daily Forecast Updates
                </Label>
                <Switch id="daily-forecast" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refresh">Refresh Interval</Label>
            <Select defaultValue="30">
              <SelectTrigger id="refresh">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 