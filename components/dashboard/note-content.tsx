'use client'

import type { Note } from '@/shared/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NoteContentProps {
  note: Note | null
}

export function NoteContent({ note }: NoteContentProps) {
  if (!note) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground p-8">
        <p>Select a note to view its content.</p>
      </div>
    )
  }

  // The 'content' is a JSON object from Yoopta. We need to parse it to display it.
  // For now, we'll just stringify it to see the structure.
  const contentToDisplay =
    typeof note.content === 'object' && note.content !== null
      ? JSON.stringify(note.content, null, 2)
      : String(note.content)

  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader>
        <CardTitle>{note.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm">{contentToDisplay}</pre>
      </CardContent>
    </Card>
  )
} 