'use client'

import React, { useEffect, useState, ReactNode } from 'react'

// Simple client-only wrapper component
export function ClientOnly({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) {
    return null
  }
  
  return <>{children}</>
} 