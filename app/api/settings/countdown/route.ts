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
      .select('countdown_target_date, countdown_title')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      targetDate: settings?.countdown_target_date || null,
      title: settings?.countdown_title || ''
    });
  } catch (error) {
    console.error('Error fetching countdown settings:', error);
    return NextResponse.json({ error: 'Failed to fetch countdown settings' }, { status: 500 });
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
    const { targetDate, title } = body;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        countdown_target_date: targetDate,
        countdown_title: title,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating countdown settings:', error);
    return NextResponse.json({ error: 'Failed to update countdown settings' }, { status: 500 });
  }
}