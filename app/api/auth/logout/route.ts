import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase sign out error:', error);
      return NextResponse.json(
        { error: 'Failed to sign out', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during sign out' },
      { status: 500 },
    );
  }
}
