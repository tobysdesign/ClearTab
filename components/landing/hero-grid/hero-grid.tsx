'use client'

import { useRef } from 'react'
import styles from './hero-grid.module.css'
import { HERO_GRID_WIDGETS } from './widgets'

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
  // Held for M2 (camera-fly): the loop will mutate these transforms per frame.
  const planeRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

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
