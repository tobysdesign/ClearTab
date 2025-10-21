'use client'

import styles from './form-buttons.module.css'

interface FormButtonsProps {
  mode: 'create' | 'edit'
  onPrimary: () => void
  onSecondary?: () => void
  primaryText?: string
  secondaryText?: string
  className?: string
}

export function FormButtons({
  mode,
  onPrimary,
  onSecondary,
  primaryText,
  secondaryText,
  className = ''
}: FormButtonsProps) {
  if (mode === 'edit') {
    return (
      <div className={`${styles.buttonContainer} ${className}`}>
        <button
          type="button"
          onClick={onPrimary}
          className={styles.doneButton}
        >
          {primaryText || 'Done'}
        </button>
      </div>
    )
  }

  return (
    <div className={`${styles.buttonContainer} ${className}`}>
      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={onPrimary}
          className={styles.createButton}
        >
          {primaryText || 'Create task'}
        </button>
        <button
          type="button"
          onClick={onSecondary || onPrimary}
          className={styles.cancelButton}
        >
          {secondaryText || 'Cancel'}
        </button>
      </div>
    </div>
  )
}

interface CheckboxFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

export function CheckboxField({ checked, onChange, label, className = '' }: CheckboxFieldProps) {
  return (
    <div className={`${styles.checkboxField} ${className}`}>
      <div
        className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg className={styles.checkmark} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        )}
      </div>
      <label className={styles.checkboxLabel} onClick={() => onChange(!checked)}>
        {label}
      </label>
    </div>
  )
}