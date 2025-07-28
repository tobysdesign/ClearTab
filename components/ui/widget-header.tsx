'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface WidgetHeaderProps {
  title: string
  children?: React.ReactNode
  className?: string
  titleClassName?: string
}

export function WidgetHeader({ 
  title, 
  children, 
  className, 
  titleClassName 
}: WidgetHeaderProps) {
  return (
    <div className={cn("widget-header", className)}>
      <h2 className={cn("widget-title", titleClassName)}>
        {title}
      </h2>
      {children && (
        <div className="widget-flex widget-gap-2">
          {children}
        </div>
      )}
    </div>
  )
}