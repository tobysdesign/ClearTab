'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Plus, GripVertical, FileText, Trash2, MoreHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import type { Note } from '@/shared/schema'
import { ListHeader } from '@/components/ui/list-header'
import { useNotes } from '@/hooks/use-notes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Editor } from '@/components/ui/editor'
import { ActionsMenu } from '@/components/ui/actions-menu'
import { motion, AnimatePresence } from 'framer-motion'

// Define types for content structure
interface ContentBlock {
  id: string;
  type: string;
  value: Array<{
    id: string;
    type: string;
    children: Array<{ text: string } | string>;
    props: { nodeType: string };
  }>;
  meta: { order: number; depth: number };
}

interface ContentValue {
  [key: string]: ContentBlock;
}

// Utility functions to convert between string and content format
// Convert structured content to string
function contentToString(content: ContentValue): string {
  try {
    if (!content) return '';
    
    // If it's already a string, return it
    if (typeof content === 'string') return content;
    
    // If it's a Yoopta-style content object
    if (typeof content === 'object') {
      // Try to extract text from children
      let extractedText = '';
      
      // Handle different content formats
      if (content['paragraph-1'] && content['paragraph-1'].value) {
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
    console.error("Error converting content to string:", error);
    return '';
  }
}

// Convert string to structured content
function stringToContent(text: string): ContentValue {
  if (!text) {
    return createEmptyContent();
  }
  
  try {
    // Check if it's already a content object
    if (typeof text === 'object') {
      return validateContent(text);
    }
    
    // Create a new content structure
    const paragraphs = text.split('\n');
    const content: ContentValue = {};
    
    paragraphs.forEach((paragraph, index) => {
      if (!paragraph.trim()) return; // Skip empty paragraphs
      
      const blockId = `paragraph-${index + 1}`;
      content[blockId] = {
        id: blockId,
    type: 'paragraph',
        value: [{
          id: `text-${index + 1}`,
          type: 'text',
          children: [{
            text: paragraph
          }],
          props: {
            nodeType: 'paragraph'
          }
        }],
        meta: {
          order: index + 1,
          depth: 0
        }
      };
    });
    
    // If no paragraphs were created, return an empty content
    if (Object.keys(content).length === 0) {
      return createEmptyContent();
    }
    
    return content;
  } catch (error) {
    console.error("Error converting string to content:", error);
    return createEmptyContent();
  }
}

// Get a preview of the content for display in the list
function getContentPreview(content: ContentValue | any): string {
  try {
    // If content is empty or undefined
    if (!content) return '';
    
    // If it's already a string, return a preview of it
    if (typeof content === 'string') {
      return content.substring(0, 100);
    }
    
    // Extract text from content object
    const text = contentToString(content);
    return text.substring(0, 100);
  } catch (error) {
    console.error("Error getting content preview:", error);
    return '';
  }
}

function createEmptyContent(): ContentValue {
  return {
    'paragraph-1': {
      id: 'paragraph-1',
      type: 'paragraph',
      value: [{
        id: 'text-1',
        type: 'text',
        children: [{ text: '' }],
        props: { nodeType: 'paragraph' }
      }],
      meta: { order: 1, depth: 0 }
    }
  };
}

// Migration function to handle legacy content formats
function migrateContentFormat(content: any): ContentValue {
  try {
    // Handle null or undefined content
    if (!content) {
      return createEmptyContent()
    }

    // If it's already in the correct format (flat object with block IDs)
    if (typeof content === 'object' && !content.root && !content.initial) {
      // Validate each block has required properties
      let hasValidBlocks = false
      const validContent: ContentValue = {}
      
      Object.entries(content).forEach(([key, block]: [string, any]) => {
        if (block && block.id && block.type && block.value && Array.isArray(block.value) && block.meta) {
          validContent[key] = block as ContentBlock
          hasValidBlocks = true
        }
      })
      
      return hasValidBlocks ? validContent : createEmptyContent()
    }

    // Handle legacy 'root' format
    if (content.root && Array.isArray(content.root)) {
      const migrated: ContentValue = {}
      content.root.forEach((block: any, index: number) => {
        const blockId = block.id || `paragraph-${index + 1}`
        migrated[blockId] = {
          id: blockId,
          type: block.type || 'paragraph',
          value: block.children ? [{
            id: `${blockId}-element`,
            type: block.type || 'paragraph',
            children: block.children,
            props: block.props || { nodeType: 'block' },
          }] : [{
            id: `${blockId}-element`,
            type: 'paragraph',
            children: [{ text: '' }],
            props: { nodeType: 'block' },
          }],
          meta: block.meta || { order: index, depth: 0 },
        }
      })
      return Object.keys(migrated).length > 0 ? migrated : createEmptyContent()
    }

    // Handle legacy 'initial' format  
    if (content.initial && Array.isArray(content.initial)) {
      const migrated: ContentValue = {}
      content.initial.forEach((block: any, index: number) => {
        const blockId = block.id || `paragraph-${index + 1}`
        migrated[blockId] = {
          id: blockId,
          type: block.type || 'paragraph',
          value: block.children ? [{
            id: `${blockId}-element`,
            type: block.type || 'paragraph',
            children: block.children,
            props: block.props || { nodeType: 'block' },
          }] : [{
            id: `${blockId}-element`,
            type: 'paragraph',
            children: [{ text: '' }],
            props: { nodeType: 'block' },
          }],
          meta: block.meta || { order: index, depth: 0 },
        }
      })
      return Object.keys(migrated).length > 0 ? migrated : createEmptyContent()
    }

    // Handle single block legacy formats
    if (content.initial && !Array.isArray(content.initial)) {
      const block = content.initial
      const result: ContentValue = {
        'paragraph-1': {
          id: 'paragraph-1',
          type: block.type || 'paragraph',
          value: block.children ? [{
            id: 'paragraph-1-element',
            type: block.type || 'paragraph',
            children: block.children,
            props: block.props || { nodeType: 'block' },
          }] : [{
            id: 'paragraph-1-element',
            type: 'paragraph',
            children: [{ text: '' }],
            props: { nodeType: 'block' },
          }],
          meta: block.meta || { order: 0, depth: 0 },
        }
      }
      return result
    }

    // Fallback to empty content
    return createEmptyContent()
  } catch (error) {
    console.error('Error migrating content format:', error)
    return createEmptyContent()
  }
}

// Helper function to extract text from structured content
function extractTextFromContent(content: any): string {
  try {
    if (!content) return '';
    
    // If it's already a string, return it
    if (typeof content === 'string') return content;
    
    // If it's a Yoopta-style content object
    if (typeof content === 'object') {
      // Try to extract text from children
      let extractedText = '';
      
      // Handle different content formats
      if (content['paragraph-1'] && content['paragraph-1'].value) {
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
    console.error("Error extracting text:", error);
    return '';
  }
}

// Validate content structure and fix if needed
function validateContent(content: any): ContentValue {
  try {
    // If content is null or undefined, return empty content
    if (!content) {
      return createEmptyContent();
    }
    
    // If content is a string, convert it to structured format
    if (typeof content === 'string') {
      return stringToContent(content);
    }
    
    // If content is already a valid object, return it
    if (typeof content === 'object' && 
        Object.keys(content).length > 0 && 
        content['paragraph-1']) {
      return content as ContentValue;
    }
    
    // If we have an unknown object format, try to extract text and create new content
    const extractedText = extractTextFromContent(content);
    if (extractedText) {
      return stringToContent(extractedText);
    }
    
    // If all else fails, return empty content
    return createEmptyContent();
  } catch (error) {
    console.error("Error validating content:", error);
    return createEmptyContent();
  }
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
  const [width, setWidth] = useState(defaultWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const [currentWidth, setCurrentWidth] = useState(defaultWidth)
  const prevCollapsedRef = useRef(collapsed)

  // Handle collapse/expand transitions
  useEffect(() => {
    if (collapsed !== prevCollapsedRef.current) {
      // If transitioning to collapsed state
      if (collapsed) {
        // Store the current width to restore later
        setCurrentWidth(width)
        setWidth(60)
      } else {
        // Restore the previous width when expanding
        setWidth(currentWidth)
      }
      prevCollapsedRef.current = collapsed
    }
  }, [collapsed, width, currentWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth)
        setCurrentWidth(newWidth)
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, minWidth, maxWidth])

  return (
    <div className="flex h-full w-full" ref={containerRef}>
      <div 
        className="h-full overflow-hidden transition-all duration-300 ease-in-out" 
        style={{ width: collapsed ? '60px' : `${width}px`, flexShrink: 0 }}
        data-panel-width={currentWidth}
      >
        {children[0]}
      </div>
      {!collapsed && (
        <div 
          className="w-1 h-full cursor-col-resize bg-border hover:bg-muted-foreground/50 transition-colors"
          onMouseDown={() => setIsDragging(true)}
          ref={resizerRef}
        />
      )}
      <div className="flex-1 h-full overflow-hidden">
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
  onDelete: () => void
  collapsed?: boolean
  isRecentlyUpdated?: boolean
}

function NoteListItem({ note, isSelected, onClick, onDelete, collapsed = false, isRecentlyUpdated = false }: NoteListItemProps) {
  const preview = getContentPreview(note.content);
  const [isNarrow, setIsNarrow] = useState(false);
  
  // Check if parent container is narrow
  useEffect(() => {
    const checkWidth = () => {
      const panel = document.querySelector('[data-panel-width]');
      if (panel) {
        const width = parseInt(panel.getAttribute('data-panel-width') || '300', 10);
        setIsNarrow(width <= 200);
      }
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    
    // Create MutationObserver to watch for width attribute changes
    const observer = new MutationObserver(checkWidth);
    const panel = document.querySelector('[data-panel-width]');
    if (panel) {
      observer.observe(panel, { attributes: true });
    }
    
    return () => {
      window.removeEventListener('resize', checkWidth);
      observer.disconnect();
    };
  }, []);

  // Get initials from title
  function getInitials(title: string) {
    if (!title) return 'UN';
    const words = title.split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
  }

  // If narrow width or collapsed, show initials
  if (isNarrow || collapsed) {
    return (
      <motion.div
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: isRecentlyUpdated ? [0, -20, 0] : 0 
        }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          duration: isRecentlyUpdated ? 0.5 : 0.3
        }}
        className={cn(
          "h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-colors",
          isSelected 
            ? "bg-[#292929] border border-[#434343]"
            : "bg-[#222222] border border-[#222222] hover:bg-[#3D3D3D] hover:border-[#252323]",
          isRecentlyUpdated && "animate-promote"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        title={note.title || "Untitled Note"}
      >
        <span className="font-bold text-xs">{getInitials(note.title || "Untitled Note")}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 30,
          duration: isRecentlyUpdated ? 0.5 : 0.3
        }
      }}
      exit={{ y: -20, opacity: 0 }}
      className={cn(
        "flex flex-col items-start w-full text-left rounded-lg p-3 mb-1 relative group transition-colors cursor-pointer border",
        isSelected 
          ? "bg-[#292929] border-[#434343]"
          : "bg-[#222222] border-[#222222] hover:bg-[#3D3D3D] hover:border-[#252323]",
        isRecentlyUpdated && "animate-highlight"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="flex justify-between w-full items-start">
        <div className="font-medium truncate">
          {note.title || "Untitled Note"}
        </div>
        <div className="flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="text-sm text-muted-foreground truncate w-full">
        {preview || "Empty note"}
      </div>
    </motion.div>
  )
}

export function NotesWidget() {
  const { notes, createNote, updateNote, deleteNote, isLoadingNotes } = useNotes()
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isShowingDraft, setIsShowingDraft] = useState(false)
  const [draftNote, setDraftNote] = useState({
    title: '',
    content: createEmptyContent(),
  })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [panelWidth, setPanelWidth] = useState(300)
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null)
  
  // Toggle collapsed state
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  // Add effect to monitor panel width changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-panel-width') {
          const panel = document.querySelector('[data-panel-width]')
          if (panel) {
            const width = parseInt(panel.getAttribute('data-panel-width') || '300', 10)
            setPanelWidth(width)
          }
        }
      })
    })

    const panel = document.querySelector('[data-panel-width]')
    if (panel) {
      observer.observe(panel, { attributes: true })
    }

    return () => observer.disconnect()
  }, [])

  // Debug logging
  console.log('NotesWidget render - notes:', notes);
  console.log('NotesWidget render - notes.length:', notes.length);
  console.log('NotesWidget render - isShowingDraft:', isShowingDraft);
  console.log('NotesWidget render - selectedNoteId:', selectedNoteId);

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId])

  // Set draft note content when selecting a note
  useEffect(() => {
    if (selectedNote) {
      setDraftNote({
        title: selectedNote.title,
        content: migrateContentFormat(selectedNote.content), // Apply migration
      })
    }
  }, [selectedNote])

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId && !isShowingDraft) {
      console.log('Auto-selecting first note:', notes[0]);
      setSelectedNoteId(notes[0].id)
    }
  }, [notes, selectedNoteId, isShowingDraft])

  // Create a new note
  const handleCreateNote = async () => {
    console.log('handleCreateNote called');
    if (!draftNote.title && !draftNote.content) {
      console.log('Not creating empty note');
      return;
    }
    
    try {
      await createNote.mutateAsync({
        title: draftNote.title || 'Untitled Note',
        content: draftNote.content || createEmptyContent(),
      });
      
      // Reset draft state after successful creation
      setIsShowingDraft(false);
      setDraftNote({
        title: '',
        content: createEmptyContent(),
      });
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleSaveOnBlur = useCallback(async () => {
    console.log('handleSaveOnBlur called');
    
    // Don't save if there's no content or title
    if (!draftNote.content && !draftNote.title) {
      console.log('Nothing to save - empty content and title');
      return;
    }
    
    try {
      if (selectedNoteId) {
        // Update existing note
        console.log('Updating existing note:', selectedNoteId);
        console.log('Content to save:', draftNote.content);
        
        await updateNote.mutateAsync({
          id: selectedNoteId,
          title: draftNote.title || 'Untitled Note',
          content: draftNote.content || createEmptyContent()
        });
        
        // Mark this note as recently updated for animation
        setRecentlyUpdatedId(selectedNoteId)
        
        // Reset the animation flag after animation completes
        setTimeout(() => {
          setRecentlyUpdatedId(null)
        }, 1000)
      } else if (isShowingDraft) {
        // Create new note if in draft mode and there's content
        if (draftNote.title || (draftNote.content && Object.keys(draftNote.content).length > 0)) {
          console.log('Creating new note from draft');
          const result = await createNote.mutateAsync({
            title: draftNote.title || 'Untitled Note',
            content: draftNote.content || createEmptyContent(),
          });
          
          // Mark the new note as recently updated for animation
          if (result && result.id) {
            setRecentlyUpdatedId(result.id)
            
            // Reset the animation flag after animation completes
            setTimeout(() => {
              setRecentlyUpdatedId(null)
            }, 1000)
          }
          
          // Reset draft state after successful creation
          setIsShowingDraft(false);
          setDraftNote({
            title: '',
            content: createEmptyContent(),
          });
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [draftNote, selectedNoteId, isShowingDraft, updateNote, createNote]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const migratedContent = migrateContentFormat(draftNote.content)
      if ((selectedNote && (selectedNote.title !== draftNote.title || JSON.stringify(selectedNote.content) !== JSON.stringify(draftNote.content))) || 
          (isShowingDraft && draftNote.title.trim() !== '' && contentToString(migratedContent).trim() !== '')) {
        handleSaveOnBlur();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleSaveOnBlur, selectedNote, isShowingDraft, draftNote]);

  // Simplified delete handler that doesn't require event
  const handleDeleteNoteSimple = useCallback((noteId: string) => {
    deleteNote.mutateAsync(noteId)
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null)
    }
  }, [deleteNote, selectedNoteId])

  const handleSelectNote = useCallback((note: Note) => {
    console.log('handleSelectNote called with note:', note);
    console.log('Raw note content:', note.content);
    
    setSelectedNoteId(note.id);
    if (isShowingDraft) {
      setIsShowingDraft(false);
    }
    
    // Update draft with the selected note's content
    setDraftNote({
      title: note.title,
      content: note.content || createEmptyContent()
    });
  }, [isShowingDraft]);

  const handleContentChange = useCallback((newContent: string) => {
    console.log('handleContentChange called with new content');
    
    // Convert string content to ContentValue format if needed
    const contentValue = typeof newContent === 'string' 
      ? stringToContent(newContent) 
      : newContent;
    
    // Only update the content for the current note
    setDraftNote(prev => ({ ...prev, content: contentValue }));
  }, []);

  return (
    <Card className="h-full w-full flex overflow-hidden bg-transparent border-[#2A2A2A]/30 rounded-2xl dashCard relative backdrop-blur-sm">
      <ResizablePanels 
        defaultWidth={isCollapsed ? 60 : 300}
        minWidth={isCollapsed ? 60 : 200}
        maxWidth={500}
        collapsed={isCollapsed}
      >
        {/* Sidebar for notes list */}
        <div className="flex flex-col h-full">
          <ListHeader
            title="Notes"
            className="border-b border-border p-4"
          >
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedNoteId(null)
                  setIsShowingDraft(true)
                  setDraftNote({
                    title: '',
                    content: createEmptyContent(),
                  })
                }}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCollapse}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <GripVertical className="h-4 w-4" />
                ) : (
                  <GripVertical className="h-4 w-4 rotate-90" />
                )}
              </Button>
            </div>
          </ListHeader>

          <ScrollArea className="flex-1 p-4">
            {isLoadingNotes ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : (
              <>
                {notes.length > 0 ? (
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {isShowingDraft && (
                        <NoteListItem
                          note={{
                            id: 'draft',
                            title: draftNote.title || 'New Draft',
                            content: draftNote.content,
                            userId: '',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          }}
                          isSelected={!selectedNoteId}
                          onClick={() => setSelectedNoteId(null)}
                          onDelete={() => {
                            setIsShowingDraft(false)
                            setDraftNote({
                              title: '',
                              content: createEmptyContent(),
                            })
                          }}
                          collapsed={isCollapsed}
                        />
                      )}
                      {notes.map((note) => (
                        <NoteListItem
                          key={note.id}
                          note={note}
                          isSelected={selectedNoteId === note.id}
                          onClick={() => handleSelectNote(note)}
                          onDelete={() => handleDeleteNoteSimple(note.id as string)}
                          collapsed={isCollapsed}
                          isRecentlyUpdated={recentlyUpdatedId === note.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No notes yet"
                    description="Create your first note to get started."
                  />
                )}
              </>
            )}
          </ScrollArea>
        </div>

        {/* Main content area */}
        <div className="flex flex-col h-full">
          <ScrollArea className="h-full pr-4">
            {selectedNote ? (
              <>
                <div className="flex justify-between items-center mb-4">
                <Input
                    className="text-2xl font-bold border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1"
                  placeholder="Untitled Note"
                    value={draftNote.title}
                    onChange={(e) => {
                      setDraftNote(prev => ({ ...prev, title: e.target.value }));
                    }}
                    onBlur={handleSaveOnBlur}
                  />
                  <div className="flex items-center gap-2">
                    <ActionsMenu 
                      onDelete={() => handleDeleteNoteSimple(selectedNote.id)} 
                      isNewNote={false}
                    />
                  </div>
                </div>
                <Editor
                  value={draftNote.content}
                  onChange={handleContentChange}
                  readOnly={false}
                  onBlur={handleSaveOnBlur}
                />
              </>
            ) : isShowingDraft ? (
              <>
                <div className="flex justify-between items-center mb-4">
                <Input
                    className="text-2xl font-bold border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1"
                  placeholder="Untitled Note"
                  value={draftNote.title}
                    onChange={(e) => setDraftNote(prev => ({ ...prev, title: e.target.value }))}
                    onBlur={handleSaveOnBlur}
                  />
                  <div className="flex items-center gap-2">
                    <ActionsMenu 
                      onDelete={() => {
                        setIsShowingDraft(false);
                        setDraftNote({
                          title: '',
                          content: createEmptyContent(),
                        });
                      }} 
                      isNewNote={true}
                    />
                  </div>
                </div>
                <Editor
                  value={draftNote.content}
                  onChange={handleContentChange}
                  readOnly={false}
                  onBlur={handleSaveOnBlur}
                />
                <Button onClick={handleCreateNote} className="mt-4">Create Note</Button>
              </>
            ) : (
              <EmptyState
                icon={FileText}
                title="Select a note or create a new one"
                description="Choose an existing note from the left panel or click the plus button to start a new note."
                className="h-full"
              />
            )}
          </ScrollArea>
        </div>
      </ResizablePanels>
    </Card>
  );
} 