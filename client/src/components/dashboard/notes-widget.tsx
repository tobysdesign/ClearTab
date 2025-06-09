import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { StickyNote, Plus, ChevronLeft, ChevronRight, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChatContext } from "@/hooks/use-chat-context";
import { useToast } from "@/hooks/use-toast";
import type { Note, InsertNote } from "@shared/schema";

export default function NotesWidget() {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [isNewNote, setIsNewNote] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  const { toast } = useToast();
  
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: Omit<InsertNote, 'userId'>) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setSelectedNoteId(newNote.id);
      setIsNewNote(false);
      setEditingNote(newNote);
      setIsSaving(false);
      toast({
        title: "Note created",
        description: "Your note has been saved successfully.",
      });
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Note> }) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, updates);
      return response.json();
    },
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setEditingNote(updatedNote);
      setIsSaving(false);
      toast({
        title: "Note updated",
        description: "Your note has been saved successfully.",
      });
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setSelectedNoteId(null);
      setEditingNote(null);
      setIsNewNote(false);
    },
  });

  // Auto-select the empty note if available, otherwise select first note
  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      const emptyNote = notes.find(note => note.title === "" && note.content === "");
      if (emptyNote) {
        setSelectedNoteId(emptyNote.id);
        setEditingNote(emptyNote);
      } else {
        setSelectedNoteId(notes[0].id);
        setEditingNote(notes[0]);
      }
    }
  }, [notes, selectedNoteId]);

  const handleNoteSelect = (note: Note) => {
    setSelectedNoteId(note.id);
    setEditingNote(note);
    setIsNewNote(false);
  };

  const handleCreateNewNote = () => {
    setIsNewNote(true);
    setSelectedNoteId(null);
    setEditingNote({ title: "", content: "" });
  };

  const handleSaveNote = () => {
    if (!editingNote) return;
    
    setIsSaving(true);
    
    if (isNewNote) {
      createNoteMutation.mutate({
        title: editingNote.title || "",
        content: editingNote.content || "",
      });
    } else if (selectedNoteId) {
      updateNoteMutation.mutate({
        id: selectedNoteId,
        updates: {
          title: editingNote.title || "",
          content: editingNote.content || "",
        }
      });
    }
  };

  const handleDeleteNote = (noteId: number) => {
    deleteNoteMutation.mutate(noteId);
  };

  const handleNoteChange = (field: keyof Note, value: string) => {
    setEditingNote(prev => prev ? { ...prev, [field]: value } : null);
    
    // Auto-save after 2 seconds of inactivity
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSaveNote();
    }, 2000);
    
    setSaveTimeout(timeout);
  };

  return (
    <div className="h-full flex">
      <Card className="bg-card text-card-foreground border-border h-full w-full flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-12' : 'w-1/3'} transition-all duration-300 border-r border-border flex flex-col`}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground">Notes</h2>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-6 w-6 p-0"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          {!sidebarCollapsed && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-2 widget-scrollable">
                <div className="space-y-1 max-h-full">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-2 mb-1 rounded bg-muted animate-pulse">
                          <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className={`p-2 mb-1 rounded cursor-pointer transition-colors ${
                            selectedNoteId === note.id 
                              ? 'bg-accent border border-border' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleNoteSelect(note)}
                        >
                          <h4 className="font-medium text-xs pt-0 pb-1.5 break-words">
                            {note.title || "Untitled"}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {note.content || "Empty note - click to edit"}
                          </p>
                        </div>
                      ))}
                      {isNewNote && (
                        <div className="p-2 mb-1 rounded bg-muted/50 border border-dashed border-border">
                          <p className="text-xs font-medium text-muted-foreground">New Note</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {editingNote ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex-1">
                  <Input
                    value={editingNote.title || ""}
                    onChange={(e) => handleNoteChange('title', e.target.value)}
                    placeholder="Note title..."
                    className="border-none p-0 text-lg font-semibold bg-transparent focus-visible:ring-0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  {selectedNoteId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(selectedNoteId)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={isSaving}
                    className="h-8 w-8 p-0"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                <Textarea
                  value={editingNote.content || ""}
                  onChange={(e) => handleNoteChange('content', e.target.value)}
                  placeholder="Start typing or paste your content here..."
                  className="w-full h-full resize-none border-none bg-transparent focus-visible:ring-0 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-sm space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">No note selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a note from the sidebar or create a new one to get started.
                  </p>
                </div>
                <Button onClick={handleCreateNewNote} className="mx-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create new note
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}