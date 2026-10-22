'use client'

/**
 * Hero-grid widget registry.
 *
 * The camera-fly hero fills its tilted 3D plane with real ClearTab widget
 * cards running in demo mode — the same self-contained `login-*` widgets used
 * on the sign-in screen. They already ship mock data, do no network calls and
 * keep themselves out of the tab order, which makes them safe to drop into a
 * non-interactive background.
 *
 * Everything is registered in ONE array so cards can be added, removed or
 * reordered without touching the grid layout. Each entry declares its own
 * aspect ratio so the masonry-ish grid reads like a real dashboard rather than
 * a uniform tile sheet. Later milestones (M3) can thread an `active` prop
 * through to drive per-widget idle/active states — the entry shape leaves room
 * for that without a rewrite.
 */

import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'

/** Props a future (M3) demo widget may accept. Current login widgets ignore them. */
export interface HeroWidgetProps {
  active?: boolean
}

type HeroWidget = ComponentType<HeroWidgetProps>

const loading = () => null

const NotesWidget = dynamic(
  () => import('@/components/widgets/login-notes-widget').then((m) => ({ default: m.LoginNotesWidget })),
  { ssr: false, loading },
) as HeroWidget

const TasksWidget = dynamic(
  () => import('@/components/widgets/login-tasks-widget').then((m) => ({ default: m.LoginTasksWidget })),
  { ssr: false, loading },
) as HeroWidget

const ScheduleWidget = dynamic(
  () => import('@/components/widgets/login-schedule-widget').then((m) => ({ default: m.LoginScheduleWidget })),
  { ssr: false, loading },
) as HeroWidget

const WeatherWidget = dynamic(
  () => import('@/components/widgets/login-weather-widget').then((m) => ({ default: m.LoginWeatherWidget })),
  { ssr: false, loading },
) as HeroWidget

const RecorderWidget = dynamic(
  () => import('@/components/widgets/login-recorder-widget').then((m) => ({ default: m.LoginRecorderWidget })),
  { ssr: false, loading },
) as HeroWidget

const CountdownWidget = dynamic(
  () => import('@/components/widgets/login-countdown-widget').then((m) => ({ default: m.LoginCountdownWidget })),
  { ssr: false, loading },
) as HeroWidget

/** How many grid rows a card spans (card width is fixed by the grid). */
export interface HeroGridEntry {
  /** Stable key — used for React keys and future per-card animation offsets. */
  id: string
  Widget: HeroWidget
  /** Row span (1 = short, 2 = tall). Column span is always 1 for M1. */
  rows: 1 | 2
}

/**
 * Repeating pattern of widget types + row spans. The grid is generated from
 * this so the total card count (and therefore how far the field spreads behind
 * the tilted camera) is a single number to tune — see HERO_GRID_CARD_COUNT.
 */
const PATTERN: Array<{ Widget: HeroWidget; rows: 1 | 2 }> = [
  { Widget: TasksWidget, rows: 2 },
  { Widget: WeatherWidget, rows: 2 },
  { Widget: NotesWidget, rows: 2 },
  { Widget: CountdownWidget, rows: 1 },
  { Widget: RecorderWidget, rows: 1 },
  { Widget: ScheduleWidget, rows: 2 },
  { Widget: NotesWidget, rows: 2 },
  { Widget: TasksWidget, rows: 1 },
  { Widget: CountdownWidget, rows: 1 },
  { Widget: ScheduleWidget, rows: 2 },
  { Widget: WeatherWidget, rows: 2 },
  { Widget: RecorderWidget, rows: 1 },
]

/** How many cards fill the grid. Enough that the zoomed-out field still covers
 *  the viewport behind the hero copy without any empty edge. */
export const HERO_GRID_CARD_COUNT = 20

export const HERO_GRID_WIDGETS: HeroGridEntry[] = Array.from(
  { length: HERO_GRID_CARD_COUNT },
  (_, i) => {
    const { Widget, rows } = PATTERN[i % PATTERN.length]
    return { id: `cell-${i}`, Widget, rows }
  },
)
