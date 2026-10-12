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
async function typeInto(d: Director, input: HTMLInputElement | HTMLTextAreaElement, text: string, delay = 55) {
  const setValue = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')!.set!
  for (const character of text) {
    setValue.call(input, input.value + character)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await d.sleep(delay)
  }
}

// All your calendars: the personal account switched off and back on
export async function calendarsStory(d: Director) {
  await d.sleep(2600)
  setCalendarVisible(PERSONAL_ACCOUNT_ID, false)
  await d.sleep(2600)
  setCalendarVisible(PERSONAL_ACCOUNT_ID, true)
  await d.sleep(2600)
}

// Dock anywhere: round each edge of the screen
export async function dockStory(d: Director) {
  for (const position of ['left', 'top', 'right', 'bottom'] as const) {
    await d.sleep(2200)
    window.dispatchEvent(new CustomEvent('dock-position-change', { detail: { position } }))
  }
  await d.sleep(2200)
}

// The AI assistant: open it from the dock and ask about the day
export async function askStory(d: Director) {
  await d.sleep(1400)
  const trigger = await d.find('[data-testid="ai-chat-trigger"]')
  await d.moveTo(trigger)
  await d.click(trigger)

  for (const question of ["What's left today?", 'What did I plan for Q4?']) {
    const input = await d.find<HTMLInputElement>('input[aria-label="Chat prompt"]')
    await d.moveTo(input, { x: 0.15 })
    await typeInto(d, input, question)
    const send = await d.find('[aria-label="Send message"]')
    await d.moveTo(send)
    await d.click(send)
    // Wait for the streamed answer to finish (the input comes back)
    await d.sleep(1500)
    await d.find(() => {
      const prompt = document.querySelector<HTMLInputElement>('input[aria-label="Chat prompt"]')
      return prompt && !prompt.disabled ? prompt : null
    }, 20000)
    await d.sleep(2600)
  }
}

// Notes: start a note and write it
export async function notesStory(d: Director) {
  await d.sleep(1400)
  const add = await d.find('[aria-label="Add note"]')
  await d.moveTo(add)
  await d.click(add)

  const title = await d.find<HTMLInputElement | HTMLTextAreaElement>('[class*="notesTitleInput"]')
  await d.moveTo(title, { x: 0.1 })
  await typeInto(d, title, 'Ideas for the weekend')

  const container = await d.find<HTMLElement>('[data-widget-id="notes"] .ql-container')
  const { default: QuillClass } = await import('quill')
  const quill = QuillClass.find(container) as Quill
  await d.moveTo(container, { x: 0.15, y: 0.08 })
  for (const character of 'Bike ride to the beach\nTry the new dumpling place\nCall Ben about the tent') {
    // As the user: it saves, like typing does
    quill.insertText(quill.getLength() - 1, character, 'user')
    await d.sleep(character === '\n' ? 260 : 42)
  }
  await d.sleep(3200)
}

// Tasks: tick one off, then two come in from the AI
export async function tasksStory(d: Director) {
  await d.sleep(1600)
  const row = await d.find(() =>
    [...document.querySelectorAll<HTMLElement>('[data-widget-id="tasks"] *')].find(
      (el) => el.childElementCount === 0 && el.textContent?.trim() === 'Renew passport',
    ),
  )
  const item = row.closest<HTMLElement>('[role="listitem"], li, [class*="task"]') ?? row.parentElement!
  const checkbox = item.querySelector<HTMLElement>('button, [role="checkbox"], input[type="checkbox"]')
  if (checkbox) {
    await d.moveTo(checkbox)
    await d.click(checkbox)
  }
  await d.sleep(1800)

  // Two more, as the AI would add them from a note (same API, same refresh)
  for (const task of [
    { title: "Book flights for Mum's birthday", isHighPriority: true, dueDate: null },
    { title: 'Send Sam the slides', isHighPriority: false, dueDate: null },
  ]) {
    await apiFetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) })
  }
  window.dispatchEvent(new CustomEvent('tasks-changed'))
  await d.sleep(4500)
}

// Schedule: nothing to do, it's the day as it is
export async function scheduleStory(d: Director) {
  await d.sleep(30000)
}

