"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeatherSettings } from './weather-settings'
import { WidgetSettings } from './widget-settings'
import { LogOut, User, Cloud, LayoutGrid } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps): ReactNode {
  const [activeTab, setActiveTab] = useState('account')
  const { data: session } = useSession()
  const router = useRouter()

  function handleLogout() {
    // Close modal first
    onOpenChange(false)
    // Trigger NextAuth sign out which redirects
    signOut({ callbackUrl: '/' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
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
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 