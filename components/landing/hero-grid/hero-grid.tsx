'use client'

import { useEffect, useRef } from 'react'
import styles from './hero-grid.module.css'
import { HERO_GRID_WIDGETS } from './widgets'

/**
 * Camera-fly timeline (M2). Each keyframe frames the grid: `tx`/`ty` slide the
 * grid across the tilted plane (px, in the plane's local space) and `scale`
 * zooms in on a card. `hold` is how long to rest on the keyframe; `travel` is
 * how long the move INTO it takes. The loop runs: overview → slide+zoom into a
 * card → hold → zoom back out → next card → …, easing every move.
 *
 * These are authored shots rather than a projected focus point — good enough to
 * read as a camera fly, and the single source to tune the choreography.
 */
interface Shot {
  tx: number
  ty: number
  scale: number
  travel: number // seconds to ease into this shot
  hold: number // seconds to rest on it
}

const SHOTS: Shot[] = [
  { tx: 0, ty: 0, scale: 1.0, travel: 3.2, hold: 1.6 }, // overview
  { tx: -300, ty: -150, scale: 1.5, travel: 3.4, hold: 2.2 }, // fly into an upper-right card
  { tx: 0, ty: 0, scale: 1.0, travel: 3.2, hold: 1.4 }, // pull back to overview
  { tx: 250, ty: 150, scale: 1.46, travel: 3.4, hold: 2.2 }, // fly into a lower card
]

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

    // Respect reduced motion: leave the grid at the overview pose, no loop.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduce?.matches) {
      grid.style.transform = 'translate3d(0, 0, 0) scale(1)'
      return
    }

    // Build a looping timeline: each segment eases from one shot to the next
    // over `travel`, then holds for `hold`.
    const segments = SHOTS.map((shot, i) => {
      const from = SHOTS[(i - 1 + SHOTS.length) % SHOTS.length]
      return { from, to: shot, travel: shot.travel, hold: shot.hold }
    })
    const total = segments.reduce((sum, s) => sum + s.travel + s.hold, 0)

    let raf = 0
    const start = performance.now()

    const frame = (now: number) => {
      let t = ((now - start) / 1000) % total
      let tx = 0
      let ty = 0
      let scale = 1
      for (const seg of segments) {
        if (t < seg.travel) {
          const e = easeInOut(t / seg.travel)
          tx = seg.from.tx + (seg.to.tx - seg.from.tx) * e
          ty = seg.from.ty + (seg.to.ty - seg.from.ty) * e
          scale = seg.from.scale + (seg.to.scale - seg.from.scale) * e
          break
        }
        t -= seg.travel
        if (t < seg.hold) {
          tx = seg.to.tx
          ty = seg.to.ty
          scale = seg.to.scale
          break
        }
        t -= seg.hold
      }
      grid.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
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
