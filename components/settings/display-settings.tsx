'use client'

import * as React from 'react'
import { useLayout } from '@/hooks/use-layout'
import sharedStyles from './settings-shared.module.css'
import drawerStyles from './settings-drawer.module.css'
import { Select, SelectItem } from '@cleartab/ui'
import { useSettings } from '@/hooks/use-settings'
import { useTheme } from 'next-themes'

type DockPosition = 'top' | 'left' | 'right' | 'bottom'

const dockOptions: { value: DockPosition; label: string }[] = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]

const layoutOptions = [
  { value: 'two-row', label: 'Row focus (layout 1)' },
  { value: 'single-row', label: 'Column focus (layout 2)' },
]

interface DisplaySettingsProps {
  sectionId: string
  heading: string
  description?: string
}

export const DisplaySettings = React.forwardRef<HTMLElement, DisplaySettingsProps>(
  function DisplaySettings({ sectionId, heading, description }, ref) {
    const { layout, setLayout } = useLayout()
    const { theme: storedTheme, setTheme: setStoredTheme } = useSettings()
    const { setTheme } = useTheme()
    const [dockPosition, setDockPosition] = React.useState<DockPosition>('bottom')

    React.useEffect(() => {
      if (typeof window === 'undefined') return
      const stored = window.localStorage.getItem('dock-position') as DockPosition | null
      if (stored && ['top', 'left', 'right', 'bottom'].includes(stored)) {
        setDockPosition(stored)
      }
    }, [])

    React.useEffect(() => {
      if (typeof window === 'undefined') return
      window.localStorage.setItem('dock-position', dockPosition)
      window.dispatchEvent(
        new CustomEvent('dock-position-change', {
          detail: { position: dockPosition },
        }),
      )
    }, [dockPosition])

    const handleLayoutChange = (value: string) => {
      if (value === 'two-row' || value === 'single-row') {
        setLayout(value)
      }
    }

    const handleThemeChange = (value: 'light' | 'dark') => {
      setStoredTheme(value)
      setTheme(value)
    }

    return (
      <section ref={ref} className={sharedStyles.card} data-section-id={sectionId}>
        <div className={drawerStyles.sectionHeading}>
          <h2 className={drawerStyles.sectionTitle}>{heading}</h2>
          {description ? <p className={drawerStyles.sectionDescription}>{description}</p> : null}
        </div>
        <div className={`${sharedStyles.innerCard} ${sharedStyles.inlineFieldRow}`}>
          <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
            <span className={sharedStyles.label}>Dock position</span>
            <Select
              value={dockPosition}
              className={sharedStyles.selectAuto}
              onValueChange={(val) => setDockPosition(val as DockPosition)}
            >
              {dockOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
            <span className={sharedStyles.label}>Dashboard layout</span>
            <Select
              value={layout}
              className={sharedStyles.selectAuto}
              onValueChange={(val) => handleLayoutChange(val)}
            >
              {layoutOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
            <span className={sharedStyles.label}>Theme</span>
            <Select
              value={storedTheme}
              className={sharedStyles.selectAuto}
              onValueChange={(val) => handleThemeChange(val as 'light' | 'dark')}
            >
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
            </Select>
          </div>
        </div>
      </section>
    )
  });

DisplaySettings.displayName = 'DisplaySettings'
