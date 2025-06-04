import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatContext } from "@/hooks/use-chat-context";
import type { Note } from "@shared/schema";
import { format } from "date-fns";

export default function NotesWidget() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  
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

  return (
    <Card className="bg-card text-card-foreground border-border h-full flex flex-row overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-12' : 'w-1/2'} transition-all duration-300 border-r border-border flex flex-col`}>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          {!sidebarCollapsed && (
            <CardTitle className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">
              Notes
            </CardTitle>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-6 w-6 p-0 flex items-center justify-center shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </CardHeader>
        
        {!sidebarCollapsed && (
          <CardContent className="flex-1 flex flex-col space-y-3">
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
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
                      className={`flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors group cursor-pointer ${
                        selectedNoteId === note.id ? 'bg-muted/50' : ''
                      }`}
                      onClick={() => setSelectedNoteId(note.id)}
                    >
                      <Checkbox
                        checked={isNoteCompleted(note)}
                        onCheckedChange={(checked) => toggleNoteCompleted(note.id, checked as boolean)}
                        className="mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-1 line-clamp-1 ${isNoteCompleted(note) ? 'line-through text-muted-foreground' : ''}`}>
                          {note.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {note.content}
                        </p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {note.tags.filter(tag => tag !== 'completed').map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40" align="end">
                          <div className="space-y-1">
                            <button
                              onClick={() => openChatWithPrompt(`Edit this note: "${note.title}"`)}
                              className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                            >
                              Edit Note
                            </button>
                            <button
                              onClick={() => toggleNoteCompleted(note.id, !isNoteCompleted(note))}
                              className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                            >
                              {isNoteCompleted(note) ? 'Mark Incomplete' : 'Mark Complete'}
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded text-destructive"
                            >
                              Delete Note
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
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
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <div className="p-6 h-full flex flex-col">
            <div className="mb-4">
              <h2 className={`text-lg font-medium mb-2 ${isNoteCompleted(selectedNote) ? 'line-through text-muted-foreground' : ''}`}>
                {selectedNote.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {format(new Date(selectedNote.createdAt), 'MMM d, yyyy')}
                </span>
                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {selectedNote.tags.filter(tag => tag !== 'completed').map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="prose prose-sm max-w-none text-foreground">
                {selectedNote.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <p className="text-muted-foreground text-sm mb-2">
                Select a note to view
              </p>
              <p className="text-xs text-muted-foreground">
                Choose a note from the sidebar to see its content
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}