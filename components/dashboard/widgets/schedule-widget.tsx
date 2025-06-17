'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ScheduleWidget() {
  const { data: session, status } = useSession()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true)
      fetch('/api/schedule')
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error(data.error)
          } else {
            setEvents(data.items || [])
          }
          setLoading(false)
        })
    }
  }, [status])

  const isConnected = status === 'authenticated'

  return (
    <Card className="h-full flex flex-col border border-border">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 px-6 pt-6 pb-1.5">
        <CardTitle>Upcoming Schedule</CardTitle>
        {isConnected && <Button variant="ghost" size="sm" onClick={() => signOut()}>Disconnect</Button>}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden relative">
        {status === 'loading' && <p>Loading...</p>}
        
        {status === 'unauthenticated' && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p>Connect to your Google Calendar to see your schedule.</p>
            <Button onClick={() => signIn('google')}>Connect to Google Calendar</Button>
          </div>
        )}

        {isConnected && loading && <p>Fetching events...</p>}
        
        {isConnected && !loading && events.length > 0 && (
          <div className="h-full overflow-y-auto relative">
            <ul className="space-y-2">
              {events.map((event) => (
                <li key={event.id} className="p-2 bg-muted rounded-md">
                  {event.summary}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isConnected && !loading && events.length === 0 && (
          <p>You have no upcoming events.</p>
        )}
      </CardContent>
    </Card>
  )
} 