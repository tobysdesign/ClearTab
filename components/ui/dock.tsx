'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, useMotionValue } from 'framer-motion'
import { DockIcon } from './dock-icon'

interface DockProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Dock({ children, className, ...props }: DockProps) {
  const mouseX = useMotionValue(Infinity)

  const childrens = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === DockIcon) {
      return React.cloneElement(child, { mouseX } as any)
    }
    return child
  })

  return (
    <div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        'flex items-end justify-center h-16 w-max mx-auto px-4 pb-2 rounded-full bg-secondary/50 backdrop-blur-md border border-secondary',
        className
      )}
      {...props}
    >
      {childrens}
    </div>
  )
} 