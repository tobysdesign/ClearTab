import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
    })

    const calendar = google.calendar({ version: 'v3', auth })
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: today.toISOString(),
      timeMax: nextWeek.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const items = response.data.items || []
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
  }
} 