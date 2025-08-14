'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SettingsLayoutProps {
  nav: React.ReactNode
  children: React.ReactNode
}

export function SettingsLayout({ nav, children }: SettingsLayoutProps) {
  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r border-white/40 dark:border-white/40 p-4">
        {nav}
      </div>
      <div className="w-3/4 p-6">
        {children}
      </div>
    </div>
  )
} 