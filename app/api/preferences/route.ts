import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dbMinimal } from '@/lib/db-minimal';
import { userPreferences } from '@/shared/schema-tables';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [prefs] = await dbMinimal
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id));

    return NextResponse.json({ data: prefs || {} });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Upsert user preferences
    const [updated] = await dbMinimal
      .insert(userPreferences)
      .values({
        userId: user.id,
        ...body,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: body,
      })
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
