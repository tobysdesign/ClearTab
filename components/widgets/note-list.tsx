'use client'

import type { Note } from '@/shared/schema'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/lib/utils'

interface NoteListProps {
  notes: Note[]
  selectedNoteId: number | string | null
  onSelectNote: (id: number | string) => void
  isCollapsed?: boolean
  isSaving: boolean
  panelSize?: number
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
}: NoteListProps) {
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
    <div className={cn("space-y-2", isCollapsed && "flex flex-col items-center")}>
      {sortedNotes.map((note) => {
        if (isCollapsed) {
          return (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id as any)}
            className={cn(
              'h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-colors',
              selectedNoteId === note.id ? 'bg-muted' : 'hover:bg-muted/50'
            )}
            title={note.title}
          >
            <span className="font-bold text-xs">{getInitials(note.title)}</span>
          </div>
          )
        }

        return (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id as any)}
            className={cn(
              'listItem cursor-pointer',
              selectedNoteId === note.id && 'active'
            )}
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
          </div>
        )
      })}
    </div>
  )
} 