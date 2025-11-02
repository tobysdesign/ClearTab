'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface SimpleDropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}

export function SimpleDropdown({
  trigger,
  children,
  className,
  align = 'left'
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTriggerClick = () => {
    setIsOpen(!isOpen)
  }

  const getAlignClasses = () => {
    switch (align) {
      case 'left':
        return 'left-0'
      case 'right':
        return 'right-0'
      case 'center':
        return 'left-1/2 transform -translate-x-1/2'
      default:
        return 'left-0'
    }
  }

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute top-full mt-1 z-50 min-w-48',
            'bg-white border border-gray-200 rounded-md shadow-lg',
            'py-1',
            getAlignClasses(),
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface SimpleDropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function SimpleDropdownItem({
  children,
  onClick,
  className,
  disabled = false
}: SimpleDropdownItemProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </div>
  )
}

interface SimpleDropdownSeparatorProps {
  className?: string
}

export function SimpleDropdownSeparator({ className }: SimpleDropdownSeparatorProps) {
  return (
    <div
      className={cn('h-px bg-gray-200 my-1', className)}
    />
  )
}