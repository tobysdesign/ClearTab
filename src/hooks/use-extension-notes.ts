import { useState, useCallback } from 'react'
import type { Note } from '@/shared/schema'
import { useExtensionStorage } from './use-extension-storage'

// Extension-compatible version of useNotes that uses Chrome Storage
export function useNotes() {
  const { data: notes, setData: setNotes, loading: isLoadingNotes } = useExtensionStorage<Note[]>('notes', [])
  const [notesError, setNotesError] = useState<Error | null>(null)

  // Load notes - just returns the current state since Chrome Storage auto-loads
  const loadNotes = useCallback(async () => {
    // Chrome Storage automatically loads on mount, so this is just for compatibility
    return notes
  }, [notes])

  // Create note mutation - stores directly to Chrome Storage
  const createNoteMutation = {
    mutate: async (newNote: Partial<Note> & { temporaryId?: string }) => {
      try {
        const noteToSave: Note = {
          id: newNote.temporaryId || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: newNote.title || 'Untitled Note',
          content: newNote.content || [],
          userId: 'extension-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const updatedNotes = [noteToSave, ...notes]
        setNotes(updatedNotes)
        return noteToSave
      } catch (error) {
        setNotesError(error as Error)
        throw error
      }
    }
  }

  // Update note mutation - updates Chrome Storage
  const updateNoteMutation = {
    mutate: async (updatedNote: Partial<Note> & { id: string }) => {
      try {
        const noteToUpdate = notes.find(note => note.id === updatedNote.id)
        if (!noteToUpdate) {
          throw new Error('Note not found')
        }

        const savedNote: Note = {
          ...noteToUpdate,
          ...updatedNote,
          updatedAt: new Date().toISOString(),
        }

        const updatedNotes = notes.map(note =>
          note.id === updatedNote.id ? savedNote : note
        )
        setNotes(updatedNotes)
        return savedNote
      } catch (error) {
        setNotesError(error as Error)
        throw error
      }
    }
  }

  // Delete note mutation - removes from Chrome Storage
  const deleteNoteMutation = {
    mutate: async (id: string) => {
      try {
        const updatedNotes = notes.filter(note => note.id !== id)
        setNotes(updatedNotes)
        return { id }
      } catch (error) {
        setNotesError(error as Error)
        throw error
      }
    }
  }

  // Optimistic update - immediately update state
  const updateNoteOptimistic = useCallback((noteId: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId ? { ...note, ...updates } : note
    )
    setNotes(updatedNotes)
  }, [notes, setNotes])

  return {
    notes,
    isLoadingNotes,
    notesError,
    loadNotes,
    createNote: createNoteMutation,
    updateNote: updateNoteMutation,
    deleteNote: deleteNoteMutation,
    updateNoteOptimistic,
  }
}