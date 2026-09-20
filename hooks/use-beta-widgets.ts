'use client'

import { useState, useEffect, useCallback } from 'react'

export type BetaPresetLayout = 'default_4right' | '3left' | '3right' | '2left2right'

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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
    try {
      window.localStorage.setItem(PRESET_LAYOUT_KEY, presetLayout)
    } catch (e) {
      console.warn('Failed to save layout preset to localStorage', e)
    }
  }, [presetLayout])

  const setPresetLayout = useCallback((layout: BetaPresetLayout) => {
    setPresetLayoutState(layout)
  }, [])

  return {
    presetLayout,
    setPresetLayout,
  }
}
