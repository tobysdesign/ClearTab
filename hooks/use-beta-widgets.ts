'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PanelNode, DropZone } from '@/lib/panel-tree'
import { presetToTree, moveWidget } from '@/lib/panel-tree'

export type BetaPresetLayout = 'notetaker' | 'even' | 'taskmaster' | 'minimal' | 'custom'

export type WidgetId = 'notes' | 'tasks' | 'schedule' | 'weather' | 'recorder' | 'countdown'

export interface CustomLayoutState {
  tree: PanelNode | null
}

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
  countdown: { id: 'countdown', name: 'Counter', icon: '⏳' },
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
  notetaker: {
    id: 'notetaker',
    name: 'Notetaker',
    description: 'Notes tall on left, Tasks top right, utilities grid below',
  },
  even: {
    name: 'Even',
    id: 'even',
    description: 'Notes & Tasks balanced top row, 4 utilities evenly split below',
  },
  taskmaster: {
    name: 'Taskmaster',
    id: 'taskmaster',
    description: 'Tasks tall on left, Notes top right, utilities grid below',
  },
  minimal: {
    name: 'Minimal',
    id: 'minimal',
    description: 'Notes & Tasks top row, 4 utilities in a single slim row below',
  },
  custom: {
    name: 'Custom',
    id: 'custom',
    description: 'A drag-to-tile arrangement forked from whichever layout was active when you started dragging',
  },
}

const PRESET_LAYOUT_KEY = 'cleartab-preset-layout-v4'
const WIDGET_STATE_KEY = 'cleartab-beta-widgets-v4'
const CUSTOM_LAYOUT_KEY = 'cleartab-custom-layout-v1'

export function useBetaWidgets() {
  const [presetLayout, setPresetLayoutState] = useState<BetaPresetLayout>(() => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(PRESET_LAYOUT_KEY) as BetaPresetLayout | null
        if (stored === 'notetaker' || stored === 'even' || stored === 'taskmaster' || stored === 'minimal' || stored === 'custom') {
          return stored
        }
      } catch {}
    }
    return 'notetaker'
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

  const [customLayout, setCustomLayout] = useState<CustomLayoutState>(() => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(CUSTOM_LAYOUT_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as CustomLayoutState
          if (parsed && (parsed.tree === null || typeof parsed.tree === 'object')) {
            return parsed
          }
        }
      } catch (e) {
        console.warn('Failed to read custom layout from localStorage', e)
      }
    }
    return { tree: null }
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.data) return
        const data = json.data
        if (
          data.layout === 'notetaker' || data.layout === 'even' ||
          data.layout === 'taskmaster' || data.layout === 'minimal' || data.layout === 'custom'
        ) {
          setPresetLayoutState(data.layout)
        }
        if (data.widgets && typeof data.widgets === 'object') {
          setWidgets((prev) => ({ ...prev, ...data.widgets }))
        }
        if (data.customLayout && typeof data.customLayout === 'object') {
          setCustomLayout(data.customLayout)
        }
      })
      .catch((e) => console.warn('Failed to load beta layout preferences from DB', e))
    return () => {
      cancelled = true
    }
    // Intentionally runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
    try {
      window.localStorage.setItem(PRESET_LAYOUT_KEY, presetLayout)
      window.localStorage.setItem(WIDGET_STATE_KEY, JSON.stringify(widgets))
      window.localStorage.setItem(CUSTOM_LAYOUT_KEY, JSON.stringify(customLayout))
    } catch (e) {
      console.warn('Failed to save layout preset to localStorage', e)
    }
  }, [presetLayout, widgets, customLayout])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: presetLayout, widgets, customLayout }),
      }).catch((e) => console.warn('Failed to sync beta layout preferences to DB', e))
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [presetLayout, widgets, customLayout])

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

  const moveWidgetInCustomLayout = useCallback((draggedId: WidgetId, targetId: WidgetId, zone: DropZone) => {
    setCustomLayout((prevCustom) => {
      const baseTree =
        presetLayout === 'custom' && prevCustom.tree
          ? prevCustom.tree
          : presetToTree(presetLayout === 'custom' ? 'notetaker' : presetLayout)
      return { tree: moveWidget(baseTree, draggedId, targetId, zone) }
    })
    setPresetLayoutState('custom')
  }, [presetLayout])

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
    customLayout,
    moveWidgetInCustomLayout,
  }
}
