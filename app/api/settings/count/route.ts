import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('show_task_count, show_note_count')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      showTaskCount: settings?.show_task_count ?? true,
      showNoteCount: settings?.show_note_count ?? true
    });
  } catch (error) {
    console.error('Error fetching count settings:', error);
    return NextResponse.json({ error: 'Failed to fetch count settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { showTaskCount, showNoteCount } = body;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        show_task_count: showTaskCount,
        show_note_count: showNoteCount,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating count settings:', error);
    return NextResponse.json({ error: 'Failed to update count settings' }, { status: 500 });
  }
}