import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Supabase client not available"
      });
    }

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Not authenticated"
      });
    }

    // Check if user has Google provider tokens with calendar scopes
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "User not found"
      });
    }

    // Check if user logged in with Google and has required metadata
    const isGoogleUser = user.app_metadata?.provider === 'google' ||
                        user.identities?.some(identity => identity.provider === 'google');

    if (!isGoogleUser) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Not signed in with Google"
      });
    }

    // If user is authenticated with Google, assume calendar access
    // (since our OAuth flow requests calendar scopes)
    return NextResponse.json({
      success: true,
      connected: true,
      message: "Google Calendar connected"
    });

  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json({
      success: false,
      connected: false,
      error: 'Failed to check calendar status'
    }, { status: 500 });
  }
}