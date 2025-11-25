'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './dock-icon-button.module.css'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

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
      title={title}
      data-testid={dataTestId}
    >
      {children}
    </button>
  )

  if (!title && !shortcut) return btn

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent>
          <span>{title}</span>
          {shortcut ? <span style={{ marginLeft: 8, opacity: 0.8 }}>{shortcut}</span> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
