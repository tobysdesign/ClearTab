import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { dbMinimal } from "@/lib/db-minimal";
import { user as userTable, connectedAccounts } from "@/shared/schema-tables";
import { googleApiService } from "@/lib/google-api-service";

export async function GET(_request: NextRequest) {
  console.log('🔵 CALENDAR ROUTE HIT - Request received at:', new Date().toISOString());
  try {
    const session = await auth();
    console.log('🔵 CALENDAR ROUTE - Auth session:', session?.user?.email);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false, data: [] },
        { status: 401 }
      );
    }

    const authUser = session.user;

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
        name: authUser.name || authUser.email!,
        googleCalendarConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        googleId: null,
        lastCalendarSync: null,
        emailVerified: null,
        image: null,
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await dbMinimal.insert(userTable).values(newUser as any);
      dbUser = newUser as any;
      console.log('✅ New user created:', dbUser.email);
    }

    console.log('📅 Calendar API - User:', dbUser.email);

    // Proactively check for tokens - even if DB says disconnected, we'll try to fetch if tokens exist
    // this handles cases where the flag is out of sync but tokens are valid.

    let events: any[] = [];
    const sessionAccessToken = session.accessToken;
    const sessionRefreshToken = session.refreshToken;

    // Determine which tokens to use (session vs database fallback)
    const accessToken = sessionAccessToken || dbUser.accessToken;
    const refreshToken = sessionRefreshToken || dbUser.refreshToken;

    if (accessToken) {
      console.log(`📅 Use tokens from: ${sessionAccessToken ? 'session' : 'database'}`);
      let currentAccessToken = accessToken;

      try {
        events = await googleApiService.getCalendarEvents(
          { accessToken: currentAccessToken, refreshToken: refreshToken || undefined },
          dbUser.email
        );
        console.log('✅ Fetched', events.length, 'events from all accounts');
        
        // AUTO-HEAL: If we successfully fetched events but DB says disconnected, update it!
        if (dbUser.googleCalendarConnected === false) {
          console.log('🩹 AUTO-HEAL: Successful fetch with healthy tokens. Marking calendar as connected in DB.');
          await dbMinimal
            .update(userTable)
            .set({ googleCalendarConnected: true } as any)
            .where(eq(userTable.id, authUser.id));
        }
      } catch (error) {
        console.error('❌ Calendar fetch error:', error);

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
                googleCalendarConnected: true,
              } as any)
              .where(eq(userTable.id, authUser.id));
            console.log('✅ Token refreshed and saved to database');

            // Retry the calendar fetch with new token
            events = await googleApiService.getCalendarEvents(
              { accessToken: currentAccessToken, refreshToken: refreshToken || undefined },
              dbUser.email
            );
            console.log('✅ Fetched', events.length, 'events after token refresh');
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            // Mark calendar as disconnected if refresh fails
            await dbMinimal
              .update(userTable)
              .set({ googleCalendarConnected: false } as any)
              .where(eq(userTable.id, authUser.id));
            console.log('🔴 Marked calendar as disconnected due to token refresh failure');
            
            return NextResponse.json({
              success: true,
              data: [],
              needsReconnection: true,
              message: "Connection expired. Please reconnect your calendar."
            });
          }
        } else {
          // If we have an auth error but no refresh token, we can't recover.
          console.warn('⚠️ Auth failed and no refresh token available. Disconnecting calendar.');
          await dbMinimal
            .update(userTable)
            .set({ googleCalendarConnected: false } as any)
            .where(eq(userTable.id, authUser.id));
          
          return NextResponse.json({
            success: true,
            data: [],
            needsReconnection: true,
            message: "Authentication failed. Please reconnect your calendar."
          });
        }
      }
    } else {
      console.warn('⚠️ No tokens available (session or DB). Prompting reconnection.');
      return NextResponse.json({
        success: true,
        data: [],
        needsReconnection: true,
        message: "Google Calendar not connected. Please sign in to sync your schedule."
      });
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
