import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useChatContext } from "@/hooks/use-chat-context";
import type { Note } from "@shared/schema";
import { format } from "date-fns";

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

  const toggleNoteCompleted = (id: number, completed: boolean) => {
    updateNoteMutation.mutate({ 
      id, 
      updates: { tags: completed ? ['completed'] : [] }
    });
  };

  const deleteNote = (id: number) => {
    deleteNoteMutation.mutate(id);
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);
  const isNoteCompleted = (note: Note) => note.tags?.includes('completed') || false;

  const handlePanelCollapse = () => {
    setIsCollapsed(true);
  };

  const handlePanelExpand = () => {
    setIsCollapsed(false);
  };

  return (
    <Card className="bg-card text-card-foreground border-border h-full flex flex-col overflow-hidden">
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar Panel */}
        <Panel 
          defaultSize={40} 
          minSize={20} 
          collapsible 
          collapsedSize={10}
          onCollapse={handlePanelCollapse}
          onExpand={handlePanelExpand}
        >
          <div className="h-full flex flex-col border-r border-border">
            {!isCollapsed ? (
              <>
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">
                    Notes
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden">
                  <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
                    {isLoading ? (
                      <div className="space-y-2 p-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex items-start space-x-3 p-2 rounded animate-pulse">
                            <div className="w-4 h-4 bg-muted rounded mt-0.5"></div>
                            <div className="flex-1">
                              <div className="h-3 bg-muted rounded mb-2"></div>
                              <div className="h-2 bg-muted rounded w-2/3"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 p-1">
                        {notes.map((note) => (
                          <div 
                            key={note.id} 
                            className={`p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer border border-solid ${
                              selectedNoteId === note.id ? 'bg-muted/50 border-[#333333]' : 'border-transparent'
                            }`}
                            onClick={() => setSelectedNoteId(note.id)}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <p className={`text-sm line-clamp-1 flex-1 ${isNoteCompleted(note) ? 'line-through text-muted-foreground' : ''}`}>
                                {note.title}
                              </p>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                {note.tags && note.tags.length > 0 && (
                                  note.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                      {tag}
                                    </Badge>
                                  ))
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={isNoteCompleted(note)}
                                  onCheckedChange={(checked) => toggleNoteCompleted(note.id, checked as boolean)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-3 w-3"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(note.createdAt), 'MMM d')}
                                </span>
                              </div>
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
                  {notes.slice(0, 5).map((note) => {
                    const initials = note.title
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase())
                      .slice(0, 2)
                      .join('');
                    
                    return (
                      <Tooltip key={note.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-colors border border-solid ${
                              selectedNoteId === note.id 
                                ? 'bg-muted border-[#333333] text-foreground' 
                                : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                            onClick={() => setSelectedNoteId(note.id)}
                          >
                            {initials}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">{note.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  
                  {/* +N button for add new note */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-colors bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        onClick={() => openChatWithPrompt("Create a new note for me")}
                      >
                        +N
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-sm">Add new note</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-0 group relative cursor-col-resize">
          <div className="absolute -left-2 -right-2 top-0 bottom-0 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-border group-hover:bg-muted-foreground/70 group-hover:w-1 transition-all duration-200 rounded-full"></div>
          </div>
        </PanelResizeHandle>

        {/* Content Panel */}
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col">
            {selectedNote ? (
              <div className="p-6 h-full flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{selectedNote.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{format(new Date(selectedNote.createdAt), 'MMMM d, yyyy')}</span>
                    {selectedNote.tags && selectedNote.tags.length > 0 && (
                      <div className="flex gap-1">
                        {selectedNote.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 bg-muted/30 rounded-lg p-4 overflow-y-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedNote.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-sm">
                  <h3 className="text-lg font-medium mb-2">Select a note</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose a note from the sidebar to view its content, or create a new one.
                  </p>
                  <Button 
                    onClick={() => openChatWithPrompt("Create a new note for me")}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </Card>
  );
}