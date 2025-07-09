'use client'

import { useState, useEffect } from 'react'
import type { Note } from '@/shared/schema'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface NoteListProps {
  notes: Note[]
  selectedNoteId: string | null
  onSelectNote: (id: string) => void
  isCollapsed?: boolean
  isSaving: boolean
  panelSize?: number
  onToggleCollapse?: () => void
  minWidth?: number
}

function getInitials(title: string) {
  if (!title) return 'UN'
  const words = title.split(' ')
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return title.substring(0, 2).toUpperCase()
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  isCollapsed = false,
  isSaving,
  panelSize = 30,
  onToggleCollapse,
  minWidth = 200
}: NoteListProps) {
  // Track previously updated notes to animate them
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null)
  const [prevNotes, setPrevNotes] = useState<Note[]>([])

  // Detect when a note is updated and moved to the top
  useEffect(() => {
    if (notes.length === 0 || prevNotes.length === 0) {
      setPrevNotes(notes)
      return
    }

    // Find a note that's been updated and moved to the top
    const sortedNotes = [...notes].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    
    const sortedPrevNotes = [...prevNotes].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    
    // Check if the top note changed and it was previously in the list
    if (sortedNotes[0]?.id !== sortedPrevNotes[0]?.id) {
      const movedNote = sortedNotes[0]
      const wasInPrevList = sortedPrevNotes.some(note => note.id === movedNote?.id)
      
      if (wasInPrevList) {
        setRecentlyUpdatedId(movedNote?.id || null)
        
        // Reset the animation flag after animation completes
        setTimeout(() => {
          setRecentlyUpdatedId(null)
        }, 1000)
      }
    }
    
    setPrevNotes(notes)
  }, [notes])

  if (notes.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No notes yet.
      </div>
    )
  }

  // Sort notes by updatedAt in descending order (newest first)
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <div 
      className={cn(
        "space-y-2 note-list-container transition-all duration-300 ease-in-out",
        isCollapsed ? "flex flex-col items-center" : "w-full"
      )}
      onClick={onToggleCollapse}
    >
      <AnimatePresence initial={false}>
        {sortedNotes.map((note) => {
          // Always show initials if collapsed
          if (isCollapsed) {
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  y: recentlyUpdatedId === note.id ? [0, -20, 0] : 0 
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  duration: recentlyUpdatedId === note.id ? 0.5 : 0.3
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectNote(note.id as string)
                }}
                className={cn(
                  'h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-colors',
                  selectedNoteId === note.id ? 'bg-muted' : 'hover:bg-muted/50'
                )}
                title={note.title}
              >
                <span className="font-bold text-xs">{getInitials(note.title)}</span>
              </motion.div>
            )
          }

          return (
            <motion.div
              key={note.id}
              layout
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  duration: recentlyUpdatedId === note.id ? 0.5 : 0.3
                }
              }}
              exit={{ y: -20, opacity: 0 }}
              className={cn(
                'listItem cursor-pointer',
                selectedNoteId === note.id && 'active',
                recentlyUpdatedId === note.id && 'animate-highlight'
              )}
              onClick={(e) => {
                e.stopPropagation()
                onSelectNote(note.id as string)
              }}
            >
              <div className="flex items-center justify-between w-full">
                <h3 className={cn("font-medium truncate", !note.title && "text-muted-foreground")}>
                  {note.title || 'Untitled Note'}
                </h3>
                <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                  {selectedNoteId === note.id && isSaving && (
                    <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
                  )}
                  {panelSize > 18 && formatShortDate(note.updatedAt)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
} 