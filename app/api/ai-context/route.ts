import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from "@/lib/auth/api-session";
import { getAiContext } from '@/lib/ai/context-service';
import { dbMinimal } from '@/lib/db-minimal';
import { userPreferences } from '@/shared/schema-tables';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession();
    const userId = session?.user?.id;
    if (!userId) {
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
