"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ReactNode } from 'react'
import styles from './weather-settings.module.css'

export function WeatherSettings(): ReactNode {
  return (
    <div className={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>Weather Preferences</CardTitle>
          <CardDescription>Configure your weather display settings</CardDescription>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          <div className={styles.fieldContainer}>
            <Label htmlFor="location">Default Location</Label>
            <Input id="location" placeholder="Enter city or coordinates" />
          </div>
          
          <div className={styles.fieldContainer}>
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

          <div className={styles.notificationsContainer}>
            <Label>Notifications</Label>
            <div className={styles.notificationsInner}>
              <div className={styles.notificationItem}>
                <Label htmlFor="severe-weather" className={styles.cursorPointer}>
                  Severe Weather Alerts
                </Label>
                <Switch id="severe-weather" />
              </div>
              <div className={styles.notificationItem}>
                <Label htmlFor="daily-forecast" className={styles.cursorPointer}>
                  Daily Forecast Updates
                </Label>
                <Switch id="daily-forecast" />
              </div>
            </div>
          </div>

          <div className={styles.fieldContainer}>
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