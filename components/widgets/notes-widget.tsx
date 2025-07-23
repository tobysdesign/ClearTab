'use client'

import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AddButton } from '@/components/ui/add-button'
import { ListHeader } from '@/components/ui/list-header'
import { SimpleBlockNoteEditor } from '@/components/ui/simple-block-note-editor'
import { EMPTY_BLOCKNOTE_CONTENT, type Note } from '@/shared/schema'
import { useNotes } from '@/hooks/use-notes'
import { Block } from '@blocknote/core'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { WidgetLoader } from './widget-loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ScrollShadows } from '@/components/ui/scroll-shadows'
import styles from './widget.module.css'
import { ActionsMenu } from '@/components/ui/actions-menu'
import { NoteListItem } from './note-list-item'
import X from 'lucide-react/dist/esm/icons/x';

// Removed all Yoopta-related content type definitions and conversion helpers.
// The ResizablePanels, NoteListItemProps, and NoteListItem components were moved here.

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
  const { notes, createNote, updateNote, deleteNote, isLoadingNotes } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isShowingDraft, setIsShowingDraft] = useState(false); // Default to false
  const [draftNote, setDraftNote] = useState<{title: string, content: any, id: string}>({
    id: 'temp-draft-' + Date.now(), // Assign a temporary unique ID
    title: '',
    content: EMPTY_BLOCKNOTE_CONTENT,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);
  const [editorTitleState, setEditorTitleState] = useState(''); // New state for input
  const [editorContentState, setEditorContentState] = useState<Block[]>([]); // State for editor content
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasModifiedDraft = useRef(false); // Track if draft has been modified
  const isInitialMount = useRef(true); // Track initial mount

  // Only show draft on initial page load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setIsShowingDraft(true);
    }
  }, []);

  const hasContent = useCallback((blocks: any): boolean => {
    if (!Array.isArray(blocks) || blocks.length === 0) return false;
    
    try {
      return blocks.some(block => {
        if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
          return block.content.some((item: any) => 
            typeof item === 'object' && item.type === 'text' && item.text && item.text.trim().length > 0
          );
        }
        return true; 
      });
    } catch (error) {
      console.error("Error checking content:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isLoadingNotes && notes.length === 0 && !isShowingDraft) {
      setIsShowingDraft(true); // Automatically show a new draft if no notes exist after loading
    }
  }, [isLoadingNotes, notes.length, isShowingDraft]);

  const handleToggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

  useEffect(() => {
    // Sync editor state from selected note
    if (selectedNote) {
      setEditorTitleState(selectedNote.title);
      setDraftNote((prev) => ({
        ...prev,
        content: selectedNote.content,
        title: selectedNote.title,
      }));
    } else if (isShowingDraft) {
      if (!draftNote.title && !editorTitleState) {
        setEditorTitleState(""); // Ensure it's truly empty if starting a new blank draft
      } else if (draftNote.title) {
        setEditorTitleState(draftNote.title);
      }
    } else {
      setEditorTitleState("");
    }

    const editorContent = selectedNote?.content || draftNote.content;
    setEditorContentState(editorContent);
  }, [selectedNote, isShowingDraft, draftNote.content, draftNote.title]);

  // Add a silent save function that doesn't affect UI
  const handleSilentSave = useCallback(async () => {
    // Don't update UI during silent saves
    const finalTitle = editorTitleState.trim() || "Untitled note";
    console.log("Silent save triggered", { 
      selectedNoteId, 
      isShowingDraft, 
      contentLength: draftNote.content?.length,
      hasModified: hasModifiedDraft.current 
    });

    try {
      // If an existing note is selected, update it silently
      if (selectedNoteId && selectedNote) {
        console.log("Updating existing note", selectedNoteId);
        // Always save the current state regardless of comparison
        updateNote.mutate({
          id: selectedNoteId,
          title: finalTitle,
          content: draftNote.content,
        });
        console.log("Update mutation triggered");
      } else if (isShowingDraft) {
        // Always try to create the note if we're showing a draft
        if (hasContent(draftNote.content)) {
          console.log("Creating new note from draft", finalTitle);
          hasModifiedDraft.current = true; // Mark as modified
          createNote.mutate({
            title: finalTitle || "Untitled note",
            content: draftNote.content,
          });
          console.log("Create mutation triggered");
        } else {
          console.log("Draft has no content, not saving");
        }
      }
    } catch (error) {
      // Silently ignore errors during auto-save
      console.log("Silent save error:", error);
    }
  }, [
    editorTitleState,
    draftNote.content,
    selectedNoteId,
    selectedNote,
    isShowingDraft,
    createNote,
    updateNote,
    hasContent
  ]);

  // Force save on component unmount and window close
  useEffect(() => {
    // Save before unmounting or closing window
    const handleBeforeUnload = () => {
      handleSilentSave();
    };

    // Save on a regular interval
    const saveInterval = setInterval(() => {
      handleSilentSave();
    }, 15000); // Save every 15 seconds

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      handleSilentSave(); // Save when component unmounts
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(saveInterval);
    };
  }, [handleSilentSave]);
  
  // Regular save with UI updates
  const handleSave = useCallback(async () => {
    const finalTitle = editorTitleState.trim() || "Untitled note";
    console.log("Full save triggered", { selectedNoteId, isShowingDraft });

    try {
      // If an existing note is selected, update it
      if (selectedNoteId && selectedNote) {
        console.log("Saving existing note:", selectedNoteId);
        // Always update to ensure content is saved
        await updateNote.mutateAsync({
          id: selectedNoteId,
          title: finalTitle,
          content: draftNote.content,
        });
        console.log("Note updated successfully");
      } else if (isShowingDraft) {
        // Only create a new note if the draft has content
        if (hasContent(draftNote.content)) {
          console.log("Creating new note from draft");
          const result = await createNote.mutateAsync({
            title: finalTitle,
            content: draftNote.content,
          });
          console.log("Note created successfully:", result);
          
          // Reset draft after saving
          hasModifiedDraft.current = false;
          const newDraftId = 'temp-draft-' + Date.now();
          setDraftNote({ 
            id: newDraftId, 
            title: '', 
            content: EMPTY_BLOCKNOTE_CONTENT 
          });
        } else {
          console.log("Draft has no content, not creating note");
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }, [
    editorTitleState,
    draftNote.content,
    selectedNoteId,
    selectedNote,
    isShowingDraft,
    createNote,
    updateNote,
    hasContent
  ]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleSave);
    return () => window.removeEventListener('beforeunload', handleSave);
  }, [handleSave]);
  
  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote.mutateAsync(noteId);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setDraftNote({ title: '', content: EMPTY_BLOCKNOTE_CONTENT, id: 'temp-draft-' + Date.now() });
      setEditorTitleState('');
    }
  }, [deleteNote, selectedNoteId]);

  // Make sure we save the right content for the right note
  const handleSelectNote = useCallback(
    async (note: Note) => {
      console.log("Selecting note:", note.id, "Current note:", selectedNoteId);
      
      try {
        // Always save the current note/draft first
        if (selectedNoteId) {
          console.log("Saving current note before switching:", selectedNoteId);
          // Save the current note explicitly to avoid any race conditions
          await updateNote.mutateAsync({
            id: selectedNoteId,
            title: editorTitleState,
            content: draftNote.content,
          });
        } else if (isShowingDraft && hasModifiedDraft.current) {
          console.log("Saving draft before switching to note:", note.id);
          if (hasContent(draftNote.content)) {
            await createNote.mutateAsync({
              title: editorTitleState || "Untitled note",
              content: draftNote.content,
            });
          }
        }
        
        // Clear all current state
        setDraftNote({ 
          id: 'temp-clear-' + Date.now(), 
          title: '', 
          content: [] 
        });
        setEditorTitleState('');
        setEditorContentState([]);
        
        // Now it's safe to switch to the new note
        console.log("Switching to note:", note.id, note.title);
        setSelectedNoteId(note.id);
        setIsShowingDraft(false);
        
        // Set new content with delay to ensure clean switch
        setTimeout(() => {
          console.log("Setting content for:", note.id, note.title);
          setEditorTitleState(note.title);
          setEditorContentState(note.content);
          setDraftNote({
            id: note.id,
            title: note.title,
            content: note.content
          });
        }, 50);
      } catch (err) {
        console.error("Error during note switch:", err);
      }
    },
    [
      selectedNoteId, 
      isShowingDraft, 
      hasModifiedDraft, 
      editorTitleState, 
      draftNote.content, 
      updateNote, 
      createNote, 
      hasContent
    ],
  );

  // Make sure new note creation is also clean
  const handleCreateNew = useCallback(async () => {
    console.log("Creating new note");
    
    try {
      // If an existing note is selected or draft has been modified, save it first
      if (selectedNoteId) {
        console.log("Saving current note before creating new:", selectedNoteId);
        await updateNote.mutateAsync({
          id: selectedNoteId,
          title: editorTitleState,
          content: draftNote.content,
        });
      } else if (isShowingDraft && hasModifiedDraft.current && hasContent(draftNote.content)) {
        console.log("Saving current draft before creating new");
        await createNote.mutateAsync({
          title: editorTitleState || "Untitled note",
          content: draftNote.content,
        });
      }
      
      // Clear all current state first
      setDraftNote({ 
        id: 'temp-clear-' + Date.now(), 
        title: '', 
        content: [] 
      });
      setEditorTitleState('');
      setEditorContentState([]);
      setSelectedNoteId(null);
      
      // Create fresh draft with slight delay to ensure clean slate
      setTimeout(() => {
        console.log("Setting up new draft");
        const newDraftId = 'temp-draft-' + Date.now();
        hasModifiedDraft.current = false; // Reset modification state
        setDraftNote({ 
          id: newDraftId, 
          title: '', 
          content: EMPTY_BLOCKNOTE_CONTENT 
        });
        setIsShowingDraft(true);
      }, 50);
    } catch (err) {
      console.error("Error during new note creation:", err);
    }
  }, [
    selectedNoteId, 
    isShowingDraft, 
    hasModifiedDraft, 
    editorTitleState, 
    draftNote.content, 
    updateNote, 
    createNote,
    hasContent
  ]);

  const handleContentChange = useCallback(
    (content: Block[]) => {
      // Always update the draftNote content, but do not trigger any UI updates or saves yet
      setDraftNote((prev) => ({ ...prev, content: content as any[] }));
      
      // Mark draft as modified if content has actual text
      if (isShowingDraft && hasContent(content)) {
        hasModifiedDraft.current = true;
      }
      
      // Auto-save content changes with a reasonable debounce
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set a new timeout to save after typing stops
      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log("Content change timeout triggered, saving...");
        // Force save regardless of state
        if (hasContent(content)) {
          handleSilentSave(); // Use silent save to avoid UI disruption
        }
      }, 2000); // 2 second debounce - balance between responsiveness and avoiding focus issues
    },
    [isShowingDraft, handleSilentSave, hasContent],
  );
  
  const handleTitleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEditorTitleState(e.target.value);
    setDraftNote((prev) => ({ ...prev, title: e.target.value }));
    
    // Mark draft as modified if title is not empty
    if (isShowingDraft && e.target.value.trim()) {
      hasModifiedDraft.current = true;
    }
  }, [isShowingDraft]);
  
  // Determine what content to show and whether it's a new note
  const isNewNote = !selectedNoteId && !isShowingDraft;
  
  // Make sure we're always using the most up-to-date content
  const editorContent = useMemo(() => {
    if (selectedNoteId && selectedNote) {
      return draftNote.content; // Use the draft content which is kept in sync with edits
    } else if (isShowingDraft) {
      return draftNote.content;
    } else {
      return EMPTY_BLOCKNOTE_CONTENT;
    }
  }, [selectedNoteId, selectedNote, isShowingDraft, draftNote.content]);
  
  const editorTitle = useMemo(() => {
    if (selectedNoteId && selectedNote) {
      return draftNote.title;
    } else if (isShowingDraft) {
      return draftNote.title;
    } else {
      return '';
    }
  }, [selectedNoteId, selectedNote, isShowingDraft, draftNote.title]);

  // Enhanced save function that handles empty new notes
  const handleSaveWithContent = useCallback((content: Block[]) => {
    // Only save if there's actual content or it's an existing note
    if (selectedNoteId || isShowingDraft || (Array.isArray(content) && hasContent(content))) {
      handleContentChange(content)
      
      // Auto-save after a delay if there's content
      if (Array.isArray(content) && hasContent(content)) {
        setTimeout(() => {
          handleSilentSave()
        }, 100) // Short delay to ensure state is updated
      }
    }
  }, [selectedNoteId, isShowingDraft, hasContent, handleContentChange, handleSilentSave])

  return (
    <div className={styles.widgetContainer}>
      <div className={styles.widgetContent}>
        <div className="flex h-full flex-col">
          <ResizablePanels
            defaultWidth={isCollapsed ? 60 : 300}
            minWidth={isCollapsed ? 60 : 120}
            maxWidth={500}
            collapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          >
            {/* First child of ResizablePanels: The notes list sidebar */}
            <div className="flex flex-col h-full overflow-hidden relative">
              <ListHeader
                title="Notes"
                className="widgetHead"
                titleClassName="widget-heading"
              >
                <AddButton onClick={handleCreateNew}>+</AddButton>
              </ListHeader>
              <ScrollShadows className="flex-1 custom-scrollbar">
                <div className="nolisty">
                  {isLoadingNotes && (
                    <div className="text-center text-muted-foreground">
                      <div className="relative w-[90px] h-[50px]">
                        <WidgetLoader />
                      </div>
                    </div>
                  )}
                  {!isLoadingNotes && notes.length === 0 && !isShowingDraft ? (
                    <EmptyState
                      renderIcon={() => <X className="h-6 w-6 text-gray-400" />}
                      title="No notes yet"
                      description="Create your first note to get started."
                    />
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {isShowingDraft && (
                          <NoteListItem
                            key={draftNote.id} /* Use draftNote's ID as key */
                            note={{
                              id: draftNote.id,
                              title: draftNote.title || 'Untitled Note', /* Changed to Untitled Note */
                              content: draftNote.content as Block[],
                              userId: '',
                              createdAt: new Date(),
                              updatedAt: new Date(),
                            }}
                            isSelected={true}
                            onClick={() => {}}
                            onDelete={() => setIsShowingDraft(false)}
                            collapsed={isCollapsed}
                          />
                        )}
                        {notes.map((note) => (
                          <NoteListItem
                            key={note.id}
                            note={note}
                            isSelected={selectedNoteId === note.id}
                            onClick={() => handleSelectNote(note)}
                            onDelete={() => handleDeleteNote(note.id as string)}
                            collapsed={isCollapsed}
                            isRecentlyUpdated={recentlyUpdatedId === note.id}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </ScrollShadows>
            </div>
            {/* Second child of ResizablePanels: The notes editor content area */}
            <div className="flex flex-col h-full">
              <ScrollArea className="h-full inner-right-shadow bg-[#151515] custom-scrollbar">
                <div className="h-full flex flex-col p-4">
                  <div className="flex justify-between items-center mb-4 sticky top-0 z-10 bg-[#151515] pb-2">
                    <Input
                      className="font-['Inter_Display'] font-medium text-[18px] leading-[22px] text-[#D2D2D2] border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1 placeholder:text-[#8D8D8D] placeholder:italic"
                      placeholder="Untitled note"
                      value={editorTitleState}
                      onChange={handleTitleChange}
                    />
                    <div className="flex items-center gap-2 ml-2">
                      <ActionsMenu
                        onDelete={() => {
                          if (selectedNoteId) handleDeleteNote(selectedNoteId);
                          else if (isShowingDraft) setIsShowingDraft(false);
                        }}
                        isNewNote={isNewNote}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <SimpleBlockNoteEditor
                      key={selectedNoteId || 'new-draft-editor'}
                      initialContent={editorContent}
                      onChange={handleContentChange}
                      editable={true}
                      className="p-0 flex-1"
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
          </ResizablePanels>
        </div>
      </div>
    </div>
  );
} 