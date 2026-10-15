'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext, type AuthContextType } from '@/components/auth/auth-context'
import { AiChat } from '@/components/ai'
import { BetaDashboardClient } from '@/components/dashboard/beta/beta-dashboard-client'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { ChatProvider, useChatContext } from '@/hooks/use-chat-context'
import { DEFAULT_WIDGET_STATE } from '@/hooks/use-beta-widgets'
import { notetakerToTree } from '@/lib/panel-tree'
import { demoAudio } from '@/lib/demo/audio'
import { demoApi, resetDemoData } from '@/lib/demo/backend'
import { DEMO_USER } from '@/lib/demo/data'
import { demoLanguageModel } from '@/lib/demo/language-model'
import { enableDemoMode } from '@/lib/demo/mode'
import { sandboxDemo } from '@/lib/demo/sandbox'
import { createDirector } from './director'
import { DemoCursor } from './demo-cursor'
import { askStory, calendarsStory, dockStory, notesStory, scheduleStory, tasksStory } from './stories/features'
import { heroStory } from './stories/hero'
import { layoutsStory, type LayoutState } from './stories/layouts'
import type { PanelNode } from '@/lib/panel-tree'
import type { WidgetId } from '@/hooks/use-beta-widgets'

/*
 * /demo: the real dashboard with sample data, played by a script. The landing page shows it
 * in iframes (components/landing/demo-embed.tsx). ?story= picks the script (see STORIES).
 */

// Before any widget renders or fetches: sample data instead of the API, a fake microphone,
// and a page that can't reach the real app's storage or scroll the landing page
if (typeof window !== 'undefined') {
  sandboxDemo()
  enableDemoMode({ api: demoApi, audio: demoAudio })
}

const DEMO_AUTH: AuthContextType = {
  user: DEMO_USER,
  session: { user: DEMO_USER, expires: '2099-01-01T00:00:00.000Z' },
  signIn: async () => {},
  signOut: async () => {},
  loading: false,
}

const STORIES = ['hero', 'layouts', 'calendars', 'dock', 'ask', 'notes', 'tasks', 'schedule'] as const
type Story = (typeof STORIES)[number]

// Stories with a pointer on screen
const WITH_CURSOR: Story[] = ['hero', 'ask', 'notes', 'tasks']

const only = (...ids: WidgetId[]) =>
  Object.fromEntries(Object.keys(DEFAULT_WIDGET_STATE).map((id) => [id, ids.includes(id as WidgetId)])) as LayoutState['visible']

const widget = (id: WidgetId): PanelNode => ({ type: 'widget', id })

function initialLayout(story: Story): LayoutState {
  switch (story) {
    case 'notes':
    case 'tasks':
    case 'schedule':
      // Just that widget, switched on alone the way a user can
      return { tree: widget(story), visible: only(story) }
    case 'calendars':
      return {
        tree: {
          type: 'split',
          direction: 'row',
          sizes: [62, 38],
          children: [widget('schedule'), { type: 'split', direction: 'column', sizes: [55, 45], children: [widget('tasks'), widget('countdown')] }],
        },
        visible: only('schedule', 'tasks', 'countdown'),
      }
    default:
      return { tree: notetakerToTree(), visible: { ...DEFAULT_WIDGET_STATE } }
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Scene({ story, onLoopEnd }: { story: Story; onLoopEnd: () => void }) {
  const chat = useChatContext()
  const chatRef = useRef(chat)
  chatRef.current = chat
  const cursorRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState(() => initialLayout(story))
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  useEffect(() => {
    if (prefersReducedMotion()) return
    const controller = new AbortController()
    const director = createDirector(cursorRef.current, controller.signal)
    const stories: Record<Story, () => Promise<void>> = {
      hero: () =>
        heroStory(director, {
          askAboutText: (text) => chatRef.current.askAboutText(text),
          closeChat: () => chatRef.current.closeChat(),
        }),
      layouts: () =>
        layoutsStory(director, {
          get: () => layoutRef.current,
          set: (next) => {
            layoutRef.current = next
            setLayout(next)
          },
        }),
      calendars: () => calendarsStory(director),
      dock: () => dockStory(director),
      ask: () => askStory(director),
      notes: () => notesStory(director),
      tasks: () => tasksStory(director),
      schedule: () => scheduleStory(director),
    }
    const run = stories[story]()
    run
      .then(onLoopEnd)
      .catch((error) => {
        if (error?.name === 'AbortError') return
        console.warn('Demo: restarting after', error)
        setTimeout(onLoopEnd, 1500)
      })
    return () => controller.abort()
  }, [story, onLoopEnd])

  return (
    <>
      <BetaDashboardClient
        notes={<NotesWidget />}
        tasks={<TasksWidget searchQuery="" />}
        layoutOverride={{ presetLayout: 'custom', visibleWidgets: layout.visible, customLayout: { tree: layout.tree } }}
      />
      <AiChat />
      <DemoCursor ref={cursorRef} showPointer={WITH_CURSOR.includes(story)} />
    </>
  )
}

export function DemoDashboard() {
  const requested = useSearchParams().get('story')
  const story: Story = STORIES.includes(requested as Story) ? (requested as Story) : 'hero'
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false } } }),
  )
  // Browser only: like /tab, the dashboard measures the window as it renders
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // Each loop starts over from the sample data with fresh widgets
  const [loop, setLoop] = useState(0)
  const nextLoop = useCallback(() => {
    resetDemoData()
    queryClient.clear()
    setLoop((n) => n + 1)
  }, [queryClient])

  if (!mounted) return null

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={DEMO_AUTH}>
        <ChatProvider key={loop} languageModel={demoLanguageModel}>
          <Scene key={loop} story={story} onLoopEnd={nextLoop} />
        </ChatProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  )
}
