'use client'

import React from 'react'
import { DockPanel } from '@cleartab/ui'
import styles from './keyboard-shortcuts-modal.module.css'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutEntry {
  keys: string[]
  description: string
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['⌘', 'K'], description: 'Open AI chat' },
  { keys: ['⌘', 'L'], description: 'Choose dashboard layout' },
  { keys: ['⌘', 'F'], description: 'Search' },
  { keys: ['⌘', ','], description: 'Open settings' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close the open modal or clear search' },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <DockPanel isOpen={isOpen} onClose={onClose} anchorSelector='[data-testid="shortcuts-trigger"]' className={styles.panelContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>Keyboard Shortcuts</h2>
        <button type="button" onClick={onClose} className={styles.closeButton}>
          <span>Close</span>
          <kbd className={styles.escKey}>Esc</kbd>
        </button>
      </div>
      <div className={styles.shortcutList}>
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.description} className={styles.shortcutRow}>
            <span className={styles.shortcutDescription}>{shortcut.description}</span>
            <span className={styles.keyGroup}>
              {shortcut.keys.map((key) => (
                <kbd key={key} className={styles.key}>{key}</kbd>
              ))}
            </span>
          </div>
        ))}
      </div>
    </DockPanel>
  )
}
