'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AddButton } from '@/components/ui/add-button'
import { WidgetHeader } from '@/components/ui/widget-header'
import { WidgetContainer, WidgetContent } from '@/components/ui/widget-container'
import { SimpleBlockNoteEditor } from '@/components/ui/simple-block-note-editor'
import { EMPTY_BLOCKNOTE_CONTENT, type Note } from '@/shared/schema'
import { useNotes } from '@/hooks/use-notes'
import { type Block, type BlockNoteEditor } from '@blocknote/core'
import { AnimatePresence } from 'framer-motion'
import { WidgetLoader } from './widget-loader'
import { EmptyState } from '@/components/ui/empty-state'
import styles from './widget.module.css'
import { NoteListItem } from './note-list-item'
import { cn } from '@/lib/utils'
import { ActionsMenu } from '@/components/ui/actions-menu'
import { useToast } from '@/components/ui/use-toast'
import { useDebounce } from '@/hooks/use-debounce'

interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode]
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  collapsed?: boolean
  onToggleCollapse: () => void
}

function ResizablePanels({
  children,
  defaultWidth = 300,
  minWidth = 120,
  maxWidth = 500,
  collapsed = false,
  onToggleCollapse,
}: ResizablePanelsProps) {
  const [currentWidth, setCurrentWidth] = useState(defaultWidth)
  const isResizing = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const collapseTriggered = useRef(false)

  useEffect(() => {
    if (!collapsed) {
      setCurrentWidth(defaultWidth)
    }
  }, [collapsed, defaultWidth])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    collapseTriggered.current = false // Reset on new drag
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseUp = () => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return
    let newWidth = e.clientX - containerRef.current.getBoundingClientRect().left
    const collapseThreshold = 90

    if (!collapseTriggered.current) {
      if (!collapsed && newWidth < collapseThreshold) {
        onToggleCollapse()
        collapseTriggered.current = true
      } else if (collapsed && newWidth > collapseThreshold) {
        onToggleCollapse()
        collapseTriggered.current = true
      }
    }

    if (!collapsed) {
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth))
      setCurrentWidth(newWidth)
    }
  }

  return (
    <div className="flex flex-row h-full w-full" ref={containerRef}>
      <div
        style={{ width: collapsed ? 60 : currentWidth }}
        className="flex-shrink-0"
      >
        {children[0]}
      </div>
      <div
        className={cn(
          'bg-border hover:bg-primary transition-colors cursor-col-resize flex-shrink-0',
          collapsed ? 'w-2' : 'w-1',
        )}
        onMouseDown={handleMouseDown}
      />
      <div className="flex-grow overflow-hidden">{children[1]}</div>
    </div>
  )
}

// Helper for deep equality check (for content)
function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function NotesWidget() {
  const { notes, createNote, updateNote, deleteNote, isLoadingNotes } = useNotes()
  const { toast } = useToast()
  const [activeNote, setActiveNote] = useState<Partial<Note> | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<BlockNoteEditor | null>(null)
  const isUpdatingEditor = useRef(false)
  const lastSavedContent = useRef<string>('')
  const lastSavedTitle = useRef<string>('')
  
  // Debug tracking for update depth
  const updateCountRef = useRef(0)
  const lastUpdateTime = useRef(Date.now())
  const activeNoteIdRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)
  const draftCounterRef = useRef(0)
  
  // Generate unique draft ID to prevent duplicate keys
  const generateDraftId = useCallback(() => {
    draftCounterRef.current += 1
    return `draft-${Date.now()}-${draftCounterRef.current}`
  }, [])
  
  // Debug function to track rapid updates (memoized to prevent recreation)
  const trackUpdate = useCallback((source: string) => {
    const now = Date.now()
    const timeDiff = now - lastUpdateTime.current
    
    if (timeDiff < 100) { // If updates happen within 100ms
      updateCountRef.current++
      if (updateCountRef.current > 10) {
        console.warn(`Potential infinite loop detected in ${source}. ${updateCountRef.current} rapid updates detected.`)
        return false // Block further updates
      }
    } else {
      updateCountRef.current = 0 // Reset counter if enough time passed
    }
    
    lastUpdateTime.current = now
    return true
  }, [])

  // Effect to track activeNote ID changes
  useEffect(() => {
    activeNoteIdRef.current = activeNote?.id || null
  }, [activeNote?.id])

  // Single effect to handle initialization and note deletion  
  useEffect(() => {
    if (isLoadingNotes) return

    // Initialize only once when notes are loaded
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      
      // Always create a blank note as the first/active note
      const blankNote = { 
        id: generateDraftId(), 
        title: '', 
        content: EMPTY_BLOCKNOTE_CONTENT as Block[] 
      }
      setActiveNote(blankNote)
      activeNoteIdRef.current = blankNote.id
      lastSavedContent.current = JSON.stringify(EMPTY_BLOCKNOTE_CONTENT)
      lastSavedTitle.current = ''
      return
    }

    // Handle case where active note was deleted
    if (activeNoteIdRef.current && !notes.some(n => n.id === activeNoteIdRef.current)) {
      if (notes.length > 0) {
        const firstNote = notes[0]
        setActiveNote(firstNote)
        activeNoteIdRef.current = firstNote.id
        lastSavedContent.current = JSON.stringify(firstNote.content || EMPTY_BLOCKNOTE_CONTENT)
        lastSavedTitle.current = firstNote.title || ''
      } else {
        // Create new draft if no notes exist
        const newNote = { 
          id: generateDraftId(), 
          title: '', 
          content: EMPTY_BLOCKNOTE_CONTENT as Block[] 
        }
        setActiveNote(newNote)
        activeNoteIdRef.current = newNote.id
        lastSavedContent.current = JSON.stringify(EMPTY_BLOCKNOTE_CONTENT)
        lastSavedTitle.current = ''
      }
    }
  }, [notes, isLoadingNotes, generateDraftId])

  // Effect to sync editor content
  useEffect(() => {
    if (!editorRef.current || !activeNote?.content) return

    const content = Array.isArray(activeNote.content) ? activeNote.content : []
    const contentStr = JSON.stringify(content)
    
    // Only update if content actually changed to prevent unnecessary updates
    if (contentStr === lastSavedContent.current) return
    
    // Add debug tracking for editor sync
    if (!trackUpdate('editor-sync')) return
    
    isUpdatingEditor.current = true
    
    try {
      editorRef.current.replaceBlocks(editorRef.current.document, content as Block[])
      lastSavedContent.current = contentStr
      lastSavedTitle.current = activeNote.title || ''
    } catch (error) {
      console.error('Failed to update editor content:', error)
    }
    
    // Use a longer timeout to ensure all editor updates are complete
    const timer = setTimeout(() => {
      isUpdatingEditor.current = false
    }, 200)
    
    return () => clearTimeout(timer)
  }, [activeNote?.id, activeNote?.content])

  const saveNote = useCallback((noteToSave: Partial<Note>, showToast = false) => {
    const isDraft = noteToSave.id?.startsWith('draft-')
    const finalNote = { ...noteToSave, title: noteToSave.title?.trim() || 'Untitled Note' }

    setIsSaving(true)

    if (isDraft) {
      createNote.mutate({ 
        ...finalNote, 
        temporaryId: finalNote.id // Pass the draft ID as temporaryId
      } as Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { temporaryId: string }, {
        onSuccess: (savedNote) => {
          setIsSaving(false)
          // Prevent editor sync during note creation by setting updating flag
          isUpdatingEditor.current = true
          setActiveNote(savedNote)
          activeNoteIdRef.current = savedNote.id
          lastSavedContent.current = JSON.stringify(savedNote.content)
          lastSavedTitle.current = savedNote.title || ''
          
          // Reset the flag after state updates settle
          setTimeout(() => {
            isUpdatingEditor.current = false
          }, 100)
          
          if (showToast) {
            toast({
              title: 'Note created',
              description: 'Your note has been saved successfully.',
            })
          }
        },
        onError: (error) => {
          setIsSaving(false)
          toast({
            title: 'Failed to create note',
            description: error.message || 'Please try again.',
            variant: 'destructive',
          })
        },
      })
    } else {
      updateNote.mutate(finalNote as Note, {
        onSuccess: () => {
          setIsSaving(false)
        },
        onError: (error) => {
          setIsSaving(false)
          toast({
            title: 'Failed to save note',
            description: error.message || 'Please try again.',
            variant: 'destructive',
          })
        },
      })
    }
  }, [createNote, updateNote, toast])

  const activeNoteRef = useRef<Partial<Note> | null>(null)
  
  // Keep activeNoteRef in sync with activeNote
  useEffect(() => {
    activeNoteRef.current = activeNote
  }, [activeNote])

  const debouncedSaveContent = useDebounce(
    (content: Block[]) => {
      const currentNote = activeNoteRef.current
      if (!currentNote) return
      
      // Check if content actually changed to prevent duplicate saves
      const contentStr = JSON.stringify(content)
      if (contentStr === lastSavedContent.current) return
      
      // console.log('Saving content for note:', currentNote.id)
      saveNote({ ...currentNote, content }, false)
    },
    2000,
    { leading: false }
  )

  const debouncedSaveTitle = useDebounce(
    (title: string) => {
      const currentNote = activeNoteRef.current
      if (!currentNote) return
      
      // Check if title actually changed to prevent duplicate saves
      const trimmedTitle = title.trim()
      if (trimmedTitle === lastSavedTitle.current) return
      
      // console.log('Saving title for note:', currentNote.id)
      saveNote({ ...currentNote, title }, false)
    },
    1000,
    { leading: false }
  )

  const handleEditorReady = useCallback((editor: BlockNoteEditor) => {
    editorRef.current = editor
  }, [])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    
    setActiveNote(prev => prev ? { ...prev, title: newTitle } : null)
    
    if (newTitle.trim() !== lastSavedTitle.current) {
      lastSavedTitle.current = newTitle.trim()
      debouncedSaveTitle(newTitle)
    }
  }, [debouncedSaveTitle]) // Removed activeNote dependency

  const handleSelectNote = useCallback(async (note: Note) => {
    // Add debug tracking
    if (!trackUpdate('handleSelectNote')) return
    
    // Save current note before switching
    if (activeNote && editorRef.current) {
      const currentContent = editorRef.current.document
      const currentTitle = activeNote.title || ''
      
      // Force save the current note if it has changes
      if (JSON.stringify(currentContent) !== lastSavedContent.current || 
          currentTitle !== lastSavedTitle.current) {
        await saveNote({ 
          ...activeNote, 
          content: currentContent, 
          title: currentTitle 
        }, false)
      }
    }
    
    // Flush any pending saves
    debouncedSaveContent.flush()
    debouncedSaveTitle.flush()
    
    setActiveNote(note)
    activeNoteIdRef.current = note.id
    lastSavedContent.current = JSON.stringify(note.content)
    lastSavedTitle.current = note.title || ''
  }, [debouncedSaveContent, debouncedSaveTitle, trackUpdate, activeNote, saveNote])

  // Save on blur/focus loss
  const handleSaveOnBlur = useCallback(() => {
    if (activeNote && editorRef.current) {
      const currentContent = editorRef.current.document
      const currentTitle = activeNote.title || ''
      
      // Force save if there are unsaved changes
      if (JSON.stringify(currentContent) !== lastSavedContent.current || 
          currentTitle !== lastSavedTitle.current) {
        saveNote({ 
          ...activeNote, 
          content: currentContent, 
          title: currentTitle 
        }, false)
      }
    }
  }, [activeNote, saveNote])

  // Add event listeners for when user clicks outside notes widget
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const notesWidget = document.querySelector('[data-widget="notes"]')
      if (notesWidget && !notesWidget.contains(event.target as Node)) {
        handleSaveOnBlur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleSaveOnBlur])

  const handleCreateNew = useCallback(() => {
    // Save current note first
    handleSaveOnBlur()
    
    debouncedSaveContent.flush()
    debouncedSaveTitle.flush()
    
    const newNote = { id: generateDraftId(), title: '', content: EMPTY_BLOCKNOTE_CONTENT as Block[] }
    setActiveNote(newNote)
    activeNoteIdRef.current = newNote.id
    lastSavedContent.current = JSON.stringify(EMPTY_BLOCKNOTE_CONTENT)
    lastSavedTitle.current = ''
  }, [debouncedSaveContent, debouncedSaveTitle, generateDraftId, handleSaveOnBlur])

  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote.mutate(noteId, {
      onError: (error) => {
        toast({
          title: 'Failed to delete note',
          description: error.message || 'Please try again.',
          variant: 'destructive',
        })
      },
    })
  }, [deleteNote, toast])

  const handleDeleteActiveNote = useCallback(() => {
    if (activeNote?.id) {
      handleDeleteNote(activeNote.id as string)
    }
  }, [activeNote?.id, handleDeleteNote])

  const handleToggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), [])

  // Memoize computed values to prevent unnecessary re-renders
  const isNewNote = useMemo(() => {
    return activeNote?.id?.startsWith('draft-') ?? false
  }, [activeNote?.id])

  const selectedNoteId = useMemo(() => activeNote?.id, [activeNote?.id])

  return (
    <WidgetContainer data-widget="notes">
      <div className="widget-flex-column widget-full-height">
        <ResizablePanels defaultWidth={300} collapsed={isCollapsed} onToggleCollapse={handleToggleCollapse}>
          {/* Notes List */}
          <div className="widget-flex-column widget-full-height widget-overflow-hidden widget-relative">
            <WidgetHeader title="Notes">
              {isSaving && (
                <div className="flex items-center mr-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1" />
                  <span className="text-xs text-gray-400">Saving...</span>
                </div>
              )}
              <AddButton onClick={handleCreateNew} />
            </WidgetHeader>
            <div className="widget-flex-1 custom-scrollbar">
              {isLoadingNotes ? <WidgetLoader /> : (
                (notes.length > 0 || activeNote) ? (
                  <div className="widget-list-content" >
                    <AnimatePresence>
                      {/* Show active note first if it's a draft (not in notes array) */}
                      {activeNote && !notes.find(n => n.id === activeNote.id) && (
                        <NoteListItem
                          key={activeNote.id}
                          note={activeNote as Note}
                          isSelected={true}
                          onClick={() => {}} // Already selected
                          onDelete={() => handleDeleteNote(activeNote.id as string)}
                          collapsed={isCollapsed}
                        />
                      )}
                      {/* Then show saved notes, but use activeNote data if it's the selected one */}
                      {notes.map((note) => {
                        const isActive = selectedNoteId === note.id
                        const displayNote = isActive && activeNote ? activeNote as Note : note
                        
                        return (
                          <NoteListItem
                            key={note.id}
                            note={displayNote}
                            isSelected={isActive}
                            onClick={() => handleSelectNote(note)}
                            onDelete={() => handleDeleteNote(note.id as string)}
                            collapsed={isCollapsed}
                          />
                        )
                      })}
                    </AnimatePresence>
                  </div>
                ) : <EmptyState title="No Notes" description="Create your first note." />
              )}
            </div>
          </div>
          {/* Note Editor */}
          <div className="widget-flex-column widget-full-height">
            {activeNote ? (
              <div className="widget-flex-column widget-full-height widget-overflow-auto custom-scrollbar bg-[#151515]">
                <div className="widget-flex-column p-4">
                  {/* Header with Title and Actions */}
                  <div className="sticky top-0 z-10 bg-[#151515] mb-4 flex items-center justify-between">
                    {/* Title Input - Tab Index 1 */}
                    <Input
                      tabIndex={1}
                      className="font-['Inter_Display'] font-medium text-[18px] leading-[22px] text-[#D2D2D2] border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1 placeholder:text-[#5c5c5c] placeholder:italic placeholder:font-medium"
                      placeholder="Untitled note"
                      value={activeNote.title || ''}
                      onChange={handleTitleChange}
                    />
                    {/* Actions Menu - Tab Index 3 */}
                    <div tabIndex={3}>
                      <ActionsMenu
                        onDelete={handleDeleteActiveNote}
                        isNewNote={isNewNote}
                      />
                    </div>
                  </div>
                  
                  {/* Content Editor - Tab Index 2 */}
                  <div className="widget-flex-1">
                    <SimpleBlockNoteEditor
                      key={activeNote.id}
                      initialContent={activeNote.content}
                      onChange={(content) => {
                        // First guard: check if we're updating programmatically
                        if (isUpdatingEditor.current) return
                        
                        // Second guard: check if activeNote exists
                        if (!activeNoteRef.current) return
                        
                        // Third guard: prevent rapid-fire updates
                        if (!trackUpdate('editor-onChange')) return
                        
                        // Fourth guard: only proceed if content actually changed
                        const currentContentStr = JSON.stringify(content)
                        if (currentContentStr !== lastSavedContent.current) {
                          lastSavedContent.current = currentContentStr
                          debouncedSaveContent(content)
                        }
                      }}
                      onEditorReady={handleEditorReady}
                      editable={true}
                      className="p-0 widget-flex-1"
                      tabIndex={2}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="widget-flex-center widget-full-height">
                <p className="text-muted-foreground">Select or create a note.</p>
              </div>
            )}
          </div>
        </ResizablePanels>
      </div>
    </WidgetContainer>
  )
} 