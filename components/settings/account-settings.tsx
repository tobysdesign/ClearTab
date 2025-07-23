'use client'

import { Button } from '@/components/ui/button'
import { signOut, useSession } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function AccountSettings() {
  const { data: session } = useSession()

  function handleLogout() {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="space-y-6">
        <h3 className="text-lg font-medium">Account</h3>
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
            Signed in as
            </p>
            <p className="text-lg font-medium break-words">
            {session?.user?.email ?? "Guest"}
            </p>
            <Button variant="destructive" onClick={handleLogout} className="mt-4 flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Log out
            </Button>
        </div>
    </div>
  )
} 