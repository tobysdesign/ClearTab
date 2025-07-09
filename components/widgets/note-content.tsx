'use client'

import type { Note } from '@/shared/schema'
import { Input } from '@/components/ui/input'
import { useEffect, useState, useRef, type ReactNode } from 'react'
import { Editor } from '@/components/ui/editor'

// Define empty content constant for compatibility
const EMPTY_CONTENT = ''

interface NoteContentProps {
  note: Note | null
  children?: ReactNode
  isNewNote?: boolean
  onTitleChange?: (title: string) => void
  onContentChange?: (content: any, options: any) => void
}

export function NoteContent({
  note,
  children,
  isNewNote = false,
  onTitleChange,
  onContentChange,
}: NoteContentProps) {
  const [currentTitle, setCurrentTitle] = useState(note?.title || '')
  const [currentContent, setCurrentContent] = useState<string>(extractTextContent(note?.content) || EMPTY_CONTENT)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Extract text content from structured content
  function extractTextContent(content: any): string {
    if (!content) return '';
    
    try {
      // If it's already a string, return it
      if (typeof content === 'string') return content;
      
      // If it's an object, try to extract text
      if (typeof content === 'object') {
        // For Yoopta-style content objects
        if (content['paragraph-1'] && content['paragraph-1'].value) {
          let extractedText = '';
          
          Object.values(content).forEach((block: any) => {
            if (block.value && Array.isArray(block.value)) {
              block.value.forEach((element: any) => {
                if (element.children) {
                  element.children.forEach((child: any) => {
                    extractedText += typeof child === 'string' ? child : (child.text || '');
                  });
                }
              });
              extractedText += '\n';
            }
          });
          
          return extractedText;
        }
      }
      
      // Fallback to string representation
      return String(content);
    } catch (error) {
      console.error("Error extracting text content:", error);
      return '';
    }
  }

  // Update title and content when note changes
  useEffect(() => {
    if (note) {
      setCurrentTitle(note.title)
      setCurrentContent(extractTextContent(note.content) || EMPTY_CONTENT)
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
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent)
    if (onContentChange) {
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