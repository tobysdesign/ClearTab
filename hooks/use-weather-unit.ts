'use client'

import { useCallback, useSyncExternalStore } from 'react'

export type TemperatureUnit = 'celsius' | 'fahrenheit'

const STORAGE_KEY = 'cleartab-weather-unit'
const DEFAULT_UNIT: TemperatureUnit = 'celsius'

let cache: TemperatureUnit | null = null
const listeners = new Set<() => void>()

function read(): TemperatureUnit {
  if (cache) return cache
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    cache = saved === 'fahrenheit' ? 'fahrenheit' : DEFAULT_UNIT
  } catch {
    cache = DEFAULT_UNIT
  }
  return cache
}

function write(next: TemperatureUnit) {
  cache = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage blocked: the switch still works until the page reloads
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
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

export function useWeatherUnit() {
  const unit = useSyncExternalStore(subscribe, read, () => DEFAULT_UNIT)

  const setUnit = useCallback((next: TemperatureUnit) => {
    write(next)
  }, [])

  return { unit, setUnit }
}
