'use client'

import * as React from 'react'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { AccountSettings } from './account-settings'
import { cn } from '@/lib/utils'
import { ScheduleSettings } from './schedule-settings'
import { FinanceSettings } from './finance-settings'

type NavItem = {
  name: string
  description: string
  component: React.ElementType
}

const settingsNav: NavItem[] = [
  { 
    name: 'Display options',
    description: 'Dock, Widget and Background',
    component: () => <div>Display Settings</div>
  },
  { 
    name: 'Notes, Tasks & Voice',
    description: 'Written and Voice notes',
    component: () => <div>Notes Settings</div>
  },
  { 
    name: 'Countdown',
    description: 'Length, units and recurrence',
    component: () => <div>Countdown Settings</div>
  },
  { 
    name: 'Schedule',
    description: 'Calendar and event settings',
    component: ScheduleSettings
  },
  { 
    name: 'Finance',
    description: 'Payday and budget settings',
    component: FinanceSettings
  },
  { 
    name: 'Weather',
    description: 'Set location(s) and localisation',
    component: () => <div>Weather Settings</div>
  },
  { 
    name: 'Account',
    description: 'Settings / Logout the primary account',
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
        <Button variant="ghost" size="icon">
          Settings
          <span className="sr-only">Open Settings</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="flex h-full">
          <div className="w-[300px] bg-[#191818] border-r border-[#2A2A2A] -mt-4">
            <nav>
              <ul>
                {settingsNav.map((item) => (
                  <li key={item.name}>
                    <button 
                      onClick={() => setActiveTab(item.name)}
                      className={cn(
                        "flex flex-col w-full text-left py-[14px] transition-colors",
                        activeTab === item.name 
                          ? "bg-[#2A2A2A]"
                          : "hover:bg-[#2A2A2A]"
                      )}
                    >
                      <div className="px-4">
                        <span className="font-['Inter_Display'] text-[15px] leading-[18px] font-medium text-[#D2D2D2] mb-1 block">{item.name}</span>
                        <span className="font-['Inter'] text-[13px] leading-[16px] text-[#949494] block">{item.description}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex-1 bg-[#111111] p-6">
            <ActiveComponent />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 