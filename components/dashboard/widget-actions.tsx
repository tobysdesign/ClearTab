"use client"

// Icons replaced with ASCII placeholders
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ReactNode } from 'react'
import styles from './widget-actions.module.css'

interface WidgetActionsProps {
  children: ReactNode
}

export function WidgetActions({ children }: WidgetActionsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost-icon"
          size="icon"
          className={styles.trigger}
        >
          <span className={styles.screenReaderOnly}>Open menu</span>
          <span className={styles.icon}>•</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={styles.content}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
} 