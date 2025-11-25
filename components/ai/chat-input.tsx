'use client'

import React, { useCallback, useState, useEffect } from 'react'
import styles from './chat-input.module.css'

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ value, onChange, onSubmit, disabled, placeholder = 'Message...' }: ChatInputProps) {
  const [hasHashtag, setHasHashtag] = useState<'task' | 'note' | null>(null)

  // Detect hashtags in input
  useEffect(() => {
    if (value.includes('#task')) {
      setHasHashtag('task')
    } else if (value.includes('#note')) {
      setHasHashtag('note')
    } else {
      setHasHashtag(null)
    }
  }, [value])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) {
        onSubmit()
      }
    }
  }, [disabled, value, onSubmit])

  return (
    <div className={styles.container}>
      {hasHashtag && (
        <div className={styles.hashtagIndicator}>
          <span className={styles.hashtagPill}>
            {hasHashtag === 'task' ? 'Creating task' : 'Creating note'}
          </span>
        </div>
      )}
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={styles.input}
          autoFocus
        />
        <button
          className={styles.submitButton}
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ChatInput
