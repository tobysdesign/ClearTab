/**
 * Lightweight Google API client to replace googleapis package (125MB → ~5KB)
 * Implements only the calendar and auth functionality we actually use
 */

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

interface GoogleApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

interface GoogleCalendarEventResponse {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  colorId?: string;
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEventResponse[];
}

interface GoogleUserInfoResponse {
  email?: string;
  name?: string;
  id?: string;
}

class LightweightGoogleApiService {
  private baseUrl = 'https://www.googleapis.com';

  private async makeAuthenticatedRequest<T>(
    url: string,
    auth: GoogleAuth,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData: GoogleApiError = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Use the original error message if JSON parsing fails
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getCalendarEvents(auth: GoogleAuth, accountEmail: string): Promise<CalendarEvent[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const params = new URLSearchParams({
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const url = `${this.baseUrl}/calendar/v3/calendars/primary/events?${params}`;

    try {
      const response = await this.makeAuthenticatedRequest<GoogleCalendarEventsResponse>(url, auth);

      return (response.items || []).map((event): CalendarEvent => ({
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
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw error;
    }
  }

  async getUserInfo(auth: GoogleAuth): Promise<string> {
    const url = `${this.baseUrl}/oauth2/v2/userinfo`;

    try {
      const response = await this.makeAuthenticatedRequest<GoogleUserInfoResponse>(url, auth);
      return response.email || "Unknown User";
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return "Secondary Account";
    }
  }

  /**
   * Refresh an access token using a refresh token
   * This replaces google-auth-library OAuth2 token refresh functionality
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const url = 'https://oauth2.googleapis.com/token';

    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      let errorMessage = `Failed to refresh token: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error_description || errorData.error || errorMessage;
      } catch {
        // Use the original error message if JSON parsing fails
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get Google OAuth2 authorization URL
   * This replaces google-auth-library OAuth2 URL generation
   */
  getAuthUrl(scopes: string[], redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.set('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   * This replaces google-auth-library OAuth2 token exchange
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  }> {
    const url = 'https://oauth2.googleapis.com/token';

    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      let errorMessage = `Failed to exchange code: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error_description || errorData.error || errorMessage;
      } catch {
        // Use the original error message if JSON parsing fails
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }
}

export const lightweightGoogleApi = new LightweightGoogleApiService();