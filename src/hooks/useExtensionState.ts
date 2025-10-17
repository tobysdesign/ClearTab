import { useState, useEffect } from 'react'

interface ExtensionState {
  isLoading: boolean
  error: boolean
}

export function useExtensionState() {
  const [state, setState] = useState<ExtensionState>({
    isLoading: true,
    error: false
  })

  useEffect(() => {
    // Simulate loading state for now
    const timer = setTimeout(() => {
      setState({
        isLoading: false,
        error: false
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return { state }
}