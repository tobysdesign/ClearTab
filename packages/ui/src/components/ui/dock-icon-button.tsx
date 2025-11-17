'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './dock-icon-button.module.css'

interface DockIconButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  title?: string
  'data-testid'?: string
}

export function DockIconButton({
  children,
  onClick,
  className,
  title,
  'data-testid': dataTestId
}: DockIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(styles.dockIconButton, className)}
      title={title}
      data-testid={dataTestId}
    >
      {children}
    </button>
  )
}
