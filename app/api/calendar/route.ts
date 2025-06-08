import { NextResponse } from 'next/server'
import { storage } from '@/server/storage'
import { googleCalendarService } from '@/server/google-calendar'

const DEFAULT_USER_ID = 1

export async function GET() {
  try {
    const user = await storage.getUser(DEFAULT_USER_ID)
    let events: any[] = []

    if (user?.googleCalendarConnected && user.accessToken) {
      try {
        const googleEvents = await googleCalendarService.getCalendarEvents(
          user.accessToken, 
          user.refreshToken || undefined
        )
        
        events = googleEvents.map(event => ({
          id: event.id,
          title: event.title,
          date: event.startTime.toISOString().split('T')[0],
          time: event.startTime.toTimeString().slice(0, 5),
          type: "google-event",
          source: "google",
          description: event.description,
          location: event.location,
          endTime: event.endTime.toTimeString().slice(0, 5),
          htmlLink: event.htmlLink
        }))
      } catch (error) {
        console.error("Google Calendar sync error:", error)
        events = []
      }
    }
    
    return NextResponse.json(events)
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 })
  }
}