import type { WidgetId, DropZone } from '@/lib/panel-tree'

export interface DropTarget {
  targetId: WidgetId
  zone: DropZone
  rect: DOMRect
}

/** Pure zone math: center (0.25–0.75 on both axes) = swap, else the nearest edge. */
export function computeZone(
  rect: { left: number; top: number; width: number; height: number },
  point: { x: number; y: number },
): DropZone {
  const relX = (point.x - rect.left) / rect.width
  const relY = (point.y - rect.top) / rect.height
  const inCenter = relX >= 0.25 && relX <= 0.75 && relY >= 0.25 && relY <= 0.75
  if (inCenter) return 'center'
  const distances = { left: relX, right: 1 - relX, top: relY, bottom: 1 - relY } as const
  return (Object.keys(distances) as Array<'left' | 'right' | 'top' | 'bottom'>).reduce(
    (closest, key) => (distances[key] < distances[closest] ? key : closest),
    'left',
  )
}

/** Hit-test the live DOM at the cursor for the tile under the drag and its zone. */
export function computeDropTarget(
  draggedEl: HTMLElement,
  pagePoint: { x: number; y: number },
): DropTarget | null {
  const point = { x: pagePoint.x - window.scrollX, y: pagePoint.y - window.scrollY }
  const stack = document.elementsFromPoint(point.x, point.y)
  const targetEl = stack.find(
    (el): el is HTMLElement =>
      el !== draggedEl && !draggedEl.contains(el) && el instanceof HTMLElement && el.hasAttribute('data-widget-id'),
  )
  if (!targetEl) return null
  const targetId = targetEl.getAttribute('data-widget-id') as WidgetId
  const rect = targetEl.getBoundingClientRect()
  return { targetId, zone: computeZone(rect, point), rect }
}

/** Rect (viewport coords) the live drop-indicator overlay should cover for a given zone —
 * the whole tile for a center/swap drop, or just the relevant half for an edge/split drop. */
export function dropIndicatorRect(target: DropTarget): { left: number; top: number; width: number; height: number } {
  const { rect, zone } = target
  switch (zone) {
    case 'center':
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    case 'left':
      return { left: rect.left, top: rect.top, width: rect.width / 2, height: rect.height }
    case 'right':
      return { left: rect.left + rect.width / 2, top: rect.top, width: rect.width / 2, height: rect.height }
    case 'top':
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height / 2 }
    case 'bottom':
      return { left: rect.left, top: rect.top + rect.height / 2, width: rect.width, height: rect.height / 2 }
  }
}
