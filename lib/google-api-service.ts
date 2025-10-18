// Lightweight Google API service - replaces 125MB googleapis package
// Uses direct HTTP requests instead of heavy googleapis library

import { lightweightGoogleApi, type GoogleAuth, type CalendarEvent } from './lightweight-google-api';

class GoogleApiService {
  async getCalendarEvents(auth: GoogleAuth, accountEmail: string): Promise<CalendarEvent[]> {
    return lightweightGoogleApi.getCalendarEvents(auth, accountEmail);
  }

  async getUserInfo(auth: GoogleAuth): Promise<string> {
    return lightweightGoogleApi.getUserInfo(auth);
  }

  async refreshAccessToken(refreshToken: string) {
    return lightweightGoogleApi.refreshAccessToken(refreshToken);
  }

  getAuthUrl(scopes: string[], redirectUri: string, state?: string): string {
    return lightweightGoogleApi.getAuthUrl(scopes, redirectUri, state);
  }

  async exchangeCodeForTokens(code: string, redirectUri: string) {
    return lightweightGoogleApi.exchangeCodeForTokens(code, redirectUri);
  }
}

// Export types for backward compatibility
export type { GoogleAuth, CalendarEvent };

export const googleApiService = new GoogleApiService();