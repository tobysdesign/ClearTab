'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from './scroll-area'

interface ScrollShadowsProps {
  children: React.ReactNode
  className?: string
  size?: string
  color?: string
}

export function ScrollShadows({
  children,
  className,
  size = '1.5rem',
  color = '#212121',
}: ScrollShadowsProps) {
  return (
    <div className={cn('relative h-full w-full', className)}>
      <div
        style={{ height: size }}
        className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[var(--shadow-color)] to-transparent z-10 pointer-events-none"
        data-shadow-color={color}
      />
      <ScrollArea 
        className={cn("h-full w-full", className)}
        style={{
          overflowY: 'auto',
          /* Webkit Scrollbar styles */
          WebkitScrollbar: {
            width: '4px',
          },
          WebkitScrollbarThumb: {
            backgroundColor: '#C57B93',
            borderRadius: '3px',
          },
          WebkitScrollbarTrack: {
            background: '#313131',
            borderRadius: '3px',
          },
        } as React.CSSProperties}
      >
        {children}
      </ScrollArea>
      <div
        style={{ height: size }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--shadow-color)] to-transparent z-10 pointer-events-none"
        data-shadow-color={color}
      />
    </div>
  )
} 