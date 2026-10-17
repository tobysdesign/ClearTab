'use client'

import React, { useRef } from 'react'
import { Popover, PopoverAnchor, PopoverContent } from '@cleartab/ui'
import {
  BetaPresetLayout,
  WidgetId,
  WidgetVisibilityState,
  WIDGET_METADATA,
  LAYOUT_PRESET_METADATA,
} from '@/hooks/use-beta-widgets'
import { useIsStacked } from '@/hooks/use-stacked-layout'
import { cn } from '@/lib/utils'
import styles from './layout-popover.module.css'

const PRESET_ORDER: BetaPresetLayout[] = ['notetaker', 'even', 'taskmaster', 'minimal']
const WIDGET_ORDER = Object.keys(WIDGET_METADATA) as WidgetId[]

interface LayoutPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The dock button; the popover anchors to it. */
  children: React.ReactNode
  side: 'top' | 'bottom' | 'left' | 'right'
  presetLayout: BetaPresetLayout
  setPresetLayout: (layout: BetaPresetLayout) => void
  widgets: WidgetVisibilityState
  toggleWidget: (id: WidgetId) => void
  activeCount: number
  onEnterEdit: () => void
}

export function LayoutPopover({
  open,
  onOpenChange,
  children,
  side,
  presetLayout,
  setPresetLayout,
  widgets,
  toggleWidget,
  activeCount,
  onEnterEdit,
}: LayoutPopoverProps) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const isStacked = useIsStacked()

  const handleEnterEdit = () => {
    onOpenChange(false)
    onEnterEdit()
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className={styles.anchor}>
          {children}
        </div>
      </PopoverAnchor>
      <PopoverContent
        side={side}
        align="center"
        sideOffset={12}
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // The dock button toggles the popover itself; don't let the outside-click close it first.
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
        aria-label="Dashboard layout"
        data-testid="layout-popover"
      >
        <div className={styles.panel}>
          <section className={styles.section}>
            <h3 className={styles.heading}>Layout</h3>
            <div className={styles.presetList}>
              {PRESET_ORDER.map((id) => {
                const meta = LAYOUT_PRESET_METADATA[id]
                const active = presetLayout === id
                return (
                  <button
                    key={id}
                    type="button"
                    className={cn(styles.preset, active && styles.presetActive)}
                    aria-pressed={active}
                    onClick={() => setPresetLayout(id)}
                  >
                    <span className={styles.presetName}>{meta.name}</span>
                    <span className={styles.presetDescription}>{meta.description}</span>
                  </button>
                )
              })}
            </div>
            {presetLayout === 'custom' && (
              <div className={styles.customRow}>
                <span className={styles.customLabel}>Custom arrangement</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setPresetLayout('notetaker')}
                >
                  Reset to preset
                </button>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h3 className={styles.heading}>Widgets</h3>
            <div className={styles.chipList}>
              {WIDGET_ORDER.map((id) => {
                const on = widgets[id]
                const isLastVisible = on && activeCount <= 1
                return (
                  <button
                    key={id}
                    type="button"
                    className={cn(styles.chip, on && styles.chipOn)}
                    aria-pressed={on}
                    disabled={isLastVisible}
                    title={isLastVisible ? 'At least one widget must stay visible' : undefined}
                    onClick={() => toggleWidget(id)}
                  >
                    {WIDGET_METADATA[id].name}
                  </button>
                )
              })}
            </div>
          </section>

          {!isStacked && (
            <button type="button" className={styles.primaryButton} onClick={handleEnterEdit}>
              Edit layout
              <kbd className={styles.kbd}>⌘L</kbd>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
