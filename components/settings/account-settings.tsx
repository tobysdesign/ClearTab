'use client'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { signOut, useSession, signIn } from 'next-auth/react'
import { LogOut, Calendar, Plus, X, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

// Mock data structure for demonstration - replace with actual data fetching
const mockSecondaryAccounts = [
  {
    id: '2',
    email: 'work@company.com',
    name: 'Work Account',
    image: null,
    isCalendarConnected: true
  },
  {
    id: '3', 
    email: 'personal2@gmail.com',
    name: 'Personal 2',
    image: null,
    isCalendarConnected: false
  }
]

export function AccountSettings() {
  const { data: session } = useSession()
  
  const { data: isCalendarConnected } = useQuery({
    queryKey: ['googleCalendarConnected'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/status')
      if (!res.ok) return false
      const data = await res.json()
      return data.connected
    }
  })

  function handleLogout() {
    signOut({ callbackUrl: '/' })
  }

  function handleConnectCalendar() {
    signIn('google', { 
      callbackUrl: '/',
      scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
    })
  }

  function handleAddAccount() {
    signIn('google', {
      callbackUrl: '/',
      prompt: 'select_account',
      scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
    })
  }

  function handleRemoveAccount(accountId: string) {
    // Implement remove secondary account logic
    console.log('Remove account:', accountId)
  }

  function handleConnectAccountCalendar(accountId: string) {
    // Implement connect calendar for specific account
    console.log('Connect calendar for account:', accountId)
  }

  return (
    <div className="space-y-8">
      {/* Primary Account Section */}
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Primary Account</h2>
        <div className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-10 h-10 rounded-full" />
              ) : (
                <User className="h-5 w-5 text-gray-300" />
              )}
            </div>
            <div>
              <div className="font-medium text-white">
                {session?.user?.name || 'Primary Account'}
              </div>
              <div className="text-sm text-gray-400">
                {session?.user?.email || 'Not signed in'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCalendarConnected ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Calendar className="h-4 w-4" />
                Calendar Connected
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleConnectCalendar}>
                <Calendar className="h-4 w-4 mr-2" />
                Connect Calendar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">Additional Accounts</h2>
          <Button variant="outline" size="sm" onClick={handleAddAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
        
        <div className="space-y-3">
          {mockSecondaryAccounts.length > 0 ? (
            mockSecondaryAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-[#111111] rounded-lg border border-[#2A2A2A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                    {account.image ? (
                      <img src={account.image} alt="Profile" className="w-10 h-10 rounded-full" />
                    ) : (
                      <User className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">{account.name}</div>
                    <div className="text-sm text-gray-400">{account.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.isCalendarConnected ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <Calendar className="h-4 w-4" />
                      Calendar Connected
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleConnectAccountCalendar(account.id)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Connect Calendar
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveAccount(account.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No additional accounts connected</p>
              <p className="text-xs mt-1">Add a secondary Google account to access multiple calendars</p>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Display Settings */}
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Calendar Display</h2>
        <p className="text-sm text-gray-400 mb-4">
          Customize how your calendar events are displayed in the schedule widget.
        </p>
        <div className="text-sm text-gray-400">
          Display customization options coming soon.
        </div>
      </div>

      {/* Account Actions */}
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Account Actions</h2>
        <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
} 