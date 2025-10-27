import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type { GoogleAuth } from "@/lib/google-api-service";

type SchemaTables = typeof import("@/shared/schema-tables");
type UserRow = SchemaTables["user"]["$inferSelect"];
type ConnectedAccountRow = SchemaTables["connectedAccounts"]["$inferSelect"];
type UserInsert = SchemaTables["user"]["$inferInsert"];
type ConnectedAccountInsert = SchemaTables["connectedAccounts"]["$inferInsert"];

const isAuthError = (error: unknown): error is { message: string } => {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  if (!message) return false;
  return message.includes("invalid authentication") || message.includes("401");
};

export async function GET(_request: NextRequest) {
  try {
    // Lazy load dependencies to reduce initial bundle size
    const [{ createClient }, { dbMinimal }, { user: userTable, connectedAccounts }, { googleApiService }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/db-minimal'),
      import('@/shared/schema-tables'),
      import('@/lib/google-api-service'),
    ]);

    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let userId: string | null = null;
    let dbUser: UserRow | null = null;

    if (devBypass) {
      console.log('🔧 Development mode: Bypassing auth for calendar API');
      // Use default development user ID
      userId = '00000000-0000-4000-8000-000000000000';

      // Get or create development user
      try {
        [dbUser] = await dbMinimal
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

        userId = authUser.id;

        // Get user from database
        [dbUser] = await dbMinimal
          .select()
          .from(userTable)
          .where(eq(userTable.id, authUser.id))
          .limit(1);

      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    let events: any[] = [];

    // Fetch events from primary account if connected
    if (dbUser?.googleCalendarConnected && dbUser.accessToken) {
      const primaryAuth: GoogleAuth = {
        accessToken: dbUser.accessToken,
        refreshToken: dbUser.refreshToken || undefined,
      };

      try {
        events = await googleApiService.getCalendarEvents(primaryAuth, dbUser.email);
      } catch (error) {
        if (isAuthError(error)) {
          if (primaryAuth.refreshToken) {
            console.log('Access token expired, attempting to refresh...');
            try {
              const refreshedTokens = await googleApiService.refreshAccessToken(primaryAuth.refreshToken);

              primaryAuth.accessToken = refreshedTokens.access_token;

              await dbMinimal
                .update(userTable)
                .set({ accessToken: refreshedTokens.access_token } as Partial<UserInsert>)
                .where(eq(userTable.id, dbUser.id));

              events = await googleApiService.getCalendarEvents(primaryAuth, dbUser.email);
              console.log('Successfully refreshed token and fetched calendar events');
            } catch (refreshError) {
              console.error('Failed to refresh access token:', refreshError);
              throw error;
            }
          } else {
            console.error('No refresh token available to refresh expired access token');
            return NextResponse.json({
              error: "Calendar authentication expired",
              errorType: "AUTH_EXPIRED",
              message: `Calendar access for ${dbUser.email || 'your account'} has expired. Please reconnect to view your events.`,
              userEmail: dbUser.email,
            }, { status: 401 });
          }
        } else {
          console.error("Error fetching primary calendar:", error);
          throw error;
        }
      }
    }

    // Fetch events from secondary accounts
    const calendarOwnerId = devBypass ? '00000000-0000-4000-8000-000000000000' : userId;
    if (!calendarOwnerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const secondaryAccounts = await dbMinimal
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, calendarOwnerId));

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
          if (isAuthError(error) && auth.refreshToken) {
            try {
              console.log(`Refreshing token for secondary account ${account.id}...`);
              const refreshedTokens = await googleApiService.refreshAccessToken(auth.refreshToken);
              auth.accessToken = refreshedTokens.access_token;
              
              // Update database with new token
              await dbMinimal
                .update(connectedAccounts)
                .set({ accessToken: refreshedTokens.access_token } as Partial<ConnectedAccountInsert>)
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
          if (isAuthError(error) && auth.refreshToken) {
            try {
              console.log(`Refreshing token for calendar events for account ${account.id}...`);
              const refreshedTokens = await googleApiService.refreshAccessToken(auth.refreshToken);
              auth.accessToken = refreshedTokens.access_token;
              
              // Update database with new token
              await dbMinimal
                .update(connectedAccounts)
                .set({ accessToken: refreshedTokens.access_token } as Partial<ConnectedAccountInsert>)
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
          await dbMinimal
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
