import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  htmlLink?: string;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    const redirectUri = 'https://t0.by/api/auth/google/callback';
      
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
  }

  async exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined
    };
  }

  async getUserInfo(accessToken: string): Promise<{ id: string; email: string; name: string; picture?: string }> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    return {
      id: data.id!,
      email: data.email!,
      name: data.name!,
      picture: data.picture || undefined
    };
  }

  async getCalendarEvents(accessToken: string, refreshToken?: string): Promise<CalendarEvent[]> {
    this.oauth2Client.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken 
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 30); // Next 30 days

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: endDate.toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      return events.map(event => ({
        id: event.id!,
        title: event.summary || 'No Title',
        description: event.description ?? undefined,
        startTime: new Date(event.start?.dateTime || event.start?.date || now),
        endTime: new Date(event.end?.dateTime || event.end?.date || now),
        location: event.location ?? undefined,
        attendees: event.attendees?.map(a => a.email!).filter(Boolean),
        htmlLink: event.htmlLink ?? undefined
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  async createCalendarEvent(
    accessToken: string, 
    refreshToken: string, 
    event: Omit<CalendarEvent, 'id' | 'htmlLink'>
  ): Promise<CalendarEvent> {
    this.oauth2Client.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken 
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({ email })),
      },
    });

    const createdEvent = response.data;
    return {
      id: createdEvent.id!,
      title: createdEvent.summary || event.title,
      description: createdEvent.description ?? event.description,
      startTime: new Date(createdEvent.start?.dateTime || createdEvent.start?.date || event.startTime),
      endTime: new Date(createdEvent.end?.dateTime || createdEvent.end?.date || event.endTime),
      location: createdEvent.location ?? event.location,
      attendees: createdEvent.attendees?.map(a => a.email!).filter(Boolean) || event.attendees,
      htmlLink: createdEvent.htmlLink ?? undefined
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token!;
  }
}

export const googleCalendarService = new GoogleCalendarService();