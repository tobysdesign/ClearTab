'use client'

import React, { useEffect } from 'react'
import {
  BetaPresetLayout,
  WidgetId,
  WidgetVisibilityState,
  WIDGET_METADATA,
  LAYOUT_PRESET_METADATA,
} from '@/hooks/use-beta-widgets'
import { PanelNode, presetToTree } from '@/lib/panel-tree'
import { Tooltip, TooltipContent, TooltipTrigger } from '@cleartab/ui'
import { cn } from '@/lib/utils'
import styles from './dock-edit-panels.module.css'

const PRESET_ORDER: Exclude<BetaPresetLayout, 'custom'>[] = [
  'notetaker',
  'even',
  'taskmaster',
  'minimal',
]
const WIDGET_ORDER = Object.keys(WIDGET_METADATA) as WidgetId[]

type Orientation = 'horizontal' | 'vertical'

/** A tiny div-only wireframe of a layout tree — the preset's shape, nothing else. */
function Wireframe({ node }: { node: PanelNode }) {
  if (node.type === 'widget') {
    const emphasis = node.id === 'notes' || node.id === 'tasks'
    return <div className={cn(styles.cell, emphasis && styles.cellEmphasis)} />
  }
  return (
    <div className={node.direction === 'row' ? styles.wfRow : styles.wfCol}>
      <Wireframe node={node.children[0]} />
      <Wireframe node={node.children[1]} />
    </div>
  )
}

interface PresetFlankProps {
  presetLayout: BetaPresetLayout
  setPresetLayout: (layout: BetaPresetLayout) => void
  orientation: Orientation
}

/** Preset pickers rendered as minimal wireframe previews, flanking one side of the dock. */
export function PresetFlank({ presetLayout, setPresetLayout, orientation }: PresetFlankProps) {
  return (
    <div
      className={cn(styles.flank, orientation === 'vertical' ? styles.flankVertical : styles.flankHorizontal)}
      data-testid="edit-presets"
    >
      <span className={styles.flankLabel}>Presets</span>
      {PRESET_ORDER.map((id) => {
        const active = presetLayout === id
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(styles.preset, active && styles.presetActive)}
                aria-pressed={active}
                aria-label={`${LAYOUT_PRESET_METADATA[id].name} layout`}
                onClick={() => setPresetLayout(id)}
                data-testid={`edit-preset-${id}`}
              >
                <Wireframe node={presetToTree(id)} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{LAYOUT_PRESET_METADATA[id].name}</TooltipContent>
          </Tooltip>
        )
      })}

      {/* Custom has no fixed shape, so it shows the "tactic" icon rather than a wireframe. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(styles.preset, styles.presetCustom, presetLayout === 'custom' && styles.presetActive)}
            aria-pressed={presetLayout === 'custom'}
            aria-label="Custom layout"
            onClick={() => setPresetLayout('custom')}
            data-testid="edit-preset-custom"
          >
            <span className={cn('material-symbols-outlined', styles.presetIcon)}>dashboard_customize</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{LAYOUT_PRESET_METADATA.custom.name}</TooltipContent>
      </Tooltip>
    </div>
  )
}

interface WidgetFlankProps {
  widgets: WidgetVisibilityState
  toggleWidget: (id: WidgetId) => void
  activeCount: number
  orientation: Orientation
}

// Highlight a widget's live tile on the board (found by its data-widget-id) while
// its toggle is hovered/focused, so users see which widget a toggle controls.
function setWidgetHighlight(id: WidgetId, on: boolean) {
  if (typeof document === 'undefined') return
  const el = document.querySelector(`[data-widget-id="${id}"]`)
  if (!el) return
  if (on) el.setAttribute('data-layout-highlight', 'true')
  else el.removeAttribute('data-layout-highlight')
}

function clearAllHighlights() {
  if (typeof document === 'undefined') return
  document
    .querySelectorAll('[data-layout-highlight]')
    .forEach((el) => el.removeAttribute('data-layout-highlight'))
}

/** Widget show/hide toggles, flanking the other side of the dock. */
export function WidgetFlank({ widgets, toggleWidget, activeCount, orientation }: WidgetFlankProps) {
  // Clear any lingering highlight when the flank unmounts (e.g. exiting edit mode).
  useEffect(() => clearAllHighlights, [])

  return (
    <div
      className={cn(styles.flank, orientation === 'vertical' ? styles.flankVertical : styles.flankHorizontal)}
      data-testid="edit-widgets"
    >
      <span className={styles.flankLabel}>Visibility</span>
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
            title={isLastVisible ? 'At least one widget must stay visible' : WIDGET_METADATA[id].name}
            onClick={() => toggleWidget(id)}
            onMouseEnter={() => setWidgetHighlight(id, true)}
            onMouseLeave={() => setWidgetHighlight(id, false)}
            onFocus={() => setWidgetHighlight(id, true)}
            onBlur={() => setWidgetHighlight(id, false)}
            data-testid={`edit-widget-${id}`}
          >
            {WIDGET_METADATA[id].name}
          </button>
        )
      })}
    </div>
  )
}
