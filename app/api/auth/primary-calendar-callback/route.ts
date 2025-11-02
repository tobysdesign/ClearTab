import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

type UserInsert = {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiry?: Date | null;
  googleCalendarConnected?: boolean;
  googleId?: string | null;
};

export async function GET(request: NextRequest) {
  try {
    // Lazy load dependencies
    const [{ createClient }, { dbMinimal }, { user: userTable }, { googleApiService }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/db-minimal'),
      import('@/shared/schema-tables'),
      import('@/lib/google-api-service'),
    ]);

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Primary OAuth error:', error);
      const nextUrl = '/settings?error=primary_oauth_denied';
      return NextResponse.redirect(new URL(nextUrl, request.url));
    }

    if (!code) {
      console.error('No authorization code received for primary account');
      const nextUrl = '/settings?error=primary_no_code';
      return NextResponse.redirect(new URL(nextUrl, request.url));
    }

    // Parse state to get redirect URL and user info
    let nextUrl = '/settings';
    let userId: string | null = null;
    if (state) {
      try {
        const parsedState = JSON.parse(state);
        nextUrl = parsedState.nextUrl || '/settings';
        userId = parsedState.userId;
      } catch (e) {
        console.warn('Failed to parse primary OAuth state:', e);
      }
    }

    // Verify user is still authenticated
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser || (userId && authUser.id !== userId)) {
      console.error('User not authenticated or user ID mismatch during primary OAuth callback');
      const errorUrl = '/settings?error=primary_not_authenticated';
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // Exchange authorization code for tokens
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/auth/primary-calendar-callback`;

    if (!googleClientId || !googleClientSecret) {
      console.error('Google OAuth credentials not configured for primary account');
      const errorUrl = '/settings?error=primary_oauth_config';
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    try {
      // Get tokens from Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Failed to exchange code for tokens (primary account):', tokens);
        const errorUrl = '/settings?error=primary_token_exchange';
        return NextResponse.redirect(new URL(errorUrl, request.url));
      }

      // Get user info to verify the Google account
      const auth = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      };

      const googleEmail = await googleApiService.getUserInfo(auth);
      const googleId = googleEmail; // Use email as Google ID for simplicity

      // Update user record with Google Calendar tokens
      await dbMinimal
        .update(userTable)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null,
          googleCalendarConnected: true,
          googleId: googleId,
        } as Partial<UserInsert>)
        .where(eq(userTable.id, authUser.id));

      console.log(`Connected primary Google Calendar account: ${googleEmail} for user: ${authUser.id}`);

      // Redirect to success page
      const successUrl = `${nextUrl}?success=primary_calendar_connected`;
      return NextResponse.redirect(new URL(successUrl, request.url));

    } catch (error) {
      console.error('Error processing primary OAuth callback:', error);
      const errorUrl = '/settings?error=primary_processing_failed';
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

  } catch (error) {
    console.error('Fatal error in primary OAuth callback:', error);
    const errorUrl = '/settings?error=primary_fatal_error';
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}