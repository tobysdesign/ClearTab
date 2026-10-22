'use client'

import { useEffect, useRef } from 'react'
import styles from './hero-grid.module.css'
import { HERO_GRID_WIDGETS } from './widgets'

/**
 * Camera-fly timeline (M2). The camera hops from widget to widget, LANDING each
 * one centred on a fixed focus point, holding, then flying to the next.
 *
 * Each landing is computed: we measure the target card's centre in the grid's
 * local space and solve for the grid transform (`translate3d(tx,ty,0)
 * scale(zoom)`) that places that centre on FOCUS — so the camera always lands
 * squarely on a widget.
 *
 * The ORDER traces a DOUBLE DIAMOND (buildShots, in the effect): two
 * concentric diamonds visited N→E→S→W. Because the anchors sit on the axes,
 * every hop is a 45°-ish diagonal and every turn is 90°, so no move is
 * horizontal or vertical, none reverses the one before it, and the loop closes
 * cleanly on itself.
 */

/** Landing zoom (grid scale) and seconds to rest on each widget. */
const ZOOM = 1.32
const HOLD = 2.5
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

    // Measure card centres in the grid's own (untransformed) space — grid and
    // cards share an offsetParent, so the subtraction cancels it out. Then walk
    // a path where every hop is diagonal and never reverses the previous hop,
    // and turn each stop into a shot that lands that card on FOCUS. Built lazily
    // on the first frame, once the grid has laid out.
    let shots: Shot[] | null = null
    let total = 0

    const buildShots = (): Shot[] | null => {
      const cards = grid.children
      const n = cards.length
      if (!n || !grid.offsetWidth) return null
      const gcx = grid.offsetLeft + grid.offsetWidth / 2
      const gcy = grid.offsetTop + grid.offsetHeight / 2
      const pos = Array.from(cards, (el) => {
        const c = el as HTMLElement
        return { ox: c.offsetLeft + c.offsetWidth / 2 - gcx, oy: c.offsetTop + c.offsetHeight / 2 - gcy }
      })

      // Double-diamond circuit. Two concentric diamonds (outer then inner),
      // each visited N → E → S → W. Every anchor sits on an axis, so every hop
      // between them is a 45°-ish DIAGONAL and every turn is 90° — no move is
      // horizontal or vertical, none reverses the one before it, and the loop
      // closes on itself. We just land on the real card nearest each anchor.
      const halfW = grid.offsetWidth / 2
      const halfH = grid.offsetHeight / 2
      const rOuter = Math.min(halfW, halfH) * 0.66
      const rInner = rOuter * 0.6
      const anchors = [
        { x: 0, y: -rOuter }, // outer N
        { x: rOuter, y: 0 }, //  outer E
        { x: 0, y: rOuter }, //  outer S
        { x: -rOuter, y: 0 }, // outer W
        { x: 0, y: -rInner }, // inner N
        { x: rInner, y: 0 }, //  inner E
        { x: 0, y: rInner }, //  inner S
        { x: -rInner, y: 0 }, // inner W
      ]

      // Diagonal-ness of a vector: shorter axis over longer (1 = perfect 45°).
      const ratioOf = (dx: number, dy: number) => {
        const ax = Math.abs(dx)
        const ay = Math.abs(dy)
        return Math.min(ax, ay) / (Math.max(ax, ay) || 1)
      }
      const K = 7 // candidate cards per anchor
      const order: number[] = []
      const used = new Set<number>()
      anchors.forEach((a, ai) => {
        const isLast = ai === anchors.length - 1
        // The K unused cards nearest this anchor.
        const cand = pos
          .map((p, i) => ({ i, dd: (p.ox - a.x) ** 2 + (p.oy - a.y) ** 2 }))
          .filter((c) => !used.has(c.i))
          .sort((x, y) => x.dd - y.dd)
          .slice(0, K)
        if (!cand.length) return
        let pick = cand[0].i
        if (order.length > 0) {
          // Favour the candidate whose hop FROM the previous card is the most
          // diagonal (and, on the last card, whose wrap back to the first is
          // diagonal too) — nudging the real cards onto the ideal diamond so no
          // hop drifts toward horizontal/vertical.
          const prev = pos[order[order.length - 1]]
          const first = pos[order[0]]
          let bestScore = -Infinity
          for (const c of cand) {
            let score = ratioOf(pos[c.i].ox - prev.ox, pos[c.i].oy - prev.oy) * 2 - c.dd / 2e7
            if (isLast) score += ratioOf(first.ox - pos[c.i].ox, first.oy - pos[c.i].oy) * 2
            if (score > bestScore) {
              bestScore = score
              pick = c.i
            }
          }
        }
        used.add(pick)
        order.push(pick)
      })

      return order.map((i) => ({
        tx: FOCUS.x - ZOOM * pos[i].ox,
        ty: FOCUS.y - ZOOM * pos[i].oy,
        scale: ZOOM,
        travel: TRAVEL,
        hold: HOLD,
      }))
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
