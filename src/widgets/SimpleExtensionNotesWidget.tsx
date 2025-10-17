"use client";

import React, { useState, useCallback } from "react";
import { AddButton } from "@/components/ui/add-button";
import { WidgetHeader } from "@/components/ui/widget-header";
import { WidgetContainer } from "@/components/ui/widget-container";
import { WidgetLoader } from "@/components/widgets/widget-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { useExtensionStorage } from "../hooks/use-extension-storage";
import { cn } from "@/lib/utils";

interface SimpleNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function SimpleExtensionNotesWidget() {
  const { data: notes, setData: setNotes, loading: isLoading } = useExtensionStorage<SimpleNote[]>('notes', []);
  const [activeNote, setActiveNote] = useState<SimpleNote | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleCreateNote = useCallback(() => {
    const newNote: SimpleNote = {
      id: `note-${Date.now()}`,
      title: title || "Untitled Note",
      content: content || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNote(newNote);
  }, [notes, setNotes, title, content]);

  const handleSelectNote = useCallback((note: SimpleNote) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!activeNote) return;

    const updatedNote = {
      ...activeNote,
      title: title || "Untitled Note",
      content,
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = notes.map((note) =>
      note.id === activeNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setActiveNote(updatedNote);
  }, [activeNote, notes, setNotes, title, content]);

  const handleDeleteNote = useCallback((noteId: string) => {
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    setNotes(updatedNotes);

    if (activeNote && activeNote.id === noteId) {
      setActiveNote(null);
      setTitle("");
      setContent("");
    }
  }, [notes, setNotes, activeNote]);

  if (isLoading) {
    return <WidgetLoader />;
  }

  return (
    <WidgetContainer data-widget="notes">
      <div style={{ display: 'flex', height: '400px' }}>
        {/* Notes List */}
        <div style={{ width: '250px', borderRight: '1px solid #333', padding: '16px' }}>
          <WidgetHeader title="Notes">
            <AddButton onClick={handleCreateNote} />
          </WidgetHeader>

          <div style={{ marginTop: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {notes.length === 0 ? (
              <EmptyState
                title="No Notes"
                description="Create your first note."
              />
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  style={{
                    padding: '8px',
                    marginBottom: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: activeNote?.id === note.id ? '#333' : 'transparent',
                    border: '1px solid #555',
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
                    {note.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    style={{
                      float: 'right',
                      background: 'none',
                      border: 'none',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div style={{ flex: 1, padding: '16px' }}>
          {activeNote ? (
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '16px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: '#222',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here..."
                style={{
                  width: '100%',
                  height: '250px',
                  padding: '8px',
                  fontSize: '14px',
                  background: '#222',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#fff',
                  resize: 'none',
                }}
              />
              <button
                onClick={handleSaveNote}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Save Note
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '100px' }}>
              <p>Select a note to edit or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}