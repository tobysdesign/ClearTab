import { NextResponse } from 'next/server'
import { getServerSession, type Session } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { type ActionResponse } from '@/types/actions'
import { user, userCalendars, connectedAccounts } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { google } from 'googleapis'
import { db } from '@/server/db'
import { getGoogleOAuth2Client } from '@/server/google-calendar'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  allDay?: boolean
  color?: string
  calendarId?: string
  calendarName?: string
  source: 'google' | 'local'
}

export async function GET(
  request: Request
): Promise<NextResponse<ActionResponse<CalendarEvent[]>>> {
  console.time('calendar-api-total');
  console.log("Calendar API: Starting GET request");
  
  try {
    console.time('calendar-session');
    const session = await getServerSession(authOptions)
    console.timeEnd('calendar-session');
    
    const userId = session?.user?.id
    console.log("Calendar API: Session user ID:", userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    console.time('calendar-user-query');
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    })
    console.timeEnd('calendar-user-query');
    console.log("Calendar API: User query complete, connected:", currentUser?.googleCalendarConnected);

    if (
      !currentUser ||
      !currentUser.googleCalendarConnected ||
      !currentUser.accessToken
    ) {
      console.timeEnd('calendar-api-total');
      return NextResponse.json({
        success: false,
        error: 'Google Calendar not connected'
      }, { status: 400 })
    }

    // Get all enabled calendars for the user
    const enabledCalendars = await db
      .select()
      .from(userCalendars)
      .innerJoin(
        connectedAccounts,
        eq(userCalendars.connectedAccountId, connectedAccounts.id)
      )
      .where(
        and(
          eq(userCalendars.userId, userId),
          eq(userCalendars.isEnabled, true)
        )
      );
    
    console.log(`Calendar API: Found ${enabledCalendars.length} enabled calendars`);
    
    // If no enabled calendars, use the primary calendar
    let calendarsToFetch = enabledCalendars.length > 0 
      ? enabledCalendars
      : [{ 
          user_calendars: { 
            calendarId: 'primary',
            name: 'Primary Calendar',
            color: null
          },
          connected_accounts: {
            accessToken: currentUser.accessToken,
            refreshToken: currentUser.refreshToken
          }
        }];
    
    console.time('calendar-google-api');
    
    // Fetch events from the start of today to 7 days from now
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Fetch from 30 days ago
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    // Fetch events from all enabled calendars
    const allEventsPromises = calendarsToFetch.map(async (calendar) => {
      try {
        const oauth2Client = getGoogleOAuth2Client(
          calendar.connected_accounts.accessToken, 
          calendar.connected_accounts.refreshToken ?? undefined
        );
        
        const googleCalendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const response = await googleCalendar.events.list({
          calendarId: calendar.user_calendars.calendarId,
          timeMin: thirtyDaysAgo.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });
        
        return (response.data.items || []).map(event => ({
          id: event.id || '',
          title: event.summary || 'Untitled Event',
          start: event.start?.dateTime || event.start?.date || '',
          end: event.end?.dateTime || event.end?.date || '',
          description: event.description || undefined,
          location: event.location || undefined,
          allDay: !event.start?.dateTime,
          color: calendar.user_calendars.color || event.colorId ? `var(--google-calendar-${event.colorId})` : undefined,
          calendarId: calendar.user_calendars.calendarId,
          calendarName: calendar.user_calendars.name,
          source: 'google' as const
        }));
      } catch (error) {
        console.error(`Error fetching events from calendar ${calendar.user_calendars.calendarId}:`, error);
        return [];
      }
    });
    
    const eventsArrays = await Promise.all(allEventsPromises);
    const events = eventsArrays.flat();
    
    console.timeEnd('calendar-google-api');
    console.timeEnd('calendar-api-total');
    
    return NextResponse.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('Calendar API error:', error)
    console.timeEnd('calendar-api-total');
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch calendar events'
    }, { status: 500 })
  }
}