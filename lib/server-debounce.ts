// Server-side debouncing to prevent database spam while keeping UI responsive

interface DebouncedOperation<T> {
  timer: NodeJS.Timeout
  latestData: T | null
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

const debouncedOperations = new Map<string, DebouncedOperation<unknown>>()

export function serverDebounce<T>(
  key: string,
  operation: () => Promise<T>,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Cancel existing operation
    const existing = debouncedOperations.get(key) as DebouncedOperation<T> | undefined
    if (existing) {
      clearTimeout(existing.timer)
      // Resolve the previous promise with the new data when it executes
      existing.resolve = resolve as (value: unknown) => void
      existing.reject = reject
    }
    
    // Schedule new operation
    const timer = setTimeout(async () => {
      try {
        const result = await operation()
        const op = debouncedOperations.get(key) as DebouncedOperation<T> | undefined
        if (op) {
          op.resolve(result)
          debouncedOperations.delete(key)
        }
      } catch (error) {
        const op = debouncedOperations.get(key) as DebouncedOperation<T> | undefined
        if (op) {
          op.reject(error)
          debouncedOperations.delete(key)
        }
      }
    }, delay)
    
    debouncedOperations.set(key, {
      timer,
      latestData: null,
      resolve: resolve as (value: unknown) => void,
      reject
    } as DebouncedOperation<unknown>)
  })
}