'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-fetch'
import { getDemoApi } from '@/lib/demo/mode'
import { type ChatThread, newThreadId, deriveThreadTitle, loadChatThreads, saveChatThreads } from '@/lib/chat-threads'

export interface Message {
  content: string
  role: 'user' | 'assistant'
  isStreaming?: boolean
  quickReplies?: string[]
  /** time from send to first token, shown as "Thought for Ns" */
  thoughtMs?: number
  /** set when a #task / #note command ran instead of the model */
  tool?: { kind: 'task' | 'note'; text: string }
  /** text from a note the user is asking about */
  quote?: string
  /** tasks the AI suggested from a note, awaiting confirmation */
  taskSuggestions?: TaskSuggestion[]
  /** how many suggested tasks were added (set once confirmed) */
  tasksAdded?: number
}

export interface TaskSuggestion {
  title: string
  isHighPriority: boolean
  /** YYYY-MM-DD or null */
  dueDate: string | null
}

export const MAKE_TASKS_REPLY = 'Make tasks from this'
export const SUMMARISE_REPLY = 'Summarise this'

interface ChatContextType {
  isChatOpen: boolean
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>
  openChat: () => void
  closeChat: () => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isThinking: boolean
  thinkingContent: string
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  processMessage: (initialMessage?: string) => Promise<void>
  processStreamingMessage: (initialMessage?: string) => Promise<void>
  retryLastMessage: () => Promise<void>
  /** text from a note that follow-up questions are about */
  contextText: string | null
  clearContext: () => void
  /** Ask AI from a note selection: opens chat with the text as context */
  askAboutText: (text: string) => void
  /** Ask the AI to suggest tasks from some note text */
  suggestTasks: (text: string, label?: string) => Promise<void>
  addSuggestedTasks: (messageIndex: number, tasks: TaskSuggestion[]) => Promise<void>
  /** Create tasks directly (used by the editor's + Task button) */
  createTasks: (tasks: Array<Partial<TaskSuggestion> & { title: string }>) => Promise<number>
  sendQuickReply: (reply: string) => Promise<void>
  isStreamingMode: boolean
  toggleStreamingMode: () => void
  cancelMessage: () => void
  canCancel: boolean
  /** saved conversations, newest first */
  threads: ChatThread[]
  activeThreadId: string | null
  newThread: () => void
  selectThread: (id: string) => void
  deleteThread: (id: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Chat runs entirely on Chrome's built-in Prompt API (Gemini Nano). Chrome 138+ exposes a
// global `LanguageModel`; earlier builds used `window.ai.languageModel`. A provider can pass
// its own model instead (the landing page demo scripts its answers this way).
function getLanguageModelApi(override?: unknown): { api: any; legacy: boolean } | null {
  if (override) return { api: override, legacy: false }
  if (typeof window === 'undefined') return null
  const g = globalThis as any
  if (g.LanguageModel) return { api: g.LanguageModel, legacy: false }
  if (g.ai?.languageModel) return { api: g.ai.languageModel, legacy: true }
  return null
}

async function isLocalAiAvailable(override?: unknown): Promise<boolean> {
  const found = getLanguageModelApi(override)
  if (!found) return false
  try {
    if (!found.legacy) return (await found.api.availability()) !== 'unavailable'
    return (await found.api.capabilities())?.available !== 'no'
  } catch {
    return false
  }
}

const LOCAL_AI_UNAVAILABLE_MESSAGE =
  "AI chat runs on Chrome's built-in Gemini Nano, so your data never leaves your device. " +
  "It isn't available in this browser. Use desktop Chrome 138 or later; the first time, " +
  "Chrome may take a few minutes to download the model."

const TASKS_SCHEMA = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          important: { type: 'boolean' },
          due: { type: ['string', 'null'] },
        },
        required: ['title', 'important', 'due'],
      },
    },
  },
  required: ['tasks'],
}

function localDateISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/* The model sometimes answers "tomorrow" or "ASAP" instead of a date */
function normaliseDue(due: unknown): string | null {
  if (typeof due !== 'string') return null
  const value = due.trim().toLowerCase()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const today = new Date()
  if (['today', 'immediately', 'now', 'asap', 'straight away', 'right away'].includes(value)) return localDateISO(today)
  if (value === 'tomorrow') {
    today.setDate(today.getDate() + 1)
    return localDateISO(today)
  }
  return null
}

/* Creating the first session after a page load can take ~15s while Chrome loads
   the model; after a short wait, tell the user what's happening */
async function withWarmUpNotice<T>(work: Promise<T>, notify: (text: string) => void): Promise<T> {
  const timer = setTimeout(() => notify('Getting the on-device model ready…'), 2500)
  try {
    return await work
  } finally {
    clearTimeout(timer)
    notify('')
  }
}

/* Pulls a task list out of the model's reply; tolerates prose around the JSON */
function parseTaskSuggestions(raw: string): TaskSuggestion[] {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[0])
    const list = Array.isArray(parsed?.tasks) ? parsed.tasks : []
    return list
      .filter((t: any) => typeof t?.title === 'string' && t.title.trim())
      .slice(0, 12)
      .map((t: any) => ({
        title: t.title.trim().replace(/\.$/, ''),
        isHighPriority: t.important === true,
        dueDate: normaliseDue(t.due),
      }))
  } catch {
    return []
  }
}

// When a plain message might be asking to create something, a structured call decides whether to
// actually make a task/note. Kept conservative so ordinary chat is never hijacked.
const CREATE_INTENT_HINT = /\b(add|create|make|new|set up|jot|note down|take a note|remind me)\b/i

const CREATE_INTENT_SCHEMA = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ['create_task', 'create_note', 'none'] },
    task: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        important: { type: 'boolean' },
        due: { type: ['string', 'null'] },
      },
    },
    note: {
      type: 'object',
      properties: { text: { type: 'string' } },
    },
  },
  required: ['action'],
}

type CreateIntent =
  | { action: 'create_task'; task: { title: string; important: boolean; due: string | null } }
  | { action: 'create_note'; note: { text: string } }
  | { action: 'none' }

function parseCreateIntent(raw: string): CreateIntent {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return { action: 'none' }
  try {
    const parsed = JSON.parse(match[0])
    if (parsed?.action === 'create_task' && typeof parsed?.task?.title === 'string' && parsed.task.title.trim()) {
      return {
        action: 'create_task',
        task: { title: parsed.task.title.trim(), important: parsed.task.important === true, due: parsed.task.due ?? null },
      }
    }
    if (parsed?.action === 'create_note' && typeof parsed?.note?.text === 'string' && parsed.note.text.trim()) {
      return { action: 'create_note', note: { text: parsed.note.text.trim() } }
    }
    return { action: 'none' }
  } catch {
    return { action: 'none' }
  }
}

export function ChatProvider({ children, languageModel }: { children: ReactNode; languageModel?: unknown }) {
  // Stable for the provider's lifetime, so a ref keeps it out of every dependency list
  const languageModelRef = useRef(languageModel)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingContent, setThinkingContent] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isStreamingMode, setIsStreamingMode] = useState(true)
  const [contextText, setContextText] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Set when we abort because the user switched threads, so no "cancelled" toast is shown
  const suppressCancelToastRef = useRef(false)
  const { hasSeenOnboarding, onboardingStep, setOnboardingStep, completeOnboarding, userName, agentName } = useSettings()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const localAiSessionRef = useRef<any>(null)

  // Conversation threads (saved per-device; see lib/chat-threads). `messages` is the live copy of
  // the active thread; a settled change is written back into that thread and persisted.
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const threadsRef = useRef<ChatThread[]>([])
  threadsRef.current = threads
  const activeThreadIdRef = useRef<string | null>(null)
  activeThreadIdRef.current = activeThreadId
  const threadsLoadedRef = useRef(false)

  const welcomeMessage = useCallback((): Message => ({
    role: 'assistant',
    content: hasSeenOnboarding
      ? 'Welcome back! What can I help you with?'
      : `Hi, I'm ${agentName || 'Alex'}. Ask me about your notes, tasks or schedule, or use #task and #note to add things.`,
  }), [hasSeenOnboarding, agentName])

  const createThread = useCallback((): ChatThread => {
    const now = Date.now()
    return { id: newThreadId(), title: 'New chat', messages: [welcomeMessage()], createdAt: now, updatedAt: now }
  }, [welcomeMessage])

  // A thread keeps the model's conversation history inside its session, so switching threads must
  // start a fresh session (the next prompt rebuilds it with up-to-date context).
  const resetModelSession = useCallback(() => {
    try { localAiSessionRef.current?.destroy?.() } catch {}
    localAiSessionRef.current = null
  }, [])

  // Abort any streaming reply before switching away, so its tokens don't land in another thread
  const stopActiveGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      suppressCancelToastRef.current = true
      abortControllerRef.current.abort()
    }
    setIsThinking(false)
  }, [])

  // Load saved threads once. The scripted /demo keeps its own in-memory thread and never persists.
  useEffect(() => {
    if (getDemoApi()) {
      const t = createThread()
      setThreads([t]); setActiveThreadId(t.id); setMessages(t.messages)
      threadsLoadedRef.current = true
      return
    }
    let active = true
    loadChatThreads()
      .then(({ threads: loaded, activeThreadId: savedActive }) => {
        if (!active) return
        if (loaded.length) {
          setThreads(loaded)
          const current = loaded.find(t => t.id === savedActive) ?? loaded[0]
          setActiveThreadId(current.id)
          setMessages(current.messages)
        } else {
          const t = createThread()
          setThreads([t]); setActiveThreadId(t.id); setMessages(t.messages)
        }
      })
      .catch(() => {
        if (!active) return
        const t = createThread()
        setThreads([t]); setActiveThreadId(t.id); setMessages(t.messages)
      })
      .finally(() => { threadsLoadedRef.current = true })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Write the live messages back into the active thread once streaming has settled, and persist.
  useEffect(() => {
    if (!threadsLoadedRef.current || !activeThreadId || getDemoApi()) return
    if (isThinking || messages.some(m => m.isStreaming)) return
    const prev = threadsRef.current
    if (!prev.some(t => t.id === activeThreadId)) return
    const next = prev.map(t => (t.id === activeThreadId
      ? { ...t, messages, title: deriveThreadTitle(messages), updatedAt: Date.now() }
      : t))
    setThreads(next)
    saveChatThreads(next, activeThreadId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isThinking, activeThreadId])

  const newThread = useCallback(() => {
    stopActiveGeneration()
    const t = createThread()
    const next = [t, ...threadsRef.current]
    setThreads(next)
    setActiveThreadId(t.id)
    setMessages(t.messages)
    setContextText(null)
    resetModelSession()
    if (!getDemoApi()) saveChatThreads(next, t.id)
  }, [createThread, resetModelSession, stopActiveGeneration])

  const selectThread = useCallback((id: string) => {
    const target = threadsRef.current.find(t => t.id === id)
    if (!target || id === activeThreadIdRef.current) return
    stopActiveGeneration()
    setActiveThreadId(id)
    setMessages(target.messages)
    setContextText(null)
    resetModelSession()
    if (!getDemoApi()) saveChatThreads(threadsRef.current, id)
  }, [resetModelSession, stopActiveGeneration])

  const deleteThread = useCallback((id: string) => {
    const remaining = threadsRef.current.filter(t => t.id !== id)
    const wasActive = id === activeThreadIdRef.current
    if (wasActive) stopActiveGeneration()
    if (remaining.length === 0) {
      const t = createThread()
      setThreads([t]); setActiveThreadId(t.id); setMessages(t.messages); resetModelSession()
      if (!getDemoApi()) saveChatThreads([t], t.id)
      return
    }
    setThreads(remaining)
    const nextActiveId = wasActive ? remaining[0].id : activeThreadIdRef.current
    if (wasActive) {
      setActiveThreadId(remaining[0].id)
      setMessages(remaining[0].messages)
      resetModelSession()
    }
    if (!getDemoApi()) saveChatThreads(remaining, nextActiveId)
  }, [createThread, resetModelSession, stopActiveGeneration])

  const initLocalAiSession = useCallback(async () => {
    if (localAiSessionRef.current) return localAiSessionRef.current;

    let dbContext = "";
    const resolvedAgentName = agentName || "Alex";
    const resolvedUserName = userName || "User";

    try {
      const res = await apiFetch('/api/ai-context');
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          dbContext = body.data.context;
        }
      }
    } catch (e) {
      console.warn("Context fetch failed, using default prompt", e);
    }

    const systemPrompt = `
You are ${resolvedAgentName}, a productivity assistant for ${resolvedUserName}.
Use this context to answer questions:
${dbContext || 'No context available.'}

Be concise. Do not answer questions unrelated to the user's data or productivity.
    `.trim();

    const found = getLanguageModelApi(languageModelRef.current);
    if (!found) throw new Error("Local AI not supported");

    const session = found.legacy
      ? await found.api.create({ systemPrompt })
      : await found.api.create({ initialPrompts: [{ role: 'system', content: systemPrompt }] });

    localAiSessionRef.current = session;
    return session;
  }, [userName, agentName]);

  // Creates tasks via the API. The API reads `title` (sending `content` saved them as "Untitled Task").
  const createTasks = useCallback(async (items: Array<Partial<TaskSuggestion> & { title: string }>) => {
    let created = 0
    const createdIds: string[] = []
    for (const item of items) {
      const title = item.title.trim().slice(0, 200)
      if (!title) continue
      const response = await apiFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          isHighPriority: item.isHighPriority ?? false,
          // Midday UTC keeps a date-only due date on the same day in every timezone
          dueDate: item.dueDate ? `${item.dueDate}T12:00:00Z` : null,
        }),
      })
      if (!response.ok) throw new Error('Failed to create task')
      const body = await response.json().catch(() => ({}))
      if (body?.data?.id) createdIds.push(body.data.id)
      created += 1
    }
    console.log('ChatProvider: created', created, 'tasks')
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    // The Tasks widget keeps its own list; this makes it reload and highlight the new tasks
    window.dispatchEvent(new CustomEvent('tasks-changed', { detail: { createdIds, count: created } }))
    return created
  }, [queryClient])

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiFetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The editor stores Quill deltas, so wrap the text; the first line becomes the title
        body: JSON.stringify({
          title: content.split('\n')[0].slice(0, 60),
          content: { ops: [{ insert: `${content}\n` }] },
        }),
      })
      if (!response.ok) throw new Error('Failed to create note')
      return response.json()
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      // The Notes widget reloads on this (it keeps its own list)
      window.dispatchEvent(new CustomEvent('note-created', { detail: result }))
      if (!getDemoApi()) {
        toast({
          title: 'Note created',
          description: 'Your note has been created successfully.',
        })
      }
    },
  })

  // Handles #task / #note commands. The tag can sit anywhere in the message ("buy milk #task" or
  // "#task buy milk"); the rest of the text becomes the task/note. Returns true when it ran.
  const handleHashtagCommand = useCallback(async (userMessage: string) => {
    const strip = (tag: RegExp) => userMessage.replace(tag, '').replace(/\s+/g, ' ').trim()
    let match: { kind: 'task' | 'note'; text: string } | null = null
    if (/#task\b/i.test(userMessage)) {
      const text = strip(/#task\b/gi)
      if (text) match = { kind: 'task', text }
    } else if (/#note\b/i.test(userMessage)) {
      const text = strip(/#note\b/gi)
      if (text) match = { kind: 'note', text }
    }
    if (!match) return false

    if (match.kind === 'task') await createTasks([{ title: match.text }])
    else await createNoteMutation.mutateAsync(match.text)
    setMessages(prev => [...prev, { role: 'assistant', content: '', tool: match }])
    return true
  }, [createTasks, createNoteMutation])

  // Natural-language "add a task…" / "make a note…": a structured call decides whether the message
  // is really a create request, and creates the object if so. Returns true when it handled it, so
  // the caller skips the normal chat reply. Plain chat (action "none") falls through untouched.
  const handleCreateIntent = useCallback(async (userMessage: string) => {
    if (!CREATE_INTENT_HINT.test(userMessage)) return false
    const found = getLanguageModelApi(languageModelRef.current)
    if (!found) return false

    const today = new Date()
    const systemPrompt = [
      'Decide whether the user wants to CREATE a task or a note, or is just chatting.',
      `Today is ${today.toLocaleDateString('en-AU', { weekday: 'long' })} ${localDateISO(today)}.`,
      'Reply with JSON matching the schema.',
      '- action "create_task": they want to add a to-do, task or reminder. Give task.title (imperative, reusing their words, at most 12 words), task.important (true only if urgent/ASAP), task.due (YYYY-MM-DD if a day or date is mentioned, otherwise null).',
      '- action "create_note": they want to save or jot a note. Give note.text (the note content, in their words).',
      '- action "none": anything else, including questions about existing tasks, notes or schedule.',
      'Only choose create when they clearly want something saved.',
    ].join('\n')

    let session: any
    try {
      session = found.legacy
        ? await found.api.create({ systemPrompt })
        : await found.api.create({ initialPrompts: [{ role: 'system', content: systemPrompt }] })
      const raw: string = await session.prompt(
        userMessage,
        found.legacy ? undefined : { responseConstraint: CREATE_INTENT_SCHEMA },
      )
      session.destroy?.()

      const intent = parseCreateIntent(raw)
      if (intent.action === 'create_task') {
        await createTasks([{ title: intent.task.title, isHighPriority: intent.task.important, dueDate: normaliseDue(intent.task.due) }])
        setMessages(prev => [...prev, { role: 'assistant', content: '', tool: { kind: 'task', text: intent.task.title } }])
        return true
      }
      if (intent.action === 'create_note') {
        await createNoteMutation.mutateAsync(intent.note.text)
        const title = intent.note.text.split('\n')[0].slice(0, 60)
        setMessages(prev => [...prev, { role: 'assistant', content: '', tool: { kind: 'note', text: title } }])
        return true
      }
      return false
    } catch (error) {
      console.error('ChatProvider: create-intent detection failed', error)
      try { session?.destroy?.() } catch {}
      return false
    }
  }, [createTasks, createNoteMutation])

  const runLocalAi = useCallback(async (userMessage: string, streaming: boolean) => {
    setIsThinking(true)
    setThinkingContent('')
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (await handleHashtagCommand(userMessage)) return

      if (!(await isLocalAiAvailable(languageModelRef.current))) {
        console.warn('ChatProvider: Prompt API unavailable in this browser')
        setMessages(prev => [...prev, { role: 'assistant', content: LOCAL_AI_UNAVAILABLE_MESSAGE }])
        return
      }

      // "add a task…" / "make a note…" create the object instead of a chat reply
      if (await handleCreateIntent(userMessage)) return

      const session = await withWarmUpNotice(initLocalAiSession(), setThinkingContent)
      const startedAt = Date.now()
      // Questions after "Ask AI" on a selection are about that text
      const prompt = contextText
        ? `Here is some text from my notes:\n"""\n${contextText}\n"""\n\n${userMessage}`
        : userMessage

      const followUpReplies =
        contextText && userMessage === SUMMARISE_REPLY ? [MAKE_TASKS_REPLY] : undefined

      if (!streaming) {
        const responseText = await session.prompt(prompt, { signal: controller.signal })
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: responseText,
            thoughtMs: Date.now() - startedAt,
            quickReplies: followUpReplies,
          },
        ])
        return
      }

      // The current API streams deltas; the legacy one streamed the cumulative text.
      const legacy = getLanguageModelApi(languageModelRef.current)?.legacy ?? false
      let fullText = ''
      let started = false

      const stream = session.promptStreaming(prompt, { signal: controller.signal })
      for await (const chunk of stream) {
        // Keep the thinking state up until the first token arrives
        setIsThinking(false)
        fullText = legacy ? chunk : fullText + chunk
        const content = fullText
        // Updaters must stay pure (StrictMode runs them twice), so decide append vs update out here
        if (!started) {
          started = true
          const thoughtMs = Date.now() - startedAt
          setMessages(prev => [...prev, { role: 'assistant' as const, content, isStreaming: true, thoughtMs }])
        } else {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], content }
            return updated
          })
        }
      }

      setMessages(prev => {
        if (!started) return prev
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
          quickReplies: followUpReplies,
        }
        return updated
      })
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        if (!suppressCancelToastRef.current) {
          toast({ title: 'Message cancelled', description: 'The message was cancelled.' })
        }
        suppressCancelToastRef.current = false
      } else {
        console.error('Error processing message:', error)
        toast({
          title: 'Error',
          description: 'Failed to process your message. Please try again.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsThinking(false)
      setThinkingContent('')
      abortControllerRef.current = null
    }
  }, [handleHashtagCommand, handleCreateIntent, initLocalAiSession, toast, contextText])

  const processMessage = useCallback(async (initialMessage?: string) => {
    const userMessage = (initialMessage || inputValue).trim()
    if (!userMessage) return
    await runLocalAi(userMessage, false)
  }, [inputValue, runLocalAi])

  const processStreamingMessage = useCallback(async (initialMessage?: string) => {
    const userMessage = (initialMessage || inputValue).trim()
    if (!userMessage) return
    await runLocalAi(userMessage, true)
  }, [inputValue, runLocalAi])

  // Drops the last assistant reply and asks again with the user message before it
  const retryLastMessage = useCallback(async () => {
    const lastUserIndex = messages.map(m => m.role).lastIndexOf('user')
    if (lastUserIndex === -1 || isThinking) return
    const lastUserMessage = messages[lastUserIndex].content
    setMessages(prev => prev.slice(0, lastUserIndex))
    await runLocalAi(lastUserMessage, true)
  }, [messages, isThinking, runLocalAi])

  // Opening chat starts loading the on-device model in the background
  const warmedRef = useRef(false)
  useEffect(() => {
    if (!isChatOpen || warmedRef.current) return
    warmedRef.current = true
    const found = getLanguageModelApi(languageModelRef.current)
    if (!found || found.legacy) return
    found.api
      .create()
      .then((session: any) => session.destroy?.())
      .catch((error: unknown) => console.warn('ChatProvider: model warm-up failed', error))
  }, [isChatOpen])

  const clearContext = useCallback(() => setContextText(null), [])

  const askAboutText = useCallback((text: string) => {
    const quote = text.trim()
    if (!quote) return
    if (!hasSeenOnboarding) completeOnboarding({ userName, agentName })
    setContextText(quote)
    setIsChatOpen(true)
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'What would you like to do with this?',
      quote,
      quickReplies: [MAKE_TASKS_REPLY, SUMMARISE_REPLY],
    }])
  }, [hasSeenOnboarding, completeOnboarding, userName, agentName])

  const suggestTasks = useCallback(async (text: string, label = MAKE_TASKS_REPLY) => {
    const source = text.trim()
    if (!source || isThinking) return
    if (!hasSeenOnboarding) completeOnboarding({ userName, agentName })
    setIsChatOpen(true)
    setMessages(prev => [...prev, { role: 'user', content: label }])
    setIsThinking(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (!(await isLocalAiAvailable(languageModelRef.current))) {
        setMessages(prev => [...prev, { role: 'assistant', content: LOCAL_AI_UNAVAILABLE_MESSAGE }])
        return
      }
      const found = getLanguageModelApi(languageModelRef.current)!
      const today = new Date()
      const systemPrompt = [
        'You turn notes into a to-do list.',
        `Today is ${today.toLocaleDateString('en-AU', { weekday: 'long' })} ${localDateISO(today)}.`,
        'Find the actionable tasks in the text. For each task give:',
        "- title: what the writer needs to do, starting with a verb and reusing their words, at most 8 words (\"I need to call Sam about the lease\" becomes \"Call Sam about the lease\")",
        '- important: false, unless the text says it is urgent, important, ASAP or needed straight away',
        '- due: the date as YYYY-MM-DD if the text mentions a day or date, otherwise null',
        'Only include real tasks. If there are none, return an empty list.',
        'Reply with JSON only, shaped like {"tasks":[{"title":"","important":false,"due":null}]}.',
      ].join('\n')

      const session: any = await withWarmUpNotice(
        found.legacy
          ? found.api.create({ systemPrompt })
          : found.api.create({ initialPrompts: [{ role: 'system', content: systemPrompt }] }),
        setThinkingContent,
      )
      const startedAt = Date.now()
      const raw: string = await session.prompt(
        source.slice(0, 6000),
        found.legacy ? { signal: controller.signal } : { signal: controller.signal, responseConstraint: TASKS_SCHEMA },
      )
      session.destroy?.()

      const tasks = parseTaskSuggestions(raw)
      console.log('ChatProvider: suggested tasks', tasks)
      const thoughtMs = Date.now() - startedAt
      setMessages(prev => [...prev, tasks.length
        ? {
            role: 'assistant' as const,
            content: `I found ${tasks.length} task${tasks.length === 1 ? '' : 's'}. Untick any you don't want, then add them.`,
            taskSuggestions: tasks,
            thoughtMs,
          }
        : {
            role: 'assistant' as const,
            content: "I couldn't find anything in there that reads like a task.",
            thoughtMs,
          }])
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('ChatProvider: task suggestion failed', error)
        toast({ title: 'Error', description: "Couldn't suggest tasks. Please try again.", variant: 'destructive' })
      }
    } finally {
      setIsThinking(false)
      setThinkingContent('')
      abortControllerRef.current = null
    }
  }, [isThinking, hasSeenOnboarding, completeOnboarding, userName, agentName, toast])

  const addSuggestedTasks = useCallback(async (messageIndex: number, tasks: TaskSuggestion[]) => {
    try {
      const created = await createTasks(tasks)
      setMessages(prev => prev.map((m, i) => (i === messageIndex ? { ...m, tasksAdded: created } : m)))
      // Pause so "Added N tasks to Tasks" reads clearly before revealing the Tasks widget
      setTimeout(() => {
        setIsChatOpen(false)
        setContextText(null)
        window.dispatchEvent(new CustomEvent('tasks-focus'))
      }, 1100)
    } catch (error) {
      console.error('ChatProvider: adding suggested tasks failed', error)
      toast({ title: 'Error', description: "Couldn't add those tasks. Please try again.", variant: 'destructive' })
    }
  }, [createTasks, toast])

  const sendQuickReply = useCallback(async (reply: string) => {
    if (reply === MAKE_TASKS_REPLY && contextText) {
      await suggestTasks(contextText, reply)
      return
    }
    await runLocalAi(reply, true)
  }, [contextText, suggestTasks, runLocalAi])

  const toggleStreamingMode = useCallback(() => {
    setIsStreamingMode(prev => !prev)
  }, [])

  const cancelMessage = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const canCancel = Boolean(abortControllerRef.current && isThinking)

  const openChat = useCallback(() => {
    setIsChatOpen(true)
    // The active thread already carries its welcome / history (see the thread-loading effect)
    if (!hasSeenOnboarding) {
      completeOnboarding({ userName, agentName })
    }
  }, [hasSeenOnboarding, completeOnboarding, userName, agentName])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
    setContextText(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === 'k') {
        event.preventDefault()
        setIsChatOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

    return (
    <ChatContext.Provider
      value={{
        isChatOpen, 
        setIsChatOpen, 
        openChat, 
        closeChat, 
        messages, 
        setMessages,
        isThinking,
        thinkingContent,
        inputValue,
        setInputValue,
        processMessage,
        processStreamingMessage,
        retryLastMessage,
        contextText,
        clearContext,
        askAboutText,
        suggestTasks,
        addSuggestedTasks,
        createTasks,
        sendQuickReply,
        isStreamingMode,
        toggleStreamingMode,
        cancelMessage,
        canCancel,
        threads,
        activeThreadId,
        newThread,
        selectThread,
        deleteThread,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
} 