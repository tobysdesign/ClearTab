import { flushSync } from 'react-dom'
import { swapWidgets, type PanelNode } from '@/lib/panel-tree'
import type { WidgetId, WidgetVisibilityState } from '@/hooks/use-beta-widgets'
import type { Director } from '../director'

/*
 * Landing page "Your priorities, first": the real dashboard swapping widgets around and
 * switching one off and back on, each change animated from where the widgets were.
 */

export interface LayoutState {
  tree: PanelNode
  visible: WidgetVisibilityState
}

interface LayoutsContext {
  get: () => LayoutState
  set: (next: LayoutState) => void
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const widgetElements = () => [...document.querySelectorAll<HTMLElement>('[data-widget-id]')]

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

// FLIP: note where each widget is, apply the change, then animate each from old to new
async function animateChange(d: Director, change: () => void) {
  const before = new Map(widgetElements().map((el) => [el.dataset.widgetId, el.getBoundingClientRect()]))
  flushSync(change)
  // Panel sizes are applied in a layout effect; measure once they're in
  await nextFrame()
  for (const el of widgetElements()) {
    const after = el.getBoundingClientRect()
    const from = before.get(el.dataset.widgetId)
    if (!from) {
      el.animate([{ opacity: 0, transform: 'scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: EASE })
      continue
    }
    const dx = from.left - after.left
    const dy = from.top - after.top
    const sx = from.width / after.width
    const sy = from.height / after.height
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) continue
    el.animate(
      [
        { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: 'top left', transform: 'none' },
      ],
      { duration: 700, easing: EASE },
    )
  }
  await d.sleep(750)
}

async function swap(d: Director, layout: LayoutsContext, a: WidgetId, b: WidgetId) {
  await animateChange(d, () => {
    const current = layout.get()
    layout.set({ ...current, tree: swapWidgets(current.tree, a, b) })
  })
}

async function setVisible(d: Director, layout: LayoutsContext, id: WidgetId, visible: boolean) {
  if (!visible) {
    // Fade it out where it is, then let the others take the space
    const el = document.querySelector<HTMLElement>(`[data-widget-id="${id}"]`)
    await el?.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.97)' }], { duration: 320, easing: EASE, fill: 'forwards' }).finished
  }
  await animateChange(d, () => {
    const current = layout.get()
    layout.set({ ...current, visible: { ...current.visible, [id]: visible } })
  })
}

export async function layoutsStory(d: Director, layout: LayoutsContext) {
  d.spotlight('notes')
  d.callout('Custom Layouts', 'Swap or hide any widget', {
    target: 'notes',
    placement: 'offset-bottom-right',
  })
  await d.sleep(3000)

  d.spotlight('tasks')
  d.callout('Swap Widgets', 'Notes ↔ Tasks', {
    target: 'tasks',
    placement: 'offset-bottom-left',
  })
  await swap(d, layout, 'notes', 'tasks')
  await d.sleep(3200)

  d.spotlight('recorder')
  d.callout('Swap Widgets', 'Weather ↔ Voice memo', {
    target: 'recorder',
    placement: 'offset-top-left',
  })
  await swap(d, layout, 'weather', 'recorder')
  await d.sleep(3200)

  d.spotlight('countdown')
  d.callout('Toggle Widgets', 'Hide Countdown widget', {
    target: 'countdown',
    placement: 'offset-top-left',
  })
  await setVisible(d, layout, 'countdown', false)
  await d.sleep(3200)

  await setVisible(d, layout, 'countdown', true)
  d.spotlight('countdown')
  d.callout('Toggle Widgets', 'Restore Countdown widget', {
    target: 'countdown',
    placement: 'offset-top-left',
  })
  await d.sleep(3200)

  d.spotlight('notes')
  d.callout('Swap Widgets', 'Tasks ↔ Notes', {
    target: 'notes',
    placement: 'offset-bottom-left',
  })
  await swap(d, layout, 'notes', 'tasks')
  await d.sleep(3200)

  d.spotlight('weather')
  d.callout('Toggle Widgets', 'Hide Weather widget', {
    target: 'weather',
    placement: 'offset-top-left',
  })
  await setVisible(d, layout, 'weather', false)
  await d.sleep(3200)

  await setVisible(d, layout, 'weather', true)
  d.spotlight('weather')
  d.callout('Toggle Widgets', 'Restore Weather widget', {
    target: 'weather',
    placement: 'offset-bottom-left',
  })
  await d.sleep(3200)

  d.spotlight('recorder')
  d.callout('Swap Widgets', 'Voice memo ↔ Weather', {
    target: 'recorder',
    placement: 'offset-top-left',
  })
  await swap(d, layout, 'weather', 'recorder')
  await d.sleep(3000)
}


