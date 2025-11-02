import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Lazy load dependencies
    const [{ createClient }, { dbMinimal }, { user: userTable }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/db-minimal'),
      import('@/shared/schema-tables'),
    ]);

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
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
      })
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