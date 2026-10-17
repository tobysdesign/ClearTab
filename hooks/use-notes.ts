import { useState, useCallback, useRef } from 'react'
import type { Note } from '@/shared/schema'
import type { ActionResponse } from '@/types/actions'
import { api } from '@/lib/api-client'

async function fetchNotesOnce(): Promise<Note[]> {
  const res = await api.get('/api/notes');
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Network response was not ok: ${res.status} ${res.statusText}`, errorText);
    throw new Error(`Network response was not ok: ${res.status} ${res.statusText}`);
  }
  const body: ActionResponse<Note[]> = await res.json();
  if (body.success) {
    return body.data || [];
  }
  console.error("Failed to fetch notes:", body.error);
  throw new Error(body.error || 'Failed to fetch notes');
}

async function getNotes(): Promise<Note[]> {
  try {
    let notes: Note[];
    try {
      notes = await fetchNotesOnce();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 900));
      notes = await fetchNotesOnce();
    }
    try {
      window.localStorage.setItem('cleartab_cached_notes_v1', JSON.stringify(notes));
    } catch {
      // Ignore storage errors
    }
    return notes;
  } catch (error) {
    console.error("Error in getNotes:", error);
    try {
      const cachedRaw = window.localStorage.getItem('cleartab_cached_notes_v1');
      if (cachedRaw) {
        const cachedNotes = JSON.parse(cachedRaw);
        if (Array.isArray(cachedNotes)) return cachedNotes;
      }
    } catch {
      // Ignore cache read errors
    }
    return [];
  }
}

async function createNote(newNote: Partial<Note> & { temporaryId?: string }): Promise<Note> {
  const res = await api.post('/api/notes', newNote)
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }
  const body: ActionResponse<Note> = await res.json()
  if (body.success && body.data) {
    return body.data
  }
  throw new Error(body.error || 'Failed to create note')
}

async function updateNote(
  updatedNote: Partial<Note> & { id: string }
): Promise<Note> {
  const { id, ...data } = updatedNote
  const res = await api.put(`/api/notes`, { noteId: id, ...data })

  if (!res.ok) {
    const errorText = await res.text()
    console.error(`Failed to update note: ${res.status} ${res.statusText}`, errorText)
    throw new Error(`Failed to update note: ${errorText}`)
  }

  const body: ActionResponse<Note> = await res.json()
  if (body.success && body.data) {
    return body.data
  }

  throw new Error(body.error || 'Failed to update note')
}

async function deleteNote(id: string): Promise<{ id: string }> {
  const res = await api.delete(`/api/notes?id=${encodeURIComponent(id)}`)
  if (!res.ok) {
    const errorText = await res.text()
    console.error(`Failed to delete note: ${res.status} ${res.statusText}`, errorText)
    throw new Error(`Failed to delete note: ${errorText}`)
  }
  const body = await res.json()
  if (!body.success) {
    throw new Error(body.error || 'Failed to delete note')
  }
  return { id }
}

function getInitialCachedNotes(): Note[] {
  if (typeof window === 'undefined') return []
  try {
    const cachedRaw = window.localStorage.getItem('cleartab_cached_notes_v1')
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return []
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(getInitialCachedNotes)
  const initialHadNotes = useRef(notes.length > 0)
  const [isLoadingNotes, setIsLoadingNotes] = useState(!initialHadNotes.current)
  const [notesError, setNotesError] = useState<Error | null>(null)
  const hasLoadedOnceRef = useRef(initialHadNotes.current)

  // Load notes on mount or refresh silently when a note is created elsewhere
  const loadNotes = useCallback(async () => {
    if (!hasLoadedOnceRef.current) {
      setIsLoadingNotes(true)
    }
    setNotesError(null)
    try {
      const data = await getNotes()
      setNotes(data)
      hasLoadedOnceRef.current = true
    } catch (error) {
      console.error('Error loading notes:', error)
      setNotesError(error as Error)
    } finally {
      setIsLoadingNotes(false)
    }
  }, [])

  // Create note locally first, then sync to server
  const createNoteMutation = {
    mutate: async (newNote: Partial<Note> & { temporaryId?: string }) => {
      try {
        const savedNote = await createNote(newNote)
        setNotes(prev => [savedNote, ...prev])
        return savedNote
      } catch (error) {
        throw error
      }
    }
  }

  // Update note locally first, then sync to server
  const updateNoteMutation = {
    mutate: async (updatedNote: Partial<Note> & { id: string }) => {
      try {
        const savedNote = await updateNote(updatedNote)
        setNotes(prev => prev.map(note => 
          note.id === updatedNote.id ? savedNote : note
        ))
        return savedNote
      } catch (error) {
        throw error
      }
    }
  }

  // Delete note - only remove from UI after successful server deletion
  const deleteNoteMutation = {
    mutate: async (id: string) => {
      // Delete from server first
      await deleteNote(id)
      // Only remove from UI if server deletion succeeded
      setNotes(prev => prev.filter(note => note.id !== id))
      return { id }
    }
  }

  const removeNoteOptimistic = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId))
  }, [])

  const insertNoteAtIndex = useCallback((note: Note, index: number) => {
    setNotes(prev => {
      const next = [...prev]
      const safeIndex = Math.max(0, Math.min(index, next.length))
      next.splice(safeIndex, 0, note)
      return next
    })
  }, [])

  // Optimistic update - immediately update UI without API call
  const updateNoteOptimistic = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, ...updates } : note
    ))
  }, [])

  return {
    notes,
    isLoadingNotes,
    notesError,
    loadNotes,
    createNote: createNoteMutation,
    updateNote: updateNoteMutation,
    deleteNote: deleteNoteMutation,
    updateNoteOptimistic,
    removeNoteOptimistic,
    insertNoteAtIndex,
  }
}
