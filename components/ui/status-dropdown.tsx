'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import type { Task } from '@/shared/schema'

interface StatusDropdownProps {
  currentStatus: Task['status']
  onSelectStatus: (status: Task['status']) => void
}

export function StatusDropdown({
  currentStatus,
  onSelectStatus,
}: StatusDropdownProps) {
  const statuses: Task['status'][] = ['pending', 'completed', 'important']

  return (
    <Select onValueChange={onSelectStatus} value={currentStatus}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a status" />
      </SelectTrigger>
      <SelectContent>
        {statuses.map(status => (
          <SelectItem key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 