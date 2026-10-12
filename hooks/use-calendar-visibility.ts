'use client'

import { useCallback, useSyncExternalStore } from 'react'

/*
 * Which calendar accounts the schedule shows. Settings flips the switches, the Schedule
 * widget filters by them; both read this one store, so a change shows up straight away.
 * Keys: `primary-<userId>` for the account you signed in with, the connected account's id
 * for the others (matches the accountId /api/calendar puts on each event). Accounts are
 * visible unless switched off. Saved per device in localStorage.
 */

type Visibility = Record<string, boolean>

const STORAGE_KEY = 'cleartab-calendar-visibility'
const EMPTY: Visibility = {}

let cache: Visibility | null = null
const listeners = new Set<() => void>()

function read(): Visibility {
  if (cache) return cache
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    cache = saved ? (JSON.parse(saved) as Visibility) : EMPTY
  } catch {
    cache = EMPTY
  }
  return cache
}

function write(next: Visibility) {
  cache = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked: the switch still works until the page reloads
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Other tabs (and the extension's other new tabs) changing it
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    cache = null
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useCalendarVisibility() {
  const visibility = useSyncExternalStore(subscribe, read, () => EMPTY)

  const isVisible = useCallback((accountKey: string) => visibility[accountKey] !== false, [visibility])
  const setVisible = useCallback((accountKey: string, visible: boolean) => {
    write({ ...read(), [accountKey]: visible })
  }, [])

  return { isVisible, setVisible }
}
