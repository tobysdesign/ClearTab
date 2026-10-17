/*
 * Drives a scripted demo on the /demo page: waits for real elements to appear, moves the demo
 * cursor to them and clicks them, so the dashboard runs its own flows. Everything stops when
 * the signal aborts (the scene unmounts or the loop restarts).
 */

export interface Point {
  x: number
  y: number
}

export type CalloutPlacement =
  | 'above'
  | 'below'
  | 'left'
  | 'right'
  | 'inside-top'
  | 'inside-middle'
  | 'inside-bottom'
  | 'offset-top-left'
  | 'offset-top-right'
  | 'offset-bottom-left'
  | 'offset-bottom-right'

export type CalloutAnchor =
  | Element
  | string
  | Point
  | {
      target?: Element | string | Point | null
      placement?: CalloutPlacement
    }
  | null

export interface Director {
  signal: AbortSignal
  sleep: (ms: number) => Promise<void>
  /** Resolves with the first match, polling until it appears */
  find: <T extends Element = HTMLElement>(query: string | (() => T | null | undefined), timeout?: number) => Promise<T>
  /** Glides the cursor to an element (x/y: where on it, 0-1) or a point */
  moveTo: (target: Element | Point, options?: { x?: number; y?: number; duration?: number }) => Promise<void>
  click: (element: HTMLElement) => Promise<void>
  /** Shows a floating white callout card with spring entrance/exit anchored at an offset near the action */
  callout: (badge: string | null, text?: string, anchor?: CalloutAnchor) => void
  /** Legacy no-op kept so stories stay concise */
  tag: (text: string | null) => void
  /** Highlights a widget panel or the AI modal with a blue spotlight border */
  spotlight: (widgetId: string | null, badgeText?: string) => void
  /** Notifies the parent frame (HeroDemo) which workflow step is active (1..4) */
  step: (stepNumber: number) => void
}

const abortError = () => new DOMException('Demo stopped', 'AbortError')

function isPoint(value: unknown): value is Point {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'x' in value &&
      'y' in value &&
      typeof (value as Point).x === 'number' &&
      typeof (value as Point).y === 'number',
  )
}

function resolveElement(target: Element | string | null | undefined): Element | null {
  if (!target) return null
  if (target instanceof Element) return target
  if (target === 'ai-chat') {
    return (
      document.querySelector<HTMLElement>('[class*="ai-chat_container"]') ??
      document.querySelector<HTMLElement>('[class*="modalHeader"]')?.parentElement ??
      null
    )
  }
  const byWidget = document.querySelector(`[data-widget-id="${target}"]`)
  if (byWidget) return byWidget
  try {
    return document.querySelector(target)
  } catch {
    return null
  }
}

export function createDirector(cursor: HTMLElement | null, signal: AbortSignal): Director {
  const calloutEl = cursor?.querySelector<HTMLElement>('[data-callout-state]') ?? null
  const badgeEl = cursor?.querySelector<HTMLElement>('[data-callout-badge]') ?? null
  const textEl = cursor?.querySelector<HTMLElement>('[data-callout-text]') ?? null

  let calloutSeq = 0
  let isCalloutActive = false
  let exitTimer: ReturnType<typeof setTimeout> | null = null
  let lastCalloutPos: Point | null = null

  const clearSpotlights = () => {
    document.querySelectorAll<HTMLElement>('[data-demo-spotlight], [data-demo-badge]').forEach((el) => {
      el.removeAttribute('data-demo-spotlight')
      el.removeAttribute('data-demo-badge')
    })
  }

  signal.addEventListener(
    'abort',
    () => {
      if (exitTimer) clearTimeout(exitTimer)
      clearSpotlights()
    },
    { once: true },
  )

  const sleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(abortError())
      const timer = setTimeout(resolve, ms)
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(abortError())
        },
        { once: true },
      )
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
    cursor?.setAttribute('data-side', point.x > window.innerWidth * 0.65 ? 'left' : 'right')
  }
  place(position, 0)

  const applyCalloutCoords = (rawLeft: number, rawTop: number, cw: number, ch: number) => {
    if (!calloutEl) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 22
    let clampedLeft = Math.max(pad, Math.min(vw - cw - pad, rawLeft))
    let clampedTop = Math.max(pad, Math.min(vh - ch - pad, rawTop))

    // Never place two consecutive callouts in the same spot
    if (lastCalloutPos && Math.hypot(clampedLeft - lastCalloutPos.x, clampedTop - lastCalloutPos.y) < 56) {
      const shiftDown = clampedTop + ch + 36
      const shiftUp = clampedTop - ch - 36
      if (shiftDown + ch <= vh - pad) {
        clampedTop = shiftDown
      } else if (shiftUp >= pad) {
        clampedTop = shiftUp
      } else {
        clampedLeft = clampedLeft > vw / 2 ? Math.max(pad, clampedLeft - 140) : Math.min(vw - cw - pad, clampedLeft + 140)
      }
    }

    lastCalloutPos = { x: clampedLeft, y: clampedTop }
    calloutEl.style.setProperty('--callout-x', `${Math.round(clampedLeft)}px`)
    calloutEl.style.setProperty('--callout-y', `${Math.round(clampedTop)}px`)
  }

  const positionCallout = (anchor?: CalloutAnchor) => {
    if (!calloutEl) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 22
    const gap = 18

    // Measure at (0, 0) so max-content width isn't constrained by the previous right-edge position
    calloutEl.style.setProperty('--callout-x', '0px')
    calloutEl.style.setProperty('--callout-y', '0px')
    const cw = calloutEl.offsetWidth || 400
    const ch = calloutEl.offsetHeight || 88

    let rawTarget: Element | string | Point | null | undefined
    let explicitPlacement: CalloutPlacement | undefined

    if (
      anchor &&
      typeof anchor === 'object' &&
      !(anchor instanceof Element) &&
      !isPoint(anchor)
    ) {
      rawTarget = anchor.target
      explicitPlacement = anchor.placement
    } else {
      rawTarget = anchor as Element | string | Point | null | undefined
    }

    if (isPoint(rawTarget)) {
      const left = rawTarget.x - cw * 0.35
      const top =
        rawTarget.y > ch + gap + pad
          ? rawTarget.y - ch - gap
          : rawTarget.y + gap
      applyCalloutCoords(left, top, cw, ch)
      return
    }

    const el =
      resolveElement(rawTarget) ??
      document.querySelector<HTMLElement>('[data-demo-spotlight="true"]')

    if (!el) {
      applyCalloutCoords((vw - cw) / 2, 28, cw, ch)
      return
    }

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let placement: CalloutPlacement = explicitPlacement ?? 'above'
    if (!explicitPlacement) {
      if (rect.height > vh * 0.62) {
        placement = 'inside-bottom'
      } else if (rect.top >= ch + gap + pad) {
        placement = 'above'
      } else if (vh - rect.bottom >= ch + gap + pad) {
        placement = 'below'
      } else {
        placement = 'inside-bottom'
      }
    }

    let left = centerX - cw / 2
    let top = rect.top - ch - gap

    switch (placement) {
      case 'above':
      case 'offset-top-left':
        left = rect.right - cw
        top = rect.top - ch - gap
        if (top < pad && vh - rect.bottom >= ch + gap + pad) {
          top = rect.bottom + gap
        }
        break
      case 'offset-top-right':
        left = rect.right - cw
        top = rect.top - ch - gap
        if (top < pad && vh - rect.bottom >= ch + gap + pad) {
          top = rect.bottom + gap
        }
        break
      case 'below':
      case 'offset-bottom-left':
        left = rect.left + 16
        top = rect.bottom + gap
        if (top + ch > vh - pad && rect.top >= ch + gap + pad) {
          top = rect.top - ch - gap
        }
        break
      case 'offset-bottom-right':
        left = rect.right - cw - 20
        top = vh - rect.bottom >= ch + gap + pad ? rect.bottom + gap : rect.bottom - ch - 32
        break
      case 'left':
        left = rect.left - cw - gap
        top = Math.max(pad + 64, centerY - ch / 2)
        break
      case 'right':
        left = rect.right + gap
        top = Math.max(pad + 64, centerY - ch / 2)
        break
      case 'inside-top':
        // Starts 68px below rect.top so the widget's 60px title bar is never obscured
        left = rect.right - cw - 24
        top = rect.top + 68
        break
      case 'inside-middle':
        // Sits in the middle of a tall widget, well below both the title bar and top lines
        left = rect.right - cw - 24
        top = rect.top + Math.max(210, Math.round(rect.height * 0.34))
        break
      case 'inside-bottom':
        left = rect.right - cw - 24
        top = rect.bottom - ch - 32
        break
    }

    applyCalloutCoords(left, top, cw, ch)
  }

  const moveTo: Director['moveTo'] = async (target, options = {}) => {
    let point: Point
    if (target instanceof Element) {
      const rect = target.getBoundingClientRect()
      point = { x: rect.left + rect.width * (options.x ?? 0.5), y: rect.top + rect.height * (options.y ?? 0.5) }
    } else {
      point = target
    }
    const distance = Math.hypot(point.x - position.x, point.y - position.y)
    const duration = options.duration ?? Math.min(1650, 620 + distance * 0.85)
    place(point, duration)
    await sleep(duration + 260)
  }

  const click = async (element: HTMLElement) => {
    cursor?.setAttribute('data-pressed', 'true')
    await sleep(190)
    element.click()
    cursor?.setAttribute('data-pressed', 'false')
    await sleep(360)
  }

  const callout: Director['callout'] = (badge, text = '', anchor) => {
    if (!calloutEl) return
    const seq = ++calloutSeq
    if (exitTimer) {
      clearTimeout(exitTimer)
      exitTimer = null
    }

    if (!badge && !text) {
      if (isCalloutActive) {
        isCalloutActive = false
        calloutEl.setAttribute('data-callout-state', 'exiting')
        exitTimer = setTimeout(() => {
          if (calloutSeq === seq) {
            calloutEl.setAttribute('data-callout-state', 'hidden')
          }
        }, 210)
      }
      return
    }

    const showAtNewSpot = () => {
      if (calloutSeq !== seq) return
      if (badgeEl) badgeEl.textContent = badge ?? ''
      if (textEl) textEl.textContent = text
      calloutEl.setAttribute('data-callout-state', 'hidden')
      positionCallout(anchor)
      // Force reflow so the spring entrance animation starts cleanly
      void calloutEl.offsetWidth
      calloutEl.setAttribute('data-callout-state', 'active')
      isCalloutActive = true
    }

    if (isCalloutActive) {
      calloutEl.setAttribute('data-callout-state', 'exiting')
      exitTimer = setTimeout(showAtNewSpot, 190)
    } else {
      showAtNewSpot()
    }
  }

  const tag: Director['tag'] = () => {
    // Simplified: only the white floating callout card is shown
  }

  const spotlight: Director['spotlight'] = (widgetId, badgeText) => {
    clearSpotlights()
    if (!widgetId) return
    const panel = resolveElement(widgetId) as HTMLElement | null
    if (!panel) return
    panel.setAttribute('data-demo-spotlight', 'true')
    if (badgeText) {
      panel.setAttribute('data-demo-badge', badgeText)
    }
  }

  const step: Director['step'] = (stepNumber) => {
    try {
      window.parent?.postMessage({ type: 'cleartab-demo-step', step: stepNumber }, '*')
    } catch {
      // Ignore cross-window errors
    }
  }

  return { signal, sleep, find, moveTo, click, callout, tag, spotlight, step }
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


