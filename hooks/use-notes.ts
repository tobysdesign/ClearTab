import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Note } from '@/shared/schema'
import type { ActionResponse } from '@/types/actions'
import { useEffect } from 'react'

async function getNotes(): Promise<Note[]> {
  // console.log("Fetching notes from /api/notes (client-side)");
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Network response was not ok: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`Network response was not ok: ${res.status} ${res.statusText}`);
    }
    const body: ActionResponse<Note[]> = await res.json();
    if (body.success) {
      // console.log("Notes fetched successfully (client-side getNotes):", body.data);
      return body.data || [];
    }
    console.error("Failed to fetch notes (client-side getNotes):", body.error);
    throw new Error(body.error || 'Failed to fetch notes');
  } catch (error) {
    console.error("Error in getNotes (client-side):", error);
    return [];
  }
}

async function createNote(newNote: Partial<Note> & { temporaryId?: string }): Promise<Note> {
  // console.log("Creating new note:", newNote);
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
    // console.log("Note created successfully:", body.data);
    return body.data
  }
  console.error("Failed to create note:", body.error);
  throw new Error(body.error || 'Failed to create note')
}

async function updateNote(
  updatedNote: Partial<Note> & { id: string }
): Promise<Note> {
  // console.log("Updating note:", updatedNote);
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
    // console.log("Note updated successfully:", body.data);
    return body.data
  }
  console.error("Failed to update note:", body.error);
  throw new Error(body.error || 'Failed to update note')
}

async function deleteNote(id: string): Promise<{ id: string }> {
  // console.log("Deleting note with ID:", id);
  const res = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }
  // console.log("Note deleted successfully:", id);
  // The API returns { success: true } on delete, so we return the ID
  // for optimistic updates.
  return { id }
}

export function useNotes() {
  // console.log("useNotes hook invoked");
  const queryClient = useQueryClient()

  const {
    data: notes,
    isLoading: isLoadingNotes,
    error: notesError,
  } = useQuery<Note[], Error>({
    queryKey: ['notes'],
    queryFn: getNotes,
  })

  useEffect(() => {
    if (notesError) {
      console.error("useNotes query error:", notesError);
    }
  }, [notesError]);

  const createNoteMutation = useMutation<Note, Error, Partial<Note> & { temporaryId?: string }, { previousNotes?: Note[], temporaryId?: string }>({
    mutationFn: createNote,
    onMutate: async (newNote) => {
      // console.log("createNoteMutation onMutate, newNote:", newNote);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notes'] })
      
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData<Note[]>(['notes'])
      
      // Optimistically update: find and replace if temporaryId, otherwise append
      queryClient.setQueryData<Note[]>(['notes'], (old = []) => {
        if (newNote.temporaryId) {
          return old.map(note => 
            note.id === newNote.temporaryId 
              ? { ...note, ...newNote } as Note // Spread newNote directly to update all properties
              : note
          );
        } else {
          return [...old, newNote as Note];
        }
      });
      
      return { previousNotes, temporaryId: newNote.temporaryId };
    },
    onSuccess: (newNote, variables, context) => {
      // console.log("createNoteMutation onSuccess, newNote:", newNote);
      // If a temporary ID was used, replace that item in the cache
      if (context?.temporaryId) {
        queryClient.setQueryData(['notes'], (old: Note[] | undefined) => {
          return old?.map(note => 
            note.id === context.temporaryId 
              ? newNote 
              : note
          ) || [];
        });
      } else {
        // Fallback for cases without a temporaryId (e.g., initial load)
        queryClient.setQueryData(['notes'], (old: Note[] | undefined) => [
          ...(old || []),
          newNote,
        ])
      }
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
    onError: (error, variables, context) => {
      // console.error("createNoteMutation onError:", error);
      // Rollback on error if there were previous notes
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes);
      }
    }
  })

  const updateNoteMutation = useMutation<
    Note,
    Error,
    Partial<Note> & { id: string },
    { previousNotes?: Note[] }
  >({
    mutationFn: updateNote,
    onMutate: async (updatedNote) => {
      // console.log("updateNoteMutation onMutate, updatedNote:", updatedNote);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notes'] })
      
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData<Note[]>(['notes'])
      
      // Optimistically update
      queryClient.setQueryData<Note[]>(['notes'], (old = []) =>
        old.map((note) =>
          note.id === updatedNote.id ? { ...note, ...updatedNote as Note } : note // Cast updatedNote to Note
        )
      )
      
      return { previousNotes }
    },
    onError: (err, updatedNote, context) => {
      // console.error("updateNoteMutation onError:", err, updatedNote);
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes)
      }
    },
    onSettled: () => {
      // console.log("updateNoteMutation onSettled");
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const deleteNoteMutation = useMutation<{ id: string }, Error, string>({
    mutationFn: deleteNote,
    onSuccess: ({ id }) => {
      // console.log("deleteNoteMutation onSuccess, deleted ID:", id);
      queryClient.setQueryData(['notes'], (old: Note[] | undefined) =>
        old?.filter((note) => note.id !== id)
      )
    },
    onError: (error) => {
      // console.error("deleteNoteMutation onError:", error);
    }
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