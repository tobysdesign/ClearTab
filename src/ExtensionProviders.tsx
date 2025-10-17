import React from 'react'

// Extension-specific theme provider (lightweight)
const ExtensionThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    // Apply dark theme immediately
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  }, [])

  return <>{children}</>
}

// Extension-specific error handler
const ExtensionErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Failed to fetch') ||
          event.reason?.message?.includes('NetworkError')) {
        console.warn('Extension: Unhandled promise rejection (network):', event.reason.message)
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  return <>{children}</>
}

// Simple state management for extension (without Zustand for now)
interface ExtensionState {
  notes: any[]
  tasks: any[]
  isLoading: boolean
  error: string | null
}

const initialState: ExtensionState = {
  notes: [],
  tasks: [],
  isLoading: false,
  error: null
}

const ExtensionStateContext = React.createContext<{
  state: ExtensionState
  setState: React.Dispatch<React.SetStateAction<ExtensionState>>
} | null>(null)

const ExtensionStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<ExtensionState>(initialState)

  const value = React.useMemo(() => ({ state, setState }), [state])

  return (
    <ExtensionStateContext.Provider value={value}>
      {children}
    </ExtensionStateContext.Provider>
  )
}

// Hook to use extension state
export const useExtensionState = () => {
  const context = React.useContext(ExtensionStateContext)
  if (!context) {
    throw new Error('useExtensionState must be used within ExtensionStateProvider')
  }
  return context
}

// Combined providers
export const ExtensionProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ExtensionErrorProvider>
      <ExtensionThemeProvider>
        <ExtensionStateProvider>
          {children}
        </ExtensionStateProvider>
      </ExtensionThemeProvider>
    </ExtensionErrorProvider>
  )
}