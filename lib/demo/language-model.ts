import { nextFriday } from './data'

/*
 * A scripted stand-in for Chrome's Prompt API (LanguageModel), passed to the /demo page's
 * ChatProvider. Same calls the chat makes (availability, create, prompt, promptStreaming),
 * with answers written for the demo data, so the demo looks the same in every browser and
 * never runs a real model.
 */

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

function tasksFor(text: string) {
  const lower = text.toLowerCase()
  const tasks = []
  if (lower.includes('flight')) tasks.push({ title: "Book flights for Mum's birthday", important: true, due: null })
  if (lower.includes('slides')) tasks.push({ title: 'Send Sam the slides', important: false, due: nextFriday() })
  if (lower.includes('plumber')) tasks.push({ title: 'Be home for the plumber', important: false, due: null })
  if (!tasks.length) tasks.push({ title: text.split(/[.\n]/)[0].trim().slice(0, 60) || 'Follow up', important: false, due: null })
  return { tasks }
}

function answerFor(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('summar')) {
    return 'Summary: You and Sam aligned on the Q4 launch — **send Sam the slides by Friday** and **book flights for Mum’s birthday**.'
  }
  if (lower.includes('left') || lower.includes('due') || lower.includes('today')) {
    return 'Two things today: **email Priya the invoice** (it’s marked important) and renew your passport, which is due tomorrow. Your next meeting is the design review at 10.'
  }
  if (lower.includes('week') || lower.includes('note')) return 'Last week you planned Q4: launch the extension before Christmas, hire a second designer, and the quarterly review on the 28th.'
  return 'Your day: stand-up at 9:15, design review at 10, lunch with Sam at 12:30 and the gym at 6. Two tasks are due today.'
}

function createSession() {
  return {
    async prompt(input: string, options: { signal?: AbortSignal; responseConstraint?: unknown } = {}) {
      await wait(1200, options.signal)
      return options.responseConstraint ? JSON.stringify(tasksFor(input)) : answerFor(input)
    },
    promptStreaming(input: string, options: { signal?: AbortSignal } = {}) {
      const words = answerFor(input).split(/(?<= )/)
      return (async function* () {
        await wait(900, options.signal)
        for (const word of words) {
          await wait(45, options.signal)
          yield word
        }
      })()
    },
    destroy() {},
  }
}

export const demoLanguageModel = {
  async availability() {
    return 'available'
  },
  async create() {
    return createSession()
  },
}
