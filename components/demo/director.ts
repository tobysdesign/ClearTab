/*
 * Drives a scripted demo on the /demo page: waits for real elements to appear, moves the demo
 * cursor to them and clicks them, so the dashboard runs its own flows. Everything stops when
 * the signal aborts (the scene unmounts or the loop restarts).
 */

export interface Point {
  x: number
  y: number
}

export interface Director {
  signal: AbortSignal
  sleep: (ms: number) => Promise<void>
  /** Resolves with the first match, polling until it appears */
  find: <T extends Element = HTMLElement>(query: string | (() => T | null | undefined), timeout?: number) => Promise<T>
  /** Glides the cursor to an element (x/y: where on it, 0-1) or a point */
  moveTo: (target: Element | Point, options?: { x?: number; y?: number; duration?: number }) => Promise<void>
  click: (element: HTMLElement) => Promise<void>
}

const abortError = () => new DOMException('Demo stopped', 'AbortError')

export function createDirector(cursor: HTMLElement | null, signal: AbortSignal): Director {
  const sleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(abortError())
      const timer = setTimeout(resolve, ms)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(abortError())
      }, { once: true })
    })

  const find = async <T extends Element = HTMLElement>(query: string | (() => T | null | undefined), timeout = 12000) => {
    const deadline = Date.now() + timeout
    for (;;) {
      const found = typeof query === 'string' ? document.querySelector<T>(query) : query()
      if (found) return found as T
      if (Date.now() > deadline) throw new Error(`Demo: nothing matched ${typeof query === 'string' ? query : 'the query'}`)
      await sleep(100)
    }
  }

  let position: Point = { x: window.innerWidth * 0.62, y: window.innerHeight * 0.72 }
  const place = (point: Point, duration: number) => {
    position = point
    cursor?.style.setProperty('--move', `${duration}ms`)
    cursor?.style.setProperty('--x', `${point.x}px`)
    cursor?.style.setProperty('--y', `${point.y}px`)
  }
  place(position, 0)

  const moveTo: Director['moveTo'] = async (target, options = {}) => {
    let point: Point
    if (target instanceof Element) {
      const rect = target.getBoundingClientRect()
      point = { x: rect.left + rect.width * (options.x ?? 0.5), y: rect.top + rect.height * (options.y ?? 0.5) }
    } else {
      point = target
    }
    const distance = Math.hypot(point.x - position.x, point.y - position.y)
    const duration = options.duration ?? Math.min(1100, 380 + distance * 0.55)
    place(point, duration)
    await sleep(duration + 60)
  }

  const click = async (element: HTMLElement) => {
    cursor?.setAttribute('data-pressed', 'true')
    await sleep(130)
    element.click()
    cursor?.setAttribute('data-pressed', 'false')
    await sleep(240)
  }

  return { signal, sleep, find, moveTo, click }
}

// First element matching the selector whose text is exactly `text` (or matches it)
export function byText<T extends HTMLElement = HTMLElement>(
  root: ParentNode,
  selector: string,
  text: string | RegExp,
): T | undefined {
  return [...root.querySelectorAll<T>(selector)].find((el) => {
    const content = el.textContent?.trim() ?? ''
    return typeof text === 'string' ? content === text : text.test(content)
  })
}
