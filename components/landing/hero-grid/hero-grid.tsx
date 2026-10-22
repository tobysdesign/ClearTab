'use client'

import { useEffect, useRef } from 'react'
import styles from './hero-grid.module.css'
import { HERO_GRID_WIDGETS } from './widgets'

/**
 * Camera-fly timeline (M2). The camera hops from widget to widget, LANDING each
 * one centred on a fixed focus point, holding briefly, then flying to the next.
 *
 * Each landing is computed, not hand-authored: we measure the target card's
 * centre in the grid's local space and solve for the grid transform
 * (`translate3d(tx,ty,0) scale(zoom)`) that places that centre on FOCUS. So the
 * camera always lands squarely on a widget regardless of the grid layout.
 *
 * VISIT is the choreography — the order of widgets, how tight the zoom is, and
 * how long to rest on each. Add entries for more movement between widgets.
 */
const VISIT: Array<{ card: number; zoom: number; hold: number }> = [
  { card: 2, zoom: 1.34, hold: 2.6 },
  { card: 9, zoom: 1.3, hold: 2.4 },
  { card: 5, zoom: 1.36, hold: 2.6 },
  { card: 14, zoom: 1.32, hold: 2.4 },
  { card: 7, zoom: 1.34, hold: 2.6 },
  { card: 17, zoom: 1.3, hold: 2.4 },
  { card: 11, zoom: 1.36, hold: 2.6 },
  { card: 4, zoom: 1.32, hold: 2.4 },
  { card: 15, zoom: 1.34, hold: 2.6 },
  { card: 8, zoom: 1.3, hold: 2.4 },
]

/** Seconds to fly between two widgets. */
const TRAVEL = 3.2
/** Plane-local point (offset from grid centre) that a landed widget centres on;
 *  positive x sits it right of the hero copy. */
const FOCUS = { x: 150, y: 10 }

interface Shot {
  tx: number
  ty: number
  scale: number
  travel: number
  hold: number
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Camera-fly hero background.
 *
 * A full-bleed, non-interactive tilted 3D plane of real ClearTab widget cards
 * behind the hero copy, over the global CharcoalWave shader. Pure CSS 3D:
 *
 *   viewport  →  stage (the mask + clip)
 *     plane   →  perspective + rotateX/Y/Z tilt (the resting camera pose, CSS)
 *       grid  →  the widget cards; the camera-fly loop writes its transform
 *
 * The loop (below) flies the camera from widget to widget, landing each on a
 * fixed focus point. The plane's tilt stays put; only the grid moves/zooms
 * inside it. Disabled under prefers-reduced-motion. The resting pose's tunables
 * (tilt, card size, spacing, perspective) are CSS custom properties on
 * `.viewport`; the choreography is the VISIT/FOCUS/TRAVEL constants above.
 *
 * The whole layer is `aria-hidden` and `pointer-events: none`, and the cards
 * are demo-mode widgets (mock data, no network, no persistence), so nothing
 * here is focusable or interactive.
 */
export function HeroGrid() {
  // The camera-fly loop writes the grid transform each frame; the plane holds
  // the resting camera pose (perspective + tilt) from CSS.
  const planeRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    // Respect reduced motion: leave the grid at the overview pose, no loop.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduce?.matches) {
      grid.style.transform = 'translate3d(0, 0, 0) scale(1)'
      return
    }

    let raf = 0
    const start = performance.now()

    // Solve each VISIT entry into a shot that lands the target card on FOCUS.
    // Card centres are measured in the grid's own (untransformed) coordinate
    // space; grid and cards share an offsetParent, so the subtraction cancels
    // it out. Measured lazily on the first frame once the grid has laid out.
    let shots: Shot[] | null = null
    let total = 0

    const buildShots = (): Shot[] | null => {
      const cards = grid.children
      if (!cards.length || !grid.offsetWidth) return null
      const gcx = grid.offsetLeft + grid.offsetWidth / 2
      const gcy = grid.offsetTop + grid.offsetHeight / 2
      return VISIT.map(({ card, zoom, hold }) => {
        const el = cards[Math.min(card, cards.length - 1)] as HTMLElement
        const ox = el.offsetLeft + el.offsetWidth / 2 - gcx
        const oy = el.offsetTop + el.offsetHeight / 2 - gcy
        return {
          tx: FOCUS.x - zoom * ox,
          ty: FOCUS.y - zoom * oy,
          scale: zoom,
          travel: TRAVEL,
          hold,
        }
      })
    }

    const frame = (now: number) => {
      if (!shots) {
        shots = buildShots()
        if (shots) total = shots.reduce((sum, s) => sum + s.travel + s.hold, 0)
      }
      if (shots && total > 0) {
        let t = ((now - start) / 1000) % total
        let tx = shots[0].tx
        let ty = shots[0].ty
        let scale = shots[0].scale
        for (let i = 0; i < shots.length; i++) {
          const to = shots[i]
          const from = shots[(i - 1 + shots.length) % shots.length]
          if (t < to.travel) {
            const e = easeInOut(t / to.travel)
            tx = from.tx + (to.tx - from.tx) * e
            ty = from.ty + (to.ty - from.ty) * e
            scale = from.scale + (to.scale - from.scale) * e
            break
          }
          t -= to.travel
          if (t < to.hold) {
            tx = to.tx
            ty = to.ty
            scale = to.scale
            break
          }
          t -= to.hold
        }
        grid.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={styles.viewport} aria-hidden="true">
      <div ref={planeRef} className={styles.plane}>
        <div ref={gridRef} className={styles.grid}>
          {HERO_GRID_WIDGETS.map(({ id, Widget, rows }) => (
            <div
              key={id}
              className={styles.card}
              data-rows={rows}
            >
              <Widget active={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HeroGrid
