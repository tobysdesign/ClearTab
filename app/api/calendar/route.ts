import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { AuthOptions } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { type ActionResponse } from '@/types/actions'
import { user } from '@/shared/schema'
import { eq } from 'drizzle-orm'
import { google } from 'googleapis'
import { db } from '@/server/db'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  allDay?: boolean
  color?: string
  source: 'google' | 'local'
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET(
  request: Request
): Promise<NextResponse<ActionResponse<CalendarEvent[]>>> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    )
  }

  try {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    })

    if (
      !currentUser ||
      !currentUser.googleCalendarConnected ||
      !currentUser.accessToken
    ) {
      return NextResponse.json(
        { success: false, error: 'User not connected to Google Calendar' },
        { status: 403 }
      )
    }

    oauth2Client.setCredentials({
      access_token: currentUser.accessToken,
      refresh_token: currentUser.refreshToken ?? undefined,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    // Fetch events from 7 days ago to 30 days from now
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: sevenDaysAgo.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    })
    
    const events = (response.data.items || [])
      .map(event => ({
        id: event.id || '',
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        description: event.description || undefined,
        location: event.location || undefined,
        allDay: !event.start?.dateTime,
        color: event.colorId ? `var(--google-calendar-${event.colorId})` : undefined,
        source: 'google' as const
      }))

    return NextResponse.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch calendar events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}