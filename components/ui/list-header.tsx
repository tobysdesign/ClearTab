'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './list-header.module.css'
import { CardTitle } from '@/components/ui/card'

interface ListHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export function ListHeader({ title, children, className }: ListHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between h-12", className)}>
      <h2 className="WidgeTit">{title}</h2>
      {children}
    </div>
  )
} 