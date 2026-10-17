/*
 * AI chat conversation threads, stored per-device (chrome.storage.local in the extension,
 * localStorage on the web) — the same on-device story as the chat itself, which runs on Gemini
 * Nano. Nothing is sent to the server. Kept to the most recent MAX_THREADS conversations.
 */

import type { Message } from '@/hooks/use-chat-context'

export interface ChatThread {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface StoredThreads {
  threads: ChatThread[]
  activeThreadId: string | null
}

const STORAGE_KEY = 'cleartab-chat-threads'
const MAX_THREADS = 30

type ChromeLocal = {
  get(keys: string | string[]): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

function chromeLocal(): ChromeLocal | null {
  const chrome = (globalThis as unknown as { chrome?: { storage?: { local?: ChromeLocal } } }).chrome
  return chrome?.storage?.local ?? null
}

export function newThreadId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** A thread's title is its first user message, trimmed; "New chat" until there is one. */
export function deriveThreadTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user' && m.content.trim())
  if (!firstUser) return 'New chat'
  const text = firstUser.content.trim().replace(/\s+/g, ' ')
  return text.length > 44 ? `${text.slice(0, 44)}…` : text
}

function isStoredThreads(value: unknown): value is StoredThreads {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as StoredThreads).threads)
  )
}

export async function loadChatThreads(): Promise<StoredThreads> {
  const empty: StoredThreads = { threads: [], activeThreadId: null }

  const local = chromeLocal()
  if (local) {
    try {
      const stored = (await local.get(STORAGE_KEY))?.[STORAGE_KEY]
      if (isStoredThreads(stored)) return stored
    } catch {
      // fall through to localStorage
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (isStoredThreads(parsed)) return parsed
      }
    } catch {
      // ignore
    }
  }

  return empty
}

export async function saveChatThreads(threads: ChatThread[], activeThreadId: string | null): Promise<void> {
  // Keep the most recently updated threads only
  const trimmed = [...threads].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_THREADS)
  const payload: StoredThreads = { threads: trimmed, activeThreadId }

  const local = chromeLocal()
  if (local) {
    try {
      await local.set({ [STORAGE_KEY]: payload })
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore (quota, private mode)
    }
  }
}
