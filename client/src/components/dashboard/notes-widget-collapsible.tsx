import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useChatContext } from "@/hooks/use-chat-context";
import type { Note } from "@shared/schema";

export default function NotesWidgetCollapsible() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

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

  const deleteNote = (id: number) => {
    deleteNoteMutation.mutate(id);
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

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
    <Card className="bg-card text-card-foreground border-border h-full flex flex-col overflow-hidden">
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
                  <CardTitle className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">
                    Notes
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 pt-0 flex-1 flex flex-col space-y-3 pb-3 pl-[8px] pr-[8px]">
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
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
                                  {note.content || "Empty note - click to edit"}
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
                  
                  <div className="mt-auto pt-3 border-t border-border/50">
                    <button 
                      className="text-xs text-text-muted text-left w-full hover:text-text-secondary transition-colors"
                      onClick={() => openChatWithPrompt("Create a new note for me")}
                    >
                      Add new note
                    </button>
                  </div>
                </CardContent>
              </>
            ) : (
              // Collapsed state with two-letter cards
              <TooltipProvider>
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
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="w-8 h-8 rounded border border-dashed border-border hover:border-accent-foreground/20 hover:bg-accent flex items-center justify-center transition-colors"
                        onClick={() => openChatWithPrompt("Create a new note for me")}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-xs">Add new note</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
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
                <textarea
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground"
                  placeholder="Start typing your note here..."
                  value={selectedNote.title ? `${selectedNote.title}\n\n${selectedNote.content || ''}` : selectedNote.content || ''}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    const title = lines[0];
                    const content = lines.slice(2).join('\n'); // Skip the empty line after title
                    
                    updateNoteMutation.mutate({
                      id: selectedNote.id,
                      updates: { title, content }
                    });
                  }}
                />
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
    </Card>
  );
}