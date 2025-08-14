'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
import { api } from '@/lib/api-client'

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
          collapsed ? 'w-[1px]' : 'w-[1px]',
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
  const { notes, createNote, updateNote, deleteNote, isLoadingNotes, loadNotes, updateNoteOptimistic } = useNotes()
  const { toast } = useToast()
  const [activeNote, setActiveNote] = useState<Partial<Note> | null>(null)
  const [displayTitle, setDisplayTitle] = useState<string>('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<BlockNoteEditor | null>(null)
  const isUpdatingEditor = useRef(false)
  const lastSavedContent = useRef<string>('')
  const lastSavedTitle = useRef<string>('')
  
  const activeNoteIdRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)
  const draftCounterRef = useRef(0)
  
  // Generate unique draft ID to prevent duplicate keys
  const generateDraftId = useCallback(() => {
    draftCounterRef.current += 1
    return `draft-${Date.now()}-${draftCounterRef.current}`
  }, [])

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

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
      setDisplayTitle('')
      activeNoteIdRef.current = blankNote.id
      lastSavedContent.current = JSON.stringify(EMPTY_BLOCKNOTE_CONTENT)
      lastSavedTitle.current = ''
      return
    }

    // Handle case where active note was deleted
    // Only check for deletion if the active note is a saved note (not a draft)
    if (activeNoteIdRef.current && 
        !activeNoteIdRef.current.startsWith('draft-') && 
        !notes.some(n => n.id === activeNoteIdRef.current)) {
      // If the active saved note was deleted, create a new blank note
      const newNote = { 
        id: generateDraftId(), 
        title: '', 
        content: EMPTY_BLOCKNOTE_CONTENT as Block[] 
      }
      setActiveNote(newNote)
      setDisplayTitle('')
      activeNoteIdRef.current = newNote.id
      lastSavedContent.current = JSON.stringify(EMPTY_BLOCKNOTE_CONTENT)
      lastSavedTitle.current = ''
    }
  }, [notes, isLoadingNotes, generateDraftId])

  // Effect to sync editor content
  useEffect(() => {
    if (!editorRef.current || !activeNote?.content) return

    const content = Array.isArray(activeNote.content) ? activeNote.content : []
    const contentStr = JSON.stringify(content)
    
    // Only update if content actually changed to prevent unnecessary updates
    if (contentStr === lastSavedContent.current) return
    
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

  const activeNoteRef = useRef<Partial<Note> | null>(null)
  
  // Keep activeNoteRef in sync with activeNote
  useEffect(() => {
    activeNoteRef.current = activeNote
  }, [activeNote])

  // Save note function (must be defined before debouncedSave)
  const saveNote = useCallback(async (noteToSave: Partial<Note>, showToast = false) => {
    // Prevent saving if already saving or if note doesn't exist
    if (isSaving || !noteToSave?.id) return
    
    const isDraft = noteToSave.id?.startsWith('draft-')
    const finalNote = { ...noteToSave, title: noteToSave.title?.trim() || 'Untitled Note' }

    setIsSaving(true)

    try {
      if (isDraft) {
        const savedNote = await createNote.mutate({ 
          ...finalNote, 
          temporaryId: finalNote.id // Pass the draft ID as temporaryId
        } as Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { temporaryId: string })
        
        // Update the active note to the saved version
        setActiveNote({ 
          id: savedNote.id, // Use the real saved ID
          title: savedNote.title,
          content: savedNote.content
        })
        setDisplayTitle(savedNote.title || '')
        activeNoteIdRef.current = savedNote.id
        lastSavedContent.current = JSON.stringify(savedNote.content)
        lastSavedTitle.current = savedNote.title || ''
        
        if (showToast) {
          toast({
            title: 'Note created',
            description: 'Your note has been saved successfully.',
          })
        }
      } else {
        const savedNote = await updateNote.mutate(finalNote as Note)
        // Update tracking refs
        lastSavedContent.current = JSON.stringify(savedNote.content)
        lastSavedTitle.current = savedNote.title || ''
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      toast({
        title: isDraft ? 'Failed to create note' : 'Failed to save note',
        description: (error as Error).message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }, [createNote, updateNote, toast, isSaving])

  // Auto-save function with client-side debouncing (standard pattern)
  const debouncedSave = useDebounce(
    useCallback(async (noteData: Partial<Note>) => {
      if (!noteData?.id || !activeNoteRef.current) return
      
      const isDraft = noteData.id?.startsWith('draft-')
      
      if (isDraft) {
        // Create new note from draft
        await saveNote(noteData, false)
      } else {
        // Update existing note
        try {
          const response = await api.put('/api/notes', {
            noteId: noteData.id,
            title: noteData.title,
            content: noteData.content
          })
          
          if (!response.ok) {
            throw new Error('Failed to update note')
          }
        } catch (error) {
          console.error('Failed to update note:', error)
        }
      }
    }, [saveNote, loadNotes]), // Add dependencies
    1000 // 1 second debounce
  )

  const handleEditorReady = useCallback((editor: BlockNoteEditor) => {
    editorRef.current = editor
  }, [])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    
    if (!activeNoteRef.current) return
    
    // Update display title immediately (no editor re-render)
    setDisplayTitle(newTitle)
    
    // Update ref directly without triggering note re-render
    const updatedNote = { ...activeNoteRef.current, title: newTitle }
    activeNoteRef.current = updatedNote
    
    // Optimistically update the note in the list immediately
    if (!updatedNote.id?.startsWith('draft-')) {
      updateNoteOptimistic(updatedNote.id, { title: newTitle })
    }
    
    // Trigger auto-save with debouncing (defensive check)
    if (debouncedSave) {
      debouncedSave(updatedNote)
    }
  }, [debouncedSave, updateNoteOptimistic])

  const handleSelectNote = useCallback((note: Note) => {
    setActiveNote(note)
    setDisplayTitle(note.title || '')
    activeNoteIdRef.current = note.id
    lastSavedContent.current = JSON.stringify(note.content)
    lastSavedTitle.current = note.title || ''
    
    // Sync editor content without re-rendering
    if (editorRef.current) {
      isUpdatingEditor.current = true
      try {
        editorRef.current.replaceBlocks(editorRef.current.document, (note.content || EMPTY_BLOCKNOTE_CONTENT) as Block[])
      } catch (error) {
        console.error('Failed to update editor content:', error)
      }
      setTimeout(() => {
        isUpdatingEditor.current = false
      }, 100)
    }
  }, [])

  // Force immediate save on blur (bypasses debouncing)
  const handleSaveOnBlur = useCallback(() => {
    if (!activeNote || !editorRef.current) return
    
    const currentContent = editorRef.current.document
    const currentTitle = activeNote.title || ''
    
    // Check if content actually changed before saving
    const contentStr = JSON.stringify(currentContent)
    if (contentStr !== lastSavedContent.current || currentTitle !== lastSavedTitle.current) {
      // Cancel any pending debounced saves and save immediately
      debouncedSave.cancel()
      
      const isDraft = activeNote.id?.startsWith('draft-')
      const noteToSave = { 
        ...activeNote, 
        content: currentContent, 
        title: currentTitle 
      }
      
      if (isDraft) {
        saveNote(noteToSave, false)
      } else {
        // Immediate save without debouncing
        api.put('/api/notes', {
          noteId: noteToSave.id,
          title: noteToSave.title,
          content: noteToSave.content
        }).catch(error => {
          console.error('Failed to save note on blur:', error)
        })
      }
    }
  }, [activeNote, debouncedSave, saveNote])

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
    // Save current note first (immediate save)
    handleSaveOnBlur()
    
    const newNote = { id: generateDraftId(), title: '', content: EMPTY_BLOCKNOTE_CONTENT as Block[] }
    setActiveNote(newNote)
    setDisplayTitle('')
    activeNoteIdRef.current = newNote.id
    lastSavedContent.current = JSON.stringify(EMPTY_BLOCKNOTE_CONTENT)
    lastSavedTitle.current = ''
  }, [generateDraftId, handleSaveOnBlur])

  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await deleteNote.mutate(noteId)
    } catch (error) {
      toast({
        title: 'Failed to delete note',
        description: (error as Error).message || 'Please try again.',
        variant: 'destructive',
      })
    }
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

  // Ensure only one note is selected at a time
  useEffect(() => {
    if (activeNote?.id) {
      // Clear any other selected notes
      // setSidebarNote(prev => prev && prev.id === activeNote.id ? prev : null) // Removed sidebar state
    }
  }, [activeNote?.id])

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
                  <span className="text-xs text-white/40">Saving...</span>
                </div>
              )}
              <AddButton onClick={handleCreateNew} />
            </WidgetHeader>
            <div className="widget-flex-1 custom-scrollbar">
              {isLoadingNotes ? <WidgetLoader /> : (
                (notes.length > 0 || activeNote) ? (
                  <div className="widget-list-content" >
                    <AnimatePresence>
                      {/* Show the active draft note (should be only one) */}
                      {activeNote && activeNote.id?.startsWith('draft-') && (
                        <>
                          <NoteListItem
                            key={activeNote.id}
                            note={activeNote as Note}
                            isSelected={true}
                            onClick={() => {}} // Already selected
                            onDelete={() => handleDeleteNote(activeNote.id as string)}
                            collapsed={isCollapsed}
                          />
                        </>
                      )}
                      {/* Then show all saved notes */}
                      {notes.map((note) => {
                        // Check if this saved note is the currently active note
                        const isActive = activeNote?.id === note.id && !activeNote?.id?.startsWith('draft-')
                        
                        return (
                          <NoteListItem
                            key={note.id}
                            note={note}
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
                      value={displayTitle} // Use separate display title state
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
                      key={`editor-${activeNoteIdRef.current}`} // Use stable ID from ref
                      initialContent={activeNote?.content || EMPTY_BLOCKNOTE_CONTENT}
                      onChange={(content) => {
                        // First guard: check if we're updating programmatically
                        if (isUpdatingEditor.current) {
                          return
                        }
                        
                        // Second guard: check if activeNote exists
                        if (!activeNoteRef.current) {
                          return
                        }
                        
                        // Update activeNoteRef directly instead of triggering re-render
                        const updatedNote = { ...activeNoteRef.current, content }
                        activeNoteRef.current = updatedNote
                        
                        // Optimistically update the note in the list immediately
                        if (!updatedNote.id?.startsWith('draft-')) {
                          updateNoteOptimistic(updatedNote.id, { content })
                        }
                        
                        // Trigger auto-save with debouncing (defensive check)
                        if (debouncedSave) {
                          debouncedSave(updatedNote)
                        }
                      }}
                      onEditorReady={handleEditorReady}
                      editable={true}
                      className="p-0 widget-flex-1"
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