'use client'

import React, { createContext, useContext, useState } from 'react'

export interface Card {
  description: string
  title: string
  src?: string
  ctaText?: string
  ctaLink?: string
  content?: () => React.ReactNode
  onClick?: () => void
}

interface ExpandableCardContextValue {
  active: Card | null
  setActive: (card: Card | null) => void
}

const ExpandableCardContext = createContext<ExpandableCardContextValue | undefined>(undefined)

export const useExpandableCard = () => {
  const ctx = useContext(ExpandableCardContext)
  if (!ctx) throw new Error('ExpandableCardContext not found')
  return ctx
}

export const ExpandableCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState<Card | null>(null)
  return (
    <ExpandableCardContext.Provider value={{ active, setActive }}>
      {children}
    </ExpandableCardContext.Provider>
  )
}