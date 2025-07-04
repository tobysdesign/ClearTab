import { Note } from '@/shared/schema'

// Shared mock data store - in a real app this would be a database
export const MOCK_NOTES: Note[] = [
  {
    id: 1,
    userId: 1,
    title: 'First Note',
    content: {},
    updatedAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    title: 'Second Note',
    content: {},
    updatedAt: new Date(),
  },
]

export function updateMockNote(id: number, updates: Partial<Note>): Note | null {
  const noteIndex = MOCK_NOTES.findIndex(note => note.id === id)
  if (noteIndex === -1) {
    return null
  }
  
  MOCK_NOTES[noteIndex] = {
    ...MOCK_NOTES[noteIndex],
    ...updates,
    updatedAt: new Date()
  }
  
  return MOCK_NOTES[noteIndex]
}

export function addMockNote(note: Omit<Note, 'id'>): Note {
  const newNote: Note = {
    ...note,
    id: Math.max(...MOCK_NOTES.map(n => n.id), 0) + 1,
  }
  
  MOCK_NOTES.push(newNote)
  return newNote
} 