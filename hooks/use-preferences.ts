'use client'

import { useQuery } from '@tanstack/react-query'

/*
 * Single source for /api/preferences (layout, widgets, weather location, countdown).
 * Every caller shares one React Query cache entry, so the page makes one request
 * instead of one per widget. The last response is also kept in localStorage and
 * shown as placeholder data, so widgets like the countdown render immediately on a
 * new tab while fresh preferences load in the background.
 */

export const PREFERENCES_QUERY_KEY = ['preferences'] as const

const CACHE_KEY = 'cleartab-preferences-cache'

// Preferences are a loose JSON blob owned by the API route
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Preferences = Record<string, any>

function readCachedPreferences(): Preferences | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const saved = window.localStorage.getItem(CACHE_KEY)
    return saved ? (JSON.parse(saved) as Preferences) : undefined
  } catch {
    return undefined
  }
}

async function fetchPreferences(): Promise<Preferences | null> {
  const response = await fetch('/api/preferences')
  if (!response.ok) throw new Error(`Failed to load preferences (${response.status})`)
  const { data } = await response.json()
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data ?? null))
  } catch {
    // Storage full or blocked: the cache is only a speed-up
  }
  return data ?? null
}

export function usePreferences() {
  return useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: fetchPreferences,
    placeholderData: readCachedPreferences,
  })
}
