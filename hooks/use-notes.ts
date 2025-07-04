import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Note } from '@/shared/schema'
import type { ActionResponse } from '@/types/actions'

async function getNotes(): Promise<Note[]> {
  const res = await fetch('/api/notes')
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }
  const body: ActionResponse<Note[]> = await res.json()
  if (body.success) {
    return body.data || []
  }
  return []
}

async function createNote(newNote: Partial<Note>): Promise<Note> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newNote),
  })
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
  const res = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }
  const body: ActionResponse<Note> = await res.json()
  if (body.success && body.data) {
    return body.data
  }
  throw new Error(body.error || 'Failed to update note')
}

async function deleteNote(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }
  // The API returns { success: true } on delete, so we return the ID
  // for optimistic updates.
  return { id }
}

export function useNotes() {
  const queryClient = useQueryClient()

  const {
    data: notes,
    isLoading: isLoadingNotes,
    error: notesError,
  } = useQuery<Note[], Error>({
    queryKey: ['notes'],
    queryFn: getNotes,
    initialData: [],
  })

  const createNoteMutation = useMutation<Note, Error, Partial<Note>>({
    mutationFn: createNote,
    onSuccess: (newNote) => {
      queryClient.setQueryData(['notes'], (old: Note[] | undefined) => [
        ...(old || []),
        newNote,
      ])
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const updateNoteMutation = useMutation<
    Note,
    Error,
    Partial<Note> & { id: string },
    { previousNotes?: Note[] }
  >({
    mutationFn: updateNote,
    onMutate: async (updatedNote) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notes'] })
      
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData<Note[]>(['notes'])
      
      // Optimistically update
      queryClient.setQueryData<Note[]>(['notes'], (old = []) =>
        old.map((note) =>
          note.id === updatedNote.id ? { ...note, ...updatedNote } : note
        )
      )
      
      return { previousNotes }
    },
    onError: (err, updatedNote, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes)
      }
    },
    onSettled: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const deleteNoteMutation = useMutation<{ id: string }, Error, string>({
    mutationFn: deleteNote,
    onSuccess: ({ id }) => {
      queryClient.setQueryData(['notes'], (old: Note[] | undefined) =>
        old?.filter((note) => note.id !== id)
      )
    },
  })

  return {
    notes: notes || [],
    isLoadingNotes,
    notesError,
    createNote: createNoteMutation,
    updateNote: updateNoteMutation,
    deleteNote: deleteNoteMutation,
  }
} 