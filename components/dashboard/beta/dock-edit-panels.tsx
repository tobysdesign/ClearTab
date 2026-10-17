'use client'

import React from 'react'
import {
  BetaPresetLayout,
  WidgetId,
  WidgetVisibilityState,
  WIDGET_METADATA,
} from '@/hooks/use-beta-widgets'
import { PanelNode, presetToTree } from '@/lib/panel-tree'
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
      {PRESET_ORDER.map((id) => {
        const active = presetLayout === id
        return (
          <button
            key={id}
            type="button"
            className={cn(styles.preset, active && styles.presetActive)}
            aria-pressed={active}
            aria-label={`${id} layout`}
            title={id}
            onClick={() => setPresetLayout(id)}
            data-testid={`edit-preset-${id}`}
          >
            <Wireframe node={presetToTree(id)} />
          </button>
        )
      })}
    </div>
  )
}

interface WidgetFlankProps {
  widgets: WidgetVisibilityState
  toggleWidget: (id: WidgetId) => void
  activeCount: number
  orientation: Orientation
}

/** Widget show/hide toggles, flanking the other side of the dock. */
export function WidgetFlank({ widgets, toggleWidget, activeCount, orientation }: WidgetFlankProps) {
  return (
    <div
      className={cn(styles.flank, orientation === 'vertical' ? styles.flankVertical : styles.flankHorizontal)}
      data-testid="edit-widgets"
    >
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
            data-testid={`edit-widget-${id}`}
          >
            {WIDGET_METADATA[id].name}
          </button>
        )
      })}
    </div>
  )
}
