'use client'

import { useEffect, useRef } from 'react'
import styles from './hero-grid.module.css'
import { HERO_GRID_WIDGETS } from './widgets'

/**
 * Camera-fly config (M2). The loop lands on an actual widget card: it translates
 * the grid so a chosen card's centre arrives at a fixed focus point (in the
 * plane's local space, which projects to a constant spot on screen — right of
 * the hero text), holds, then flies to the next card. The path visits far-apart
 * interior cards so there's lots of movement between stops.
 */
const ZOOM = 1.72 // how close the camera sits on a landed widget
const TRAVEL = 2.3 // seconds to fly between widgets
const HOLD = 1.25 // seconds resting on a widget
const FOCUS_X = 110 // local-space landing point — tune to sit the widget right of the text
const FOCUS_Y = -26
const MAX_STOPS = 6 // how many widgets the loop visits before repeating

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Camera-fly hero background — Milestone 1 (STATIC proof).
 *
 * A full-bleed, non-interactive tilted 3D plane of real ClearTab widget cards
 * that sits behind the hero copy and over the global CharcoalWave shader. The
 * structure is pure CSS 3D transforms:
 *
 *   viewport  →  perspective + perspective-origin (the "camera")
 *     plane   →  rotateX / rotateY tilt (the floating grid surface)
 *       grid  →  the widget cards laid out in a dense grid
 *
 * M1 is static: no requestAnimationFrame loop. The plane/grid refs are wired
 * up now so M2's camera-fly loop can write transforms straight to them without
 * restructuring. Every tunable (tilt, card size, spacing, radius, perspective,
 * scrim strength) is a CSS custom property on `.viewport` in the stylesheet.
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

    const park = () => {
      grid.style.transform = `translate3d(${FOCUS_X}px, ${FOCUS_Y}px, 0) scale(${ZOOM})`
    }

    // Respect reduced motion: land on the first widget and stay there, no loop.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduce?.matches) {
      park()
      return
    }

    // Each stop's grid translate so that card's centre lands at (FOCUS_X, FOCUS_Y)
    // in plane-local space. Built lazily once the cards have laid out.
    let stops: Array<{ tx: number; ty: number }> = []

    const buildStops = () => {
      const els = Array.from(grid.children) as HTMLElement[]
      if (els.length === 0) return false
      const gw = grid.clientWidth
      const gh = grid.clientHeight
      if (!gw || !gh) return false

      const cards = els.map((el) => ({
        cx: el.offsetLeft + el.offsetWidth / 2 - gw / 2,
        cy: el.offsetTop + el.offsetHeight / 2 - gh / 2,
      }))
      // Prefer interior cards so zooming in never reveals the grid's edge.
      let pool = cards
        .map((c, i) => ({ i, ...c }))
        .filter((c) => Math.abs(c.cx) < gw * 0.3 && Math.abs(c.cy) < gh * 0.34)
      if (pool.length < 3) pool = cards.map((c, i) => ({ i, ...c }))

      // Greedy "farthest next" ordering → big jumps between widgets.
      const path = [pool[0]]
      const used = new Set([pool[0].i])
      let cur = pool[0]
      while (path.length < Math.min(pool.length, MAX_STOPS)) {
        let best: (typeof pool)[number] | null = null
        let bestDist = -1
        for (const p of pool) {
          if (used.has(p.i)) continue
          const d = (p.cx - cur.cx) ** 2 + (p.cy - cur.cy) ** 2
          if (d > bestDist) {
            bestDist = d
            best = p
          }
        }
        if (!best) break
        path.push(best)
        used.add(best.i)
        cur = best
      }

      stops = path.map((p) => ({ tx: FOCUS_X - ZOOM * p.cx, ty: FOCUS_Y - ZOOM * p.cy }))
      return stops.length >= 2
    }

    let raf = 0
    const start = performance.now()
    const seg = TRAVEL + HOLD

    const frame = (now: number) => {
      if (stops.length < 2 && !buildStops()) {
        park()
        raf = requestAnimationFrame(frame)
        return
      }
      const n = stops.length
      const t = ((now - start) / 1000) % (n * seg)
      const idx = Math.floor(t / seg)
      const from = stops[idx]
      const to = stops[(idx + 1) % n]
      const local = t - idx * seg
      const e = local < TRAVEL ? easeInOut(local / TRAVEL) : 1
      const tx = from.tx + (to.tx - from.tx) * e
      const ty = from.ty + (to.ty - from.ty) * e
      grid.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${ZOOM})`
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
