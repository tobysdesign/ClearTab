'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './demo-embed.module.css'

/*
 * The real dashboard (the /demo page, sample data, a scripted story) in an iframe, scaled to
 * fit. It only runs while it's on or near the screen, since each one is a whole dashboard,
 * and starts its story over when it comes back.
 */

export type DemoStory = 'hero' | 'layouts' | 'calendars' | 'dock' | 'ask' | 'notes' | 'tasks' | 'schedule'

// The demo's window size (CSS sets the matching aspect ratio, so nothing shifts on load)
const SIZES = { wide: 1440, half: 1100, card: 720 } as const

export function DemoEmbed({ story, title, size = 'wide' }: { story: DemoStory; title: string; size?: keyof typeof SIZES }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const resize = new ResizeObserver(([entry]) => {
      el.style.setProperty('--demo-scale', String(entry.contentRect.width / SIZES[size]))
    })
    resize.observe(el)
    const visibility = new IntersectionObserver(
      ([entry]) => {
        setNear(entry.isIntersecting)
        if (!entry.isIntersecting) setLoaded(false)
      },
      { rootMargin: '300px 0px' },
    )
    visibility.observe(el)
    return () => {
      resize.disconnect()
      visibility.disconnect()
    }
  }, [size])

  return (
    <div ref={ref} className={styles.embed} data-size={size} data-loaded={loaded} aria-hidden="true">
      {near && (
        <iframe
          className={styles.frame}
          src={`/demo?story=${story}`}
          title={title}
          tabIndex={-1}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  )
}
