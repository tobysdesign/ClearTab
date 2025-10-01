'use client'

import React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from './button'
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical'

interface ActionsMenuProps {
  onDelete: () => void
  isNewNote?: boolean
}

export const ActionsMenu = React.memo(function ActionsMenu({ onDelete, isNewNote }: ActionsMenuProps) {
  const [open, setOpen] = React.useState(false)
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(false) // Close the popover first
    onDelete()
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost-icon" size="icon">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto border-0 bg-[#a5a5a5] text-black shadow-none backdrop-blur-[.75em] z-50 rounded-[12px] p-2">
        <Button
          variant="ghost"
          onClick={handleDelete}
          disabled={isNewNote}
          className="w-full justify-start text-red-600 hover:bg-[#8c8c8c] hover:text-red-700 transition-colors"
        >
          Delete
        </Button>
      </PopoverContent>
    </Popover>
  )
}) 