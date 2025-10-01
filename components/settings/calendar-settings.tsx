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
import { createClient } from '@/lib/supabase/client'

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
  const queryClient = useQueryClient()

  const supabase = createClient()

  const handleGoogleSignIn = async () => {
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
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Connect and manage your Google Calendars.
          </p>
          <Button onClick={handleGoogleSignIn}>
            Connect Google Calendar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <Accordion type="multiple" className="w-full" defaultValue={accounts.map(a => a.id)}>
            {accounts.map((account) => (
              <AccordionItem value={account.id} key={account.id}>
                <AccordionTrigger>{account.email}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {calendars
                      .filter((cal) => cal.connectedAccountId === account.id)
                      .map((cal) => (
                        <div
                          key={cal.id}
                          className="flex items-center justify-between"
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
                      <p className="text-sm text-muted-foreground">
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