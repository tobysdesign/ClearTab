'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestCalendarPage() {
  const [calendarStatus, setCalendarStatus] = useState<any>(null)
  const [calendarData, setCalendarData] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchCalendarStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar/status')
      const data = await response.json()
      setCalendarStatus({ 
        status: response.status, 
        data,
        ok: response.ok 
      })
    } catch (error: any) {
      setCalendarStatus({ error: error.message })
    }
    setLoading(false)
  }

  const fetchCalendarData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar')
      const data = await response.json()
      setCalendarData({ 
        status: response.status, 
        data,
        ok: response.ok,
        headers: {
          contentType: response.headers.get('content-type')
        }
      })
    } catch (error: any) {
      setCalendarData({ error: error.message })
    }
    setLoading(false)
  }

  const fetchUserInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/user')
      const data = await response.json()
      setUserInfo({ 
        status: response.status, 
        data,
        ok: response.ok 
      })
    } catch (error: any) {
      setUserInfo({ error: error.message })
    }
    setLoading(false)
  }

  const connectCalendar = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/connect-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      alert(`Calendar connection result: ${JSON.stringify(data)}`)
      if (data.success) {
        window.location.reload()
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Calendar Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchUserInfo} disabled={loading}>
              Fetch User Info
            </Button>
            {userInfo && (
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto text-white">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchCalendarStatus} disabled={loading}>
              Check Calendar Status
            </Button>
            {calendarStatus && (
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto text-white">
                {JSON.stringify(calendarStatus, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchCalendarData} disabled={loading}>
              Fetch Calendar Events
            </Button>
            {calendarData && (
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto text-white">
                {JSON.stringify(calendarData, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={connectCalendar} variant="default" disabled={loading}>
              Connect Calendar Manually
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}