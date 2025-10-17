'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { ConnectedAccountWithEmail } from '@/shared/types'
import { Skeleton } from '@/components/ui/skeleton'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient, isExtensionEnvironment } from '@/lib/extension-utils'
import styles from './calendar-settings.module.css'

interface Calendar {
  id: string
  summary: string
  isEnabled: boolean
  connectedAccountId: string
}

export function CalendarSettings() {
  const [accounts, setAccounts] = useState<ConnectedAccountWithEmail[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingCalendars, setLoadingCalendars] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)
  const queryClient = useQueryClient()

  // Initialize Supabase client based on environment
  useEffect(() => {
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
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  useEffect(() => {
    async function fetchAccounts() {
      setLoadingAccounts(true)
      try {
        const response = await fetch('/api/settings/accounts')
        if (!response.ok) throw new Error('Failed to fetch accounts')
        const data = await response.json()
        setAccounts(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingAccounts(false)
      }
    }

    async function fetchCalendars() {
      setLoadingCalendars(true)
      try {
        const response = await fetch('/api/calendars')
        if (!response.ok) throw new Error('Failed to fetch calendars')
        const res = await response.json()
        if(res.success) {
            setCalendars(res.data)
        } else {
            throw new Error(res.error || 'Failed to fetch calendars')
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingCalendars(false)
      }
    }

    fetchAccounts()
    fetchCalendars()
  }, [])

  async function handleToggleCalendar(
    calendarId: string,
    isEnabled: boolean,
    connectedAccountId: string,
    summary: string,
  ) {
    const originalCalendars = [...calendars]
    // Optimistically update UI
    setCalendars((prev) =>
      prev.map((cal) =>
        cal.id === calendarId ? { ...cal, isEnabled } : cal,
      ),
    )

    try {
      const response = await fetch('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId,
          isEnabled,
          connectedAccountId,
          name: summary, // The API requires a name
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update calendar')
      }
      const res = await response.json()
      if (!res.success) {
        throw new Error(res.error || 'Failed to update calendar')
      }
      // On success, invalidate the schedule query to re-fetch events
      await queryClient.invalidateQueries({ queryKey: ['schedule'] })
    } catch (error) {
      console.error(error)
      // Revert on failure
      setCalendars(originalCalendars)
    }
  }

  const isLoading = loadingAccounts || loadingCalendars

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Calendars</CardTitle>
      </CardHeader>
      <CardContent className={styles.spaceY6}>
        <div className={styles.flexJustifyBetween}>
          <p className={styles.textMuted}>
            Connect and manage your Google Calendars.
          </p>
          <Button onClick={handleGoogleSignIn}>
            Connect Google Calendar
          </Button>
        </div>

        {isLoading ? (
          <div className={styles.spaceY4}>
            <Skeleton className={styles.skeletonFull} />
            <Skeleton className={styles.skeletonFull} />
          </div>
        ) : (
          <Accordion type="multiple" className={styles.accordionFull} defaultValue={accounts.map(a => a.id)}>
            {accounts.map((account) => (
              <AccordionItem value={account.id} key={account.id}>
                <AccordionTrigger>{account.email}</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.spaceY4}>
                    {calendars
                      .filter((cal) => cal.connectedAccountId === account.id)
                      .map((cal) => (
                        <div
                          key={cal.id}
                          className={styles.flexItemsJustifyBetween}
                        >
                          <Label htmlFor={cal.id}>{cal.summary}</Label>
                          <Switch
                            id={cal.id}
                            checked={cal.isEnabled}
                            onCheckedChange={(checked) =>
                              handleToggleCalendar(
                                cal.id,
                                checked,
                                cal.connectedAccountId,
                                cal.summary,
                              )
                            }
                          />
                        </div>
                      ))}
                    {calendars.filter(
                      (cal) => cal.connectedAccountId === account.id,
                    ).length === 0 && (
                      <p className={styles.textSmMuted}>
                        No calendars found for this account.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
} 