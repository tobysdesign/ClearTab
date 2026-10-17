import { forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { EyesMarkIcon } from '@/components/icons'
import styles from './demo-cursor.module.css'

// The pointer and floating white callout card driven by the /demo scripts (see director.ts).
// Portaled to document.body so it sits in the root stacking context above DockPanel (AI Chat).
export const DemoCursor = forwardRef<HTMLDivElement, { showPointer?: boolean }>(function DemoCursor(
  { showPointer = true },
  ref,
) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div ref={ref} className={styles.root} data-side="right" aria-hidden="true">
      <div className={styles.calloutPositioner} data-callout-state="hidden">
        <div className={styles.calloutCard}>
          <div className={styles.calloutIcon}>
            <EyesMarkIcon size={28} />
          </div>
          <div className={styles.calloutCopy}>
            <div className={styles.calloutBadge} data-callout-badge="" />
            <div className={styles.calloutText} data-callout-text="" />
          </div>
        </div>
      </div>
      {showPointer && (
        <div className={styles.cursor}>
          <svg className={styles.arrow} viewBox="0 0 16 22" width="28" height="38">
            <path
              d="M1 1v17.5l4.6-4.4 2.9 6.6 2.7-1.2-2.9-6.4H15L1 1Z"
              fill="#f4f4f5"
              stroke="#090d16"
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>,
    document.body,
  )
})
