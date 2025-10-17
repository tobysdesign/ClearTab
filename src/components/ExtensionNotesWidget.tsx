import React from 'react'
import { NotesWidget } from '@/components/widgets/notes-widget'

// Extension provider to override hooks
const ExtensionHooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // This provider will override the hooks context for extension use
  return <>{children}</>
}

// Extension-compatible wrapper for NotesWidget
export const ExtensionNotesWidget: React.FC = () => {
  return (
    <ExtensionHooksProvider>
      <NotesWidget />
    </ExtensionHooksProvider>
  )
}