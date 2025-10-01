import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { user as userTable, connectedAccounts } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

function getGoogleOAuth2Client(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

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
        const oauth2Client = getGoogleOAuth2Client(
          dbUser.accessToken,
          dbUser.refreshToken || undefined,
        );

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const response = await calendar.events.list({
          calendarId: "primary",
          timeMin: thirtyDaysAgo.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
        });

        events = (response.data.items || []).map((event) => ({
          id: event.id || "",
          title: event.summary || "Untitled Event",
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          description: event.description || undefined,
          location: event.location || undefined,
          allDay: !event.start?.dateTime,
          color: event.colorId
            ? `var(--google-calendar-${event.colorId})`
            : "rgba(59, 130, 246, 0.3)",
          calendarId: "primary",
          calendarName: dbUser.email,
          source: "google" as const,
        }));
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
        const oauth2Client = getGoogleOAuth2Client(
          account.accessToken,
          account.refreshToken || undefined,
        );

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const response = await calendar.events.list({
          calendarId: "primary",
          timeMin: thirtyDaysAgo.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
        });

        // Get account email
        const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
        let accountEmail = "Secondary Account";
        try {
          const { data: userInfo } = await oauth2.userinfo.get();
          accountEmail = userInfo.email || accountEmail;
        } catch (e) {
          console.error(
            "Could not fetch email for secondary account:",
            account.id,
          );
        }

        const secondaryEvents = (response.data.items || []).map((event) => ({
          id: `${account.id}-${event.id}` || "",
          title: event.summary || "Untitled Event",
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          description: event.description || undefined,
          location: event.location || undefined,
          allDay: !event.start?.dateTime,
          color: "rgba(147, 51, 234, 0.3)", // Purple tint for secondary accounts
          calendarId: "primary",
          calendarName: `${accountEmail} (view-only)`,
          source: "google" as const,
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
