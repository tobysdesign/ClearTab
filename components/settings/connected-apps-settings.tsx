'use client'

import * as React from 'react'
// import { useSession } from 'next-auth/react' // Disabled - using Supabase
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ExternalLink from 'lucide-react/dist/esm/icons/external-link'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle'
import Info from 'lucide-react/dist/esm/icons/info'

import { createClient } from '@/lib/supabase/client'

export function ConnectedAppsSettings() {
  const supabase = createClient()
  const [session, setSession] = React.useState<any>(null)

  React.useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    getSession()
  }, [supabase.auth])

  const isGoogleConnected = session?.user?.app_metadata?.provider === 'google'

  const handleConnectGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
      },
    })
  };

  const handleDisconnectGoogle = async () => {
    // Implement disconnect logic here
    console.log("Disconnecting Google Calendar");
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Connected Apps</h3>
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Connect your Google Calendar to view your schedule and events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGoogleConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">Connected</p>
              </div>
              <Button variant="outline" onClick={handleDisconnectGoogle}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <p>Not connected</p>
              </div>
              <Button onClick={handleConnectGoogle}>
                Connect
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 