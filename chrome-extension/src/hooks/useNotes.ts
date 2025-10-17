import { useState, useCallback } from 'react';
import { type Note } from '../types';

const STORAGE_KEY = 'notes';

async function getNotesFromStorage(): Promise<Note[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

async function saveNotesToStorage(notes: Note[]) {
  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    const notesFromStorage = await getNotesFromStorage();
    setNotes(notesFromStorage);
    setIsLoading(false);
  }, []);

  const createNote = useCallback(async (newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const note: Note = {
      ...newNote,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes);
    return note;
  }, [notes]);

  const updateNote = useCallback(async (updatedNote: Partial<Note> & { id: string }) => {
    const now = new Date().toISOString();
    const updatedNotes = notes.map(note =>
      note.id === updatedNote.id ? { ...note, ...updatedNote, updatedAt: now } : note
    );
    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes);
    return updatedNote as Note;
  }, [notes]);

  const deleteNote = useCallback(async (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes);
  }, [notes]);

  return {
    notes,
    isLoading,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
