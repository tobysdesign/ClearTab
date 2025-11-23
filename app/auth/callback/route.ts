import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  // Clean any error params from the next URL to avoid redirect loops
  if (next.includes('?error=')) {
    next = next.split('?')[0] || '/';
  }
  // Note: addingAccount functionality may be implemented in the future
  // const addingAccount = searchParams.get("adding_account") === "true";

  if (!code) {
    console.error("Auth callback: No code provided.");
    return NextResponse.redirect(`${origin}/login?error=No code provided`);
  }

  const supabase = await createClient();

  // --- Primary Sign-In Flow ---
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      console.error("Auth exchange failed:", error?.message);
      return NextResponse.redirect(
        `${origin}/login?error=Authentication failed`,
      );
    }

    if (data.user) {
      // Debug what tokens we receive from Supabase
      console.log('Auth callback - Supabase token debug:', {
        userId: data.user.id,
        email: data.user.email,
        hasProviderToken: !!data.session.provider_token,
        providerTokenLength: data.session.provider_token?.length,
        hasProviderRefreshToken: !!data.session.provider_refresh_token,
        providerRefreshTokenLength: data.session.provider_refresh_token?.length,
        scopes: data.session.provider_token ? 'token-present' : 'no-token'
      });

      // DON'T use Supabase provider tokens for calendar - they lack proper scopes
      // Instead, we'll trigger the dedicated calendar OAuth flow
      const userInsertValues = {
        email: data.user.email!,
        name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          "User",
        googleId: data.user.user_metadata?.provider_id,
        googleCalendarConnected: false, // Will be set to true by primary-calendar-callback
        accessToken: null, // Will be set by primary-calendar-callback
        refreshToken: null, // Will be set by primary-calendar-callback
      } as const;

      // Try to update existing user first, then insert if not found
      try {
        // First try to update based on Supabase user ID
        const existingUser = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, data.user.id))
          .limit(1);

        if (existingUser.length > 0) {
          // Update existing user - but DON'T overwrite their calendar tokens!
          // Only update basic profile info
          await db
            .update(userTable)
            .set({
              email: userInsertValues.email,
              name: userInsertValues.name,
              googleId: userInsertValues.googleId,
              // DON'T reset googleCalendarConnected, accessToken, refreshToken
              // Those are only set by the calendar OAuth flow
            })
            .where(eq(userTable.id, data.user.id));

          console.log(`Updated existing user ${data.user.id} profile (preserved calendar tokens)`);
        } else {
          // Insert new user with conflict resolution on googleId
          await db
            .insert(userTable)
            .values({ ...userInsertValues, id: data.user.id })
            .onConflictDoUpdate({
              target: userTable.googleId,
              set: {
                email: userInsertValues.email,
                name: userInsertValues.name,
                googleCalendarConnected: userInsertValues.googleCalendarConnected,
                accessToken: userInsertValues.accessToken,
                refreshToken: userInsertValues.refreshToken,
              },
            });

          console.log(`Inserted/updated user ${data.user.id} with Google ID ${userInsertValues.googleId}`);
        }

        // After user is created/updated, check if they need calendar OAuth
        // Check the database to see if they already have calendar tokens
        const [currentUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, data.user.id))
          .limit(1);

        if (!currentUser?.googleCalendarConnected) {
          console.log('🔐 PRIMARY: User needs calendar OAuth, building redirect URL...');

          // Build the Google OAuth URL directly instead of going through the API endpoint
          const googleClientId = process.env.GOOGLE_CLIENT_ID;
          const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google-callback`;

          if (googleClientId) {
            const params = new URLSearchParams({
              client_id: googleClientId,
              redirect_uri: redirectUri,
              response_type: 'code',
              scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
              access_type: 'offline',
              prompt: 'consent',
              state: JSON.stringify({
                nextUrl: next,
                isPrimary: true,
                userId: data.user.id
              }),
            });

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
            console.log('🔐 PRIMARY: Redirecting to Google OAuth for calendar permissions');
            return NextResponse.redirect(authUrl);
          }
        }

      } catch (dbError) {
        console.error('Database operation failed in auth callback:', dbError);
        // Continue with the redirect even if database update fails
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(
      `${origin}/login?error=An unexpected error occurred`,
    );
  }
}
