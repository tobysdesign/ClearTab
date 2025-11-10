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
          return NextResponse.json(
            {
              error: "Unauthorized",
              success: false,
              data: []
            },
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }

        userId = authUser.id;

        // Get user from database
        [dbUser] = await dbMinimal
          .select()
          .from(userTable)
          .where(eq(userTable.id, authUser.id))
          .limit(1);

      if (!dbUser) {
        return NextResponse.json(
          {
            error: "User not found",
            success: false,
            data: []
          },
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    let events: any[] = [];

    // Debug primary account status
    console.log('Calendar API - Primary account debug:', {
      userId,
      userExists: !!dbUser,
      googleCalendarConnected: dbUser?.googleCalendarConnected,
      hasAccessToken: !!dbUser?.accessToken,
      accessTokenLength: dbUser?.accessToken?.length,
      hasRefreshToken: !!dbUser?.refreshToken,
      email: dbUser?.email
    });

    // Fetch events from primary account if connected
    let primaryAccountFailed = false;
    let primaryAccountError = '';
    if (dbUser?.googleCalendarConnected && dbUser.accessToken) {
      const primaryAuth: GoogleAuth = {
        accessToken: dbUser.accessToken,
        refreshToken: dbUser.refreshToken || undefined,
      };

      try {
        const primaryEvents = await googleApiService.getCalendarEvents(primaryAuth, dbUser.email);
        events = primaryEvents;
        console.log(`✅ Successfully fetched ${primaryEvents.length} events from primary account (${dbUser.email})`);
      } catch (error) {
        if (isAuthError(error)) {
          if (primaryAuth.refreshToken) {
            console.log(`⚠️ Primary account (${dbUser.email}): Access token expired, attempting to refresh...`);
            try {
              const refreshedTokens = await googleApiService.refreshAccessToken(primaryAuth.refreshToken);

              primaryAuth.accessToken = refreshedTokens.access_token;

              await dbMinimal
                .update(userTable)
                .set({ accessToken: refreshedTokens.access_token } as Partial<UserInsert>)
                .where(eq(userTable.id, dbUser.id));

              const primaryEvents = await googleApiService.getCalendarEvents(primaryAuth, dbUser.email);
              events = primaryEvents;
              console.log(`✅ Successfully refreshed primary token and fetched ${primaryEvents.length} events from ${dbUser.email}`);
            } catch (refreshError) {
              primaryAccountFailed = true;
              primaryAccountError = refreshError instanceof Error ? refreshError.message : 'Token refresh failed';
              console.error(`❌ Failed to refresh primary access token for ${dbUser.email}:`, refreshError);
              console.log('⚠️ Primary account refresh failed, will try connected accounts instead');
            }
          } else {
            primaryAccountFailed = true;
            primaryAccountError = 'No refresh token available';
            console.log(`⚠️ Primary account (${dbUser.email}): No refresh token available, will try connected accounts instead`);
          }
        } else {
          primaryAccountFailed = true;
          primaryAccountError = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Error fetching primary calendar for ${dbUser.email}:`, error);
          console.log('⚠️ Primary account error, will try connected accounts instead');
        }
      }
    } else if (dbUser?.googleCalendarConnected && !dbUser.accessToken) {
      primaryAccountFailed = true;
      primaryAccountError = 'No access token stored';
      console.log(`⚠️ Primary account (${dbUser?.email}): googleCalendarConnected=true but no access token`);
    }

    // Fetch events from secondary accounts
    const calendarOwnerId = devBypass ? '00000000-0000-4000-8000-000000000000' : userId;
    if (!calendarOwnerId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          success: false,
          data: []
        },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    const secondaryAccounts = await dbMinimal
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, calendarOwnerId));

    console.log('Calendar API - Secondary accounts debug:', {
      calendarOwnerId,
      secondaryAccountsCount: secondaryAccounts.length,
      accounts: secondaryAccounts.map(acc => ({
        id: acc.id,
        hasAccessToken: !!acc.accessToken,
        accessTokenLength: acc.accessToken?.length,
        hasRefreshToken: !!acc.refreshToken
      }))
    });

    let secondaryAccountsSuccess = 0;
    let secondaryAccountsFailed = 0;

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
          secondaryAccountsSuccess++;
          console.log(`✅ Successfully fetched ${secondaryEventsList.length} events from secondary account (${accountEmail})`);
        } catch (error: any) {
          if (isAuthError(error) && auth.refreshToken) {
            try {
              console.log(`⚠️ Refreshing token for calendar events for account ${accountEmail}...`);
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
              secondaryAccountsSuccess++;
              console.log(`✅ Successfully refreshed token and fetched ${secondaryEventsList.length} events from ${accountEmail}`);
            } catch (refreshError) {
              secondaryAccountsFailed++;
              console.error(`❌ Failed to refresh token for calendar events for ${accountEmail}:`, refreshError);
              throw error; // Let the outer catch handle this
            }
          } else {
            secondaryAccountsFailed++;
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

    // Log summary of calendar sync
    console.log('📅 Calendar API Summary:', {
      primaryAccount: dbUser?.googleCalendarConnected ?
        (primaryAccountFailed ? `❌ Failed (${primaryAccountError})` : `✅ Success`) :
        '➖ Not connected',
      primaryAccountEmail: dbUser?.email,
      secondaryAccountsTotal: secondaryAccounts.length,
      secondaryAccountsSuccess,
      secondaryAccountsFailed,
      totalEvents: events.length,
      timestamp: new Date().toISOString()
    });

    // If primary account failed and we have no events at all, inform the user
    if (primaryAccountFailed && events.length === 0) {
      console.warn(`⚠️ WARNING: Primary account (${dbUser?.email}) failed and no secondary accounts provided events. User may need to reconnect.`);
    }

    return NextResponse.json(
      {
        success: true,
        data: events,
        debug: process.env.NODE_ENV === 'development' ? {
          primaryAccountStatus: primaryAccountFailed ? 'failed' : 'success',
          primaryAccountError: primaryAccountFailed ? primaryAccountError : null,
          secondaryAccountsSuccess,
          secondaryAccountsFailed
        } : undefined
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("Calendar API error:", error);

    // Ensure we always return valid JSON, even for unexpected errors
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch calendar events";

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        data: [] // Always include data field for consistency
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      },
    );
  }
}
