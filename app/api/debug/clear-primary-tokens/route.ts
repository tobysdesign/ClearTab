import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { dbMinimal } from '@/lib/db-minimal';
import { user as userTable } from '@/shared/schema-tables';

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    const authUser = session?.user;

    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear expired primary account Google tokens
    await dbMinimal
      .update(userTable)
      .set({
        accessToken: null,
        refreshToken: null,
        googleCalendarConnected: false,
        tokenExpiry: null,
      } as any)
      .where(eq(userTable.id, authUser.id));

    console.log(`Cleared expired primary Google tokens for user: ${authUser.id}`);

    return NextResponse.json({
      success: true,
      message: 'Cleared expired primary account Google tokens. Schedule widget will now use connected accounts.'
    });

  } catch (error) {
    console.error('Error clearing primary tokens:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear primary tokens'
    }, { status: 500 });
  }
}