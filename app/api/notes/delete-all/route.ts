import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from "@/lib/auth/api-session";
import { dbMinimal } from '@/lib/db-minimal';
import { notes } from '@/shared/schema-tables';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getApiSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    // Delete all notes for the current user
    const deletedNotes = await dbMinimal
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