import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { user as userTable } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connected: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [dbUser] = await db
      .select({
        googleCalendarConnected: userTable.googleCalendarConnected,
        lastCalendarSync: userTable.lastCalendarSync,
      })
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: dbUser.googleCalendarConnected,
      lastSync: dbUser.lastCalendarSync,
    });

  } catch (error) {
    console.error('Calendar status API error:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to fetch calendar status' },
      { status: 500 },
    );
  }
}
