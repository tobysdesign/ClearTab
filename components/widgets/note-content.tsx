'use client'

import type { Note } from '@/shared/schema'
import { Input } from '@/components/ui/input'
import { useEffect, useState, useRef, type ReactNode } from 'react'
import { Editor } from '@/components/ui/editor'
import { YooptaContentValue, EMPTY_CONTENT } from '@/shared/schema' // Import YooptaContentValue and EMPTY_CONTENT from shared/schema

interface NoteContentProps {
  note: Note | null
  children?: ReactNode
  isNewNote?: boolean
  onTitleChange?: (title: string) => void
  onContentChange?: (content: YooptaContentValue, options: any) => void // Type content as YooptaContentValue
}

export function NoteContent({
  note,
  children,
  isNewNote = false,
  onTitleChange,
  onContentChange,
}: NoteContentProps) {
  const [currentTitle, setCurrentTitle] = useState(note?.title || '')
  // Initialize content directly with YooptaContentValue
  const [currentContent, setCurrentContent] = useState<YooptaContentValue>(note?.content || EMPTY_CONTENT)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Removed: extractTextContent function

  // Update title and content when note changes
  useEffect(() => {
    if (note) {
      setCurrentTitle(note.title)
      setCurrentContent(note.content || EMPTY_CONTENT)
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

  // Handle content changes - pass YooptaContentValue directly
  const handleContentChange = (newContent: YooptaContentValue) => {
    setCurrentContent(newContent)
    if (onContentChange) {
      // YooptaOnChangeOptions might not be needed if not used internally by Editor
      onContentChange(newContent, {})
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
        <Editor
          value={currentContent}
          onChange={handleContentChange}
          editable={isNewNote || !!note}
          className="h-full"
        />
      </div>
    </div>
  )
}