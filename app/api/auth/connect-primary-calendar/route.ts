import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.error("❌ Session or user ID missing in GET /api/auth/connect-primary-calendar");
      return NextResponse.json({ error: "Unauthorized - No User ID" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the next URL from query params for redirect after auth
    const { searchParams } = new URL(request.url);
    const nextUrl = searchParams.get('next') || '/settings';

    // Google OAuth configuration for primary account
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/auth/google-callback`;

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
        userId: userId
      }),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Redirect directly to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error getting primary calendar connect URL:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get primary calendar connect URL'
    }, { status: 500 });
  }
}