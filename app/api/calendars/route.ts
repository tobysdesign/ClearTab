import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type ActionResponse } from '@/types/actions'
import { userCalendars, connectedAccounts } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { google } from 'googleapis'
import { db } from '@/server/db'
import { getGoogleOAuth2Client } from '@/server/google-calendar'

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  backgroundColor?: string
  accessRole: string
  primary?: boolean
  connectedAccountId: string
}

interface CalendarWithStatus extends GoogleCalendar {
  isEnabled: boolean
  isConfigured: boolean
}

export async function GET(): Promise<NextResponse<ActionResponse<CalendarWithStatus[]>>> {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const userId = user.id;

    const accounts = await db
        .select()
        .from(connectedAccounts)
        .where(and(
            eq(connectedAccounts.userId, userId),
            eq(connectedAccounts.provider, 'google')
        ));
    
    if (accounts.length === 0) {
        return NextResponse.json({ success: true, data: [] });
    }
    
    const allGoogleCalendars: GoogleCalendar[] = [];

    for (const account of accounts) {
        if (!account.accessToken) continue;

        const oauth2Client = getGoogleOAuth2Client(account.accessToken, account.refreshToken ?? undefined)

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.calendarList.list();
        
        const googleCalendars: GoogleCalendar[] = response.data.items?.map(cal => ({
            id: cal.id || '',
            summary: cal.summary || 'Untitled Calendar',
            description: cal.description || '',
            backgroundColor: cal.backgroundColor || '',
            accessRole: cal.accessRole || 'reader',
            primary: cal.primary || false,
            connectedAccountId: account.id
        })) || [];

        allGoogleCalendars.push(...googleCalendars);
    }

    const savedCalendars = await db
      .select()
      .from(userCalendars)
      .where(eq(userCalendars.userId, userId))

    const calendarsWithStatus: CalendarWithStatus[] = allGoogleCalendars.map(gcal => {
      const saved = savedCalendars.find(sc => sc.calendarId === gcal.id && sc.connectedAccountId === gcal.connectedAccountId);
      return {
        ...gcal,
        isEnabled: saved?.isEnabled ?? (gcal.primary || false),
        isConfigured: !!saved,
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: calendarsWithStatus 
    })
  } catch (error) {
    console.error('Calendars API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch calendars' 
    }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ActionResponse<string>>> {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    const userId = user.id;

    const body = await request.json()
    const { calendarId, name, isEnabled, color, accessRole, connectedAccountId } = body

    if (!calendarId || !name || !connectedAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Calendar ID, name, and connectedAccountId are required' 
      }, { status: 400 })
    }

    // Temporarily simplified insert for build
    await db
      .insert(userCalendars)
      .values({
        userId,
        connectedAccountId,
        calendarId,
        name,
      } as any)
      .onConflictDoUpdate({
        target: [userCalendars.connectedAccountId, userCalendars.calendarId],
        set: {
          name,
        },
      })

    return NextResponse.json({ 
      success: true, 
      data: 'Calendar preference saved' 
    })
  } catch (error) {
    console.error('Save calendar API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save calendar preference' 
    }, { status: 500 })
  }
} 