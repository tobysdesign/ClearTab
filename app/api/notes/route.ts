import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    if (devBypass) {
      // Development mode: use minimal dependencies
      const [{ dbMinimal }, { notes }] = await Promise.all([
        import('@/lib/db-minimal'),
        import('@/lib/notes-schema')
      ]);

      const userId = '00000000-0000-4000-8000-000000000000';
      console.log('🔧 Development mode: Bypassing auth for notes API');

      // Fetch notes from database using Drizzle
      const allNotes = await dbMinimal
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.updatedAt));

      return NextResponse.json({ success: true, data: allNotes || [] });
    } else {
      // Production mode: full auth check
      const [{ createClient }, { dbMinimal }, { notes }] = await Promise.all([
        import('@/lib/supabase/server'),
        import('@/lib/db-minimal'),
        import('@/lib/notes-schema')
      ]);

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      // Fetch notes from database using Drizzle
      const allNotes = await dbMinimal
        .select()
        .from(notes)
        .where(eq(notes.userId, user.id))
        .orderBy(desc(notes.updatedAt));

      return NextResponse.json({ success: true, data: allNotes || [] });
    }
  } catch (error) {
    console.error('Error fetching notes:', error);

    // If it's a UUID error with old dev-user-id, return empty array instead of failing
    if (error && typeof error === 'object' && 'code' in error && error.code === '22P02') {
      console.log('🔧 UUID error detected, returning empty notes array');
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Lazy load only essential dependencies
    const [{ createClient }, { dbMinimal }, { notes }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/db-minimal'),
      import('@/lib/notes-schema')
    ]);

    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let userId: string;

    if (devBypass) {
      userId = '00000000-0000-4000-8000-000000000000';
      console.log('🔧 Development mode: Bypassing auth for notes POST');
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const body = await request.json();
    const { title, content } = body;

    // Create note in database using Drizzle
    const [newNote] = await dbMinimal
      .insert(notes)
      .values({
        userId: userId,
        title: title || 'Untitled',
        content: content || JSON.stringify({ ops: [{ insert: '\n' }] })
      })
      .returning();

    return NextResponse.json({ success: true, data: newNote });
  } catch (error) {
    console.error('Error creating note:', error);

    // If it's a UUID error, return a more specific error
    if (error && typeof error === 'object' && 'code' in error && error.code === '22P02') {
      console.log('🔧 UUID error detected during note creation');
      return NextResponse.json({ success: false, error: 'Invalid user ID format' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Lazy load only essential dependencies
    const [{ createClient }, { dbMinimal }, { notes }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/db-minimal'),
      import('@/lib/notes-schema')
    ]);

    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let userId: string;

    if (devBypass) {
      userId = '00000000-0000-4000-8000-000000000000';
      console.log('🔧 Development mode: Bypassing auth for notes PUT');
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const body = await request.json();
    const { noteId, title, content } = body;

    if (!noteId) {
      return NextResponse.json({ success: false, error: 'Note ID is required' }, { status: 400 });
    }

    // Update note in database using Drizzle
    const [updatedNote] = await dbMinimal
      .update(notes)
      .set({
        title: title || 'Untitled',
        content: content || JSON.stringify({ ops: [{ insert: '\n' }] }),
        updatedAt: new Date()
      })
      .where(eq(notes.id, noteId))
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
    // Lazy load only essential dependencies
    const [{ createClient }, { dbMinimal }, { notes }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/db-minimal'),
      import('@/lib/notes-schema')
    ]);

    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let userId: string;

    if (devBypass) {
      userId = '00000000-0000-4000-8000-000000000000';
      console.log('🔧 Development mode: Bypassing auth for notes DELETE');
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Note ID is required' }, { status: 400 });
    }

    // Delete from database using Drizzle
    await dbMinimal
      .delete(notes)
      .where(eq(notes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 });
  }
}