'use client'

import React, { useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { cn } from '@/lib/utils'
import { GlowButton } from './glow-button'
import X from 'lucide-react/dist/esm/icons/x'
import styles from './expanding-modal.module.css'
import { ClientOnly } from './safe-motion'

export interface ExpandingModalProps {
  children: React.ReactNode
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  layoutId: string
  position?: 'center' | 'bottom'
  className?: string
  onClose?: () => void; // Add onClose prop
}

export function ExpandingModal({
  children,
  isOpen,
  setIsOpen,
  layoutId,
  position = 'center',
  className,
  onClose,
}: ExpandingModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useOutsideClick(ref, () => {
    if (isOpen) {
      onClose?.(); // Call onClose if provided, otherwise setIsOpen(false)
      setIsOpen(false)
    }
  })

  return (
    <ClientOnly>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Background overlay - just fade in/out without scaling */}
            <motion.div
              className={cn(
                position === 'center' ? styles.wrapperCenter : styles.wrapperBottom,
                className,
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Card content with layout animation */}
              <motion.div
                ref={ref}
                layoutId={layoutId}
                className={styles.modal}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.closeContainer}
                >
                  <GlowButton
                    onClick={() => {
                      onClose?.(); // Call onClose when close button is clicked
                      setIsOpen(false)
                    }}
                    className={styles.closeBtn}
                  >
                    <X className={styles.closeIcon} />
                  </GlowButton>
                </motion.div>
                {children}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ClientOnly>
  )
} 