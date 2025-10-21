import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { notes } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Delete all notes for the current user
    const deletedNotes = await db
      .delete(notes)
      .where(eq(notes.userId, userId))
      .returning();

    console.log(`Deleted ${deletedNotes.length} notes for user ${userId}`);

    return NextResponse.json({
      success: true,
      deletedCount: deletedNotes.length,
      message: `Successfully deleted ${deletedNotes.length} notes`
    });

  } catch (error) {
    console.error('Error deleting all notes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete all notes'
      },
      { status: 500 }
    );
  }
}