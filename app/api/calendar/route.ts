import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { user as userTable, connectedAccounts } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { googleApiService, type GoogleAuth } from "@/lib/google-api-service";

export async function GET(request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let user;
    let dbUser;

    if (devBypass) {
      console.log('🔧 Development mode: Bypassing auth for calendar API');
      // Use default development user ID
      const userId = '00000000-0000-4000-8000-000000000000';

      // Get or create development user
      try {
        [dbUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, userId))
          .limit(1);
      } catch (error) {
        // User might not exist in dev mode, return sample calendar data
        console.log('🔧 Development mode: No user found, returning sample calendar data');
        const sampleEvents = [
          {
            id: "dev-event-1",
            title: "Team Standup",
            start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            end: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours from now
            description: "Daily team sync",
            location: "Conference Room A",
            allDay: false,
            color: "#4285f4",
            calendarId: "primary",
            calendarName: "Work Calendar",
            source: "google"
          },
          {
            id: "dev-event-2",
            title: "Product Review",
            start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
            description: "Weekly product review meeting",
            location: "Meeting Room B",
            allDay: false,
            color: "#34a853",
            calendarId: "primary",
            calendarName: "Work Calendar",
            source: "google"
          },
          {
            id: "dev-event-3",
            title: "Project Deadline",
            start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // All day event
            description: "Final project submission",
            location: "",
            allDay: true,
            color: "#ea4335",
            calendarId: "primary",
            calendarName: "Work Calendar",
            source: "google"
          }
        ];
        return NextResponse.json({ data: sampleEvents });
      }
    } else {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      user = authUser;

      // Get user from database
      [dbUser] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, user.id))
        .limit(1);

      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    let events: any[] = [];

    // Fetch events from primary account if connected
    if (dbUser.googleCalendarConnected && dbUser.accessToken) {
      try {
        const auth: GoogleAuth = {
          accessToken: dbUser.accessToken,
          refreshToken: dbUser.refreshToken || undefined,
        };

        try {
          events = await googleApiService.getCalendarEvents(auth, dbUser.email);
        } catch (error: any) {
          // If authentication failed and we have a refresh token, try to refresh
          if (error.message.includes('invalid authentication') || error.message.includes('401')) {
            if (auth.refreshToken) {
              console.log('Access token expired, attempting to refresh...');
              try {
                const refreshedTokens = await googleApiService.refreshAccessToken(auth.refreshToken);
                
                // Update the auth object with new access token
                auth.accessToken = refreshedTokens.access_token;
                
                // Update the database with new access token
                await db
                  .update(userTable)
                  .set({ accessToken: refreshedTokens.access_token })
                  .where(eq(userTable.id, dbUser.id));
                
                // Retry the calendar request with new token
                events = await googleApiService.getCalendarEvents(auth, dbUser.email);
                console.log('Successfully refreshed token and fetched calendar events');
              } catch (refreshError) {
                console.error('Failed to refresh access token:', refreshError);
                throw error; // Re-throw original error
              }
            } else {
              console.error('No refresh token available to refresh expired access token');
              throw error;
            }
          } else {
            throw error; // Re-throw non-auth errors
          }
        }
        } catch (error: any) {
          console.error("Error fetching primary calendar:", error);
          // Store error for later response
          if (error.message.includes('invalid authentication') || error.message.includes('401')) {
            // If this is an auth error and we have no refresh token, mark as auth error
            if (!auth.refreshToken) {
              return NextResponse.json({ 
                error: "Calendar authentication expired", 
                errorType: "AUTH_EXPIRED",
                message: `Calendar access for ${dbUser.email || 'your account'} has expired. Please reconnect to view your events.`,
                userEmail: dbUser.email
              }, { status: 401 });
            }
          }
        }
    }

    // Fetch events from secondary accounts
    const userId = devBypass ? '00000000-0000-4000-8000-000000000000' : user.id;
    const secondaryAccounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, userId));

    for (const account of secondaryAccounts) {
      if (!account.accessToken) continue;

      try {
        const auth: GoogleAuth = {
          accessToken: account.accessToken,
          refreshToken: account.refreshToken || undefined,
        };

        // Get account email with token refresh on auth failure
        let accountEmail = "Secondary Account";
        try {
          accountEmail = await googleApiService.getUserInfo(auth);
        } catch (error: any) {
          if ((error.message.includes('invalid authentication') || error.message.includes('401')) && auth.refreshToken) {
            try {
              console.log(`Refreshing token for secondary account ${account.id}...`);
              const refreshedTokens = await googleApiService.refreshAccessToken(auth.refreshToken);
              auth.accessToken = refreshedTokens.access_token;
              
              // Update database with new token
              await db
                .update(connectedAccounts)
                .set({ accessToken: refreshedTokens.access_token })
                .where(eq(connectedAccounts.id, account.id));
              
              // Retry getting user info
              accountEmail = await googleApiService.getUserInfo(auth);
            } catch (refreshError) {
              console.error(`Failed to refresh token for secondary account ${account.id}:`, refreshError);
              continue; // Skip this account
            }
          } else {
            console.error(
              "Could not fetch email for secondary account:",
              account.id,
            );
          }
        }

        // Get calendar events with token refresh on auth failure
        try {
          const secondaryEventsList = await googleApiService.getCalendarEvents(auth, accountEmail);

          const secondaryEvents = secondaryEventsList.map((event) => ({
            ...event,
            id: `${account.id}-${event.id}`,
            color: "rgba(147, 51, 234, 0.3)", // Purple tint for secondary accounts
            calendarName: `${accountEmail} (view-only)`,
          }));

          events.push(...secondaryEvents);
        } catch (error: any) {
          if ((error.message.includes('invalid authentication') || error.message.includes('401')) && auth.refreshToken) {
            try {
              console.log(`Refreshing token for calendar events for account ${account.id}...`);
              const refreshedTokens = await googleApiService.refreshAccessToken(auth.refreshToken);
              auth.accessToken = refreshedTokens.access_token;
              
              // Update database with new token
              await db
                .update(connectedAccounts)
                .set({ accessToken: refreshedTokens.access_token })
                .where(eq(connectedAccounts.id, account.id));
              
              // Retry getting calendar events
              const secondaryEventsList = await googleApiService.getCalendarEvents(auth, accountEmail);
              const secondaryEvents = secondaryEventsList.map((event) => ({
                ...event,
                id: `${account.id}-${event.id}`,
                color: "rgba(147, 51, 234, 0.3)",
                calendarName: `${accountEmail} (view-only)`,
              }));
              events.push(...secondaryEvents);
            } catch (refreshError) {
              console.error(`Failed to refresh token for calendar events for account ${account.id}:`, refreshError);
              throw error; // Let the outer catch handle this
            }
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error(
          `Error fetching events from secondary account ${account.id}:`,
          error.message,
        );
        // If the error is related to an invalid token, it means the user has likely revoked access.
        // We should delete this stale connection to allow the account to be re-linked by someone else.
        if (
          error.response?.data?.error === "invalid_grant" ||
          error.message.includes("invalid_grant") ||
          (error.message.includes('invalid authentication') && !account.refreshToken)
        ) {
          console.log(
            `Detected invalid grant for account ${account.id}. Deleting stale connection.`,
          );
          await db
            .delete(connectedAccounts)
            .where(eq(connectedAccounts.id, account.id));
        }
      }
    }

    // In development mode, if no events found, return sample data
    if (devBypass && events.length === 0) {
      console.log('🔧 Development mode: No events found, returning sample calendar data');
      const sampleEvents = [
        {
          id: "dev-event-1",
          title: "Team Standup",
          start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          end: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours from now
          description: "Daily team sync",
          location: "Conference Room A",
          allDay: false,
          color: "#4285f4",
          calendarId: "primary",
          calendarName: "Work Calendar",
          source: "google"
        },
        {
          id: "dev-event-2",
          title: "Product Review",
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
          description: "Weekly product review meeting",
          location: "Meeting Room B",
          allDay: false,
          color: "#34a853",
          calendarId: "primary",
          calendarName: "Work Calendar",
          source: "google"
        },
        {
          id: "dev-event-3",
          title: "Project Deadline",
          start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // All day event
          description: "Final project submission",
          location: "",
          allDay: true,
          color: "#ea4335",
          calendarId: "primary",
          calendarName: "Work Calendar",
          source: "google"
        }
      ];
      return NextResponse.json({ data: sampleEvents });
    }

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 },
    );
  }
}
