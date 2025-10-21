"use client"

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ReactNode } from 'react'
import styles from './weather-settings.module.css'

export function WeatherSettings(): ReactNode {
  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Weather Preferences</div>
        <div className={styles.sectionDescription}>Configure your weather display settings</div>

        <div className={styles.formRow}>
          <label htmlFor="location" className={styles.formLabel}>Default Location</label>
          <Input id="location" placeholder="Enter city or coordinates" className={styles.formInput} />
        </div>

        <div className={styles.formRow}>
          <label htmlFor="units" className={styles.formLabel}>Temperature Units</label>
          <Select defaultValue="celsius">
            <SelectTrigger id="units" className={styles.formSelect}>
              <SelectValue placeholder="Select units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="celsius">Celsius (°C)</SelectItem>
              <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formLabel}>Notifications</div>
          <div className={styles.toggleRow}>
            <label htmlFor="severe-weather" className={styles.toggleLabel}>
              Severe Weather Alerts
            </label>
            <Switch id="severe-weather" />
          </div>
          <div className={styles.toggleRow}>
            <label htmlFor="daily-forecast" className={styles.toggleLabel}>
              Daily Forecast Updates
            </label>
            <Switch id="daily-forecast" />
          </div>
        </div>

        <div className={styles.formRow}>
          <label htmlFor="refresh" className={styles.formLabel}>Refresh Interval</label>
          <Select defaultValue="30">
            <SelectTrigger id="refresh" className={styles.formSelect}>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 