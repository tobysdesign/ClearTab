'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

export type WidgetId = 'notes' | 'tasks' | 'schedule' | 'weather' | 'recorder' | 'countdown'

export type PrimaryWidgetId = 'notes' | 'tasks'
export type UtilityWidgetId = 'weather' | 'recorder' | 'countdown' | 'schedule'

export type PresetId = 'all' | 'focus' | 'planner' | 'capture' | 'minimal' | 'custom'

export type LayoutOrientation = 'rows' | 'columns' | 'inverted'

export interface WidgetMeta {
  id: WidgetId
  name: string
  description: string
  icon: string
  category: 'primary' | 'utility'
}

export const WIDGET_METADATA: Record<WidgetId, WidgetMeta> = {
  notes: {
    id: 'notes',
    name: 'Notes',
    description: 'Writing, thoughts & scratchpad',
    icon: '📝',
    category: 'primary',
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    description: 'To-dos, checklists & priorities',
    icon: '✓',
    category: 'primary',
  },
  schedule: {
    id: 'schedule',
    name: 'Schedule',
    description: 'Google Calendar agenda & events',
    icon: '📅',
    category: 'utility',
  },
  recorder: {
    id: 'recorder',
    name: 'Voice Memo',
    description: 'Audio recording with AI transcription',
    icon: '🎙️',
    category: 'utility',
  },
  weather: {
    id: 'weather',
    name: 'Weather',
    description: 'Live forecast & current conditions',
    icon: '☁️',
    category: 'utility',
  },
  countdown: {
    id: 'countdown',
    name: 'Countdown',
    description: 'Upcoming deadlines & milestones',
    icon: '⏳',
    category: 'utility',
  },
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

export const DEFAULT_PRIMARY_ORDER: PrimaryWidgetId[] = ['notes', 'tasks']
export const DEFAULT_UTILITY_ORDER: UtilityWidgetId[] = ['weather', 'recorder', 'countdown', 'schedule']

export const PRESETS: Record<Exclude<PresetId, 'custom'>, { name: string; description: string; widgets: WidgetVisibilityState }> = {
  all: {
    name: 'All Widgets',
    description: 'The full bento grid with all 6 widgets',
    widgets: {
      notes: true,
      tasks: true,
      schedule: true,
      weather: true,
      recorder: true,
      countdown: true,
    },
  },
  focus: {
    name: 'Deep Focus',
    description: 'Notes and Tasks side-by-side with zero distractions',
    widgets: {
      notes: true,
      tasks: true,
      schedule: false,
      weather: false,
      recorder: false,
      countdown: false,
    },
  },
  planner: {
    name: 'Day Planner',
    description: 'Agenda, tasks and countdown to keep your day aligned',
    widgets: {
      notes: false,
      tasks: true,
      schedule: true,
      weather: true,
      recorder: false,
      countdown: true,
    },
  },
  capture: {
    name: 'Quick Capture',
    description: 'Writing, voice recording and fast task creation',
    widgets: {
      notes: true,
      tasks: true,
      schedule: false,
      weather: false,
      recorder: true,
      countdown: false,
    },
  },
  minimal: {
    name: 'Minimalist',
    description: 'Clean notes workspace with quiet weather glance',
    widgets: {
      notes: true,
      tasks: false,
      schedule: false,
      weather: true,
      recorder: false,
      countdown: false,
    },
  },
}

const STORAGE_KEY = 'cleartab-beta-widgets-v2'
const PRESET_KEY = 'cleartab-beta-preset-v2'
const ORDER_KEY = 'cleartab-beta-order-v2'
const ORIENTATION_KEY = 'cleartab-beta-orientation-v2'

export function useBetaWidgets() {
  const [widgets, setWidgets] = useState<WidgetVisibilityState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          return { ...DEFAULT_WIDGET_STATE, ...parsed }
        }
      } catch (e) {
        console.warn('Failed to read beta widget state from localStorage', e)
      }
    }
    return DEFAULT_WIDGET_STATE
  })

  const [activePreset, setActivePreset] = useState<PresetId>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PRESET_KEY) as PresetId | null
        if (stored && (stored in PRESETS || stored === 'custom')) {
          return stored
        }
      } catch {}
    }
    return 'all'
  })

  const [primaryOrder, setPrimaryOrder] = useState<PrimaryWidgetId[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ORDER_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed?.primary)) return parsed.primary
        }
      } catch {}
    }
    return DEFAULT_PRIMARY_ORDER
  })

  const [utilityOrder, setUtilityOrder] = useState<UtilityWidgetId[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ORDER_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed?.utility)) return parsed.utility
        }
      } catch {}
    }
    return DEFAULT_UTILITY_ORDER
  })

  const [layoutOrientation, setLayoutOrientation] = useState<LayoutOrientation>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ORIENTATION_KEY) as LayoutOrientation | null
        if (stored === 'rows' || stored === 'columns' || stored === 'inverted') {
          return stored
        }
      } catch {}
    }
    return 'rows'
  })

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
      localStorage.setItem(PRESET_KEY, activePreset)
      localStorage.setItem(ORDER_KEY, JSON.stringify({ primary: primaryOrder, utility: utilityOrder }))
      localStorage.setItem(ORIENTATION_KEY, layoutOrientation)
    } catch (e) {
      console.warn('Failed to save beta widget state to localStorage', e)
    }
  }, [widgets, activePreset, primaryOrder, utilityOrder, layoutOrientation])

  const toggleWidget = useCallback((id: WidgetId) => {
    setWidgets((prev) => {
      // Ensure at least 1 widget is always visible
      const activeCount = Object.values(prev).filter(Boolean).length
      if (prev[id] && activeCount <= 1) {
        return prev // Prevent hiding the last active widget
      }

      const next = { ...prev, [id]: !prev[id] }
      setActivePreset('custom')
      return next
    })
  }, [])

  const swapPrimaryOrder = useCallback(() => {
    setPrimaryOrder((prev) => [prev[1] ?? 'tasks', prev[0] ?? 'notes'])
    setActivePreset('custom')
  }, [])

  const moveUtility = useCallback((id: UtilityWidgetId, direction: 'left' | 'right') => {
    setUtilityOrder((prev) => {
      const idx = prev.indexOf(id)
      if (idx === -1) return prev
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= prev.length) return prev

      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(targetIdx, 0, item)
      return next
    })
    setActivePreset('custom')
  }, [])

  const applyPreset = useCallback((presetId: Exclude<PresetId, 'custom'>) => {
    const preset = PRESETS[presetId]
    if (!preset) return
    setWidgets({ ...preset.widgets })
    setActivePreset(presetId)
  }, [])

  const resetToAll = useCallback(() => {
    setWidgets({ ...DEFAULT_WIDGET_STATE })
    setPrimaryOrder(DEFAULT_PRIMARY_ORDER)
    setUtilityOrder(DEFAULT_UTILITY_ORDER)
    setLayoutOrientation('rows')
    setActivePreset('all')
  }, [])

  const activeCount = useMemo(() => {
    return Object.values(widgets).filter(Boolean).length
  }, [widgets])

  const totalCount = Object.keys(WIDGET_METADATA).length

  return {
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
  }
}
