'use client'

import * as React from 'react'
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { AccountSettings } from './account-settings'
import { DisplaySettings } from './display-settings'
import { CountSettings } from './count-settings'
import { cn } from '@/lib/utils'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import Settings from 'lucide-react/dist/esm/icons/settings'
import X from 'lucide-react/dist/esm/icons/x'

type NavItem = {
  name: string
  description: string
  component: React.ElementType
}

const settingsNav: NavItem[] = [
  { 
    name: 'Display options',
    description: 'Dock, Widget and Background',
    component: DisplaySettings
  },
  { 
    name: 'Notes, Tasks & Voice',
    description: 'Written and Voice notes',
    component: () => <div>Notes Settings</div>
  },
  { 
    name: 'Count',
    description: 'Countdown and recurrence settings',
    component: CountSettings
  },
  { 
    name: 'Weather',
    description: 'Set location(s) and localisation',
    component: () => <div>Weather Settings</div>
  },
  { 
    name: 'Account',
    description: 'Accounts, Calendar and Authentication',
    component: AccountSettings
  },
]

export function SettingsDrawer() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<string>('Display options')

  const ActiveComponent = settingsNav.find(item => item.name === activeTab)?.component || (() => <div>Select a setting</div>)

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-lg p-2 hover:bg-white/20 transition-all duration-200 ease-out text-white/60 hover:text-white/80 group">
          <Settings className="h-4 w-4 group-hover:rotate-45 transition-transform duration-300" />
          <span className="sr-only">Open Settings</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent 
        overlayVariant="settings"
        className="max-w-4xl mx-auto rounded-tl-lg rounded-tr-lg rounded-bl-none rounded-br-none border-0"
        style={{
          background: 'linear-gradient(rgba(38, 38, 38, 0.5) 0%, rgba(0, 0, 0, .7 ) 100%)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <VisuallyHidden>
          <DrawerTitle>Settings</DrawerTitle>
        </VisuallyHidden>
        
        <div className="flex flex-col h-[85vh]">
          {/* Grab Handle */}
          <div className="flex justify-center pt-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 rounded-full bg-[#242424]" />
          </div>

          {/* Fixed Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4">
            <h1 className="text-lg font-medium text-white">Settings</h1>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
              className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-[#bbbbbb]" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation with independent scroll */}
            <div className="w-64 overflow-y-auto">
              <nav className="p-4">
                <ul className="space-y-2">
                  {settingsNav.map((item) => (
                    <li key={item.name}>
                      <button 
                        onClick={() => setActiveTab(item.name)}
                        className={cn(
                          "w-full text-left p-3 transition-colors rounded",
                          activeTab === item.name 
                            ? "bg-black/30 text-white"
                            : "text-[#bbbbbb] hover:text-white hover:bg-black/20"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{item.name}</span>
                          <span className="text-xs text-[#5A5A5A] mt-1">{item.description}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Main Content with independent scroll */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 rounded-lg rounded-bl-none rounded-br-none mr-[12px] bg-[#1B1B1B]">
                <ActiveComponent />
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 