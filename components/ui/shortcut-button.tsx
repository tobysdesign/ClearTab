'use client'

import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
        <kbd className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </div>
  )
})

ShortcutButton.displayName = 'ShortcutButton'

export { ShortcutButton } 