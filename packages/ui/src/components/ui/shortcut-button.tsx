'use client'

import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from './shortcut-button.module.css'

interface ShortcutButtonProps extends ButtonProps {
  shortcut?: string
}

const ShortcutButton = React.forwardRef<
  HTMLButtonElement,
  ShortcutButtonProps
>(({ shortcut, children, className, ...props }, ref) => {
  return (
    <div className="relative inline-block">
      <Button
        ref={ref}
        className={cn('justify-start', className)}
        {...props}
      >
        {children}
      </Button>
      {shortcut && (
        <kbd className={styles.shortcut}>
          {shortcut}
        </kbd>
      )}
    </div>
  )
})

ShortcutButton.displayName = 'ShortcutButton'

export { ShortcutButton } 