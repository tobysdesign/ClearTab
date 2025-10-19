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
        // User might not exist in dev mode, return empty calendar
        console.log('🔧 Development mode: No user found, returning empty calendar');
        return NextResponse.json({ data: [] });
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

        events = await googleApiService.getCalendarEvents(auth, dbUser.email);
      } catch (error) {
        console.error("Error fetching primary calendar:", error);
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

        // Get account email
        let accountEmail = "Secondary Account";
        try {
          accountEmail = await googleApiService.getUserInfo(auth);
        } catch (e) {
          console.error(
            "Could not fetch email for secondary account:",
            account.id,
          );
        }

        // Get calendar events
        const secondaryEventsList = await googleApiService.getCalendarEvents(auth, accountEmail);

        const secondaryEvents = secondaryEventsList.map((event) => ({
          ...event,
          id: `${account.id}-${event.id}`,
          color: "rgba(147, 51, 234, 0.3)", // Purple tint for secondary accounts
          calendarName: `${accountEmail} (view-only)`,
        }));

        events.push(...secondaryEvents);
      } catch (error: any) {
        console.error(
          `Error fetching events from secondary account ${account.id}:`,
          error.message,
        );
        // If the error is related to an invalid token, it means the user has likely revoked access.
        // We should delete this stale connection to allow the account to be re-linked by someone else.
        if (
          error.response?.data?.error === "invalid_grant" ||
          error.message.includes("invalid_grant")
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

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 },
    );
  }
}
