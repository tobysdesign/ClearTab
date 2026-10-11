'use client'

/*
 * Thinking state, streaming text and tool rows adapted from Beautiful UI
 * (https://www.beautifului.dev), MIT License, Copyright (c) 2026 Shane Levine.
 * See components/ai/THIRD_PARTY_NOTICES.md.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { SparkleIcon, CopyIcon, RetryIcon, CheckIcon, ReplyIcon, PenIcon, LabelImportantIcon } from '@/components/icons'
import type { Message, TaskSuggestion } from '@/hooks/use-chat-context'
import styles from './chat-messages.module.css'

export type { Message }

interface ChatMessagesProps {
  messages: Message[]
  isThinking: boolean
  thinkingContent: string
  onQuickReply: (reply: string) => void
  onRetry: () => void
  onAddTasks: (messageIndex: number, tasks: TaskSuggestion[]) => Promise<void>
}

function formatThought(ms: number) {
  const seconds = Math.max(1, Math.round(ms / 1000))
  return `Thought for ${seconds} second${seconds === 1 ? '' : 's'}`
}

/* Shimmering "Thinking" header shown until the first token arrives */
function ThinkingState({ content }: { content: string }) {
  return (
    <div className={styles.thinkingState} role="status">
      <SparkleIcon size={14} className={styles.thinkingIcon} />
      <span className={styles.shimmerText}>{content || 'Thinking'}</span>
    </div>
  )
}

/* Each word resolves out of a blur as it arrives. Keys are positional, so words
   already on screen keep their DOM node and don't animate again. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((token, i) =>
        /^\s*$/.test(token) ? token : <span key={i} className={styles.word}>{token}</span>
      )}
    </>
  )
}

/* Gemini Nano answers in light markdown: support **bold** inline */
function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        /^\*\*[^*]+\*\*$/.test(part)
          ? <strong key={i} className={styles.strong}><Words text={part.slice(2, -2)} /></strong>
          : <Words key={i} text={part} />
      )}
    </>
  )
}

type Block = { kind: 'p'; text: string } | { kind: 'ul'; items: string[] }

const BULLET = /^\s*[*-]\s+/

function toBlocks(content: string): Block[] {
  const blocks: Block[] = []
  for (const line of content.split('\n')) {
    if (!line.trim()) continue
    if (BULLET.test(line)) {
      const item = line.replace(BULLET, '')
      const last = blocks[blocks.length - 1]
      if (last?.kind === 'ul') last.items.push(item)
      else blocks.push({ kind: 'ul', items: [item] })
    } else {
      blocks.push({ kind: 'p', text: line })
    }
  }
  return blocks
}

function StreamingText({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const blocks = toBlocks(content)
  const caret = isStreaming ? <span className={styles.caret} aria-hidden="true" /> : null

  return (
    <div className={styles.streamingText}>
      {blocks.map((block, i) => {
        const isLastBlock = i === blocks.length - 1
        if (block.kind === 'ul') {
          return (
            <ul key={i} className={styles.list}>
              {block.items.map((item, j) => (
                <li key={j} className={styles.listItem}>
                  <InlineText text={item} />
                  {isLastBlock && j === block.items.length - 1 && caret}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className={styles.paragraph}>
            <InlineText text={block.text} />
            {isLastBlock && caret}
          </p>
        )
      })}
      {blocks.length === 0 && caret}
    </div>
  )
}

/* Compact confirmation row for #task / #note commands */
function ToolRow({ tool }: { tool: NonNullable<Message['tool']> }) {
  return (
    <div className={styles.toolRow}>
      {tool.kind === 'task'
        ? <CheckIcon size={13} className={styles.toolIcon} />
        : <PenIcon size={13} className={styles.toolIcon} />}
      <span className={styles.toolLabel}>{tool.kind === 'task' ? 'Created task' : 'Created note'}</span>
      <span className={styles.toolChip}>{tool.text}</span>
    </div>
  )
}

function formatDue(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((date.getTime() - today.getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1 && days < 7) return date.toLocaleDateString(undefined, { weekday: 'short' })
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/* AI-suggested tasks: untick the ones you don't want, flag priority, then add */
function TaskSuggestions({ tasks, added, onAdd }: {
  tasks: TaskSuggestion[]
  added?: number
  onAdd: (tasks: TaskSuggestion[]) => Promise<void>
}) {
  const [items, setItems] = useState(() => tasks.map((task) => ({ ...task, selected: true })))
  const [adding, setAdding] = useState(false)
  const selectedCount = items.filter((item) => item.selected).length

  if (added !== undefined) {
    return (
      <div className={styles.toolRow}>
        <CheckIcon size={13} className={styles.toolIcon} />
        <span className={styles.toolLabel}>Added {added} task{added === 1 ? '' : 's'}</span>
      </div>
    )
  }

  const toggle = (index: number, key: 'selected' | 'isHighPriority') =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: !item[key] } : item)))

  const handleAdd = async () => {
    setAdding(true)
    await onAdd(items.filter((item) => item.selected).map(({ selected: _selected, ...task }) => task))
    setAdding(false)
  }

  return (
    <div className={styles.suggestions}>
      <ul className={styles.suggestionList}>
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`} className={styles.suggestion} data-selected={item.selected}>
            <button
              type="button"
              className={styles.suggestionCheck}
              aria-pressed={item.selected}
              aria-label={item.selected ? `Don't add "${item.title}"` : `Add "${item.title}"`}
              onClick={() => toggle(i, 'selected')}
            >
              {item.selected && <CheckIcon size={10} />}
            </button>
            <span className={styles.suggestionTitle}>{item.title}</span>
            {item.dueDate && <span className={styles.suggestionDue}>{formatDue(item.dueDate)}</span>}
            <button
              type="button"
              className={styles.priorityToggle}
              data-active={item.isHighPriority}
              aria-pressed={item.isHighPriority}
              aria-label="Important"
              title="Important"
              onClick={() => toggle(i, 'isHighPriority')}
            >
              <LabelImportantIcon size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.addTasksButton}
        disabled={selectedCount === 0 || adding}
        onClick={handleAdd}
      >
        {adding ? 'Adding…' : `Add ${selectedCount} task${selectedCount === 1 ? '' : 's'}`}
      </button>
    </div>
  )
}

function MessageActions({ content, onRetry }: { content: string; onRetry: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('ChatMessages: copy failed', error)
    }
  }, [content])

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.actionButton} onClick={handleCopy} aria-label={copied ? 'Copied' : 'Copy reply'}>
        {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      </button>
      <button type="button" className={styles.actionButton} onClick={onRetry} aria-label="Retry">
        <RetryIcon size={14} />
      </button>
    </div>
  )
}

function FollowUps({ replies, onQuickReply }: { replies: string[]; onQuickReply: (reply: string) => void }) {
  return (
    <div className={styles.followUps}>
      <p className={styles.followUpsLabel}>Follow-ups</p>
      {replies.map((reply) => (
        <button key={reply} type="button" className={styles.followUpButton} onClick={() => onQuickReply(reply)}>
          <ReplyIcon size={11} className={styles.followUpIcon} />
          {reply}
        </button>
      ))}
    </div>
  )
}

function AssistantMessage({ message, index, isLast, onQuickReply, onRetry, onAddTasks }: {
  message: Message
  index: number
  isLast: boolean
  onQuickReply: (reply: string) => void
  onRetry: () => void
  onAddTasks: (messageIndex: number, tasks: TaskSuggestion[]) => Promise<void>
}) {
  if (message.tool) return <ToolRow tool={message.tool} />

  const settled = !message.isStreaming
  // Retry only makes sense for real model replies, not the local welcome message
  const canAct = isLast && settled && message.thoughtMs !== undefined

  return (
    <div className={styles.assistant}>
      {message.thoughtMs !== undefined && (
        <div className={styles.thoughtLabel}>
          <SparkleIcon size={12} />
          <span>{formatThought(message.thoughtMs)}</span>
        </div>
      )}
      {message.quote && <blockquote className={styles.quote}>{message.quote}</blockquote>}
      <StreamingText content={message.content} isStreaming={message.isStreaming} />
      {message.taskSuggestions && (
        <TaskSuggestions
          tasks={message.taskSuggestions}
          added={message.tasksAdded}
          onAdd={(tasks) => onAddTasks(index, tasks)}
        />
      )}
      {canAct && !message.taskSuggestions && <MessageActions content={message.content} onRetry={onRetry} />}
      {isLast && settled && message.quickReplies && message.quickReplies.length > 0 && (
        <FollowUps replies={message.quickReplies} onQuickReply={onQuickReply} />
      )}
    </div>
  )
}

export function ChatMessages({ messages, isThinking, thinkingContent, onQuickReply, onRetry, onAddTasks }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  return (
    <div className={styles.container} ref={scrollRef}>
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          {message.role === 'user' ? (
            <div className={styles.userRow}>
              <div className={styles.userBubble}>{message.content}</div>
            </div>
          ) : (
            <AssistantMessage
              message={message}
              index={index}
              isLast={index === messages.length - 1}
              onQuickReply={onQuickReply}
              onRetry={onRetry}
              onAddTasks={onAddTasks}
            />
          )}
        </motion.div>
      ))}
      {isThinking && <ThinkingState content={thinkingContent} />}
    </div>
  )
}

export default ChatMessages
