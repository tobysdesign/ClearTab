import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/server/storage'
import { insertNoteSchema } from '@shared/schema'

const DEFAULT_USER_ID = 1

export async function GET() {
  try {
    const notes = await storage.getNotesByUserId(DEFAULT_USER_ID)
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedNote = insertNoteSchema.parse(body)
    
    const note = await storage.createNote({
      ...validatedNote,
      userId: DEFAULT_USER_ID
    })
    
    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}