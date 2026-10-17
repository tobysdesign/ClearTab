/*
 * Sample data for the /demo page. Dates are relative to today so the demo never goes stale.
 */

export const DEMO_USER = {
  id: 'demo-user',
  name: 'Sam Taylor',
  email: 'sam@example.com',
  image: null,
}

export const PERSONAL_ACCOUNT_ID = 'demo-personal-account'
const PRIMARY_ACCOUNT_ID = `primary-${DEMO_USER.id}`

// What the voice memo "hears" (with speaker identification)
export const DEMO_TRANSCRIPT =
  "Speaker 1 (You): Great brainstorming session on the Q4 launch.\nSpeaker 2 (Sam): I'll send Sam the slides by Friday, and we need to book flights for Mum's birthday."

// The part of it the hero demo highlights and asks the AI to summarize and turn into tasks
export const DEMO_TASK_SOURCE =
  "Speaker 2 (Sam): I'll send Sam the slides by Friday, and we need to book flights for Mum's birthday."

const DAY = 24 * 60 * 60 * 1000

function at(dayOffset: number, hours: number, minutes = 0) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString()

export function localDate(dayOffset: number) {
  const date = new Date(Date.now() + dayOffset * DAY)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// The coming Friday (today if it's Friday)
export function nextFriday() {
  const today = new Date()
  return localDate((5 - today.getDay() + 7) % 7)
}

const delta = (...lines: string[]) => ({ ops: [{ insert: `${lines.join('\n')}\n` }] })

export function demoNotes() {
  return [
    {
      id: 'demo-note-weekend',
      userId: DEMO_USER.id,
      title: 'Weekend',
      content: delta('Farmers market at 9, then a swim.', 'Call Mum about Sunday lunch.', 'Pick up the new tent from Ben.'),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0.1),
    },
    {
      id: 'demo-note-q4',
      userId: DEMO_USER.id,
      title: 'Q4 planning',
      content: delta('Launch the extension before Christmas.', 'Hire a second designer.', 'Quarterly review on the 28th.'),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
    },
    {
      id: 'demo-note-books',
      userId: DEMO_USER.id,
      title: 'Book ideas',
      content: delta('A Psalm for the Wild-Built', 'Tomorrow, and Tomorrow, and Tomorrow', 'The Overstory'),
      createdAt: daysAgo(12),
      updatedAt: daysAgo(3),
    },
    {
      id: 'demo-note-recipes',
      userId: DEMO_USER.id,
      title: 'Recipes to try',
      content: delta('Miso eggplant', 'Lemon ricotta pancakes', 'Green curry with whatever is left'),
      createdAt: daysAgo(20),
      updatedAt: daysAgo(9),
    },
  ]
}

function task(id: string, title: string, options: { dueIn?: number | null; important?: boolean; done?: boolean; ageDays?: number }) {
  const created = daysAgo(options.ageDays ?? 1)
  return {
    id,
    userId: DEMO_USER.id,
    title,
    content: { ops: [{ insert: '\n' }] },
    isCompleted: options.done ?? false,
    isHighPriority: options.important ?? false,
    dueDate: options.dueIn === undefined || options.dueIn === null ? null : `${localDate(options.dueIn)}T12:00:00.000Z`,
    order: null,
    createdAt: created,
    updatedAt: created,
  }
}

export function demoTasks() {
  return [
    task('demo-task-invoice', 'Email Priya the invoice', { dueIn: 0, important: true, ageDays: 1 }),
    task('demo-task-passport', 'Renew passport', { dueIn: 1, ageDays: 2 }),
    task('demo-task-dentist', 'Book the dentist', { dueIn: 6, ageDays: 3 }),
    task('demo-task-rent', 'Pay rent', { dueIn: 9, ageDays: 4 }),
    task('demo-task-gift', 'Wrap the birthday present', { dueIn: null, ageDays: 5 }),
  ]
}

function event(
  id: string,
  title: string,
  start: string,
  end: string,
  account: 'work' | 'personal',
  extra: { allDay?: boolean; location?: string } = {},
) {
  const work = account === 'work'
  return {
    id,
    title,
    start,
    end,
    description: '',
    location: extra.location ?? '',
    allDay: extra.allDay ?? false,
    color: work ? 'var(--google-calendar-default)' : 'var(--google-calendar-7)',
    calendarId: work ? 'primary' : 'personal',
    calendarName: work ? 'Work' : 'Personal',
    source: 'google' as const,
    accountId: work ? PRIMARY_ACCOUNT_ID : PERSONAL_ACCOUNT_ID,
  }
}

// Work and personal calendars from two Google accounts, merged as /api/calendar does
export function demoEvents() {
  const events = []
  for (let day = -1; day <= 6; day++) {
    const weekday = new Date(Date.now() + day * DAY).getDay()
    const weekend = weekday === 0 || weekday === 6
    if (!weekend) {
      events.push(event(`demo-standup-${day}`, 'Team stand-up', at(day, 9, 15), at(day, 9, 30), 'work'))
    }
    if (day === 0) {
      events.push(event('demo-review', 'Design review', at(0, 10), at(0, 10, 45), 'work', { location: 'Room 4' }))
      events.push(event('demo-lunch', 'Lunch with Sam', at(0, 12, 30), at(0, 13, 30), 'personal', { location: 'Bills, Surry Hills' }))
      events.push(event('demo-1on1', '1:1 with Priya', at(0, 15), at(0, 15, 30), 'work'))
      events.push(event('demo-gym', 'Gym', at(0, 18), at(0, 19), 'personal'))
    }
    if (day === 1) {
      events.push(event('demo-dentist', 'Dentist', at(1, 8), at(1, 8, 45), 'personal'))
      events.push(event('demo-planning', 'Sprint planning', at(1, 11), at(1, 12), 'work'))
    }
    if (day === 2) {
      events.push(event('demo-plumber', 'Plumber', at(2, 10), at(2, 11), 'personal'))
      events.push(event('demo-demo', 'Client demo', at(2, 14), at(2, 15), 'work'))
    }
    if (day === 3) {
      events.push(event('demo-drinks', 'Team drinks', at(3, 17, 30), at(3, 19), 'work'))
    }
    if (day === 4) {
      events.push(event('demo-market', 'Farmers market', at(4, 9), at(4, 10, 30), 'personal'))
    }
  }
  return events
}

export function demoPreferences() {
  return {
    id: 'demo-preferences',
    userId: DEMO_USER.id,
    agentName: 'Alex',
    userName: 'Sam',
    initialized: true,
    countdownTitle: 'Holiday',
    countdownMode: 'date-range',
    startDate: daysAgo(40),
    endDate: new Date(Date.now() + 23 * DAY).toISOString(),
    location: 'Sydney, NSW',
    theme: 'dark',
    currency: 'AUD',
    layout: 'even',
    widgets: { notes: true, tasks: true, schedule: true, weather: true, recorder: true, countdown: true },
    customLayout: null,
  }
}

export function demoWeather(units: 'METRIC' | 'IMPERIAL' = 'METRIC') {
  const toUnit = (celsius: string) =>
    units === 'IMPERIAL' ? String(Math.round((Number(celsius) * 9) / 5 + 32)) : celsius
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const forecast = [
    { condition: 'Mostly sunny', high: toUnit('24'), low: toUnit('15') },
    { condition: 'Partly cloudy', high: toUnit('22'), low: toUnit('14') },
    { condition: 'Showers', high: toUnit('19'), low: toUnit('13') },
    { condition: 'Sunny', high: toUnit('25'), low: toUnit('16') },
    { condition: 'Mostly sunny', high: toUnit('27'), low: toUnit('17') },
  ].map((day, i) => ({ ...day, day: days[new Date(Date.now() + i * DAY).getDay()] }))
  const location = 'Sydney NSW, Australia'
  return [
    { label: '5 Day Forecast', location, isForecast: true, condition: 'Forecast', forecast },
    { label: forecast[1].day, location, temperature: forecast[1].high, condition: forecast[1].condition, high: forecast[1].high, low: forecast[1].low },
    { label: 'Today', location, temperature: toUnit('21'), condition: forecast[0].condition, high: forecast[0].high, low: forecast[0].low },
  ]
}
