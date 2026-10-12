import type { DemoApi } from './mode'
import {
  DEMO_TRANSCRIPT,
  DEMO_USER,
  demoEvents,
  demoNotes,
  demoPreferences,
  demoTasks,
  demoWeather,
} from './data'

/*
 * In-memory stand-in for the ClearTab API, used by apiFetch on the /demo page. It answers the
 * routes the dashboard calls with the same response shapes, and keeps writes (new notes,
 * tasks, preference changes) for the life of the page.
 */

type Note = ReturnType<typeof demoNotes>[number]
type Task = ReturnType<typeof demoTasks>[number]

const store = {
  notes: demoNotes(),
  tasks: demoTasks(),
  preferences: demoPreferences() as Record<string, unknown>,
}

let nextId = 1
const newId = (prefix: string) => `${prefix}-${Date.now()}-${nextId++}`

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function readBody(init?: RequestInit): Promise<Record<string, any>> {
  if (!init?.body || typeof init.body !== 'string') return {}
  try {
    return JSON.parse(init.body)
  } catch {
    return {}
  }
}

const byNewest = <T extends { updatedAt: string }>(items: T[]) =>
  [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

async function notes(method: string, url: URL, init?: RequestInit) {
  if (method === 'GET') return json({ success: true, data: byNewest(store.notes) })
  const body = await readBody(init)
  const now = new Date().toISOString()
  if (method === 'POST') {
    const note: Note = {
      id: newId('demo-note'),
      userId: DEMO_USER.id,
      title: body.title || 'Untitled',
      content: body.content || { ops: [{ insert: '\n' }] },
      createdAt: now,
      updatedAt: now,
    }
    store.notes.unshift(note)
    return json({ success: true, data: note })
  }
  if (method === 'PUT') {
    const note = store.notes.find((n) => n.id === body.noteId)
    if (!note) return json({ success: false, error: 'Note not found' }, 404)
    Object.assign(note, { title: body.title || 'Untitled', content: body.content ?? note.content, updatedAt: now })
    return json({ success: true, data: note })
  }
  if (method === 'DELETE') {
    store.notes = store.notes.filter((n) => n.id !== url.searchParams.get('id'))
    return json({ success: true })
  }
  return json({ error: 'Method not allowed' }, 405)
}

async function tasks(method: string, url: URL, init?: RequestInit) {
  const id = url.searchParams.get('id')
  if (method === 'GET') {
    if (id) {
      const task = store.tasks.find((t) => t.id === id)
      return task ? json({ data: task }) : json({ error: 'Task not found' }, 404)
    }
    return json({ data: [...store.tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) })
  }
  const body = await readBody(init)
  const now = new Date().toISOString()
  if (method === 'POST') {
    const task: Task = {
      id: newId('demo-task'),
      userId: DEMO_USER.id,
      title: body.title || 'Untitled task',
      content: body.content || { ops: [{ insert: '\n' }] },
      isCompleted: false,
      isHighPriority: Boolean(body.isHighPriority),
      dueDate: body.dueDate ?? null,
      order: null,
      createdAt: now,
      updatedAt: now,
    }
    store.tasks.unshift(task)
    return json({ data: task })
  }
  if (method === 'PUT') {
    const task = store.tasks.find((t) => t.id === (body.id ?? id))
    if (!task) return json({ error: 'Task not found' }, 404)
    const { id: _id, userId: _userId, ...changes } = body
    Object.assign(task, changes, { updatedAt: now })
    return json({ data: task })
  }
  if (method === 'DELETE') {
    store.tasks = store.tasks.filter((t) => t.id !== id)
    return json({ success: true })
  }
  return json({ error: 'Method not allowed' }, 405)
}

async function preferences(method: string, init?: RequestInit) {
  if (method === 'PUT') {
    const { id: _id, userId: _userId, ...changes } = await readBody(init)
    Object.assign(store.preferences, changes)
  }
  return json({ data: store.preferences })
}

export const demoApi: DemoApi = async (path, init) => {
  const url = new URL(path, 'https://demo.cleartab.app')
  const method = (init?.method ?? 'GET').toUpperCase()
  // Feels like a network, without making anyone wait
  await wait(method === 'GET' ? 80 : 160)

  switch (url.pathname) {
    case '/api/notes':
      return notes(method, url, init)
    case '/api/tasks':
      return tasks(method, url, init)
    case '/api/preferences':
      return preferences(method, init)
    case '/api/calendar':
      return json({ success: true, data: demoEvents() })
    case '/api/weather': {
      const units = url.searchParams.get('units') === 'IMPERIAL' ? 'IMPERIAL' : 'METRIC'
      return json({ success: true, data: demoWeather(units) })
    }
    case '/api/settings/accounts':
      return json([])
    case '/api/ai-context':
      return json({
        success: true,
        data: {
          context: [
            'Recent notes: ' + store.notes.map((n) => n.title).join(', '),
            'Open tasks: ' + store.tasks.filter((t) => !t.isCompleted).map((t) => t.title).join(', '),
          ].join('\n'),
        },
      })
    case '/api/transcribe':
      // Long enough to see "Transcribing"
      await wait(1100)
      return json({ success: true, data: { text: DEMO_TRANSCRIPT } })
    case '/api/extension/session':
      return json({ user: DEMO_USER, expires: new Date(Date.now() + 864e5).toISOString() })
    default:
      return json({ error: 'Not available in the demo' }, 404)
  }
}

// Back to the starting data, for the next loop of a scripted demo
export function resetDemoData() {
  store.notes = demoNotes()
  store.tasks = demoTasks()
  store.preferences = demoPreferences()
}
