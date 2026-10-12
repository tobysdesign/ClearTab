import { forwardRef } from 'react'
import styles from './demo-cursor.module.css'

// The pointer the /demo scripts move around (see director.ts)
export const DemoCursor = forwardRef<HTMLDivElement>(function DemoCursor(_props, ref) {
  return (
    <div ref={ref} className={styles.cursor} aria-hidden="true">
      <svg className={styles.arrow} viewBox="0 0 16 22" width="20" height="27">
        <path
          d="M1 1v17.5l4.6-4.4 2.9 6.6 2.7-1.2-2.9-6.4H15L1 1Z"
          fill="#f4f4f5"
          stroke="#161616"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
})
