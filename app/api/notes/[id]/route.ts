import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { notes, yooptaContentSchema } from '@/shared/schema'
import { db } from '@/server/db'
import { and, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const params = await context.params
  const id = params.id
  if (!id || typeof id !== 'string') {
    return Response.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const note = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, userId))
    });

    if (!note) {
      return Response.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notes/:id - Update a note
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const params = await context.params
  const id = params.id
  if (!id || typeof id !== 'string') {
    return Response.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await request.json()
    delete body.id // Don't allow changing the ID

    // Ensure updatedAt is always current
    const updateData = {
        ...body,
        updatedAt: new Date(),
    }
    
    const result = await db
      .update(notes)
      .set(updateData)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();

    if (!result.length) {
      return Response.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating note:', error);
    return Response.json({ success: false, error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }
  
  const params = await context.params
  const id = params.id
  if (!id || typeof id !== 'string') {
    return Response.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const result = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();

    if (!result.length) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 