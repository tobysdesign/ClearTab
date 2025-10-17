"use client";

// Icons replaced with ASCII placeholders
import * as React from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";

import { getSupabaseClient, isExtensionEnvironment } from '@/lib/extension-utils'
import styles from './schedule-settings.module.css';

export function ScheduleSettings() {
  const [supabase, setSupabase] = React.useState<any>(null);

  // Initialize Supabase client based on environment
  React.useEffect(() => {
    const initSupabase = async () => {
      const client = await getSupabaseClient()
      setSupabase(client)
    }
    initSupabase()
  }, [])

  const handleGoogleSignIn = async () => {
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
  const { data: isConnected } = useQuery({
    queryKey: ["googleCalendarConnected"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/status");
      if (!res.ok) return false;
      const data = await res.json();
      return data.connected;
    },
  });

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <EmptyState
          renderIcon={() => <span className={styles.calendarIcon}>◊</span>}
          title="Connect your calendar"
          description="See your schedule at a glance by connecting your Google Calendar."
          action={{
            label: "Connect Google Calendar",
            onClick: handleGoogleSignIn,
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <div>
        <h2 className={styles.heading}>Connected Calendars</h2>
        <p className={styles.description}>
          Manage your connected Google Calendars and customize how they appear.
        </p>
        <Button variant="outline" onClick={handleGoogleSignIn}>
          Refresh Calendar Connection
        </Button>
      </div>

      <div>
        <h2 className={styles.heading}>Display Settings</h2>
        <p className={styles.descriptionOnly}>
          Customize how your calendar events are displayed in the schedule
          widget.
        </p>
      </div>
    </div>
  );
}
