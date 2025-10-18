'use client'

import * as React from 'react'
import { SettingsIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
        "rounded-lg p-2 hover:bg-white/20 transition-all duration-200 ease-out text-white/60 hover:text-white/80 group",
        className
      )}
      data-testid="settings-trigger"
    >
      <SettingsIcon size={16} className="text-white/60 group-hover:rotate-45 transition-transform duration-300" />
      <span className="sr-only">Open Settings</span>
    </Button>
  )
}