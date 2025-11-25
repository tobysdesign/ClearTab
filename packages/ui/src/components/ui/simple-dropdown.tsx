'use client'

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { cn } from '../../lib/utils'
import styles from './simple-dropdown.module.css'

// Context to allow items to close the dropdown
const DropdownContext = createContext<{ close: () => void } | null>(null)

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
  const containerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setIsOpen(false), [])

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Small delay to avoid the opening click from triggering close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(prev => !prev)
  }, [])

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
    <DropdownContext.Provider value={{ close }}>
      <div ref={containerRef} className={styles.container}>
        <div
          onClick={handleTriggerClick}
          className={styles.trigger}
        >
          {trigger}
        </div>

        {isOpen && (
          <div
            className={cn(
              styles.dropdownContent,
              getAlignClass(),
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
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
  const context = useContext(DropdownContext)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onClick) {
      onClick()
    }
    // Close the dropdown after clicking an item
    context?.close()
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
