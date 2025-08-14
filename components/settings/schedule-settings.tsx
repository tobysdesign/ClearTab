'use client'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import Calendar from 'lucide-react/dist/esm/icons/calendar'
import { useQuery } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'

export function ScheduleSettings() {
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
      },
    })
  }
  const { data: isConnected } = useQuery({
    queryKey: ['googleCalendarConnected'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/status')
      if (!res.ok) return false
      const data = await res.json()
      return data.connected
    }
  })

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <EmptyState
          renderIcon={() => <Calendar className="h-6 w-6 text-white/40" />}
          title="Connect your calendar"
          description="See your schedule at a glance by connecting your Google Calendar."
          action={{
            label: "Connect Google Calendar",
            onClick: handleGoogleSignIn
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-2">Connected Calendars</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your connected Google Calendars and customize how they appear.
        </p>
        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
        >
          Refresh Calendar Connection
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Display Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize how your calendar events are displayed in the schedule widget.
        </p>
      </div>
    </div>
  )
} 