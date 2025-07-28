'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface WidgetContainerProps {
  children: React.ReactNode
  className?: string
}

export function WidgetContainer({ children, className }: WidgetContainerProps) {
  return (
    <div className={cn("widget-relative widget-full-height widget-full-width", className)}>
      <div className="widget-absolute widget-full rounded-[22px] widget-background widget-overflow-hidden">
        <div className="widget-flex-column widget-full-height">
          {children}
        </div>
      </div>
    </div>
  )
}

interface WidgetContentProps {
  children: React.ReactNode
  className?: string
  scrollable?: boolean
}

export function WidgetContent({ children, className, scrollable = true }: WidgetContentProps) {
  const contentClasses = cn(
    "widget-flex-1",
    scrollable && "widget-overflow-auto custom-scrollbar",
    className
  )

  return (
    <div className={contentClasses}>
      {children}
    </div>
  )
}