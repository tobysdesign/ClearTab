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

    console.log('📖 GET preferences:', prefs?.countdownTitle, prefs?.endDate ? 'has end date' : 'no end date');
    return NextResponse.json({ data: prefs || {} });
  } catch (error) {
    console.error('❌ Error fetching preferences:', error);
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
    console.log('🔍 API saving for user:', user.id.slice(0,8));

    // Convert ISO string dates back to Date objects for database
    const processedBody = { ...body };
    if (processedBody.startDate && typeof processedBody.startDate === 'string') {
      processedBody.startDate = new Date(processedBody.startDate);
    }
    if (processedBody.endDate && typeof processedBody.endDate === 'string') {
      processedBody.endDate = new Date(processedBody.endDate);
    }
    if (processedBody.paydayDate && typeof processedBody.paydayDate === 'string') {
      processedBody.paydayDate = new Date(processedBody.paydayDate);
    }

    // Upsert user preferences
    const [updated] = await dbMinimal
      .insert(userPreferences)
      .values({
        userId: user.id,
        ...processedBody,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: processedBody,
      })
      .returning();

    console.log('✅ Database updated:', updated);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
