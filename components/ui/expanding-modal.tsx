'use client'

import React, { useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { cn } from '@/lib/utils'
import { GlowButton } from './glow-button'
import { X } from 'lucide-react'
import styles from './expanding-modal.module.css'

export interface ExpandingModalProps {
  children: React.ReactNode
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  layoutId: string
  position?: 'center' | 'bottom'
  className?: string
}

export function ExpandingModal({
  children,
  isOpen,
  setIsOpen,
  layoutId,
  position = 'center',
  className,
}: ExpandingModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useOutsideClick(ref, () => {
    if (isOpen) {
      setIsOpen(false)
    }
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          layoutId={layoutId}
          className={cn(
            position === 'center' ? styles.wrapperCenter : styles.wrapperBottom,
            className,
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={ref}
            className={styles.modal}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeInOut"
              }
            }}
          >
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className={styles.closeContainer}
            >
              <GlowButton
            onClick={() => setIsOpen(false)}
                className={styles.closeBtn}
              >
                <X className={styles.closeIcon} />
              </GlowButton>
            </motion.div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 