import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Lazy load dependencies
    const [{ createClient }] = await Promise.all([
      import('@/lib/supabase/server'),
    ]);

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the next URL from query params for redirect after auth
    const { searchParams } = new URL(request.url);
    const nextUrl = searchParams.get('next') || '/settings';

    // Google OAuth configuration for primary account
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/auth/primary-calendar-callback`;

    if (!googleClientId) {
      return NextResponse.json({
        success: false,
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.'
      }, { status: 500 });
    }

    // Build OAuth URL with state indicating this is for primary account
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({
        nextUrl,
        isPrimary: true,
        userId: authUser.id
      }),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Primary account authorization URL generated successfully'
    });
  } catch (error) {
    console.error('Error getting primary calendar connect URL:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get primary calendar connect URL'
    }, { status: 500 });
  }
}