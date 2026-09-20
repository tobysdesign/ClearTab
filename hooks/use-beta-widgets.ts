'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

export type WidgetId = 'notes' | 'tasks' | 'schedule' | 'weather' | 'recorder' | 'countdown'

export type PresetId = 'all' | 'focus' | 'planner' | 'capture' | 'minimal' | 'custom'

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

const STORAGE_KEY = 'cleartab-beta-widgets-v1'
const PRESET_KEY = 'cleartab-beta-preset-v1'

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

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
      localStorage.setItem(PRESET_KEY, activePreset)
    } catch (e) {
      console.warn('Failed to save beta widget state to localStorage', e)
    }
  }, [widgets, activePreset])

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

  const applyPreset = useCallback((presetId: Exclude<PresetId, 'custom'>) => {
    const preset = PRESETS[presetId]
    if (!preset) return
    setWidgets({ ...preset.widgets })
    setActivePreset(presetId)
  }, [])

  const resetToAll = useCallback(() => {
    setWidgets({ ...DEFAULT_WIDGET_STATE })
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
    toggleWidget,
    applyPreset,
    resetToAll,
  }
}
