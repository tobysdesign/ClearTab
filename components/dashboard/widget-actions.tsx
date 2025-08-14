"use client"

import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ReactNode } from 'react'

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
          className="absolute top-4 right-4"
        >
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-40 border-0 bg-[#a5a5a5] text-black shadow-none backdrop-blur-[.75em] z-50 rounded-[12px]"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
} 