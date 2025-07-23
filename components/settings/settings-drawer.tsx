'use client'

import * as React from 'react'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { SettingsLayout } from './settings-layout'
import { AccountSettings } from './account-settings'
import { cn } from '@/lib/utils';

type NavItem = {
    name: string;
    // icon: React.ElementType;
    component: React.ElementType;
}

const settingsNav: NavItem[] = [
  { name: 'Account', component: AccountSettings },
  { name: 'Personalization', component: () => <div>Personalization Settings</div> },
  { name: 'Speech', component: () => <div>Speech Settings</div> },
  { name: 'Data controls', component: () => <div>Data Controls</div> },
  { name: 'Connected apps', component: () => <div>Connected Apps</div> },
  { name: 'Security', component: () => <div>Security Settings</div> },
]

export function SettingsDrawer() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<string>('Account')

  const ActiveComponent = settingsNav.find(item => item.name === activeTab)?.component || (() => <div>Select a setting</div>);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          Settings
          <span className="sr-only">Open Settings</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="">
        <div className="p-4 h-full">
            <SettingsLayout
                nav={
                    <nav>
                        <ul>
                            {settingsNav.map((item) => (
                                <li key={item.name}>
                                    <button 
                                        onClick={() => setActiveTab(item.name)}
                                        className={cn(
                                            "flex items-center p-2 rounded-md w-full text-left",
                                            activeTab === item.name 
                                                ? "bg-gray-100 dark:bg-gray-800"
                                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                        )}
                                    >
                                        {item.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                }
            >
                <ActiveComponent />
            </SettingsLayout>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 