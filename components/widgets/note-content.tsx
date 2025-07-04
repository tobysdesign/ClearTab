'use client'

import type { Note } from '@/shared/schema'
import { Input } from '@/components/ui/input'
import type { YooptaContentValue } from '@yoopta/editor'
import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { SimpleEditor as Editor } from '@/components/ui/simple-editor'

// Empty content structure that matches Yoopta's types
export const EMPTY_CONTENT: YooptaContentValue = {
  'root': {
    id: 'root',
    type: 'paragraph',
    value: [{
      id: 'initial',
        type: 'paragraph',
        children: [{ text: '' }],
        props: {
          nodeType: 'block',
        },
    }],
    meta: {
      order: 0,
      depth: 0,
    },
  },
}

interface NoteContentProps {
  note: Note | null
  children?: ReactNode
  isNewNote?: boolean
  onTitleChange?: (title: string) => void
  onContentChange?: (content: YooptaContentValue) => void
}

export function NoteContent({
  note,
  children,
  isNewNote = false,
  onTitleChange,
  onContentChange,
}: NoteContentProps) {
  const [currentTitle, setCurrentTitle] = useState(note?.title || '')
  const [currentContent, setCurrentContent] = useState<YooptaContentValue>(note?.content as YooptaContentValue || EMPTY_CONTENT)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const debouncedTitleUpdate = useDebouncedCallback((title: string) => {
    onTitleChange?.(title)
  }, 1000)

  const debouncedContentUpdate = useDebouncedCallback((content: YooptaContentValue) => {
    onContentChange?.(content)
  }, 1000)

  useEffect(() => {
    if (note) {
      setCurrentTitle(note.title)
      setCurrentContent(note.content as YooptaContentValue || EMPTY_CONTENT)
    }
  }, [note])
  
  useEffect(() => {
    if (isNewNote && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isNewNote])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setCurrentTitle(newTitle)
    debouncedTitleUpdate(newTitle)
  }

  const handleContentChange = (newContent: YooptaContentValue) => {
    setCurrentContent(newContent)
    debouncedContentUpdate(newContent)
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
          <Input
          ref={titleInputRef}
          type="text"
          placeholder="Untitled Note"
          value={currentTitle}
          onChange={handleTitleChange}
          className="text-lg font-medium bg-transparent border-none shadow-none focus-visible:ring-0 px-0"
          />
        {children}
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          key={note.id?.toString()}
          value={currentContent}
          onChange={handleContentChange}
          placeholder="Start writing..."
        />
      </div>
    </div>
  )
}