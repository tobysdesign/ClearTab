"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AddButton } from "@/components/ui/add-button";
import { WidgetHeader, WidgetLoader } from "@cleartab/ui";
import { useNotes } from "@/hooks/use-notes";
import type { Note } from "@/shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteListItem } from "./note-list-item";
import notesStyles from "./notes-widget.module.css";
import { cn } from "@/lib/utils";

export function NotesListMobile() {
  const { notes, isLoadingNotes } = useNotes();
  const [_selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const handleNoteClick = (note: Note) => {
    setSelectedNoteId(note.id);
    // TODO: Open note modal (similar to task modal)
    console.log("Open note:", note.id);
  };

  const handleCreateNew = () => {
    // TODO: Open new note modal
    console.log("Create new note");
  };

  const handleDeleteNote = async (noteId: string) => {
    // TODO: Implement delete
    console.log("Delete note:", noteId);
  };

  return (
    <div className={notesStyles.notesListPanel}>
      <WidgetHeader title="Notes">
        <AddButton onClick={handleCreateNew} tooltip="Add note" />
      </WidgetHeader>
      <div className={cn(notesStyles.notesListScroll, "custom-scrollbar")}>
        {isLoadingNotes ? (
          <WidgetLoader />
        ) : notes.length > 0 ? (
          <div className="ListContent">
            <AnimatePresence>
              {notes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isSelected={false}
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
