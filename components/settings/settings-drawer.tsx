'use client'

// Icons replaced with ASCII placeholders
import * as React from 'react'
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { AccountSettings } from './account-settings'
import { DisplaySettings } from './display-settings'
import { CountSettings } from './count-settings'
import { cn } from '@/lib/utils'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import styles from './settings-drawer.module.css'

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

interface SettingsDrawerProps {
  initialTab?: string
}

export function SettingsDrawer({ initialTab = 'Display options' }: SettingsDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<string>(initialTab)

  // Update activeTab when initialTab changes and drawer opens
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  // Listen for global settings open events
  React.useEffect(() => {
    const handleOpenSettings = (event: CustomEvent<{ tab?: string }>) => {
      console.log('SettingsDrawer: Received openSettings event', event.detail)
      const { tab } = event.detail
      if (tab) {
        console.log(`SettingsDrawer: Setting active tab to "${tab}"`)
        setActiveTab(tab)
      }
      setIsOpen(true)
    }

    window.addEventListener('openSettings', handleOpenSettings as EventListener)
    return () => window.removeEventListener('openSettings', handleOpenSettings as EventListener)
  }, [])

  const ActiveComponent = settingsNav.find(item => item.name === activeTab)?.component || (() => <div>Select a setting</div>)

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(styles.drawerTrigger, "group")}
          data-testid="settings-drawer-trigger"
        >
          <span className={styles.settingsIcon}>*</span>
          <span className="sr-only">Open Settings</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent 
        overlayVariant="settings"
        className={styles.drawerContent}
        style={{
          background: 'linear-gradient(rgba(38, 38, 38, 0.5) 0%, rgba(0, 0, 0, .7 ) 100%)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <VisuallyHidden>
          <DrawerTitle>Settings</DrawerTitle>
        </VisuallyHidden>
        
        <div className={styles.container}>
          {/* Grab Handle */}
          <div className={styles.grabHandle}>
            <div className={styles.grabBar} />
          </div>

          {/* Fixed Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
            >
              <span className={styles.closeIcon}>×</span>
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className={styles.scrollableContent}>
            {/* Sidebar Navigation with independent scroll */}
            <div className={styles.sidebar}>
              <nav className={styles.nav}>
                <ul className={styles.navList}>
                  {settingsNav.map((item) => (
                    <li key={item.name}>
                      <button 
                        onClick={() => setActiveTab(item.name)}
                        className={cn(
                          styles.navButton,
                          activeTab === item.name
                            ? styles.navButtonActive
                            : styles.navButtonInactive
                        )}
                      >
                        <div className={styles.navButtonContent}>
                          <span className={styles.navButtonTitle}>{item.name}</span>
                          <span className={styles.navButtonDescription}>{item.description}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Main Content with independent scroll */}
            <div className={styles.mainContent}>
              <div className={styles.contentPanel}>
                <ActiveComponent />
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 