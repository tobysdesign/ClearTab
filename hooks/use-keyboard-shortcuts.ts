'use client'

import { useState } from 'react'

export function useKeyboardShortcuts() {
  const [isChatOpen, setChatOpen] = useState(false)
  
  // This is a placeholder. In a real implementation, you'd add
  // event listeners here to handle keyboard shortcuts.
  
  return {
    isChatOpen,
    openChat: () => setChatOpen(true),
    closeChat: () => setChatOpen(false),
    initialMessage: 'Hello from a keyboard shortcut!',
  }
} 