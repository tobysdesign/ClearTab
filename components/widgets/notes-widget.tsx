'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Plus, GripVertical, FileText, Trash2, MoreHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import type { Note, YooptaContentValue } from '@/shared/schema'
import { ListHeader } from '@/components/ui/list-header'
import { WidgetLoader } from './widget-loader'
import { useNotes } from '@/hooks/use-notes'
import { useDebouncedCallback } from 'use-debounce'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

// Utility functions to convert between string and Yoopta format
function yooptaToString(content: YooptaContentValue): string {
  try {
    if (!content?.root?.value) return ''
    return content.root.value
      .map(block => block.children?.[0]?.text || '')
      .join('\n')
  } catch {
    return ''
  }
}

function stringToYoopta(text: string): YooptaContentValue {
  const blocks = text.split('\n').map((line, index) => ({
    id: `block-${index}`,
    type: 'paragraph',
    children: [{ text: line }],
    props: { nodeType: 'block' },
  }))

  return {
    root: {
      id: 'root',
      type: 'paragraph',
      value: blocks,
      meta: { order: 0, depth: 0 },
    },
  }
}

function getContentPreview(content: YooptaContentValue | string): string {
  const text = typeof content === 'string' ? content : yooptaToString(content)
  return text.slice(0, 50) + (text.length > 50 ? '...' : '')
}

// Block editor component with contextual actions
interface BlockEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

function BlockEditor({ content, onChange, placeholder = 'Start writing...' }: BlockEditorProps) {
  const [localContent, setLocalContent] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync with external content changes
  useEffect(() => {
    setLocalContent(content)
  }, [content])

  // Handle content changes with debouncing
  const debouncedOnChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (newContent: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        onChange(newContent)
      }, 300) // Debounce onChange calls
    }
  }, [onChange])

  const handleChange = useCallback((newContent: string) => {
    setLocalContent(newContent)
    debouncedOnChange(newContent)
  }, [debouncedOnChange])

  // Auto-resize textarea
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    target.style.height = 'auto'
    target.style.height = target.scrollHeight + 'px'
  }, [])

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={(e) => handleChange(e.target.value)}
        onInput={handleInput}
        placeholder={placeholder}
        className="w-full resize-none border-none bg-transparent p-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:bg-secondary/20 rounded min-h-[200px]"
        style={{
          height: 'auto',
          overflow: 'hidden'
        }}
      />
    </div>
  )

}

// Resizable panels component
interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode]
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  collapsed?: boolean
}

function ResizablePanels({ 
  children, 
  defaultWidth = 300, 
  minWidth = 200, 
  maxWidth = 500,
  collapsed = false 
}: ResizablePanelsProps) {
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, minWidth, maxWidth])

  return (
    <div ref={containerRef} className="flex h-full">
      <div 
        className={cn(
          "flex-shrink-0 border-r border-border transition-all duration-200",
          collapsed ? "w-16" : ""
        )}
        style={{ width: collapsed ? 64 : sidebarWidth }}
      >
        {children[0]}
      </div>
      
      {!collapsed && (
        <div
          className="w-1 bg-border hover:bg-primary/20 cursor-col-resize transition-colors flex items-center justify-center"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {children[1]}
      </div>
    </div>
  )
}

// Note list item component
interface NoteListItemProps {
  note: Note
  isSelected: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  collapsed?: boolean
}

function NoteListItem({ note, isSelected, onClick, onDelete, collapsed = false }: NoteListItemProps) {
  const preview = getContentPreview(note.content)

  if (collapsed) {
    return (
      <Button
        variant={isSelected ? "secondary" : "ghost"}
        size="sm"
        className="w-full h-12 p-2 justify-center"
        onClick={onClick}
      >
        <FileText className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors border group relative",
        isSelected 
          ? "bg-secondary border-primary/20" 
          : "hover:bg-secondary/50 border-transparent"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{note.title}</h4>
          <p className="text-xs text-muted-foreground truncate mt-1 whitespace-nowrap overflow-hidden">{preview}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete}>
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export function NotesWidget() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [draftNote, setDraftNote] = useState({ title: 'Untitled', content: '' })
  const [localNotes, setLocalNotes] = useState<Record<string, { title: string; content: string }>>({})
  const [collapsed, setCollapsed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { 
    notes, 
    isLoadingNotes, 
    createNote: createNoteMutation, 
    updateNote: updateNoteMutation, 
    deleteNote: deleteNoteMutation 
  } = useNotes()

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        setCollapsed(width < 600) // Collapse at 600px
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Debounced API calls (NOT UI updates)
  const debouncedSaveDraft = useDebouncedCallback(async (title: string, content: string) => {
    if (title.trim() || content.trim()) {
      try {
        const newNote = await createNoteMutation.mutateAsync({ 
          title, 
          content: stringToYoopta(content) 
        })
        setSelectedNoteId(newNote.id)
        setDraftNote({ title: 'Untitled', content: '' })
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    }
  }, 2000, { leading: false, trailing: true })

  const debouncedUpdate = useDebouncedCallback((id: string, data: Partial<Note>) => {
    updateNoteMutation.mutate({ id, ...data })
  }, 1000, { leading: false, trailing: true })

  // Get current note data (local or server)
  const getCurrentNote = useCallback((noteId: string) => {
    if (!noteId) return null
    const serverNote = notes.find(note => note.id === noteId)
    const localData = localNotes[noteId]
    
    if (localData && serverNote) {
      return {
        ...serverNote,
        title: localData.title,
        content: stringToYoopta(localData.content)
      }
    }
    
    return serverNote
  }, [notes, localNotes])

  const handleCreateNote = async () => {
    try {
      const newNote = await createNoteMutation.mutateAsync({
        title: 'Untitled Note',
        content: stringToYoopta('')
      })
      setSelectedNoteId(newNote.id)
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  // Immediate UI updates with debounced API calls
  const handleDraftTitleChange = useCallback((title: string) => {
    setDraftNote(prev => {
      const newDraft = { ...prev, title }
      debouncedSaveDraft(newDraft.title, newDraft.content)
      return newDraft
    })
  }, [debouncedSaveDraft])

  const handleDraftContentChange = useCallback((content: string) => {
    setDraftNote(prev => {
      const newDraft = { ...prev, content }
      debouncedSaveDraft(newDraft.title, newDraft.content)
      return newDraft
    })
  }, [debouncedSaveDraft])

  const handleNoteTitleChange = useCallback((title: string) => {
    if (selectedNoteId) {
      // Update local state immediately
      setLocalNotes(prev => ({
        ...prev,
        [selectedNoteId]: {
          ...prev[selectedNoteId],
          title,
          content: prev[selectedNoteId]?.content || ''
        }
      }))
      
      // Debounce API call
      debouncedUpdate(selectedNoteId, { title })
    }
  }, [selectedNoteId, debouncedUpdate])

  const handleNoteContentChange = useCallback((content: string) => {
    if (selectedNoteId) {
      // Update local state immediately
      setLocalNotes(prev => ({
        ...prev,
        [selectedNoteId]: {
          title: prev[selectedNoteId]?.title || '',
          content
        }
      }))
      
      // Debounce API call
      debouncedUpdate(selectedNoteId, { content: stringToYoopta(content) })
    }
  }, [selectedNoteId, debouncedUpdate])

  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNoteMutation.mutate(noteId)
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null)
    }
    // Remove from local state
    setLocalNotes(prev => {
      const newState = { ...prev }
      delete newState[noteId]
      return newState
    })
  }, [selectedNoteId, deleteNoteMutation])

  const selectedNote = selectedNoteId ? getCurrentNote(selectedNoteId) : null
  const isShowingDraft = !selectedNoteId

  // Memoize draft note object to prevent unnecessary re-renders
  const draftNoteObject = useMemo(() => ({
    id: 'draft', 
    title: draftNote.title, 
    content: stringToYoopta(draftNote.content),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: ''
  }), [draftNote.title, draftNote.content])

  if (isLoadingNotes) {
    return <WidgetLoader minHeight="h-[400px]" />
  }

    return (
    <Card ref={containerRef} className="dashCard h-full">
      <ResizablePanels collapsed={collapsed}>
        {/* Sidebar */}
        <div className="flex flex-col h-full">
          <ListHeader 
            title={collapsed ? "" : "Notes"} 
            className="p-4 flex-shrink-0"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateNote}
              disabled={createNoteMutation.isPending}
              className="h-8 w-8"
          >
              <Plus className="h-4 w-4" />
          </Button>
      </ListHeader>
          
            <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {/* Draft note always visible */}
              <div className="group">
                <NoteListItem
                  note={draftNoteObject}
                  isSelected={isShowingDraft}
                  onClick={() => setSelectedNoteId(null)}
                  onDelete={(e) => { 
                    e.stopPropagation(); 
                    setDraftNote({ title: 'Untitled', content: '' }); 
                  }}
                  collapsed={collapsed}
                />
              </div>
              
              {/* Saved notes */}
              {notes.length > 0 ? (
                notes.map((note) => {
                  const displayNote = getCurrentNote(note.id as string) || note
                  return (
                    <div key={note.id} className="group">
                      <NoteListItem
                        note={displayNote}
                        isSelected={selectedNoteId === note.id}
                        onClick={() => setSelectedNoteId(note.id as string)}
                        onDelete={(e) => { 
                          e.stopPropagation(); 
                          handleDeleteNote(note.id as string); 
                        }}
                        collapsed={collapsed}
                      />
                    </div>
                  )
                })
              ) : (
                !collapsed && (
                  <div className="text-center py-8 px-2">
                    <p className="text-xs text-muted-foreground">
                      No saved notes yet. Start writing in the draft above.
                    </p>
                  </div>
                )
              )}
              </div>
            </ScrollArea>
        </div>

        {/* Main content */}
        <div className="flex flex-col h-full">
          {isShowingDraft ? (
            <>
              <div className="p-4 border-b border-border">
                <Input
                  value={draftNote.title}
                  onChange={(e) => handleDraftTitleChange(e.target.value)}
                  placeholder="Note title..."
                  className="text-lg font-medium bg-transparent border-none shadow-none focus-visible:ring-0 px-0"
                />
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <BlockEditor
                  content={draftNote.content}
                  onChange={handleDraftContentChange}
                  placeholder="Start writing your note..."
                />
              </div>
            </>
          ) : selectedNote ? (
            <>
              <div className="p-4 border-b border-border">
                <Input
                  value={localNotes[selectedNote.id as string]?.title ?? selectedNote.title}
                  onChange={(e) => handleNoteTitleChange(e.target.value)}
                  placeholder="Note title..."
                  className="text-lg font-medium bg-transparent border-none shadow-none focus-visible:ring-0 px-0"
                />
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <BlockEditor
                  content={localNotes[selectedNote.id as string]?.content ?? yooptaToString(selectedNote.content)}
                  onChange={handleNoteContentChange}
                  placeholder="Start writing your note..."
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="No note selected"
              description="Select a note from the sidebar to view and edit it, or start writing in the draft note."
              className="h-full"
            />
            )}
        </div>
      </ResizablePanels>
    </Card>
  )
} 