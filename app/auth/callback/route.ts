import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
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

      const userInsertValues = {
        email: data.user.email!,
        name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          "User",
        googleId: data.user.user_metadata?.provider_id,
        googleCalendarConnected: !!data.session.provider_token,
        accessToken: data.session.provider_token || null,
        refreshToken: data.session.provider_refresh_token || null,
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
          // Update existing user with new tokens
          await db
            .update(userTable)
            .set({
              email: userInsertValues.email,
              name: userInsertValues.name,
              googleId: userInsertValues.googleId,
              googleCalendarConnected: userInsertValues.googleCalendarConnected,
              accessToken: userInsertValues.accessToken,
              refreshToken: userInsertValues.refreshToken,
            })
            .where(eq(userTable.id, data.user.id));

          console.log(`Updated existing user ${data.user.id} with fresh Google Calendar tokens`);
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
