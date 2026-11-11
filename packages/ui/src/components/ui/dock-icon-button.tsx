'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './dock-icon-button.module.css'
import { Tooltip, TooltipContent, TooltipShortcut, TooltipTrigger } from './tooltip'

interface DockIconButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  title?: string
  'data-testid'?: string
  shortcut?: string
  'aria-expanded'?: boolean
  'aria-haspopup'?: React.AriaAttributes['aria-haspopup']
  /** Which side the tooltip opens toward; defaults to "top". Set it away from the dock. */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left'
}

export function DockIconButton({
  children,
  onClick,
  className,
  title,
  shortcut,
  'data-testid': dataTestId,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
  tooltipSide,
}: DockIconButtonProps) {
  const btn = (
    <button
      onClick={onClick}
      className={cn(styles.dockIconButton, className)}
      aria-label={title}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      data-testid={dataTestId}
    >
      {children}
    </button>
  )

  if (!title && !shortcut) return btn

  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side={tooltipSide}>
        <span>{title}</span>
        {shortcut ? <TooltipShortcut>{shortcut}</TooltipShortcut> : null}
      </TooltipContent>
    </Tooltip>
  )
}
