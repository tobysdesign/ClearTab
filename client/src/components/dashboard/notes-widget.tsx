import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { StickyNote, Plus, ChevronLeft, ChevronRight, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChatContext } from "@/hooks/use-chat-context";
import { useToast } from "@/hooks/use-toast";
import type { Note, InsertNote } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

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
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertNote> }) => {
      const response = await apiRequest("PUT", `/api/notes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setIsSaving(false);
      toast({
        title: "Note updated",
        description: "Your changes have been saved.",
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
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
    },
  });

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  useEffect(() => {
    if (selectedNote) {
      setEditingNote(selectedNote);
      setIsNewNote(false);
    }
  }, [selectedNoteId, selectedNote]);

  // Initialize with new note if no notes exist
  useEffect(() => {
    if (notes.length === 0 && !editingNote && !isNewNote) {
      handleCreateNewNote();
    }
  }, [notes, editingNote, isNewNote]);

  const handleCreateNewNote = () => {
    setIsNewNote(true);
    setSelectedNoteId(null);
    setEditingNote({
      title: "",
      content: "",
      tags: []
    });
  };

  const generateUntitledName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `Untitled ${dateStr} ${timeStr}`;
  };

  const autoSaveNote = () => {
    if (!editingNote || isSaving) return;

    const title = editingNote.title?.trim() || generateUntitledName();
    const content = editingNote.content?.trim() || "";

    // Only save if there's actual content
    if (!content && !editingNote.title?.trim()) return;

    setIsSaving(true);

    if (isNewNote) {
      createNoteMutation.mutate({
        title,
        content,
        tags: editingNote.tags || []
      });
    } else if (selectedNoteId) {
      updateNoteMutation.mutate({
        id: selectedNoteId,
        data: {
          title,
          content,
          tags: editingNote.tags
        }
      });
    }
  };

  const scheduleAutoSave = (delay: number = 30000) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const newTimeout = setTimeout(autoSaveNote, delay);
    setSaveTimeout(newTimeout);
  };

  const handleDeleteNote = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteNoteMutation.mutate(id);
  };

  return (
    <div className="widget notes-widget h-full flex flex-row">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-8' : 'w-1/3'} transition-all duration-300 border-r border-border bg-card/50 min-w-8`}>
        <div className="p-2 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <h3 className="text-sm font-medium text-muted-foreground leading-4">#Notes</h3>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-4 w-4 p-0 flex items-center justify-center"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <div className="overflow-y-auto h-[calc(100%-40px)]">
            {isLoading ? (
              <div className="p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-2 rounded border animate-pulse">
                    <div className="h-3 bg-muted rounded mb-1"></div>
                    <div className="h-2 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : notes.length === 0 && !isNewNote ? (
              <div className="p-2 text-center text-muted-foreground">
                <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No notes yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-6 text-xs"
                  onClick={handleCreateNewNote}
                >
                  Create first note
                </Button>
              </div>
            ) : (
              <div className="p-1">
                {isNewNote && (
                  <div className="p-2 mb-1 rounded bg-muted/50 border border-dashed border-border">
                    <p className="text-xs font-medium text-muted-foreground">New Note</p>
                  </div>
                )}
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-2 mb-1 rounded cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedNoteId === note.id ? 'bg-muted border border-border' : ''
                    }`}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsNewNote(false);
                    }}
                  >
                    <h4 className="font-medium text-xs mb-1 line-clamp-1">
                      {note.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {!sidebarCollapsed && (
              <div className="p-2">
                <button
                  onClick={handleCreateNewNote}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Add new note
                </button>
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
            <div className="p-3 border-b border-border">
              <input
                value={editingNote.title || ""}
                onChange={(e) => {
                  setEditingNote(prev => prev ? {...prev, title: e.target.value} : null);
                }}
                onBlur={() => {
                  autoSaveNote();
                }}
                placeholder="Note title..."
                className="w-full text-sm font-medium border-none outline-none bg-transparent placeholder:text-muted-foreground"
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-3">
              <textarea
                value={editingNote.content || ""}
                onChange={(e) => {
                  setEditingNote(prev => prev ? {...prev, content: e.target.value} : null);
                  scheduleAutoSave(30000);
                }}
                placeholder="Add anything notable..."
                className="w-full h-full resize-none border-none outline-none bg-transparent text-sm placeholder:text-muted-foreground"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <StickyNote className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-2">
                Select a note to edit
              </p>
              <Button onClick={handleCreateNewNote} size="sm">
                <Plus className="w-3 h-3 mr-1" />
                New Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
