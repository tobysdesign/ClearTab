import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

type ConnectedAccountInsert = {
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiry?: Date | null;
};

export async function GET(request: NextRequest) {
  try {
    // Lazy load dependencies
    const [{ createClient }, { dbMinimal }, { connectedAccounts }, { googleApiService }] = await Promise.all([
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
      console.error('OAuth error:', error);
      const nextUrl = '/settings?error=oauth_denied';
      return NextResponse.redirect(new URL(nextUrl, request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      const nextUrl = '/settings?error=no_code';
      return NextResponse.redirect(new URL(nextUrl, request.url));
    }

    // Parse state to get redirect URL
    let nextUrl = '/settings';
    if (state) {
      try {
        const parsedState = JSON.parse(state);
        nextUrl = parsedState.nextUrl || '/settings';
      } catch (e) {
        console.warn('Failed to parse OAuth state:', e);
      }
    }

    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let userId: string | null = null;

    if (devBypass) {
      console.log('🔧 Development mode: Bypassing auth for OAuth callback');
      userId = '00000000-0000-4000-8000-000000000000';
    } else {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        console.error('User not authenticated during OAuth callback');
        const errorUrl = '/settings?error=not_authenticated';
        return NextResponse.redirect(new URL(errorUrl, request.url));
      }

      userId = authUser.id;
    }

    // Exchange authorization code for tokens
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // Use environment variable or fall back to dynamic URI
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/auth/google-callback`;

    if (!googleClientId || !googleClientSecret) {
      console.error('Google OAuth credentials not configured');
      const errorUrl = '/settings?error=oauth_config';
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
        console.error('Failed to exchange code for tokens:', tokens);
        const errorUrl = '/settings?error=token_exchange';
        return NextResponse.redirect(new URL(errorUrl, request.url));
      }

      // Get user info to identify the account
      const auth = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      };

      const userInfo = await googleApiService.getUserInfo(auth);

      // Check if this account is already connected
      const [existingAccount] = await dbMinimal
        .select()
        .from(connectedAccounts)
        .where(eq(connectedAccounts.providerAccountId, userInfo))
        .limit(1);

      if (existingAccount) {
        // Update existing account with new tokens
        await dbMinimal
          .update(connectedAccounts)
          .set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiry: tokens.expires_in
              ? new Date(Date.now() + tokens.expires_in * 1000)
              : null,
          } as Partial<ConnectedAccountInsert>)
          .where(eq(connectedAccounts.id, existingAccount.id));

        console.log(`Updated existing Google account: ${userInfo}`);
      } else {
        // Create new connected account
        await dbMinimal
          .insert(connectedAccounts)
          .values({
            userId,
            provider: 'google',
            providerAccountId: userInfo,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiry: tokens.expires_in
              ? new Date(Date.now() + tokens.expires_in * 1000)
              : null,
          } as ConnectedAccountInsert);

        console.log(`Connected new Google account: ${userInfo}`);
      }

      // Redirect to success page
      const successUrl = `${nextUrl}?success=account_connected`;
      return NextResponse.redirect(new URL(successUrl, request.url));

    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      const errorUrl = '/settings?error=processing_failed';
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

  } catch (error) {
    console.error('Fatal error in OAuth callback:', error);
    const errorUrl = '/settings?error=fatal_error';
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}