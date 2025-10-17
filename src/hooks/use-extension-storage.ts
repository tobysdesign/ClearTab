import { useState, useEffect, useCallback } from 'react'

// Extension-specific storage hook
export function useExtensionStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data from storage
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Use Chrome storage API
        const result = await chrome.storage.local.get([key])
        setData(result[key] || defaultValue)
      } else {
        // Fallback to localStorage for development
        const saved = localStorage.getItem(`extension-${key}`)
        setData(saved ? JSON.parse(saved) : defaultValue)
      }
    } catch (err) {
      console.warn(`Extension: Failed to load ${key}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setData(defaultValue)
    } finally {
      setLoading(false)
    }
  }, [key, defaultValue])

  // Save data to storage
  const saveData = useCallback(async (newData: T) => {
    try {
      setError(null)

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [key]: newData })
      } else {
        localStorage.setItem(`extension-${key}`, JSON.stringify(newData))
      }

      setData(newData)
    } catch (err) {
      console.warn(`Extension: Failed to save ${key}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to save data')
      throw err
    }
  }, [key])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    setData: saveData,
    loading,
    error,
    reload: loadData
  }
}