import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { auth } from "@/auth";
import { dbMinimal } from "@/lib/db-minimal";
import { connectedAccounts, user as userTable } from "@/shared/schema-tables";
import { googleApiService } from "@/lib/google-api-service";
import { OAUTH_STATE_COOKIE, oauthNonceMatches } from "@/lib/auth/oauth-state";

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

    // Parse state to get redirect URL and check if this is a primary account connection
    let nextUrl = '/settings';
    let isPrimary = false;
    let stateUserId: string | null = null;
    let stateNonce: string | null = null;
    if (state) {
      try {
        const parsedState = JSON.parse(state);
        // Same-site paths only: state isn't signed, so an absolute URL here would be an open redirect
        if (typeof parsedState.nextUrl === 'string' && /^\/(?![/\\])/.test(parsedState.nextUrl)) {
          nextUrl = parsedState.nextUrl;
        }
        isPrimary = parsedState.isPrimary === true;
        stateUserId = parsedState.userId || null;
        stateNonce = typeof parsedState.nonce === 'string' ? parsedState.nonce : null;
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
      const session = await auth();
      if (!session?.user?.id) {
        console.error('User not authenticated during OAuth callback');
        const errorUrl = '/settings?error=not_authenticated';
        return NextResponse.redirect(new URL(errorUrl, request.url));
      }

      userId = session.user.id;
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
      const authInfo = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      };

      const userInfo = await googleApiService.getUserInfo(authInfo);

      // Handle PRIMARY account calendar connection (updates user table)
      if (isPrimary) {
        console.log('🔐 PRIMARY: Processing primary account calendar connection...');

        // Update the user table with calendar tokens
        await dbMinimal
          .update(userTable)
          .set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiry: tokens.expires_in
              ? new Date(Date.now() + tokens.expires_in * 1000)
              : null,
            googleCalendarConnected: true,
            googleId: userInfo,
          } as any)
          .where(eq(userTable.id, userId));

        console.log(`✅ PRIMARY: Connected primary Google Calendar account: ${userInfo} for user: ${userId}`);

        // Redirect to dashboard with success indicator
        const cleanUrl = nextUrl.split('?')[0];
        const finalUrl = cleanUrl === '/settings' || cleanUrl === '/'
          ? '/tab?calendar=connected'
          : `${cleanUrl}?success=primary_calendar_connected`;
        return NextResponse.redirect(new URL(finalUrl, request.url));
      }

      // Handle SECONDARY account connection (uses connected_accounts table)

      // CSRF check: the nonce echoed in state must match the cookie planted when this
      // flow was started (google-link-url). Blocks a forged callback from linking an
      // attacker's Google account into a logged-in victim's session.
      const cookieStore = await cookies();
      const cookieNonce = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
      if (!oauthNonceMatches(stateNonce, cookieNonce)) {
        console.error('OAuth state nonce mismatch on account link; rejecting.');
        const errorUrl = '/settings?error=invalid_state';
        const res = NextResponse.redirect(new URL(errorUrl, request.url));
        res.cookies.delete(OAUTH_STATE_COOKIE);
        return res;
      }

      // Look up by (user, Google account) so each user links their OWN calendars
      // independently — two different users may link the same shared Google account,
      // and one user re-linking updates only their own row. Previously the lookup was
      // by providerAccountId alone, which let one user's link clobber another's tokens.
      const [existingAccount] = await dbMinimal
        .select()
        .from(connectedAccounts)
        .where(and(
          eq(connectedAccounts.userId, userId),
          eq(connectedAccounts.providerAccountId, userInfo),
        ))
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

        console.log(`Updated existing Google account for user ${userId}: ${userInfo}`);
      } else {
        // Create new connected account for this user
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

        console.log(`Connected new Google account for user ${userId}: ${userInfo}`);
      }

      // Redirect to success page
      const successUrl = `${nextUrl}?success=account_connected`;
      const res = NextResponse.redirect(new URL(successUrl, request.url));
      res.cookies.delete(OAUTH_STATE_COOKIE);
      return res;

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