'use client'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/components/auth/supabase-auth-provider'
import LogOut from 'lucide-react/dist/esm/icons/log-out'
import Calendar from 'lucide-react/dist/esm/icons/calendar'
import Plus from 'lucide-react/dist/esm/icons/plus'
import X from 'lucide-react/dist/esm/icons/x'
import User from 'lucide-react/dist/esm/icons/user'
import { useQuery } from '@tanstack/react-query'

// For now, no secondary accounts (real functionality to be implemented later)
const mockSecondaryAccounts: any[] = []

export function AccountSettings() {
  const { user, signOut: supabaseSignOut } = useAuth()
  
  const { data: isCalendarConnected } = useQuery({
    queryKey: ['googleCalendarConnected'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/status', {
        credentials: 'include'
      })
      if (!res.ok) return false
      const data = await res.json()
      return data.connected
    }
  })

  function handleLogout() {
    console.log('Logout button clicked - redirecting to logout page')
    // Simply navigate to the logout page
    window.location.href = '/logout'
  }

  async function handleConnectCalendar() {
    try {
      console.log('Connect calendar button clicked')
      
      // First try the manual connection endpoint
      const response = await fetch('/api/auth/connect-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      const data = await response.json()
      console.log('Connect calendar response:', data)
      
      if (data.success) {
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        // Fall back to OAuth re-authentication
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        })
      }
    } catch (error) {
      console.error('Error connecting calendar:', error)
    }
  }

  function handleAddAccount() {
    // TODO: Implement multiple account support with Supabase
    console.log('Add account - to be implemented with Supabase')
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
            <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-10 h-10 rounded-full" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-medium text-white">
                {user?.user_metadata?.full_name || 'Primary Account'}
              </div>
              <div className="text-sm text-white">
                {user?.email || 'Not signed in'}
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
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    {account.image ? (
                      <img src={account.image} alt="Profile" className="w-10 h-10 rounded-full" />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">{account.name}</div>
                    <div className="text-sm text-white">{account.email}</div>
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
            <div className="text-center py-8 text-white">
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
        <p className="text-sm text-white mb-4">
          Customize how your calendar events are displayed in the schedule widget.
        </p>
        <div className="text-sm text-gray-400">
          Display customization options coming soon.
        </div>
      </div>

      {/* Account Actions */}
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Account Actions</h2>
        <div className="space-y-2">
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <div className="text-sm text-gray-400">
            If the button above doesn't work, <a href="/api/auth/logout-redirect" className="text-blue-400 hover:underline">click here to logout</a>
          </div>
        </div>
      </div>
    </div>
  )
} 