import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleCalendarEvent } from '../shared/calendar-types';

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

  constructor(
    clientId: string,
    clientSecret: string,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );
  }

  // getAuthUrl(): string {
  //   return this.oauth2Client.generateAuthUrl({
  //     access_type: 'offline',
  //     scope: [
  //       'https://www.googleapis.com/auth/calendar.readonly',
  //       'https://www.googleapis.com/auth/calendar.events',
  //       'https://www.googleapis.com/auth/userinfo.profile',
  //       'https://www.googleapis.com/auth/userinfo.email'
  //     ],
  //     prompt: 'consent'
  //   });
  // }

  // async exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
  //   const { tokens } = await this.oauth2Client.getToken(code);
  //   if (!tokens.access_token) {
  //     throw new Error('No access token received');
  //   }
  //   
  //   return {
  //     accessToken: tokens.access_token,
  //     refreshToken: tokens.refresh_token || undefined
  //   };
  // }

  async getUserInfo(accessToken: string): Promise<{ id: string; email: string; name: string; picture?: string }> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2('v2');
    const userInfo = await oauth2.userinfo.get({ auth: this.oauth2Client });
    
    if (!userInfo.data.id || !userInfo.data.email || !userInfo.data.name) {
      throw new Error('Failed to get user info from Google');
    }

    return {
      id: userInfo.data.id as string,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture ?? undefined,
    };
  }

  async getEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<GoogleCalendarEvent[]> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar('v3');
    const response = await calendar.events.list({
      auth: this.oauth2Client,
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return (response.data.items || []).map((event: calendar_v3.Schema$Event) => ({
      id: event.id || '',
      title: event.summary || '',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || '',
      attendees: event.attendees?.map(attendee => attendee.email || '') || [],
      startTime: event.start?.dateTime || event.start?.date || '',
      endTime: event.end?.dateTime || event.end?.date || '',
      source: 'google'
    }));
  }

  async getCalendarEvents(accessToken: string, refreshToken?: string): Promise<CalendarEvent[]> {
    this.oauth2Client.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken 
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    // Start from beginning of today to catch early morning events
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start from midnight today
    
    // Also check events from yesterday to catch any timezone issues
    const yesterdayStart = new Date(startDate);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14); // Next 14 days to catch more recurring events

    try {
      // Get authenticated user info
      const userInfo = await this.getUserInfo(accessToken);
      console.log(`Calendar request for user: ${userInfo.email} (ID: ${userInfo.id})`);
      console.log(`Fetching events from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // List available calendars to find all accessible calendars
      const calendarList = await calendar.calendarList.list();
      const calendars = calendarList.data.items || [];
      console.log(`Available calendars for ${userInfo.email}:`, calendars.map(cal => ({ 
        id: cal.id, 
        summary: cal.summary,
        primary: cal.primary,
        accessRole: cal.accessRole,
        selected: cal.selected 
      })));
      
      // Also try to search for "Sotten" events specifically across all calendars
      console.log('Searching specifically for "Sotten" events...');

      // Fetch events from all accessible calendars, not just primary
      const allEvents: any[] = [];
      for (const cal of calendars) {
        if (cal.id && cal.accessRole && cal.accessRole !== 'freeBusyReader') {
          try {
            console.log(`Checking calendar: ${cal.summary} (${cal.id})`);
            const response: any = await calendar.events.list({
              calendarId: cal.id,
              timeMin: yesterdayStart.toISOString(),
              timeMax: endDate.toISOString(),
              maxResults: 100,
              singleEvents: true,
              orderBy: 'startTime',
              showDeleted: false
            });
            
            console.log(`Found ${response.data?.items?.length || 0} events in calendar: ${cal.summary}`);
            
            const events = response.data?.items || [];
            // Log each event found in this calendar with more detail
            events.forEach((event: any, idx: number) => {
              const startTime = event.start?.dateTime || event.start?.date;
              const hour = event.start?.dateTime ? new Date(event.start.dateTime).getHours() : null;
              console.log(`  Event ${idx + 1} in ${cal.summary}: "${event.summary}" - ${startTime} (hour: ${hour})`);
              
              // Check for various possible matches including undefined/empty titles and 5am timing
              if (
                (event.summary && (
                  event.summary.toLowerCase().includes('sotten') ||
                  event.summary.toLowerCase().includes('5am') ||
                  event.summary.toLowerCase().includes('morning')
                )) ||
                !event.summary ||
                event.summary === 'undefined' ||
                (hour !== null && (hour === 5 || hour === 4 || hour === 6)) // Check around 5am
              ) {
                console.log(`  --> POTENTIAL MATCH! Title: "${event.summary}", Time: ${startTime}, Hour: ${hour}`);
                console.log(`  --> Full event details:`, JSON.stringify(event, null, 2));
              }
            });
            
            // Add calendar source info to each event
            events.forEach((event: any) => {
              event.calendarSource = cal.summary || cal.id;
              event.calendarId = cal.id;
            });
            allEvents.push(...events);
          } catch (calError: any) {
            console.log(`Could not access calendar ${cal.summary}: ${calError.message}`);
          }
        }
      }

      // Add detailed logging for all events found
      console.log(`Total events found across all calendars: ${allEvents.length}`);
      allEvents.forEach((event: any, index: number) => {
        console.log(`Event ${index + 1}: "${event.summary}" at ${event.start?.dateTime || event.start?.date} from calendar: ${event.calendarSource}`);
      });

      // Sort all events by start time
      allEvents.sort((a: any, b: any) => {
        const aTime = new Date(a.start?.dateTime || a.start?.date || startDate);
        const bTime = new Date(b.start?.dateTime || b.start?.date || startDate);
        return aTime.getTime() - bTime.getTime();
      });

      return allEvents.map((event: any) => ({
        id: event.id!,
        title: event.summary || 'No Title',
        description: event.description ?? undefined,
        startTime: event.start?.dateTime || event.start?.date || startDate,
        endTime: event.end?.dateTime || event.end?.date || startDate,
        originalStartTime: event.start,
        originalEndTime: event.end,
        location: event.location ?? undefined,
        attendees: event.attendees?.map((attendee: { email?: string }) => attendee.email).filter(Boolean) as string[],
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

    return {
      id: response.data.id!,
      title: response.data.summary!,
      description: response.data.description ?? undefined,
      startTime: new Date(response.data.start?.dateTime || response.data.start?.date!),
      endTime: new Date(response.data.end?.dateTime || response.data.end?.date!),
      location: response.data.location ?? undefined,
      attendees: response.data.attendees?.map(attendee => attendee.email!) || [],
      htmlLink: response.data.htmlLink ?? undefined,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token!;
  }
}

export const getGoogleOAuth2Client = (accessToken: string, refreshToken?: string): OAuth2Client => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Automatically refresh the token if it's about to expire
  client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log("new refresh token", tokens.refresh_token);
    }
    console.log("new access token", tokens.access_token);
    client.setCredentials(tokens);
  });

  return client;
};

export const googleCalendarService = new GoogleCalendarService(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  // No redirectUri here, as NextAuth handles the primary OAuth flow.
  // `${process.env.NODE_ENV === 'production' ? 'https://t0.by' : `http://${process.env.REPLIT_DEV_DOMAIN || 'localhost:3000'}`}/api/auth/google/callback`
);