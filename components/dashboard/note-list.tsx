'use client'

import type { Note } from '@/shared/schema'
import { cn } from '@/lib/utils'

interface NoteListProps {
  notes: Note[]
  selectedNoteId: number | null
  onSelectNote: (id: number) => void
  isCollapsed: boolean
}

function getInitials(title: string) {
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
  isCollapsed,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No notes yet.
      </div>
    )
  }

  return (
    <div className={cn("space-y-2 p-2", isCollapsed && "flex flex-col items-center")}>
      {notes.map((note) =>
        isCollapsed ? (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={cn(
              'h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-colors',
              selectedNoteId === note.id ? 'bg-muted' : 'hover:bg-muted/50'
            )}
            title={note.title}
          >
            <span className="font-bold text-xs">{getInitials(note.title)}</span>
          </div>
        ) : (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={cn(
              'p-3 rounded-lg cursor-pointer transition-colors',
              selectedNoteId === note.id ? 'bg-muted' : 'hover:bg-muted/50'
            )}
          >
            <h3 className="font-semibold text-sm truncate">{note.title}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(note.updatedAt).toLocaleDateString()}
            </p>
          </div>
        )
      )}
    </div>
  )
} 