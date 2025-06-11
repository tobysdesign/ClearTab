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
    // Use production domain t0.by, fallback to Replit domain for development
    const productionDomain = 't0.by';
    const replitDomain = process.env.REPLIT_DEV_DOMAIN || '6831cd48-e927-4fba-879d-0649453b1e2a-00-10wxp596mzofb.spock.replit.dev';
    const domain = process.env.NODE_ENV === 'production' ? productionDomain : replitDomain;
    const redirectUri = `https://${domain}/api/auth/google/callback`;
      
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
        startTime: new Date(event.start?.dateTime || event.start?.date || startDate),
        endTime: new Date(event.end?.dateTime || event.end?.date || startDate),
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