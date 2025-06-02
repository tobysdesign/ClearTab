import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { StickyNote, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChatContext } from "@/hooks/use-chat-context";
import type { Note } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function NotesWidget() {
  const queryClient = useQueryClient();
  const { openChatWithPrompt } = useChatContext();
  
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const handleDeleteNote = (id: number) => {
    deleteNoteMutation.mutate(id);
  };

  return (
    <div className="widget notes-widget">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Notes</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs text-text-muted bg-muted">
            Ctrl+N
          </Badge>
          <StickyNote className="h-5 w-5 text-text-secondary" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card p-3 rounded-lg border border-border animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs mt-1">Press Ctrl+/ to start adding notes</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card 
              key={note.id} 
              className="p-3 hover:border-muted transition-colors cursor-pointer group bg-dark-primary border-dark-border"
              onClick={() => {/* Handle note edit */}}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm text-text-primary line-clamp-1">
                  {note.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-text-muted">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-destructive transition-all text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-secondary line-clamp-2">
                {note.content}
              </p>
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center mt-2 space-x-2">
                  {note.tags.map((tag, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="text-xs px-2 py-1 bg-muted text-text-muted"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-xs text-text-muted hover:text-text-secondary"
          onClick={() => openChatWithPrompt("Create a new note for me")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add new note (Cmd+N)
        </Button>
      </div>
    </div>
  );
}
