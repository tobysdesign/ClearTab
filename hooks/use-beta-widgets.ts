'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

export type BetaPresetLayout = 'default_4right' | '3left' | '3right' | '2left2right'

export type WidgetId = 'notes' | 'tasks' | 'schedule' | 'weather' | 'recorder' | 'countdown'

export interface WidgetMeta {
  id: WidgetId
  name: string
  icon: string
}

export const WIDGET_METADATA: Record<WidgetId, WidgetMeta> = {
  notes: { id: 'notes', name: 'Notes', icon: '📝' },
  tasks: { id: 'tasks', name: 'Tasks', icon: '✓' },
  schedule: { id: 'schedule', name: 'Schedule', icon: '📅' },
  weather: { id: 'weather', name: 'Weather', icon: '☁️' },
  recorder: { id: 'recorder', name: 'Voice Memo', icon: '🎙️' },
  countdown: { id: 'countdown', name: 'Countdown', icon: '⏳' },
}

export type WidgetVisibilityState = Record<WidgetId, boolean>

export const DEFAULT_WIDGET_STATE: WidgetVisibilityState = {
  notes: true,
  tasks: true,
  schedule: true,
  weather: true,
  recorder: true,
  countdown: true,
}

export interface LayoutPresetMeta {
  id: BetaPresetLayout
  name: string
  description: string
}

export const LAYOUT_PRESET_METADATA: Record<BetaPresetLayout, LayoutPresetMeta> = {
  default_4right: {
    id: 'default_4right',
    name: 'default_4right',
    description: 'Notes tall on left, Tasks top right, 2x2 utility grid bottom right',
  },
  '3left': {
    name: '3left',
    id: '3left',
    description: 'Notes & Tasks top row, 3 utilities left, Schedule wide right',
  },
  '3right': {
    name: '3right',
    id: '3right',
    description: 'Tasks & Notes top row, Schedule wide left, 3 utilities right',
  },
  '2left2right': {
    name: '2left2right',
    id: '2left2right',
    description: 'Notes & Tasks top row, 2 utilities left, 2 utilities right',
  },
}

const PRESET_LAYOUT_KEY = 'cleartab-preset-layout-v3'
const WIDGET_STATE_KEY = 'cleartab-beta-widgets-v3'

export function useBetaWidgets() {
  const [presetLayout, setPresetLayoutState] = useState<BetaPresetLayout>(() => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(PRESET_LAYOUT_KEY) as BetaPresetLayout | null
        if (stored && (stored === 'default_4right' || stored === '3left' || stored === '3right' || stored === '2left2right')) {
          return stored
        }
      } catch {}
    }
    return 'default_4right'
  })

  const [widgets, setWidgets] = useState<WidgetVisibilityState>(() => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(WIDGET_STATE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          return { ...DEFAULT_WIDGET_STATE, ...parsed }
        }
      } catch (e) {
        console.warn('Failed to read widget visibility state from localStorage', e)
      }
    }
    return DEFAULT_WIDGET_STATE
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
    try {
      window.localStorage.setItem(PRESET_LAYOUT_KEY, presetLayout)
      window.localStorage.setItem(WIDGET_STATE_KEY, JSON.stringify(widgets))
    } catch (e) {
      console.warn('Failed to save layout preset to localStorage', e)
    }
  }, [presetLayout, widgets])

  const setPresetLayout = useCallback((layout: BetaPresetLayout) => {
    setPresetLayoutState(layout)
  }, [])

  const toggleWidget = useCallback((id: WidgetId) => {
    setWidgets((prev) => {
      // Ensure at least 1 widget is always visible
      const activeCount = Object.values(prev).filter(Boolean).length
      if (prev[id] && activeCount <= 1) {
        return prev
      }
      return { ...prev, [id]: !prev[id] }
    })
  }, [])

  const activeCount = useMemo(() => {
    return Object.values(widgets).filter(Boolean).length
  }, [widgets])

  const totalCount = Object.keys(WIDGET_METADATA).length

  return {
    presetLayout,
    setPresetLayout,
    widgets,
    toggleWidget,
    activeCount,
    totalCount,
  }
}
