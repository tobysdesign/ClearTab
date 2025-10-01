import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { user as userTable } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For the primary account, we update the user table
    await db
      .update(userTable)
      .set({
        googleCalendarConnected: false,
        accessToken: null,
        refreshToken: null,
        lastCalendarSync: null,
      })
      .where(eq(userTable.id, user.id));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Disconnect calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 },
    );
  }
}
