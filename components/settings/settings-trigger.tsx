'use client'

import * as React from 'react'
import { SettingsIcon } from '@/components/icons'
import { DockIconButton } from '@cleartab/ui'
import { cn } from '@/lib/utils'
import styles from './settings-trigger.module.css'

interface SettingsTriggerProps {
  className?: string
}

export function SettingsTrigger({ className }: SettingsTriggerProps) {
  const handleClick = () => {
    // Dispatch custom event to open settings (or close them if already open)
    const event = new CustomEvent('openSettings', {
      detail: { tab: 'schedule', toggle: true }
    })
    window.dispatchEvent(event)
  }

  return (
    <DockIconButton
      onClick={handleClick}
      className={cn(styles.settingsTrigger, className)}
      data-testid="settings-trigger"
      title="Settings"
      shortcut="⌘," 
    >
      <SettingsIcon size={16} className={styles.settingsIcon} />
      <span className="sr-only">Open Settings</span>
    </DockIconButton>
  )
}
