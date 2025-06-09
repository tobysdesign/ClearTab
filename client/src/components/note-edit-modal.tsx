import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import YooptaEditorComponent from "@/components/ui/yoopta-editor";
import { Note } from "@shared/schema";

interface NoteEditModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note>) => void;
  onDelete: (noteId: number) => void;
  onDuplicate: (note: Note) => void;
}

export default function NoteEditModal({ note, isOpen, onClose, onSave, onDelete, onDuplicate }: NoteEditModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.title);
      setContent(note.content || "");
    }
  }, [note, isOpen]);

  // Debounced save function - only save when needed
  const debouncedSave = useDebounce(() => {
    if (!note) return;
    onSave({
      id: note.id,
      title,
      content,
    });
  }, 1000);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle); // Immediate local update
    debouncedSave(); // Trigger debounced save
  }, [debouncedSave]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent); // Immediate local update  
    debouncedSave(); // Trigger debounced save
  }, [debouncedSave]);

  const handleSave = () => {
    if (!note) return;
    
    onSave({
      id: note.id,
      title,
      content,
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (!note) return;
    onDelete(note.id);
    onClose();
  };

  const handleDuplicate = () => {
    if (!note) return;
    onDuplicate(note);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] [&>button]:hidden max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg">Edit Note</DialogTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note title..."
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Content
            </label>
            <YooptaEditorComponent
              value={content}
              onChange={handleContentChange}
              placeholder="Write your note content..."
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}