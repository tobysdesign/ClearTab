import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { user as userTable, connectedAccounts } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { googleApiService, type GoogleAuth } from "@/lib/google-api-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    const secondaryAccounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, user.id));

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
