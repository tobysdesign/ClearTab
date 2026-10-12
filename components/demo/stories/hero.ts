import type Quill from 'quill'
import { MAKE_TASKS_REPLY } from '@/hooks/use-chat-context'
import { DEMO_TASK_SOURCE } from '@/lib/demo/data'
import { byText, type Director, type Point } from '../director'

/*
 * Landing page hero: record a voice memo -> it's transcribed into a note -> highlight part of
 * the note -> ask the AI to make tasks -> add them -> they land in Tasks. Every step uses the
 * dashboard's own buttons and flows.
 */

// Browser-style selection blue for the highlighted words
const HIGHLIGHT = 'rgba(80, 140, 255, 0.38)'

interface HeroContext {
  askAboutText: (text: string) => void
  closeChat: () => void
}

export async function heroStory(d: Director, chat: HeroContext) {
  await d.sleep(1600)

  // 1. Record a voice memo
  const record = await d.find('[aria-label="Start recording"]')
  await d.moveTo(record)
  await d.click(record)
  await d.sleep(4200)
  const stop = await d.find('[aria-label="Stop recording and transcribe to notes"]')
  await d.moveTo(stop)
  await d.click(stop)

  // 2. It's transcribed and saved to Notes: open it
  const view = await d.find(() => byText(document, 'button', 'View note'), 20000)
  await d.sleep(500)
  await d.moveTo(view)
  await d.click(view)

  // 3. Highlight part of it, dragging across the words
  const container = await d.find(() =>
    [...document.querySelectorAll<HTMLElement>('.ql-container')].find((c) => c.textContent?.includes(DEMO_TASK_SOURCE)),
  )
  // Loaded here, not at the top: Quill touches `document`, which breaks server rendering
  const { default: QuillClass } = await import('quill')
  const quill = QuillClass.find(container) as Quill
  await d.sleep(900)

  const start = quill.getText().indexOf(DEMO_TASK_SOURCE)
  const length = DEMO_TASK_SOURCE.length
  const pointAt = (index: number): Point => {
    const bounds = quill.getBounds(index, 0)
    const box = container.getBoundingClientRect()
    return { x: box.left + (bounds?.left ?? 0), y: box.top + (bounds?.top ?? 0) + (bounds?.height ?? 16) / 2 }
  }

  await d.moveTo(pointAt(start))
  const steps = 16
  for (let step = 1; step <= steps; step++) {
    const covered = Math.round((length * step) / steps)
    quill.formatText(start, covered, 'background', HIGHLIGHT, 'silent')
    await d.moveTo(pointAt(start + covered), { duration: 60 })
  }

  // The editor's own selection bar (Ask AI / + Task)
  const tooltip = (quill as unknown as { theme?: { tooltip?: { show: () => void; hide: () => void; position: (b: unknown) => void } } })
    .theme?.tooltip
  tooltip?.show()
  tooltip?.position(quill.getBounds(start, length))
  await d.sleep(600)

  // 4. Ask AI about it. A scripted highlight isn't a real selection, so open the chat with the
  // same text the button would send.
  const askAi = await d.find(() => container.querySelector<HTMLElement>('.ql-askAi'))
  await d.moveTo(askAi)
  await d.click(askAi)
  chat.askAboutText(quill.getText(start, length))
  tooltip?.hide()
  quill.formatText(start, length, 'background', false, 'silent')

  // 5. Make tasks from it, then add them
  const makeTasks = await d.find(() => byText(document, 'button', MAKE_TASKS_REPLY))
  await d.sleep(700)
  await d.moveTo(makeTasks)
  await d.click(makeTasks)

  const add = await d.find(() => byText(document, 'button', /^Add \d+ tasks?$/), 20000)
  await d.sleep(900)
  await d.moveTo(add)
  await d.click(add)

  // 6. They're in Tasks
  await d.sleep(1400)
  chat.closeChat()
  await d.sleep(500)
  const created = await d.find(() =>
    [...document.querySelectorAll<HTMLElement>('[data-widget-id="tasks"] *')].find(
      (el) => el.childElementCount === 0 && el.textContent?.trim() === "Book flights for Mum's birthday",
    ),
  )
  await d.moveTo(created, { x: 0.2 })
  await d.sleep(4500)
}
