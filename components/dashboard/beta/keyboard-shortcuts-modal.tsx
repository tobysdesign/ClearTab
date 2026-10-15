'use client'

import React from 'react'
import { Button, DockPanel } from '@cleartab/ui'
import styles from './keyboard-shortcuts-modal.module.css'
import footerStyles from '../../ui/modal-actions.module.css'

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
      <div className={footerStyles.footer}>
        <Button onClick={onClose}>
          <span>Done</span>
          <kbd className={footerStyles.kbd}>Esc</kbd>
        </Button>
      </div>
    </DockPanel>
  )
}
