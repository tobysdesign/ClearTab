import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { StickyNote, Plus, ChevronLeft, ChevronRight, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Note, InsertNote } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function NotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [isNewNote, setIsNewNote] = useState(false);
  
  const queryClient = useQueryClient();
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
      setEditingNote(null);
      toast({
        title: "Note created",
        description: "Your note has been saved successfully.",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertNote> }) => {
      const response = await apiRequest("PUT", `/api/notes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setEditingNote(null);
      toast({
        title: "Note updated",
        description: "Your changes have been saved.",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setSelectedNoteId(null);
      setEditingNote(null);
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
    },
  });

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  useEffect(() => {
    if (selectedNote && !editingNote) {
      setEditingNote(selectedNote);
    }
  }, [selectedNote]);

  const handleCreateNewNote = () => {
    setIsNewNote(true);
    setSelectedNoteId(null);
    setEditingNote({
      title: "",
      content: "",
      tags: []
    });
  };

  const handleSaveNote = () => {
    if (!editingNote) return;

    if (isNewNote) {
      createNoteMutation.mutate({
        title: editingNote.title || "Untitled Note",
        content: editingNote.content || "",
        tags: editingNote.tags || []
      });
    } else if (selectedNoteId) {
      updateNoteMutation.mutate({
        id: selectedNoteId,
        data: {
          title: editingNote.title,
          content: editingNote.content,
          tags: editingNote.tags
        }
      });
    }
  };

  const handleDeleteNote = () => {
    if (selectedNoteId) {
      deleteNoteMutation.mutate(selectedNoteId);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-12' : 'w-80'} transition-all duration-300 border-r border-border bg-card`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                Notes
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateNewNote}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notes yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleCreateNewNote}
                >
                  Create your first note
                </Button>
              </div>
            ) : (
              <div className="p-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedNoteId === note.id ? 'bg-muted border border-border' : ''
                    }`}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsNewNote(false);
                    }}
                  >
                    <h3 className="font-medium text-sm mb-1 line-clamp-1">
                      {note.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </span>
                      {note.tags && note.tags.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {note.tags.length} tag{note.tags.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {editingNote ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  value={editingNote.title || ""}
                  onChange={(e) => setEditingNote(prev => prev ? {...prev, title: e.target.value} : null)}
                  placeholder="Note title..."
                  className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                {selectedNoteId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteNote}
                    disabled={deleteNoteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={handleSaveNote}
                  disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isNewNote ? "Create" : "Save"}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              <Textarea
                value={editingNote.content || ""}
                onChange={(e) => setEditingNote(prev => prev ? {...prev, content: e.target.value} : null)}
                placeholder="Add anything notable..."
                className="w-full h-full resize-none border-none p-0 focus-visible:ring-0 bg-transparent text-base"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <StickyNote className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Select a note to edit</h3>
              <p className="text-muted-foreground mb-4">
                Choose a note from the sidebar or create a new one
              </p>
              <Button onClick={handleCreateNewNote}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}