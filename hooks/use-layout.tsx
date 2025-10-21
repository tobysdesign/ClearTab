'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type LayoutType = 'two-row' | 'single-row'

interface LayoutContextType {
  layout: LayoutType
  setLayout: (layout: LayoutType) => void
  toggleLayout: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutType>(() => {
    // Initialize from localStorage immediately if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('layout-preference')
      if (saved === 'single-row' || saved === 'two-row') {
        return saved
      }
    }
    return 'two-row'
  })

  // Load layout from localStorage on mount (fallback for SSR)
  useEffect(() => {
    const saved = localStorage.getItem('layout-preference')
    if (saved === 'single-row' || saved === 'two-row') {
      setLayout(saved)
    }
  }, [])

  // Save layout to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('layout-preference', layout)
  }, [layout])

  const toggleLayout = () => {
    const newLayout = layout === 'two-row' ? 'single-row' : 'two-row'
    console.log('Layout toggled from', layout, 'to', newLayout, 'at', Date.now())
    setLayout(newLayout)
    // Force a re-render by triggering state change
    setTimeout(() => {
      console.log('Force checking layout after toggle:', newLayout)
    }, 0)
  }

  return (
    <LayoutContext.Provider value={{ layout, setLayout, toggleLayout }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}