"use client";

// Icons replaced with ASCII placeholders
import * as React from "react";
// import { useSession } from 'next-auth/react' // Disabled - using Supabase
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getSupabaseClient, isExtensionEnvironment } from '@/lib/extension-utils'
import styles from "./connected-apps-settings.module.css";

export function ConnectedAppsSettings() {
  const [supabase, setSupabase] = React.useState<any>(null);
  const [session, setSession] = React.useState<{ user: { email: string } } | null>(null);

  // Initialize Supabase client based on environment
  React.useEffect(() => {
    const initSupabase = async () => {
      const client = await getSupabaseClient()
      setSupabase(client)
    }
    initSupabase()
  }, [])

  React.useEffect(() => {
    const getSession = async () => {
      if (!supabase) return

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    getSession();
  }, [supabase]);

  const isGoogleConnected = session?.user?.app_metadata?.provider === "google";

  const handleConnectGoogle = async () => {
    if (!supabase) {
      console.warn('No Supabase client available for Google sign in (extension mode)')
      return
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes:
          "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const handleDisconnectGoogle = async () => {
    // Implement disconnect logic here
    console.log("Disconnecting Google Calendar");
  };

  return (
    <div className={styles.spaceY6}>
      <h3 className={styles.titleLarge}>Connected Apps</h3>
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Connect your Google Calendar to view your schedule and events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGoogleConnected ? (
            <div className={styles.flexJustifyBetween}>
              <div className={styles.flexItemsGap2Green}>
                <span className={styles.iconMedium}>•</span>
                <p className={styles.fontMedium}>Connected</p>
              </div>
              <Button variant="outline" onClick={handleDisconnectGoogle}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className={styles.flexJustifyBetween}>
              <div className={styles.flexItemsGap2Muted}>
                <span className={styles.iconYellow}>•</span>
                <p>Not connected</p>
              </div>
              <Button onClick={handleConnectGoogle}>
                Connect
                <span className={styles.iconSmall}>•</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
