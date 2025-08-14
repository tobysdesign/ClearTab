'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [calendarStatus, setCalendarStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchUserInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/user')
      const data = await response.json()
      setUserInfo(data)
    } catch (error) {
      setUserInfo({ error: error.message })
    }
    setLoading(false)
  }

  const fetchCalendarStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar/status')
      const data = await response.json()
      setCalendarStatus(data)
    } catch (error) {
      setCalendarStatus({ error: error.message })
    }
    setLoading(false)
  }

  const testLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      const data = await response.json()
      alert(`Logout response: ${JSON.stringify(data)}`)
      if (data.success) {
        window.location.href = '/login'
      }
    } catch (error) {
      alert(`Logout error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Auth & Calendar Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchUserInfo} disabled={loading}>
              Fetch User Info
            </Button>
            {userInfo && (
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto text-black">
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
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto text-black">
                {JSON.stringify(calendarStatus, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logout Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testLogout} variant="destructive">
            Test Logout API
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}