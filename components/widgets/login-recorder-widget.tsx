'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import styles from './recorder-widget.module.css'
import { ClientOnly } from '@/components/ui/safe-motion'
import { WidgetHeader } from '@/components/ui/widget-header'

export function LoginRecorderWidget() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <ClientOnly>
      <div className={cn(styles.flipContainer)} style={{ pointerEvents: 'none' }}>
        <div className={styles.flipper}>
          {/* Front Side (Idle) - Always show this for login */}
          <div className={styles.front}>
            <div className={styles.container}>
              <div className={styles.content}>
                {/* Header */}
                <WidgetHeader title="Voice notes" className="!justify-start" />

                {/* Body */}
                <div className={styles.body}>
                  {/* Button Container */}
                  <div className={styles.buttonContainer}>
                    <button
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      className={cn(styles.button, 'group')}
                      style={{ cursor: 'default' }}
                    >
                      <div className={styles.buttonOuter}>
                        {/* Main shading background */}
                        <div className={styles.buttonBackground} />

                        {/* Gradient border */}
                        <div className={styles.buttonBorder} />

                        {/* Top highlight for lighter upper half */}
                        <div className={styles.buttonTopHighlight} />

                        {/* Recording indicator dot (positioned top-right) */}
                        <div className={cn(styles.recordingDot, { [styles.recordingDotHover]: isHovered })} />

                        {/* Microphone icon */}
                        <div className={styles.microphoneIcon}>
                          <span className={styles.micIcon}>•</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Text */}
                  <p className={styles.bodyText}>
                    Start a voice note
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  )
}