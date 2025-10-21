'use client'

import { ReactNode } from 'react'
import styles from './form-field.module.css'

interface FormFieldProps {
  label: string
  children: ReactNode
  className?: string
}

export function FormField({ label, children, className = '' }: FormFieldProps) {
  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  )
}

interface FormRowProps {
  children: ReactNode
  className?: string
}

export function FormRow({ children, className = '' }: FormRowProps) {
  return (
    <div className={`${styles.row} ${className}`}>
      {children}
    </div>
  )
}

interface TextInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function TextInput({ value, onChange, placeholder, className = '' }: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`${styles.textInput} ${className}`}
    />
  )
}

interface DateInputProps {
  value?: string
  onClick?: () => void
  placeholder?: string
  className?: string
}

export function DateInput({ value, onClick, placeholder, className = '' }: DateInputProps) {
  return (
    <input
      type="text"
      readOnly
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      className={`${styles.dateInput} ${className}`}
    />
  )
}

interface PriorityToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function PriorityToggle({ checked, onChange, label = 'High priority' }: PriorityToggleProps) {
  return (
    <div className={styles.priorityToggle}>
      <div
        className={`${styles.switch} ${checked ? styles.switchChecked : ''}`}
        onClick={() => onChange(!checked)}
      >
        <div className={styles.switchThumb}></div>
      </div>
      <span className={styles.priorityLabel} onClick={() => onChange(!checked)}>
        {label}
      </span>
    </div>
  )
}