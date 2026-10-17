'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-fetch'

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
  const response = await apiFetch('/api/preferences')
  if (!response.ok) throw new Error(`Failed to load preferences (${response.status})`)
  const { data } = await response.json()
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data ?? null))
  } catch {
    // Storage full or blocked: the cache is only a speed-up
  }
  return data ?? null
}

// On sign-out, so the next account to sign in doesn't briefly see these
export function clearPreferencesCache() {
  try {
    window.localStorage.removeItem(CACHE_KEY)
  } catch {
    // Storage blocked: nothing cached anyway
  }
}

export function usePreferences() {
  return useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: fetchPreferences,
    // The localStorage snapshot is a *placeholder* only — it renders instantly
    // (countdown, weather) but reports isPlaceholderData=true, so consumers that
    // apply server state once (the beta layout) can wait for the genuinely fresh
    // fetch instead of clobbering freshly-edited local state with a stale cache.
    // NOTE: do not add `initialData` here — initialData is treated as real data
    // (isPlaceholderData=false), which reintroduces the custom-layout revert bug.
    placeholderData: readCachedPreferences,
  })
}
