'use client'

// Icons replaced with ASCII placeholders
import { useLayout } from '@/hooks/use-layout'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import styles from './layout-toggle.module.css'

interface LayoutToggleProps {
  variant?: 'dock' | 'settings'
}

export function LayoutToggle({ variant = 'dock' }: LayoutToggleProps) {
  const { layout, toggleLayout } = useLayout()
  
  if (variant === 'dock') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLayout}
              className={styles.dockButton}
            >
              {layout === 'two-row' ? (
                <span className={styles.icon}>•</span>
              ) : (
                <span className={styles.icon}>•</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Switch to {layout === 'two-row' ? 'single-row' : 'two-row'} layout
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={toggleLayout}
      className={styles.settingsButton}
    >
      {layout === 'two-row' ? (
        <>
          <span className={styles.icon}>•</span>
          Switch to Single Row
        </>
      ) : (
        <>
          <span className={styles.icon}>•</span>
          Switch to Two Row
        </>
      )}
    </Button>
  )
}