import { useCallback, useRef } from 'react'

interface DebouncedFunction<T> {
  (value: T): void
  cancel: () => void
  flush: () => void
}

export function useDebounce<T>(
  callback: (value: T) => void | Promise<void>,
  delay: number,
  options: { leading?: boolean } = {}
): DebouncedFunction<T> {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)
  const valueRef = useRef<T | undefined>(undefined)
  const optionsRef = useRef(options)

  // Update refs when values change
  callbackRef.current = callback
  optionsRef.current = options

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  const flush = useCallback(() => {
    cancel()
    if (valueRef.current !== undefined) {
      callbackRef.current(valueRef.current)
      valueRef.current = undefined
    }
  }, [cancel])

  const debouncedCallback = useCallback(
    (value: T) => {
      valueRef.current = value

      // If leading is true and there's no active timeout, call immediately
      if (optionsRef.current.leading && !timeoutRef.current) {
        callbackRef.current(value)
      }

      cancel()

      timeoutRef.current = setTimeout(() => {
        if (valueRef.current !== undefined) {
          callbackRef.current(valueRef.current)
          valueRef.current = undefined
        }
        timeoutRef.current = undefined
      }, delay)
    },
    [delay, cancel]
  )

  // Add cancel and flush methods to the debounced function
  Object.assign(debouncedCallback, { cancel, flush })

  return debouncedCallback as DebouncedFunction<T>
} 