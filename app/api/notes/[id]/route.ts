import { NextResponse } from 'next/server'
import { z } from 'zod'
import { insertNoteSchema, Note, yooptaContentSchema } from '@/shared/schema'
import { updateMockNote } from '@/lib/mock-data'

export const runtime = 'nodejs';

// PUT /api/notes/:id - Update a note
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noteId = parseInt(id, 10);
  if (isNaN(noteId)) {
    return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    console.log('Updating note:', noteId, 'with data:', body);

    // Only allow title and content to be updated (both optional)
    const validation = insertNoteSchema.pick({ title: true, content: true }).partial().extend({
      content: yooptaContentSchema.optional()
    }).safeParse(body);
    
    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    // Update the note using shared store
    const updatedNote = updateMockNote(noteId, validation.data);
    if (!updatedNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    console.log('Note updated successfully:', updatedNote);
    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
} 