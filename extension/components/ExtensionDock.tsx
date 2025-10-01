/**
 * Extension Dock Component
 * Semantic floating dock with drag functionality
 */

import React, { useState } from 'react'
import { useAuth } from '../utils/chrome-auth'

export function ExtensionDock() {
  const [isDragging, setIsDragging] = useState(false)
  const [isVertical, setIsVertical] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { signOut } = useAuth()

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <nav
      className={`dock ${isDragging ? 'is-dragging' : ''} ${isVertical ? 'is-vertical' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <button
        className="dock__button"
        onClick={() => setShowSettings(!showSettings)}
        title="Settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
        </svg>
      </button>

      <button
        className="dock__button"
        onClick={handleSignOut}
        title="Sign Out"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9Z"/>
        </svg>
      </button>

      <div
        className="dock__drag-handle"
        title="Drag to move dock"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8,18H11V15H8V18M13,18H16V15H13V18M8,14H11V11H8V14M13,14H16V11H13V14M8,10H11V7H8V10M13,10H16V7H13V10Z"/>
        </svg>
      </div>
    </nav>
  )
}
