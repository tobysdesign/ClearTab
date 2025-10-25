import { useState, useCallback } from 'react'
import type { Note } from '@/shared/schema'
import type { ActionResponse } from '@/types/actions'
import { api } from '@/lib/api-client'

async function getNotes(): Promise<Note[]> {
  try {
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
  } catch (error) {
    console.error("Error in getNotes:", error);
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

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [notesError, setNotesError] = useState<Error | null>(null)

  // Load notes once on mount
  const loadNotes = useCallback(async () => {
    setIsLoadingNotes(true)
    setNotesError(null)
    try {
      const data = await getNotes()
      setNotes(data)
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
