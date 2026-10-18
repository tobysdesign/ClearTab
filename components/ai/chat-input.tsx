'use client'

/*
 * Composer layout adapted from Beautiful UI's Chat Composer and Prompt Bar
 * (https://www.beautifului.dev), MIT License, Copyright (c) 2026 Shane Levine.
 * See components/ai/THIRD_PARTY_NOTICES.md.
 */

import React, { useCallback, useEffect, useRef } from 'react'
import { Tooltip, TooltipContent, TooltipShortcut, TooltipTrigger } from '@cleartab/ui'
import { ArrowUpIcon } from '@/components/icons'
import styles from './chat-input.module.css'

type Command = 'task' | 'note'

const COMMANDS: { id: Command; label: string; hint: string }[] = [
  { id: 'task', label: '#task', hint: 'Add a task' },
  { id: 'note', label: '#note', hint: 'Add a note' },
]

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: () => void
  /** replaces the input with "#<command> " plus whatever was typed */
  onInsertCommand?: (command: Command) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ value, onChange, onSubmit, onInsertCommand, disabled, placeholder = 'Message...' }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeCommand: Command | null = value.includes('#task') ? 'task' : value.includes('#note') ? 'note' : null
  const canSend = !disabled && value.trim().length > 0

  // Grow the textarea to fit its content (capped by max-height in CSS, which then
  // scrolls). Runs whenever the value changes, including when it clears on send.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // Keep focus on the prompt: on open (the panel remounts this each time) and again
  // when a reply finishes (disabled flips back to false, which had blurred the input).
  useEffect(() => {
    if (disabled) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [disabled])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a line break (the textarea default).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onSubmit()
    }
  }, [canSend, onSubmit])

  const handleCommand = useCallback((command: Command) => {
    onInsertCommand?.(command)
    inputRef.current?.focus()
  }, [onInsertCommand])

  return (
    <div
      role="presentation"
      className={styles.composer}
      onClick={() => inputRef.current?.focus()}
    >
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Chat prompt"
        className={styles.input}
      />
      <div className={styles.controls}>
        <div className={styles.commands}>
          {COMMANDS.map((command) => (
            <Tooltip key={command.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={styles.commandChip}
                  data-active={activeCommand === command.id}
                  aria-pressed={activeCommand === command.id}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCommand(command.id)
                  }}
                >
                  {command.label}
                </button>
              </TooltipTrigger>
              <TooltipContent>{command.hint}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={styles.sendButton}
              onClick={(e) => {
                e.stopPropagation()
                if (!canSend) return
                onSubmit()
              }}
              aria-disabled={!canSend}
              aria-label={activeCommand ? `Create ${activeCommand}` : 'Send message'}
            >
              <ArrowUpIcon size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {activeCommand ? `Create ${activeCommand}` : 'Send'} <TooltipShortcut>↵</TooltipShortcut>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default ChatInput
