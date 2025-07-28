'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { signIn } from "next-auth/react"

export function ConnectedAppsSettings() {
  const { data: session, update } = useSession()

  const isGoogleConnected = session?.user?.accounts?.some(
    (account: any) => account.provider === 'google'
  );

  const handleConnectGoogle = () => {
    signIn("google", { scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly" });
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