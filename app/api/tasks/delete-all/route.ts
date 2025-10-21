import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { tasks } from '@/shared/schema';
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

    // Delete all tasks for the current user
    const deletedTasks = await db
      .delete(tasks)
      .where(eq(tasks.userId, userId))
      .returning();

    console.log(`Deleted ${deletedTasks.length} tasks for user ${userId}`);

    return NextResponse.json({
      success: true,
      deletedCount: deletedTasks.length,
      message: `Successfully deleted ${deletedTasks.length} tasks`
    });

  } catch (error) {
    console.error('Error deleting all tasks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete all tasks'
      },
      { status: 500 }
    );
  }
}