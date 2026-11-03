import { NextRequest, NextResponse } from 'next/server';
import { and, eq, desc } from 'drizzle-orm';
import { getApiSession } from "@/lib/auth/api-session";
import { dbMinimal } from '@/lib/db-minimal';
import { notes } from '@/shared/schema-tables';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const session = await getApiSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const allNotes = await dbMinimal
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(desc(notes.updatedAt));

    return NextResponse.json({ success: true, data: allNotes || [] });
  } catch (error) {
    console.error('Error fetching notes:', error);

    // If it's a UUID error, return empty array instead of failing
    if (error && typeof error === 'object' && 'code' in error && error.code === '22P02') {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { title, content } = body;

    const insertValues = {
      userId,
      title: title || 'Untitled',
      content: content || { ops: [{ insert: '\n' }] }
    } as const;

    const [newNote] = await dbMinimal
      .insert(notes)
      .values(insertValues)
      .returning();

    return NextResponse.json({ success: true, data: newNote });
  } catch (error) {
    console.error('Error creating note:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === '22P02') {
      return NextResponse.json({ success: false, error: 'Invalid user ID format' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getApiSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { noteId, title, content } = body;

    if (!noteId) {
      return NextResponse.json({ success: false, error: 'Note ID is required' }, { status: 400 });
    }

    const updateValues = {
      title: title || 'Untitled',
      content: content || { ops: [{ insert: '\n' }] }
    } as const;

    const [updatedNote] = await dbMinimal
      .update(notes)
      .set(updateValues)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    if (!updatedNote) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ success: false, error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getApiSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Note ID is required' }, { status: 400 });
    }

    await dbMinimal
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 });
  }
}
