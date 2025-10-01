import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import {
  user as userSchema,
  userCalendars,
  connectedAccounts,
} from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";
import { db } from "@/server/db";
import { getGoogleOAuth2Client } from "@/server/google-calendar";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  allDay?: boolean;
  color?: string;
  calendarId?: string;
  calendarName?: string;
  source: "google" | "local";
}

export async function GET(
  request: Request,
): Promise<NextResponse<ActionResponse<CalendarEvent[]>>> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const userId = user.id;

    let currentUser;
    try {
      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("id, google_calendar_connected, access_token, refresh_token")
        .eq("id", userId)
        .single();

      if (userError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch user data",
          },
          { status: 500 },
        );
      }

      currentUser = {
        ...userData,
        googleCalendarConnected: userData.google_calendar_connected,
        accessToken: userData.access_token,
        refreshToken: userData.refresh_token,
      };
    } catch (dbError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Database connection failed. Please check your internet connection or try again later.",
        },
        { status: 503 },
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found in database",
        },
        { status: 400 },
      );
    }

    if (!currentUser.googleCalendarConnected) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Google Calendar not connected. Please go to Settings and click "Connect Calendar".',
        },
        { status: 400 },
      );
    }

    if (!currentUser.accessToken) {
      return NextResponse.json({
        success: true,
        data: [],
        message:
          "Calendar connected but no events available. Try reconnecting your calendar.",
      });
    }

    // Get all enabled calendars for the user using Supabase client
    const { data: enabledCalendars, error: calendarsError } = await supabase
      .from("user_calendars")
      .select(
        `
        *,
        connected_accounts (
          access_token,
          refresh_token
        )
      `,
      )
      .eq("user_id", userId)
      .eq("is_enabled", true);

    if (calendarsError) {
      console.error("Error fetching calendars:", calendarsError);
      // Continue with empty calendars array instead of failing
    }

    // If no enabled calendars, use the primary calendar
    let calendarsToFetch =
      enabledCalendars && enabledCalendars.length > 0
        ? enabledCalendars.map((cal) => ({
            calendar_id: cal.calendar_id || "primary",
            name: cal.name || "Primary Calendar",
            color: cal.color,
            connected_accounts: cal.connected_accounts || {
              access_token: currentUser.accessToken,
              refresh_token: currentUser.refreshToken,
            },
          }))
        : [
            {
              calendar_id: "primary",
              name: "Primary Calendar",
              color: null,
              connected_accounts: {
                access_token: currentUser.accessToken,
                refresh_token: currentUser.refreshToken,
              },
            },
          ];

    // Fetch events from the start of today to 7 days from now
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Fetch from 30 days ago
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    // Also fetch events from connected accounts
    const { data: secondaryAccounts } = await supabase
      .from("connected_accounts")
      .select("id, access_token, refresh_token, provider")
      .eq("user_id", userId)
      .eq("provider", "google");

    // Fetch events from primary account calendars
    const primaryEventsPromises = calendarsToFetch.map(async (calendar) => {
      try {
        const oauth2Client = getGoogleOAuth2Client(
          calendar.connected_accounts.access_token,
          calendar.connected_accounts.refresh_token ?? undefined,
        );

        const googleCalendar = google.calendar({
          version: "v3",
          auth: oauth2Client,
        });

        const response = await googleCalendar.events.list({
          calendarId: calendar.calendar_id,
          timeMin: thirtyDaysAgo.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
        });

        return (response.data.items || []).map((event) => ({
          id: event.id || "",
          title: event.summary || "Untitled Event",
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          description: event.description || undefined,
          location: event.location || undefined,
          allDay: !event.start?.dateTime,
          color:
            calendar.color || event.colorId
              ? `var(--google-calendar-${event.colorId})`
              : undefined,
          calendarId: calendar.calendar_id,
          calendarName: calendar.name,
          source: "google" as const,
        }));
      } catch (error) {
        console.error(
          `Error fetching events from calendar ${calendar.calendar_id}:`,
          error,
        );
        return [];
      }
    });

    // Fetch events from secondary accounts (primary calendar only, view-only)
    const secondaryEventsPromises = (secondaryAccounts || []).map(
      async (account) => {
        try {
          if (!account.access_token) return [];

          const oauth2Client = getGoogleOAuth2Client(
            account.access_token,
            account.refresh_token ?? undefined,
          );

          const googleCalendar = google.calendar({
            version: "v3",
            auth: oauth2Client,
          });

          const response = await googleCalendar.events.list({
            calendarId: "primary",
            timeMin: thirtyDaysAgo.toISOString(),
            timeMax: thirtyDaysFromNow.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
          });

          // Get account email for labeling
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

          return (response.data.items || []).map((event) => ({
            id: `${account.id}-${event.id}` || "",
            title: event.summary || "Untitled Event",
            start: event.start?.dateTime || event.start?.date || "",
            end: event.end?.dateTime || event.end?.date || "",
            description: event.description || undefined,
            location: event.location || undefined,
            allDay: !event.start?.dateTime,
            color: event.colorId
              ? `var(--google-calendar-${event.colorId})`
              : "rgba(147, 51, 234, 0.3)", // Purple tint for secondary accounts
            calendarId: "primary",
            calendarName: `${accountEmail} (view-only)`,
            source: "google" as const,
          }));
        } catch (error) {
          console.error(
            `Error fetching events from secondary account ${account.id}:`,
            error,
          );
          return [];
        }
      },
    );

    const eventsArrays = await Promise.all([
      ...primaryEventsPromises,
      ...secondaryEventsPromises,
    ]);
    const events = eventsArrays.flat();

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch calendar events: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}
