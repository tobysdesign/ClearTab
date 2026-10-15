import type Quill from 'quill'
import { apiFetch } from '@/lib/api-fetch'
import { setCalendarVisible } from '@/hooks/use-calendar-visibility'
import { PERSONAL_ACCOUNT_ID } from '@/lib/demo/data'
import type { Director } from '../director'

/*
 * The landing page's smaller demos, each on the real dashboard: calendars, the dock, the AI
 * chat, notes, tasks and the schedule.
 */

// Types into a React-controlled input the way a person would, a character at a time
async function typeInto(d: Director, input: HTMLInputElement | HTMLTextAreaElement, text: string, delay = 75) {
  const setValue = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')!.set!
  for (const character of text) {
    setValue.call(input, input.value + character)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await d.sleep(delay)
  }
}

// All your calendars: the personal account switched off and back on
export async function calendarsStory(d: Director) {
  d.spotlight('schedule')
  d.callout('Every Calendar', 'Work & personal in one view', {
    target: 'schedule',
    placement: 'inside-middle',
  })
  await d.sleep(3600)
  d.callout('Toggle Account', 'Personal calendar hidden', {
    target: 'schedule',
    placement: 'right',
  })
  setCalendarVisible(PERSONAL_ACCOUNT_ID, false)
  await d.sleep(3600)
  d.callout('Every Calendar', 'Personal calendar shown again', {
    target: 'schedule',
    placement: 'inside-bottom',
  })
  setCalendarVisible(PERSONAL_ACCOUNT_ID, true)
  await d.sleep(3600)
}

// Dock anywhere: round each edge of the screen
export async function dockStory(d: Director) {
  const labels: Record<'left' | 'top' | 'right' | 'bottom', string> = {
    left: 'Docked on the left edge',
    top: 'Docked on the top edge',
    right: 'Docked on the right edge',
    bottom: 'Docked on the bottom edge',
  }
  for (const position of ['left', 'top', 'right', 'bottom'] as const) {
    await d.sleep(3000)
    window.dispatchEvent(new CustomEvent('dock-position-change', { detail: { position } }))
    await d.sleep(250)
    d.callout('Dock Position', labels[position], '[data-testid="ai-chat-trigger"]')
  }
  await d.sleep(3000)
}

// The AI assistant: open it from the dock and ask about the day
export async function askStory(d: Director) {
  const trigger = await d.find('[data-testid="ai-chat-trigger"]')
  d.callout('On-Device AI', 'Open AI chat from the dock', {
    target: trigger,
    placement: 'above',
  })
  await d.sleep(2000)
  await d.moveTo(trigger)
  await d.click(trigger)

  const questions = [
    { text: "What's left today?", placement: 'left' as const },
    { text: 'What did I plan for Q4?', placement: 'right' as const },
  ]
  for (const { text: question, placement } of questions) {
    const input = await d.find<HTMLInputElement>('input[aria-label="Chat prompt"]')
    d.spotlight('ai-chat')
    d.callout('Ask Your Day', `“${question}”`, {
      target: 'ai-chat',
      placement,
    })
    await d.moveTo(input, { x: 0.15 })
    await typeInto(d, input, question)
    const send = await d.find('[aria-label="Send message"]')
    await d.moveTo(send)
    await d.click(send)
    // Wait for the streamed answer to finish (the input comes back)
    await d.sleep(1600)
    await d.find(() => {
      const prompt = document.querySelector<HTMLInputElement>('input[aria-label="Chat prompt"]')
      return prompt && !prompt.disabled ? prompt : null
    }, 20000)
    await d.sleep(3800)
  }
}

// Notes: start a note and write it
export async function notesStory(d: Director) {
  const add = await d.find('[aria-label="Add note"]')
  d.callout('Notes', 'Create a new note', {
    target: 'notes',
    placement: 'inside-middle',
  })
  await d.sleep(2000)
  await d.moveTo(add)
  await d.click(add)

  const title = await d.find<HTMLInputElement | HTMLTextAreaElement>('[class*="notesTitleInput"]')
  await d.moveTo(title, { x: 0.1 })
  await typeInto(d, title, 'Ideas for the weekend')

  const container = await d.find<HTMLElement>('[data-widget-id="notes"] .ql-container')
  const { default: QuillClass } = await import('quill')
  const quill = QuillClass.find(container) as Quill
  d.callout('Autosave', 'Saves automatically as you type', {
    target: 'notes',
    placement: 'inside-bottom',
  })
  await d.moveTo(container, { x: 0.15, y: 0.08 })
  for (const character of 'Bike ride to the beach\nTry the new dumpling place\nCall Ben about the tent') {
    // As the user: it saves, like typing does
    quill.insertText(quill.getLength() - 1, character, 'user')
    await d.sleep(character === '\n' ? 340 : 58)
  }
  await d.sleep(4200)
}

// Tasks: tick one off, then two come in from the AI
export async function tasksStory(d: Director) {
  const row = await d.find(() =>
    [...document.querySelectorAll<HTMLElement>('[data-widget-id="tasks"] *')].find(
      (el) => el.childElementCount === 0 && el.textContent?.trim() === 'Renew passport',
    ),
  )
  const item = row.closest<HTMLElement>('[role="listitem"], li, [class*="task"]') ?? row.parentElement!
  d.callout('Tasks', 'Check off completed tasks', {
    target: 'tasks',
    placement: 'inside-middle',
  })
  await d.sleep(2200)
  const checkbox = item.querySelector<HTMLElement>('button, [role="checkbox"], input[type="checkbox"]')
  if (checkbox) {
    await d.moveTo(checkbox)
    await d.click(checkbox)
  }
  await d.sleep(2400)

  // Two more, as the AI would add them from a note (same API, same refresh)
  const createdIds: string[] = []
  for (const task of [
    { title: "Book flights for Mum's birthday", isHighPriority: true, dueDate: null },
    { title: 'Send Sam the slides', isHighPriority: false, dueDate: null },
  ]) {
    const res = await apiFetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) })
    const body = await res.json().catch(() => ({}))
    if (body?.data?.id) createdIds.push(body.data.id)
  }
  window.dispatchEvent(new CustomEvent('tasks-changed', { detail: { createdIds, count: createdIds.length } }))
  d.callout('Notes → Tasks', '2 tasks added from your note', {
    target: 'tasks',
    placement: 'inside-bottom',
  })
  await d.sleep(5200)
}

// Schedule: nothing to do, it's the day as it is
export async function scheduleStory(d: Director) {
  d.callout('Schedule', 'All your calendars in one view', {
    target: 'schedule',
    placement: 'inside-bottom',
  })
  await d.sleep(30000)
}



