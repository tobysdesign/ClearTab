'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type LayoutType = 'two-row' | 'single-row'

interface LayoutContextType {
  layout: LayoutType
  setLayout: (layout: LayoutType) => void
  toggleLayout: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutType>('two-row')

  const toggleLayout = () => {
    setLayout(prev => prev === 'two-row' ? 'single-row' : 'two-row')
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