import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatContext } from "@/hooks/use-chat-context";
import NoteEditModal from "@/components/note-edit-modal";
import YooptaEditorComponent from "@/components/ui/yoopta-editor";
import type { Note } from "@shared/schema";

export default function NotesWidget() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Note> & { id: number }) => {
      return await apiRequest("PATCH", `/api/notes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
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

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string }) => {
      return await apiRequest("POST", "/api/notes", noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const handleEditNote = (note: Note) => {
    setEditNote(note);
    setIsEditModalOpen(true);
  };

  const handleSaveNote = (noteData: Partial<Note>) => {
    if (noteData.id) {
      updateNoteMutation.mutate(noteData as Partial<Note> & { id: number });
    }
  };

  const handleDeleteNote = (id: number) => {
    deleteNoteMutation.mutate(id);
  };

  const handleDuplicateNote = (note: Note) => {
    createNoteMutation.mutate({
      title: `${note.title} (Copy)`,
      content: note.content || "",
    });
  };

  const deleteNote = (id: number) => {
    deleteNoteMutation.mutate(id);
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  // Auto-select the empty note if available, otherwise select first note
  if (!selectedNoteId && notes.length > 0) {
    const emptyNote = notes.find(note => note.title === "" && note.content === "");
    if (emptyNote) {
      setSelectedNoteId(emptyNote.id);
    } else {
      setSelectedNoteId(notes[0].id);
    }
  }

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
          <CardContent className="space-y-3 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0 widget-scrollable">
              <div className="space-y-2 p-1 max-h-full">
                {isLoading ? (
                  <div className="space-y-2">
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
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className={`group relative p-2 rounded-lg cursor-pointer transition-colors border border-solid border-transparent hover:border-[#333333] ${
                        selectedNoteId === note.id 
                          ? 'bg-accent border-border' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedNoteId(note.id)}
                      onDoubleClick={() => handleEditNote(note)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1 break-words">
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
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40" align="end">
                            <div className="space-y-1">
                              <button
                                onClick={() => handleEditNote(note)}
                                className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                              >
                                Edit Note
                              </button>
                              <button
                                onClick={() => handleDuplicateNote(note)}
                                className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded text-destructive"
                              >
                                Delete
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
              <h3 className="text-lg font-semibold mb-2">{selectedNote.title || "Untitled"}</h3>
            </div>
            
            <div className="flex-1 bg-muted/30 rounded-lg overflow-y-auto">
              <YooptaEditorComponent
                value={selectedNote.content || ""}
                readOnly={true}
                placeholder="Start typing or paste your content here..."
                className="h-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="max-w-sm">
              <h3 className="text-lg font-medium mb-2">Select a note</h3>
              <p className="text-sm text-muted-foreground">
                Choose a note from the sidebar to view and edit it.
              </p>
            </div>
          </div>
        )}
      </div>

      <NoteEditModal
        note={editNote}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditNote(null);
        }}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onDuplicate={handleDuplicateNote}
      />
    </Card>
  );
}