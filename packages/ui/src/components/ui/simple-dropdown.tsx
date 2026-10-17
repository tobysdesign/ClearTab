'use client'

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import styles from './simple-dropdown.module.css'

// Context to allow items to close the dropdown
const DropdownContext = createContext<{ close: () => void } | null>(null)

interface SimpleDropdownProps {
  /** A node, or a render function given the open state (e.g. to drop a tooltip while open). */
  trigger: React.ReactNode | ((isOpen: boolean) => React.ReactNode)
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
  /** Which way the menu opens. 'up' is useful near the bottom of the viewport. */
  direction?: 'up' | 'down'
}

export function SimpleDropdown({
  trigger,
  children,
  className,
  align = 'right',
  direction = 'down'
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // The menu is portalled to <body> (position: fixed) so it isn't clipped by any
  // overflow:hidden ancestor; position is measured from the trigger.
  const [pos, setPos] = useState<React.CSSProperties>({})

  const close = useCallback(() => setIsOpen(false), [])

  const place = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const s: React.CSSProperties = {}
    if (direction === 'up') s.bottom = Math.round(window.innerHeight - r.top + 4)
    else s.top = Math.round(r.bottom + 4)
    if (align === 'left') s.left = Math.round(r.left)
    else if (align === 'center') s.left = Math.round(r.left + r.width / 2)
    else s.right = Math.round(window.innerWidth - r.right)
    setPos(s)
  }, [align, direction])

  useLayoutEffect(() => {
    if (isOpen) place()
  }, [isOpen, place])

  // Close on outside click; reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return
    const onDocClick = (event: MouseEvent) => {
      const t = event.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setIsOpen(false)
    }
    const reposition = () => place()
    const timeoutId = setTimeout(() => document.addEventListener('click', onDocClick), 0)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', onDocClick)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [isOpen, place])

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(prev => !prev)
  }, [])

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={triggerRef} onClick={handleTriggerClick} className={styles.trigger}>
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </div>

      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', ...pos }}
            className={cn(
              styles.dropdownContent,
              styles.portaled,
              align === 'center' && styles.alignCenter,
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>,
          document.body
        )}
    </DropdownContext.Provider>
  )
}

interface SimpleDropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  variant?: 'default' | 'danger'
}

export function SimpleDropdownItem({
  children,
  onClick,
  className,
  disabled = false,
  variant = 'default'
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
        variant === 'danger' && styles.itemDanger,
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
