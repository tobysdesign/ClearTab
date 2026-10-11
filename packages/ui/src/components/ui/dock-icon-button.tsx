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
}

export function DockIconButton({
  children,
  onClick,
  className,
  title,
  shortcut,
  'data-testid': dataTestId
}: DockIconButtonProps) {
  const btn = (
    <button
      onClick={onClick}
      className={cn(styles.dockIconButton, className)}
      aria-label={title}
      data-testid={dataTestId}
    >
      {children}
    </button>
  )

  if (!title && !shortcut) return btn

  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent>
        <span>{title}</span>
        {shortcut ? <TooltipShortcut>{shortcut}</TooltipShortcut> : null}
      </TooltipContent>
    </Tooltip>
  )
}
