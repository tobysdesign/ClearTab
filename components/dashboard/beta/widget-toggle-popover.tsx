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
  PrimaryWidgetId,
  UtilityWidgetId,
  PresetId,
  LayoutOrientation,
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
  primaryOrder: PrimaryWidgetId[]
  utilityOrder: UtilityWidgetId[]
  layoutOrientation: LayoutOrientation
  setLayoutOrientation: (orientation: LayoutOrientation) => void
  toggleWidget: (id: WidgetId) => void
  swapPrimaryOrder: () => void
  moveUtility: (id: UtilityWidgetId, direction: 'left' | 'right') => void
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
  primaryOrder,
  utilityOrder,
  layoutOrientation,
  setLayoutOrientation,
  toggleWidget,
  swapPrimaryOrder,
  moveUtility,
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

          {/* Layout Orientation */}
          <div className={styles.sectionLabel}>Orientation</div>
          <div className={styles.orientationRow}>
            <button
              type="button"
              onClick={() => setLayoutOrientation('rows')}
              className={`${styles.orientationChip} ${layoutOrientation === 'rows' ? styles.orientationChipActive : ''}`}
            >
              <span>☰</span> Rows
            </button>
            <button
              type="button"
              onClick={() => setLayoutOrientation('columns')}
              className={`${styles.orientationChip} ${layoutOrientation === 'columns' ? styles.orientationChipActive : ''}`}
            >
              <span>❚❚</span> Columns
            </button>
            <button
              type="button"
              onClick={() => setLayoutOrientation('inverted')}
              className={`${styles.orientationChip} ${layoutOrientation === 'inverted' ? styles.orientationChipActive : ''}`}
            >
              <span>⇅</span> Inverted
            </button>
          </div>

          {/* Quick Presets */}
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

          {/* Primary Workspace Widgets */}
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Workspace Widgets</span>
            <button
              type="button"
              onClick={swapPrimaryOrder}
              className={styles.swapBtn}
              title="Swap Notes and Tasks positions"
            >
              ⇄ Swap Order
            </button>
          </div>
          <div className={styles.widgetList} style={{ maxHeight: 110, marginBottom: 12 }}>
            {primaryOrder.map((id) => {
              const meta = WIDGET_METADATA[id]
              const isChecked = widgets[id] ?? false
              return (
                <div
                  key={id}
                  className={`${styles.widgetRow} ${isChecked ? styles.widgetRowActive : ''}`}
                >
                  <div className={styles.widgetInfo}>
                    <span className={styles.widgetIcon}>{meta.icon}</span>
                    <div className={styles.widgetText}>
                      <span className={styles.widgetName}>{meta.name}</span>
                      <span className={styles.widgetDesc}>{meta.description}</span>
                    </div>
                  </div>
                  <div className={styles.widgetControls}>
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

          {/* Utility Shelf Widgets */}
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Utility Shelf</span>
            <span style={{ fontSize: 10, color: '#71717a' }}>Reorder with ◀ ▶</span>
          </div>
          <div className={styles.widgetList} style={{ maxHeight: 180 }}>
            {utilityOrder.map((id, index) => {
              const meta = WIDGET_METADATA[id]
              const isChecked = widgets[id] ?? false
              return (
                <div
                  key={id}
                  className={`${styles.widgetRow} ${isChecked ? styles.widgetRowActive : ''}`}
                >
                  <div className={styles.widgetInfo}>
                    <span className={styles.widgetIcon}>{meta.icon}</span>
                    <div className={styles.widgetText}>
                      <span className={styles.widgetName}>{meta.name}</span>
                      <span className={styles.widgetDesc}>{meta.description}</span>
                    </div>
                  </div>
                  <div className={styles.widgetControls}>
                    <div className={styles.reorderGroup}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveUtility(id, 'left')}
                        className={styles.reorderBtn}
                        title="Move left/up"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        disabled={index === utilityOrder.length - 1}
                        onClick={() => moveUtility(id, 'right')}
                        className={styles.reorderBtn}
                        title="Move right/down"
                      >
                        ▶
                      </button>
                    </div>
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
            <span className={styles.footerHint}>Drag splitters to resize</span>
            <button
              type="button"
              onClick={resetToAll}
              className={styles.resetBtn}
            >
              Reset
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
