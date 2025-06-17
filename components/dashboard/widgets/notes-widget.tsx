'use client'

import { useState, useEffect, useMemo } from 'react'
import YooptaEditor, { createYooptaEditor, YooptaContentValue } from '@yoopta/editor'
import Paragraph from '@yoopta/paragraph'
import Blockquote from '@yoopta/blockquote'
import Headings from '@yoopta/headings'
import Lists from '@yoopta/lists'
import { Bold, Italic, CodeMark, Underline, Strike } from '@yoopta/marks'
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon, DotsHorizontalIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { Note } from '@/shared/schema'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'

// Enhanced plugins setup with dark theme styling
const plugins = [
  Paragraph.extend({
    options: {
      placeholder: 'Type / to see commands...',
    },
  }),
  Headings.HeadingOne,
  Headings.HeadingTwo, 
  Headings.HeadingThree,
  Blockquote,
  Lists.BulletedList,
  Lists.NumberedList,
]

// Marks for text formatting
const marks = [Bold, Italic, CodeMark, Underline, Strike]

// Tools configuration with dark theme
const TOOLS = {
  Toolbar: {
    tool: Toolbar,
    render: DefaultToolbarRender,
  },
}

// Dark theme configuration for YooptaEditor
const EDITOR_THEME = {
  colors: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    background: '#09090b',
    surface: '#18181b',
    border: '#27272a',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    accent: '#3b82f6',
  },
  fontFamily: 'Inter, system-ui, sans-serif',
}

function getInitials(title: string) {
  const words = title.split(' ')
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return title.substring(0, 2).toUpperCase()
}

export function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Create editor instance with dark theme
  const editor = useMemo(() => {
    console.log('Creating YooptaEditor instance...')
    try {
      const editorInstance = createYooptaEditor()
      console.log('YooptaEditor instance created successfully:', editorInstance)
      return editorInstance
    } catch (error) {
      console.error('Error creating YooptaEditor instance:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    async function fetchNotes() {
      try {
        const response = await fetch('/api/notes')
        if (!response.ok) throw new Error('Failed to fetch notes')
        const data = await response.json()
        setNotes(data)
        if (data.length > 0) {
          const sortedNotes = [...data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          setSelectedNoteId(sortedNotes[0].id)
        }
      } catch (error) {
        console.error(error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred.')
      }
    }
    fetchNotes()
  }, [])

  const selectedNote = notes.find((note) => note.id === selectedNoteId)

  function handleNoteChange(value: YooptaContentValue) {
    if (!selectedNoteId) return
    
    console.log('Note content changed:', value)
    
    // Update local state immediately
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === selectedNoteId ? { ...note, content: value } : note
      )
    )
    
    // Save to API (we'll add debouncing later)
    saveNoteContent(selectedNoteId, { content: value })
  }

  function handleTitleChange(title: string) {
    if (!selectedNoteId) return
    
    console.log('Note title changed:', title)
    
    // Update local state immediately
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === selectedNoteId ? { ...note, title } : note
      )
    )
    
    // Save to API
    saveNoteContent(selectedNoteId, { title })
  }

  async function saveNoteContent(noteId: number, updates: { title?: string; content?: YooptaContentValue }) {
    try {
      console.log('Saving note updates to API:', { noteId, updates })
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        console.error('Failed to save note updates')
      } else {
        console.log('Note updates saved successfully')
      }
    } catch (error) {
      console.error('Error saving note updates:', error)
    }
  }

  async function handleAddNote() {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: {},
        }),
      })
      if (!response.ok) throw new Error('Failed to create note')
      const newNote: Note = await response.json()
      setNotes((prev) => [...prev, newNote])
      setSelectedNoteId(newNote.id)
    } catch (error) {
      console.error(error)
    }
  }

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center border border-border">
        <p className="text-red-500">{error}</p>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col border border-border">
       <PanelGroup direction="horizontal" className="flex-1">
        <Panel
          collapsible
          collapsedSize={4}
          minSize={15}
          defaultSize={33}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
          className={cn("transition-all duration-300 ease-in-out", isCollapsed ? 'min-w-[56px] max-w-[56px]' : 'min-w-[200px]')}
        >
          <div className="h-full flex flex-col">
            <CardHeader className={cn("flex flex-row items-center justify-between flex-shrink-0", isCollapsed ? "p-2 justify-center" : "px-6 pt-6 pb-1.5")}>
              {!isCollapsed && <CardTitle>Notes</CardTitle>}
              <Button variant="ghost" size="icon" onClick={handleAddNote}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-2 overflow-hidden flex-grow relative">
              <div className="h-full overflow-y-auto">
                                <div className="space-y-2">
                  {notes.map((note) => 
                    isCollapsed ? (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNoteId(note.id)}
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
                        onClick={() => setSelectedNoteId(note.id)}
                        className={cn(
                          'group relative p-4 rounded-xl cursor-pointer transition-all duration-300',
                          selectedNoteId === note.id
                            ? 'bg-neutral-800 shadow-lg shadow-neutral-900/50'
                            : 'bg-neutral-900 hover:bg-neutral-800/90 hover:shadow-lg hover:shadow-neutral-900/50'
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg text-foreground truncate">
                            {note.title}
                          </h3>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DotsHorizontalIcon />
                          </Button>
                        </div>
                        <p className="text-sm text-neutral-400 truncate">
                          No preview available.
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </Panel>
        <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors" />
        <Panel className="p-4 overflow-y-auto">
          {selectedNote ? (
            <div className="h-full flex flex-col">
              {/* Title Input */}
              <div className="mb-4">
                <Input
                  value={selectedNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Note title..."
                  className="text-xl font-semibold"
                />
              </div>
              
              {/* Block Editor with Dark Theme */}
              <div className="flex-1 yoopta-dark-theme">
                <YooptaEditor
                  editor={editor}
                  plugins={plugins}
                  marks={marks}
                  tools={TOOLS}
                  value={selectedNote.content as YooptaContentValue || {}}
                  onChange={handleNoteChange}
                  placeholder="Start typing or press / for commands..."
                  className="yoopta-editor-dark h-full"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    padding: '16px',
                    backgroundColor: 'transparent',
                    color: '#fafafa',
                    '--yoopta-primary-color': '#ffffff',
                    '--yoopta-secondary-color': '#a1a1aa',
                    '--yoopta-background-color': 'transparent',
                    '--yoopta-surface-color': 'transparent',
                    '--yoopta-border-color': '#27272a',
                    '--yoopta-text-color': '#fafafa',
                    '--yoopta-text-secondary-color': '#a1a1aa',
                  } as React.CSSProperties}
                  key={selectedNote.id} // Force re-render when switching notes
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {notes.length > 0 ? 'Select a note' : 'Create a new note'}
            </div>
          )}
        </Panel>
       </PanelGroup>
    </Card>
  )
} 