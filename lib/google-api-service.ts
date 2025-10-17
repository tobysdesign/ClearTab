// Isolated Google API service with dynamic imports
// This prevents googleapis from being bundled in other API routes

export interface GoogleAuth {
  accessToken: string;
  refreshToken?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  allDay: boolean;
  color: string;
  calendarId: string;
  calendarName: string;
  source: "google";
}

class GoogleApiService {
  private async getOAuth2Client(auth: GoogleAuth) {
    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    );

    oauth2Client.setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
    });

    return oauth2Client;
  }

  async getCalendarEvents(auth: GoogleAuth, accountEmail: string): Promise<CalendarEvent[]> {
    const oauth2Client = await this.getOAuth2Client(auth);
    const { google } = await import("googleapis");
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

    return (response.data.items || []).map((event): CalendarEvent => ({
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
      calendarName: accountEmail,
      source: "google" as const,
    }));
  }

  async getUserInfo(auth: GoogleAuth): Promise<string> {
    const oauth2Client = await this.getOAuth2Client(auth);
    const { google } = await import("googleapis");
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });

    try {
      const { data: userInfo } = await oauth2.userinfo.get();
      return userInfo.email || "Unknown User";
    } catch {
      return "Secondary Account";
    }
  }
}

export const googleApiService = new GoogleApiService();