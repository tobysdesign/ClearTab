"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { AddButton } from "@/components/ui/add-button";
import { WidgetHeader, WidgetLoader } from "@cleartab/ui";
import { useNotes } from "@/hooks/use-notes";
import type { Note } from "@/shared/schema";
import { EMPTY_QUILL_CONTENT } from "@/lib/quill-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteListItem } from "./note-list-item";
import notesStyles from "./notes-widget.module.css";

export function NotesListMobile() {
  const { notes, isLoadingNotes, loadNotes, createNote, deleteNote } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const handleNoteClick = (note: Note) => {
    setSelectedNoteId(note.id);
  };

  const handleCreateNew = async () => {
    try {
      const created = await createNote.mutate({
        title: "Untitled",
        content: EMPTY_QUILL_CONTENT,
      });
      setSelectedNoteId(created.id);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutate(noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return (
    <div className={notesStyles.notesListPanel}>
      <WidgetHeader title="Notes">
        <AddButton onClick={handleCreateNew} tooltip="Add note" />
      </WidgetHeader>
      <div className={notesStyles.notesListScroll}>
        {isLoadingNotes ? (
          <WidgetLoader />
        ) : notes.length > 0 ? (
          <div className="ListContent">
            <AnimatePresence>
              {notes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isSelected={selectedNoteId === note.id}
                  onClick={() => handleNoteClick(note)}
                  onDelete={() => handleDeleteNote(note.id as string)}
                  collapsed={false}
                  isEditing={false}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            title="No Notes"
            description="Create your first note."
            action={{
              label: "Create Note",
              onClick: handleCreateNew,
            }}
          />
        )}
      </div>
    </div>
  );
}
