import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    if (!devBypass) {
      const session = await auth();
      if (!session?.user?.id) {
        console.error("❌ Session or user ID missing in GET /api/auth/google-link-url");
        return NextResponse.json({ error: "Unauthorized - No User ID" }, { status: 401 });
      }
    }

    // Get the next URL from query params for redirect after auth
    const { searchParams } = new URL(request.url);
    const nextUrl = searchParams.get('next') || '/settings';

    // Google OAuth configuration
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    // Use environment variable or fall back to dynamic URI
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/auth/google-callback`;

    if (!googleClientId) {
      return NextResponse.json({
        success: false,
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.'
      }, { status: 500 });
    }

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ nextUrl }), // Include next URL in state
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Authorization URL generated successfully'
    });
  } catch (error) {
    console.error('Error getting Google link URL:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get Google link URL'
    }, { status: 500 });
  }
}
