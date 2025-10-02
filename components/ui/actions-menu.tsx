'use client'

import React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from './button'
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical'
import styles from './actions-menu.module.css'

interface ActionsMenuProps {
  onDelete: () => void
  isNewNote?: boolean
}

export const ActionsMenu = React.memo(function ActionsMenu({ onDelete, isNewNote }: ActionsMenuProps) {
  const [open, setOpen] = React.useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(false)
    onDelete()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost-icon" size="icon">
          <span className={styles.srOnly}>Open menu</span>
          <MoreVertical className={styles.icon} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={styles.popoverContent}>
        <Button
          variant="ghost"
          onClick={handleDelete}
          disabled={isNewNote}
          className={styles.deleteButton}
        >
          Delete
        </Button>
      </PopoverContent>
    </Popover>
  )
})
