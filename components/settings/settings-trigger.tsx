'use client'

import * as React from 'react'
import { SettingsIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from './settings-trigger.module.css'

interface SettingsTriggerProps {
  className?: string
}

export function SettingsTrigger({ className }: SettingsTriggerProps) {
  const handleClick = () => {
    // Dispatch custom event to open settings
    const event = new CustomEvent('openSettings', {
      detail: { tab: 'Display options' }
    })
    window.dispatchEvent(event)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        styles.settingsTrigger,
        className
      )}
      data-testid="settings-trigger"
    >
      <SettingsIcon size={16} className={styles.settingsIcon} />
      <span className="sr-only">Open Settings</span>
    </Button>
  )
}