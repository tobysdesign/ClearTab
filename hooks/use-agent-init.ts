'use client'

import { useState } from 'react'

export function useAgentInit() {
  const [isInitFlowOpen, setInitFlowOpen] = useState(false)

  // This is a placeholder. A real implementation would likely check
  // local storage or an API to see if this is the user's first time.
  
  return {
    isFirstTime: false,
    isInitFlowOpen,
    closeInitFlow: () => setInitFlowOpen(false),
  }
} 