'use client'

import React from 'react'

interface ChatOverlayProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
  isSetupMode: boolean
  onSetupComplete: () => void
}

export default function ChatOverlay({ isOpen, onClose }: ChatOverlayProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">AI Chat</h2>
        <p>Chat overlay content goes here.</p>
        <button onClick={onClose} className="mt-4 p-2 bg-primary text-primary-foreground rounded">Close</button>
      </div>
    </div>
  )
} 