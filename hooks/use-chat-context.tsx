'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-fetch'

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
const SUMMARISE_REPLY = 'Summarise this'

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
  const { hasSeenOnboarding, onboardingStep, setOnboardingStep, completeOnboarding, userName, agentName } = useSettings()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const localAiSessionRef = useRef<any>(null)

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
      created += 1
    }
    console.log('ChatProvider: created', created, 'tasks')
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    // The Tasks widget keeps its own list; this makes it reload so the new tasks show
    window.dispatchEvent(new CustomEvent('tasks-changed'))
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
      toast({
        title: 'Note created',
        description: 'Your note has been created successfully.',
      })
    },
  })

  // Handles #task / #note commands. Returns true when the message was a command.
  const handleHashtagCommand = useCallback(async (userMessage: string) => {
    const taskMatch = userMessage.match(/#task\s+(.+)/)
    const noteMatch = userMessage.match(/#note\s+(.+)/)
    const match = taskMatch ? { kind: 'task' as const, text: taskMatch[1] } : noteMatch ? { kind: 'note' as const, text: noteMatch[1] } : null
    if (!match) return false

    if (match.kind === 'task') await createTasks([{ title: match.text }])
    else await createNoteMutation.mutateAsync(match.text)
    setMessages(prev => [...prev, { role: 'assistant', content: '', tool: match }])
    return true
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

      const session = await withWarmUpNotice(initLocalAiSession(), setThinkingContent)
      const startedAt = Date.now()
      // Questions after "Ask AI" on a selection are about that text
      const prompt = contextText
        ? `Here is some text from my notes:\n"""\n${contextText}\n"""\n\n${userMessage}`
        : userMessage

      if (!streaming) {
        const responseText = await session.prompt(prompt, { signal: controller.signal })
        setMessages(prev => [...prev, { role: 'assistant', content: responseText, thoughtMs: Date.now() - startedAt }])
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
        updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false }
        return updated
      })
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        toast({ title: 'Message cancelled', description: 'The message was cancelled.' })
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
  }, [handleHashtagCommand, initLocalAiSession, toast, contextText])

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
    if (messages.length === 0) {
      // The old server-driven onboarding chat no longer exists, so finish onboarding on first open
      if (!hasSeenOnboarding) {
        completeOnboarding({ userName, agentName })
      }
      setMessages([{
        role: 'assistant',
        content: hasSeenOnboarding
          ? 'Welcome back! What can I help you with?'
          : `Hi, I'm ${agentName}. Ask me about your notes, tasks or schedule, or use #task and #note to add things.`,
      }])
    }
  }, [hasSeenOnboarding, completeOnboarding, userName, agentName, messages])

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