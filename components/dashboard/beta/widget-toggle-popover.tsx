'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@cleartab/ui'
import { Switch } from '@/components/ui/switch'
import {
  WidgetId,
  PresetId,
  WIDGET_METADATA,
  PRESETS,
  WidgetVisibilityState,
} from '@/hooks/use-beta-widgets'
import styles from './widget-toggle-popover.module.css'

interface WidgetTogglePopoverProps {
  children: React.ReactNode
  widgets: WidgetVisibilityState
  activePreset: PresetId
  activeCount: number
  totalCount: number
  toggleWidget: (id: WidgetId) => void
  applyPreset: (presetId: Exclude<PresetId, 'custom'>) => void
  resetToAll: () => void
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function WidgetTogglePopover({
  children,
  widgets,
  activePreset,
  activeCount,
  totalCount,
  toggleWidget,
  applyPreset,
  resetToAll,
  side = 'top',
}: WidgetTogglePopoverProps) {
  const [open, setOpen] = useState(false)

  // Listen for ⌘L shortcut to open/close popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const widgetKeys = Object.keys(WIDGET_METADATA) as WidgetId[]
  const presetKeys = Object.keys(PRESETS) as (Exclude<PresetId, 'custom'>)[]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        sideOffset={12}
        align="center"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
        }}
      >
        <div className={styles.popoverCard}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>Adaptive Layout</h3>
              <span className={`${styles.badge} ${activeCount < totalCount ? styles.badgeHighlight : ''}`}>
                {activeCount}/{totalCount} Active
              </span>
            </div>
            <Link href="/" className={styles.classicLink} title="Switch to fixed Classic layout">
              Exit Beta ↗
            </Link>
          </div>

          <div className={styles.sectionLabel}>Presets</div>
          <div className={styles.presetsRow}>
            {presetKeys.map((key) => {
              const preset = PRESETS[key]
              const isActive = activePreset === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={`${styles.presetChip} ${isActive ? styles.presetChipActive : ''}`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              )
            })}
          </div>

          <div className={styles.sectionLabel}>Toggle Widgets</div>
          <div className={styles.widgetList}>
            {widgetKeys.map((id) => {
              const meta = WIDGET_METADATA[id]
              const isChecked = widgets[id] ?? false
              return (
                <div
                  key={id}
                  className={`${styles.widgetRow} ${isChecked ? styles.widgetRowActive : ''}`}
                  onClick={() => toggleWidget(id)}
                >
                  <div className={styles.widgetInfo}>
                    <span className={styles.widgetIcon}>{meta.icon}</span>
                    <div className={styles.widgetText}>
                      <span className={styles.widgetName}>{meta.name}</span>
                      <span className={styles.widgetDesc}>{meta.description}</span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={isChecked}
                      onCheckedChange={() => toggleWidget(id)}
                      aria-label={`Toggle ${meta.name}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className={styles.footer}>
            <span className={styles.footerHint}>Shortcut: ⌘L</span>
            {activeCount < totalCount && (
              <button
                type="button"
                onClick={resetToAll}
                className={styles.resetBtn}
              >
                Reset All
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
