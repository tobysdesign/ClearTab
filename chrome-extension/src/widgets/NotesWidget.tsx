import React, { useState, useEffect, useCallback } from 'react';
import { useNotes } from '../hooks/useNotes';
import { QuillEditor } from '../components/QuillEditor';
import { type Note } from '../types';

const EMPTY_QUILL_CONTENT = { ops: [{ insert: '\n' }] };

export function NotesWidget() {
  const { notes, isLoading, loadNotes, createNote, updateNote, deleteNote } = useNotes();
  const [activeNote, setActiveNote] = useState<Partial<Note> | null>(null);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!activeNote && !isLoading) {
      if (notes.length > 0) {
        setActiveNote(notes[0]);
      } else {
        handleCreateNew();
      }
    }
  }, [notes, isLoading, activeNote]);

  const handleSelectNote = useCallback((note: Note) => {
    setActiveNote(note);
  }, []);

  const handleCreateNew = useCallback(() => {
    const newNote: Partial<Note> = {
      title: 'Untitled Note',
      content: EMPTY_QUILL_CONTENT,
    };
    setActiveNote(newNote);
  }, []);

  const handleSaveNote = useCallback(async (noteToSave: Partial<Note>) => {
    if (noteToSave.id) {
      await updateNote(noteToSave as Note);
    } else {
      const savedNote = await createNote(noteToSave as Omit<Note, 'id' | 'createdAt' | 'updatedAt'>);
      setActiveNote(savedNote);
    }
    loadNotes();
  }, [createNote, updateNote, loadNotes]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    await deleteNote(noteId);
    setActiveNote(null);
  }, [deleteNote]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: '300px', borderRight: '1px solid #ccc' }}>
        <h2>Notes</h2>
        <button onClick={handleCreateNew}>New Note</button>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {notes.map(note => (
              <li key={note.id} onClick={() => handleSelectNote(note)}>
                {note.title}
                <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ flex: 1, padding: '1rem' }}>
        {activeNote && (
          <div>
            <input
              type="text"
              value={activeNote.title || ''}
              onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
              onBlur={() => handleSaveNote(activeNote)}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <QuillEditor
              value={activeNote.content}
              onChange={(content) => setActiveNote({ ...activeNote, content })}
              onBlur={() => handleSaveNote(activeNote)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
