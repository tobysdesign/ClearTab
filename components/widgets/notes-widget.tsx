'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import Plus from 'lucide-react/dist/esm/icons/plus'
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal'
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
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
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
      return extractedText.trim();
    }
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
    const paragraphs = text.split('\n');
    const content: ContentValue = {};
    paragraphs.forEach((paragraph, index) => {
      if (!paragraph.trim()) return;
      const blockId = `paragraph-${index + 1}`;
      content[blockId] = {
        id: blockId,
        type: 'paragraph',
        value: [{
          id: `text-${index + 1}`,
          type: 'text',
          children: [{ text: paragraph }],
          props: { nodeType: 'paragraph' }
        }],
        meta: { order: index + 1, depth: 0 }
      };
    });
    if (Object.keys(content).length === 0) {
      return createEmptyContent();
    }
    return content;
  } catch (error) {
    console.error("Error converting string to content:", error);
    return createEmptyContent();
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

function validateContent(content: any): ContentValue {
    if (typeof content !== 'object' || content === null) {
        return createEmptyContent();
    }

    const validatedContent: ContentValue = {};
    let isValid = false;

    for (const key in content) {
        const block = content[key];
        if (
            block &&
            typeof block.id === 'string' &&
            typeof block.type === 'string' &&
            Array.isArray(block.value)
        ) {
            validatedContent[key] = block;
            isValid = true;
        }
    }

    return isValid ? validatedContent : createEmptyContent();
}

function migrateContentFormat(content: any): ContentValue {
    try {
        if (!content) return createEmptyContent();
        if (typeof content === 'object' && !Array.isArray(content)) {
            const keys = Object.keys(content);
            if (keys.every(k => content[k].id && content[k].type && content[k].value)) {
                return content as ContentValue;
            }
        }
        return validateContent(content);
    } catch (error) {
        console.error('Error migrating content format:', error);
        return createEmptyContent();
    }
}


function getContentPreview(content: ContentValue | any): string {
  try {
    if (!content) return '';
    if (typeof content === 'string') {
      return content.substring(0, 100);
    }
    const text = contentToString(content);
    return text.substring(0, 100);
  } catch (error) {
    console.error("Error getting content preview:", error);
    return '';
  }
}

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
  const [width, setWidth] = useState(defaultWidth);
  const isResizing = useRef(false);

  useEffect(() => {
    setWidth(collapsed ? 60 : defaultWidth);
  }, [collapsed, defaultWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      setWidth(prevWidth => {
        const newWidth = prevWidth + e.movementX;
        return Math.max(minWidth, Math.min(newWidth, maxWidth));
      });
    };
    const handleMouseUp = () => { isResizing.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minWidth, maxWidth]);

  return (
    <div className="flex h-full">
      <div style={{ width: `${width}px` }} className="flex-shrink-0" data-panel-width={width}>
        {children[0]}
      </div>
      <div className="w-2 cursor-col-resize flex-shrink-0 bg-border/20 hover:bg-border transition-colors" onMouseDown={handleMouseDown} />
      <div className="flex-grow">
        {children[1]}
      </div>
    </div>
  );
}

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

  function getInitials(title: string) {
    if (!title) return 'UN';
    const words = title.split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
  }

  if (collapsed) {
    return (
      <motion.div layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, y: isRecentlyUpdated ? [0, -20, 0] : 0 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30, duration: isRecentlyUpdated ? 0.5 : 0.3 }}
        className={cn("h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-colors", isSelected ? "bg-[#292929] border border-[#434343]" : "bg-[#222222] border border-[#222222] hover:bg-[#3D3D3D] hover:border-[#252323]", isRecentlyUpdated && "animate-promote")}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        title={note.title || "Untitled Note"}
      >
        <span className="font-bold text-xs">{getInitials(note.title || "Untitled Note")}</span>
      </motion.div>
    );
  }

  return (
    <motion.div layout initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn("flex flex-col items-start w-full text-left rounded-lg p-3 mb-1 relative group transition-colors cursor-pointer border", isSelected ? "bg-[#292929] border-[#434343]" : "bg-[#222222] border-[#222222] hover:bg-[#3D3D3D] hover:border-[#252323]", isRecentlyUpdated && "animate-highlight")}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <div className="flex justify-between w-full items-start">
        <div className="font-medium truncate">{note.title || "Untitled Note"}</div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="text-sm text-muted-foreground w-full overflow-hidden text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
        {preview || "Empty note"}
      </div>
    </motion.div>
  );
}

export function NotesWidget() {
  const { notes, createNote, updateNote, deleteNote, isLoadingNotes } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isShowingDraft, setIsShowingDraft] = useState(false);
  const [draftNote, setDraftNote] = useState<{title: string, content: ContentValue}>({
    title: '',
    content: createEmptyContent(),
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);

  const handleToggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

  useEffect(() => {
    if (selectedNote) {
      setDraftNote({ title: selectedNote.title, content: migrateContentFormat(selectedNote.content) });
    }
  }, [selectedNote]);

  const handleSave = useCallback(async () => {
    const migratedContent = migrateContentFormat(draftNote.content);
    const contentString = contentToString(migratedContent).trim();

    if (selectedNoteId && selectedNote) {
      const originalContentString = contentToString(migrateContentFormat(selectedNote.content)).trim();
      if (selectedNote.title !== draftNote.title || originalContentString !== contentString) {
        await updateNote.mutateAsync({ id: selectedNoteId, title: draftNote.title, content: migratedContent });
        setRecentlyUpdatedId(selectedNoteId);
        setTimeout(() => setRecentlyUpdatedId(null), 1000);
      }
    } else if (isShowingDraft && (draftNote.title.trim() !== '' || contentString !== '')) {
      const newNote = await createNote.mutateAsync({ title: draftNote.title || 'Untitled Note', content: migratedContent });
      setSelectedNoteId(newNote.id);
      setIsShowingDraft(false);
    }
  }, [draftNote, selectedNoteId, isShowingDraft, updateNote, createNote, selectedNote]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleSave);
    return () => window.removeEventListener('beforeunload', handleSave);
  }, [handleSave]);
  
  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote.mutateAsync(noteId);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setDraftNote({ title: '', content: createEmptyContent() });
    }
  }, [deleteNote, selectedNoteId]);

  const handleSelectNote = useCallback((note: Note) => {
    handleSave();
    setSelectedNoteId(note.id);
    setIsShowingDraft(false);
  }, [handleSave]);
  
  const handleCreateNew = () => {
    handleSave();
    setSelectedNoteId(null);
    setIsShowingDraft(true);
    setDraftNote({ title: '', content: createEmptyContent() });
  };
  
  const handleContentChange = useCallback((newContent: any) => {
    const contentValue = typeof newContent === 'string' ? stringToContent(newContent) : validateContent(newContent);
    setDraftNote(prev => ({ ...prev, content: contentValue }));
  }, []);

  const editorContent = selectedNoteId ? draftNote.content : (isShowingDraft ? draftNote.content : createEmptyContent());
  const editorTitle = selectedNoteId ? draftNote.title : (isShowingDraft ? draftNote.title : '');

  return (
    <Card className="h-full w-full flex overflow-hidden bg-transparent border-[#2A2A2A]/30 rounded-2xl dashCard relative backdrop-blur-sm">
      <ResizablePanels defaultWidth={isCollapsed ? 60 : 300} minWidth={isCollapsed ? 60 : 200} maxWidth={500} collapsed={isCollapsed}>
        <div className="flex flex-col h-full">
          <ListHeader title="Notes" className="border-b border-border p-4">
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={handleCreateNew} className="h-8 w-8 p-0"><Plus className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={handleToggleCollapse} className="h-8 w-8 p-0"><GripVertical className={cn("h-4 w-4", !isCollapsed && "rotate-90")} /></Button>
            </div>
          </ListHeader>
          <ScrollArea className="flex-1 p-4">
            {isLoadingNotes && <div className="text-center text-muted-foreground">Loading...</div>}
            {!isLoadingNotes && notes.length === 0 && !isShowingDraft ? (
              <EmptyState icon={FileText} title="No notes yet" description="Create your first note to get started." />
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {isShowingDraft && (
                    <NoteListItem note={{ id: 'draft', title: draftNote.title || 'New Draft', content: draftNote.content, userId: '', createdAt: new Date(), updatedAt: new Date() }} isSelected={true} onClick={() => {}} onDelete={() => setIsShowingDraft(false)} collapsed={isCollapsed}/>
                  )}
                  {notes.map(note => (
                    <NoteListItem key={note.id} note={note} isSelected={selectedNoteId === note.id} onClick={() => handleSelectNote(note)} onDelete={() => handleDeleteNote(note.id as string)} collapsed={isCollapsed} isRecentlyUpdated={recentlyUpdatedId === note.id}/>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>
        <div className="flex flex-col h-full">
          {selectedNoteId || isShowingDraft ? (
            <ScrollArea className="h-full pr-4">
              <div className="flex justify-between items-center mb-4">
                <Input className="text-2xl font-bold border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1" placeholder="Untitled Note" value={editorTitle} onChange={e => setDraftNote(prev => ({ ...prev, title: e.target.value }))} onBlur={handleSave}/>
                <div className="flex items-center gap-2">
                  <ActionsMenu onDelete={() => { if (selectedNoteId) handleDeleteNote(selectedNoteId); else setIsShowingDraft(false); }} isNewNote={!selectedNoteId}/>
                </div>
              </div>
              <Editor value={editorContent} onChange={handleContentChange} readOnly={false} onBlur={handleSave} />
            </ScrollArea>
          ) : (
            <EmptyState icon={FileText} title="Select or create a note" description="Choose a note from the list or create a new one to start writing." className="h-full"/>
          )}
        </div>
      </ResizablePanels>
    </Card>
  );
} 