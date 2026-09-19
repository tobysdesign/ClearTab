import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This route is legacy and points to Supabase. 
    // Data is now managed via /api/preferences.
    return NextResponse.json({
      showTaskCount: true,
      showNoteCount: true
    });
  } catch (error) {
    console.error('Error fetching count settings:', error);
    return NextResponse.json({ error: 'Failed to fetch count settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Body parsing just to avoid unread stream
    await request.json();

    return NextResponse.json({ success: true, message: 'Legacy route - please use /api/preferences instead' });
  } catch (error) {
    console.error('Error updating count settings:', error);
    return NextResponse.json({ error: 'Failed to update count settings' }, { status: 500 });
  }
}