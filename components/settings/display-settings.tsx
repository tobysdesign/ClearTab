'use client'

import { LayoutToggle } from '@/components/ui/layout-toggle'
import { useLayout } from '@/hooks/use-layout'
import styles from './display-settings.module.css'

export function DisplaySettings() {
  const { layout } = useLayout()

  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Layout</div>
        <div className={styles.sectionDescription}>
          Choose how your widgets are arranged on the screen.
        </div>

        <div className={styles.layoutContainer}>
          <div className={styles.layoutInfo}>
            <div className={styles.layoutTitle}>Current Layout</div>
            <div className={styles.layoutSubtitle}>
              {layout === 'two-row' ? 'Two-row grid layout' : 'Single-row layout'}
            </div>
          </div>
          <LayoutToggle variant="settings" />
        </div>

        <div className={styles.detailsContainer}>
          <div className={styles.detailItem}>
            <strong className={styles.detailLabel}>Two-row layout:</strong> Notes and Tasks span the top half, with Weather, Voice notes, Finance, and Schedule widgets arranged in the bottom row.
          </div>
          <div className={styles.detailItem}>
            <strong className={styles.detailLabel}>Single-row layout:</strong> Notes takes up most of the left side, with smaller widgets below it, and Tasks and Schedule on the right side.
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Dock & Interface</div>
        <div className={styles.sectionDescription}>
          Customize the floating dock and interface elements.
        </div>
        <div className={styles.comingSoon}>
          Additional dock and interface customization options coming soon.
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Background</div>
        <div className={styles.sectionDescription}>
          Personalize your workspace background.
        </div>
        <div className={styles.comingSoon}>
          Background customization options coming soon.
        </div>
      </div>
    </div>
  )
}