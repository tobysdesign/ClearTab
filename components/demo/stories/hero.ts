import type Quill from 'quill'
import { MAKE_TASKS_REPLY, SUMMARISE_REPLY } from '@/hooks/use-chat-context'
import { DEMO_TASK_SOURCE } from '@/lib/demo/data'
import { byText, type Director, type Point } from '../director'

/*
 * Landing page hero: record a voice memo -> transcribed with speaker identification into a note ->
 * highlight part of the note -> AI summarises the conversation -> create tasks from the summary ->
 * added to Tasks. Every action uses the dashboard's own buttons and flows.
 */

// Browser-style selection blue for the highlighted words
const HIGHLIGHT = 'rgba(80, 140, 255, 0.38)'

interface HeroContext {
  askAboutText: (text: string) => void
  closeChat: () => void
}

export async function heroStory(d: Director, chat: HeroContext) {
  // 1. Brainstorming session (9 words) — positioned above Voice notes so "Voice notes" title is unobstructed
  d.spotlight('recorder')
  d.callout(null, 'You have a great brainstorming session with a colleague', {
    target: 'recorder',
    placement: 'above',
  })
  await d.sleep(2400)

  const record = await d.find('[aria-label="Start recording"]')
  await d.moveTo(record)
  await d.click(record)
  await d.sleep(4400)

  const stop = await d.find('[aria-label="Stop recording and transcribe to notes"]')
  await d.moveTo(stop)
  await d.click(stop)

  const view = await d.find(() => byText(document, 'button', 'View note'), 20000)
  await d.sleep(900)
  await d.moveTo(view)
  await d.click(view)

  // 2. Transcribed with speaker identification (14 words) — moves into Notes below the transcript lines
  d.spotlight('notes')
  d.callout(
    null,
    'ClearTab automatically transcribes and identifies speakers, and saves it as a note (requires tokens)',
    {
      target: 'notes',
      placement: 'inside-middle',
    },
  )
  await d.sleep(3800)

  // 3. Move cursor to the note text first, then trigger the highlight callout right as highlighting begins
  const container = await d.find(() =>
    [...document.querySelectorAll<HTMLElement>('.ql-container')].find((c) => c.textContent?.includes(DEMO_TASK_SOURCE)),
  )
  // Loaded here, not at the top: Quill touches `document`, which breaks server rendering
  const { default: QuillClass } = await import('quill')
  const quill = QuillClass.find(container) as Quill

  const start = quill.getText().indexOf(DEMO_TASK_SOURCE)
  const length = DEMO_TASK_SOURCE.length
  const pointAt = (index: number): Point => {
    const bounds = quill.getBounds(index, 0)
    const box = container.getBoundingClientRect()
    return { x: box.left + (bounds?.left ?? 0), y: box.top + (bounds?.top ?? 0) + (bounds?.height ?? 16) / 2 }
  }

  await d.moveTo(pointAt(start))

  const steps = 18
  for (let step = 1; step <= steps; step++) {
    if (step === 4) {
      d.callout(
        null,
        'You can highlight parts of the note and along with styling you can either explore the content with free local on-device AI or create tasks',
        {
          target: 'notes',
          placement: 'inside-bottom',
        },
      )
    }
    const covered = Math.round((length * step) / steps)
    quill.formatText(start, covered, 'background', HIGHLIGHT, 'silent')
    await d.moveTo(pointAt(start + covered), { duration: 85 })
  }

  // The editor's own selection bar (styling + Ask AI / + Task) — hold so user can read the callout while seeing the highlight & toolbar
  const tooltip = (quill as unknown as { theme?: { tooltip?: { show: () => void; hide: () => void; position: (b: unknown) => void } } })
    .theme?.tooltip
  tooltip?.show()
  tooltip?.position(quill.getBounds(start, length))
  await d.sleep(5200)

  // 4. Open on-device AI with the highlighted text
  const askAi = await d.find(() => container.querySelector<HTMLElement>('.ql-askAi'))
  await d.moveTo(askAi)
  await d.click(askAi)
  chat.askAboutText(quill.getText(start, length))
  tooltip?.hide()
  quill.formatText(start, length, 'background', false, 'silent')

  // 5. Summarise the conversation with on-device AI, then create tasks from that summary — moves to left of AI modal
  const summarise = await d.find(() => byText(document, 'button', SUMMARISE_REPLY))
  d.spotlight('ai-chat')
  d.callout(
    null,
    'Free local on-device AI summarises the conversation — and turns that summary into tasks',
    {
      target: 'ai-chat',
      placement: 'left',
    },
  )
  await d.sleep(2200)
  await d.moveTo(summarise)
  await d.click(summarise)

  // Wait for the streamed summary to finish and the follow-up "Make tasks from this" button to appear
  await d.sleep(400)
  const makeTasks = await d.find(() => byText(document, 'button', MAKE_TASKS_REPLY), 20000)
  await d.sleep(2600)
  await d.moveTo(makeTasks)
  await d.click(makeTasks)

  const add = await d.find(() => byText(document, 'button', /^Add \d+ tasks?$/), 20000)
  await d.sleep(2200)
  await d.moveTo(add)
  await d.click(add)

  // 6. Pause briefly for the "Added 2 tasks" confirmation, then spotlight Tasks and place callout below Tasks
  await d.sleep(1100)
  chat.closeChat()
  d.spotlight('tasks')
  d.callout(
    null,
    'Your new tasks are added straight to your list with due dates and priority',
    {
      target: 'tasks',
      placement: 'below',
    },
  )
  const created = await d.find(() =>
    [...document.querySelectorAll<HTMLElement>('[data-widget-id="tasks"] *')].find(
      (el) => el.childElementCount === 0 && el.textContent?.trim() === "Book flights for Mum's birthday",
    ),
  )
  await d.moveTo(created, { x: 0.2 })
  await d.sleep(5400)
}


