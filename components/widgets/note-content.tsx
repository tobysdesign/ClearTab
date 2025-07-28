'use client'

import type { Note } from '@/shared/schema'
import { Input } from '@/components/ui/input'
import { useEffect, useState, useRef, type ReactNode } from 'react'
import { SimpleBlockNoteEditor } from '@/components/ui/simple-block-note-editor'
import { EMPTY_BLOCKNOTE_CONTENT } from '@/shared/schema'
import { Block } from '@blocknote/core'

interface NoteContentProps {
  note: Note | null
  children?: ReactNode
  isNewNote?: boolean
  onTitleChange?: (title: string) => void
  onContentChange?: (content: Block[]) => void
}

export function NoteContent({
  note,
  children,
  isNewNote = false,
  onTitleChange,
  onContentChange,
}: NoteContentProps) {
  const [currentTitle, setCurrentTitle] = useState(note?.title || '')
  const [currentContent, setCurrentContent] = useState<Block[]>(note?.content || EMPTY_BLOCKNOTE_CONTENT as Block[])
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Update title and content when note changes
  useEffect(() => {
    if (note) {
      setCurrentTitle(note.title)
      setCurrentContent(note.content || EMPTY_BLOCKNOTE_CONTENT as Block[])
    }
  }, [note])
  
  // Focus title input for new notes
  useEffect(() => {
    if (isNewNote && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isNewNote])

  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setCurrentTitle(newTitle)
    if (onTitleChange) {
      onTitleChange(newTitle)
    }
  }

  // Handle content changes
  const handleContentChange = (newContent: Block[]) => {
    setCurrentContent(newContent)
    if (onContentChange) {
      onContentChange(newContent)
    }
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a note to view its content, or create a new one.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-6 py-4">
        {isNewNote ? (
          <Input
            ref={titleInputRef}
            type="text"
            placeholder="Untitled Note"
            value={currentTitle}
            onChange={handleTitleChange}
            className="border-0 bg-transparent p-0 text-xl font-bold !outline-none !ring-0 placeholder:text-muted-foreground/50"
          />
        ) : (
          <h2 className="text-xl font-bold mb-2 p-2">{currentTitle}</h2>
        )}
        {children}
      </div>
      <div className="flex-grow overflow-y-auto px-2">
        <SimpleBlockNoteEditor
          initialContent={currentContent}
          onChange={handleContentChange}
          editable={isNewNote || !!note}
          className="h-full"
        />
      </div>
    </div>
  )
}