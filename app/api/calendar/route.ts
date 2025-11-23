import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { dbMinimal } from "@/lib/db-minimal";
import { user as userTable, connectedAccounts } from "@/shared/schema-tables";
import { googleApiService } from "@/lib/google-api-service";

export async function GET(_request: NextRequest) {
  console.log('🔵 CALENDAR ROUTE HIT - Request received at:', new Date().toISOString());
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log('🔵 CALENDAR ROUTE - Auth user ID:', authUser?.id);

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized", success: false, data: [] },
        { status: 401 }
      );
    }

    let [dbUser] = await dbMinimal
      .select()
      .from(userTable)
      .where(eq(userTable.id, authUser.id))
      .limit(1);

    if (!dbUser) {
      console.log('User not found in DB, creating new user...');
      const newUser = {
        id: authUser.id,
        email: authUser.email!,
        googleCalendarConnected: false,
      };
      await dbMinimal.insert(userTable).values(newUser);
      dbUser = newUser;
      console.log('✅ New user created:', dbUser.email);
    }

    console.log('📅 Calendar API - User:', dbUser.email, 'Connected:', dbUser.googleCalendarConnected);

    let events: any[] = [];

    // Fetch from primary if connected
    if (dbUser?.googleCalendarConnected && 'accessToken' in dbUser && dbUser.accessToken) {
      let currentAccessToken = dbUser.accessToken as string;
      const refreshToken = 'refreshToken' in dbUser ? dbUser.refreshToken as string | undefined : undefined;

      try {
        events = await googleApiService.getCalendarEvents(
          { accessToken: currentAccessToken, refreshToken },
          dbUser.email
        );
        console.log('✅ Fetched', events.length, 'events from all accounts');
      } catch (error) {
        console.error('❌ Calendar fetch error (will try to refresh token):', error);

        // Try to refresh the token if we have a refresh token
        if (refreshToken) {
          try {
            console.log('🔄 Attempting to refresh access token...');
            const newTokens = await googleApiService.refreshAccessToken(refreshToken);
            currentAccessToken = newTokens.access_token;

            // Save the new access token to the database
            await dbMinimal
              .update(userTable)
              .set({
                accessToken: newTokens.access_token,
                tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
              })
              .where(eq(userTable.id, authUser.id));
            console.log('✅ Token refreshed and saved to database');

            // Retry the calendar fetch with new token
            events = await googleApiService.getCalendarEvents(
              { accessToken: currentAccessToken, refreshToken },
              dbUser.email
            );
            console.log('✅ Fetched', events.length, 'events after token refresh');
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            // Mark calendar as disconnected if refresh fails
            await dbMinimal
              .update(userTable)
              .set({ googleCalendarConnected: false })
              .where(eq(userTable.id, authUser.id));
            console.log('🔴 Marked calendar as disconnected due to token refresh failure');
          }
        }
      }
    }

    console.log('📤 Returning', events.length, 'total events');
    return NextResponse.json({ success: true, data: events });

  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch calendar", success: false, data: [] },
      { status: 500 }
    );
  }
}
