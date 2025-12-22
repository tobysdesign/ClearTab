
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAiContext } from '@/lib/ai/context-service';
import { dbMinimal } from '@/lib/db-minimal';
import { userPreferences } from '@/shared/schema-tables';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Development bypass
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';
    let userId = session?.user?.id;

    if (!userId && devBypass) {
        userId = '00000000-0000-4000-8000-000000000000';
    } else if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get Context
    console.log('🤖 fetching AI context for user', userId);
    const aiContext = await getAiContext(userId);
    
    // 2. Get User Preferences (for simple personalization)
    const [prefs] = await dbMinimal
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

    const agentName = prefs?.agentName || 'Alex';
    const userName = prefs?.userName || 'User';

    return NextResponse.json({ 
        success: true, 
        data: {
          context: aiContext.formattedContext,
          userInfo: { agentName, userName }
        }
    });

  } catch (error) {
    console.error('Context API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
