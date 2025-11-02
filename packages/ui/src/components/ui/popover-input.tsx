'use client'

import { useState, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import { cn } from '../../lib/utils'

interface PopoverInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  children?: ReactNode
  icon?: ReactNode
}

export function PopoverInput({
  value,
  onChange,
  placeholder = "Enter value",
  className,
  children,
  icon = "✏️"
}: PopoverInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')

  const handleSubmit = () => {
    onChange?.(inputValue)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setInputValue(value || '')
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal bg-transparent border-none text-white rounded-lg hover:bg-white/10",
            !value && "text-muted-foreground",
            className
          )}
        >
          {!icon && <span className="mr-2 h-4 w-4">✏️</span>}
          {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
          {value ? <span>{value}</span> : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {children || (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
                if (e.key === 'Escape') handleCancel()
              }}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              className="bg-white text-black hover:bg-white/90"
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}