'use client'

import * as React from 'react'
import styles from './settings-layout.module.css'

interface SettingsLayoutProps {
  nav: React.ReactNode
  children: React.ReactNode
}

export function SettingsLayout({ nav, children }: SettingsLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        {nav}
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
} 