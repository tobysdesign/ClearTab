'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'
import styles from './simple-dropdown.module.css'

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
  align = 'right'
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

  const getAlignClass = () => {
    switch (align) {
      case 'left':
        return styles.alignLeft
      case 'right':
        return styles.alignRight
      case 'center':
        return styles.alignCenter
      default:
        return styles.alignRight
    }
  }

  return (
    <div className={styles.container}>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={styles.trigger}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            styles.dropdownContent,
            getAlignClass(),
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
        styles.item,
        disabled && styles.itemDisabled,
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
      className={cn(styles.separator, className)}
    />
  )
}
