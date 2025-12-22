import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbMinimal } from '@/lib/db-minimal';
import { tasks } from '@/shared/schema-tables';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';
    const defaultUserId = '00000000-0000-4000-8000-000000000000';

    let userId = defaultUserId;

    if (!devBypass) {
      const session = await auth();

      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = session.user.id;
    }

    // Delete all tasks for the current user
    const deletedTasks = await dbMinimal
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