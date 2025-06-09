import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useChatContext } from "@/hooks/use-chat-context";
import YooptaEditor, { createYooptaEditor } from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import Code from '@yoopta/code';
import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import { Bold, Italic, CodeMark, Underline, Strike } from '@yoopta/marks';
import Link from '@yoopta/link';
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import type { Note } from "@shared/schema";

export default function NotesWidgetCollapsible() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localContent, setLocalContent] = useState({});
  const [editorKey, setEditorKey] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Yoopta editor configuration
  const plugins = useMemo(() => [
    Paragraph,
    HeadingOne,
    HeadingTwo,
    HeadingThree,
    BulletedList,
    NumberedList,
    TodoList,
    Blockquote,
    Code,
    Link,
  ], []);

  const marks = useMemo(() => [
    Bold,
    Italic,
    CodeMark,
    Underline,
    Strike,
  ], []);

  const tools = useMemo(() => ({
    ActionMenu: {
      render: DefaultActionMenuRender,
      tool: ActionMenuList,
    },
    Toolbar: {
      render: DefaultToolbarRender,
      tool: Toolbar,
    },
  }), []);

  // Convert stored content to Yoopta format
  const convertTextToYooptaValue = useCallback((content: string) => {
    if (!content || content.trim() === '') {
      return {
        "paragraph-1": {
          id: "paragraph-1",
          type: "Paragraph",
          value: [{ id: "text-1", type: "text", children: [{ text: "" }] }],
          meta: { order: 0, depth: 0 }
        }
      };
    }

    // Try to parse as JSON first (for Yoopta-saved content)
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        // Return as-is if it's valid Yoopta structure
        return parsed;
      }
    } catch (e) {
      // Not valid JSON, treat as plain text
    }

    // Convert plain text to simple single paragraph
    return {
      "paragraph-1": {
        id: "paragraph-1",
        type: "Paragraph",
        value: [{ id: "text-1", type: "text", children: [{ text: content }] }],
        meta: { order: 0, depth: 0 }
      }
    };
  }, []);

  // Extract readable text from note content for preview
  const getReadablePreview = useCallback((content: string) => {
    if (!content || content.trim() === '') return "Empty note - click to edit";
    
    // Content is now stored as plain text, so just return it with length limit
    return content.length > 100 ? content.substring(0, 100) + "..." : content;
  }, []);
  
  const { data: rawNotes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  // Sort notes with untitled at top, then by most recently modified
  const notes = useMemo(() => {
    return [...rawNotes].sort((a, b) => {
      // First priority: untitled notes at top
      const aIsUntitled = !a.title || a.title.trim() === '' || a.title === 'Untitled';
      const bIsUntitled = !b.title || b.title.trim() === '' || b.title === 'Untitled';
      
      if (aIsUntitled && !bIsUntitled) return -1;
      if (!aIsUntitled && bIsUntitled) return 1;
      
      // Second priority: most recently updated first (using id as proxy for creation order)
      return b.id - a.id;
    });
  }, [rawNotes]);

  const selectedNote = notes.find(note => note.id === selectedNoteId);
  
  const editor = useMemo(() => createYooptaEditor(), []);

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setSelectedNoteId(null);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Note> }) => {
      const res = await apiRequest("PATCH", `/api/notes/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/notes", noteData);
      return res.json();
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setSelectedNoteId(newNote.id);
    },
  });

  const deleteNote = (id: number) => {
    deleteNoteMutation.mutate(id);
  };

  const createNewNote = () => {
    createNoteMutation.mutate({
      title: "",
      content: ""
    });
  };

  // Update local content when switching notes
  useEffect(() => {
    if (selectedNote) {
      // Combine title and content for display
      const fullText = selectedNote.title && selectedNote.content 
        ? `${selectedNote.title}\n\n${selectedNote.content}`
        : selectedNote.title || selectedNote.content || '';
      
      const yooptaValue = convertTextToYooptaValue(fullText);
      setLocalContent(yooptaValue);
      setEditorKey(prev => prev + 1); // Force editor re-mount
    } else {
      setLocalContent(convertTextToYooptaValue(""));
      setEditorKey(prev => prev + 1);
    }
  }, [selectedNote?.id]);

  const handlePanelCollapse = () => {
    setIsCollapsed(true);
  };

  const handlePanelExpand = () => {
    setIsCollapsed(false);
  };

  // Auto-select the empty note (id: 3) if no note is selected and notes are loaded
  if (!selectedNoteId && notes.length > 0) {
    const emptyNote = notes.find(note => note.title === "" && note.content === "");
    if (emptyNote) {
      setSelectedNoteId(emptyNote.id);
    } else {
      setSelectedNoteId(notes[0].id);
    }
  }

  return (
    <Card className="bg-card text-card-foreground border-border h-full flex flex-col overflow-hidden relative">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Sidebar Panel */}
        <Panel 
          defaultSize={40} 
          minSize={20} 
          maxSize={60}
          collapsible={true}
          onCollapse={handlePanelCollapse}
          onExpand={handlePanelExpand}
        >
          <div className="h-full flex flex-col border-r border-border">
            {!isCollapsed ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between h-4">
                    <CardTitle className="text-[13px] font-aileron-black text-muted-foreground leading-none">
                      Notes
                    </CardTitle>
                    <button
                      onClick={createNewNote}
                      className="w-6 h-6 bg-muted hover:bg-muted/80 rounded-sm flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 pt-0 flex-1 flex flex-col space-y-3 pb-3 pl-[12px] pr-[12px] overflow-hidden">
                  <div className="flex-1 space-y-2 overflow-y-auto min-h-0 widget-scrollable">
                    {isLoading ? (
                      <div className="space-y-2 p-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex items-start space-x-3 p-2 rounded animate-pulse">
                            <div className="flex-1">
                              <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notes.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No notes yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {notes.map((note) => (
                          <div 
                            key={note.id}
                            className={`group relative p-3 rounded cursor-pointer transition-colors border border-transparent hover:border-border/50 ${
                              selectedNoteId === note.id 
                                ? 'bg-accent border-border' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedNoteId(note.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm pb-1 break-words">
                                  {note.title || "Untitled"}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {getReadablePreview(note.content || "")}
                                </p>
                              </div>
                              
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="1"/>
                                      <circle cx="12" cy="5" r="1"/>
                                      <circle cx="12" cy="19" r="1"/>
                                    </svg>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-40 p-2" align="end">
                                  <div className="space-y-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNote(note.id);
                                      }}
                                      className="w-full text-left text-sm px-2 py-1 hover:bg-muted rounded text-destructive"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              // Collapsed state with two-letter cards
              (<TooltipProvider>
                <div className="h-full flex flex-col p-2 space-y-2 overflow-y-auto">
                  {notes.slice(0, 6).map((note) => {
                    const initials = note.title 
                      ? note.title.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
                      : 'UN'; // Untitled
                    
                    return (
                      <Tooltip key={note.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`w-8 h-8 rounded border cursor-pointer flex items-center justify-center text-xs font-medium transition-colors ${
                              selectedNoteId === note.id 
                                ? 'bg-accent border-accent-foreground/20' 
                                : 'bg-muted border-border hover:bg-accent'
                            }`}
                            onClick={() => setSelectedNoteId(note.id)}
                          >
                            {initials}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">{note.title || "Untitled"}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>)
            )}
          </div>
        </Panel>
        
        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-transparent hover:bg-transparent transition-colors relative group">
          <div className="absolute inset-y-0 left-1/2 w-px bg-border group-hover:bg-accent transition-colors transform -translate-x-1/2" />
        </PanelResizeHandle>
        
        {/* Content Panel */}
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col bg-muted/30">
            {selectedNote ? (
              <div className="p-6 h-full flex flex-col">
                <div className="flex-1">
                  <YooptaEditor
                    key={`${selectedNote?.id || 'empty'}-${editorKey}`}
                    editor={editor}
                    plugins={plugins}
                    tools={tools}
                    marks={marks}
                    value={localContent}
                    autoFocus={false}
                    onChange={(newValue) => {
                      setLocalContent(newValue);
                      
                      // Clear existing timeout
                      if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                      }
                      
                      // Set new timeout for auto-save
                      saveTimeoutRef.current = setTimeout(() => {
                        // Extract text content from Yoopta structure
                        const blocks = Object.values(newValue);
                        const textContent = blocks
                          .map((block: any) => {
                            if (block.value && Array.isArray(block.value)) {
                              return block.value
                                .map((item: any) => 
                                  item.children?.map((child: any) => child.text || '').join('') || ''
                                )
                                .join('');
                            }
                            return '';
                          })
                          .filter(text => text.trim() !== '')
                          .join('\n');

                        // Use first line as title, rest as content
                        const lines = textContent.split('\n').filter(line => line.trim() !== '');
                        const title = lines[0]?.trim() || "Untitled";
                        const content = lines.slice(1).join('\n').trim();
                        
                        updateNoteMutation.mutate({
                          id: selectedNote.id,
                          updates: { title, content }
                        });
                      }, 1000);
                    }}
                    placeholder="Start typing your note here..."
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-sm">
                  <h3 className="text-lg font-medium mb-2 text-left ml-[24px] mr-[24px]">Select a note</h3>
                  <p className="text-sm text-muted-foreground text-left ml-[24px] mr-[24px]">
                    Choose a note from the sidebar to view and edit it.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
      
      {/* Blur fade effect */}
      <div className="blur-fade"></div>
    </Card>
  );
}