/**
 * Native JavaScript date utilities to replace date-fns
 * Optimized for performance and bundle size
 */

/**
 * Format a date using native Intl.DateTimeFormat
 * Replaces date-fns format function
 */
export function format(date: Date | string | number, pattern: string): string {
  const d = new Date(date)

  switch (pattern) {
    case 'MMM dd':
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    case 'd MMM':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'yyyy-MM-dd':
      return d.toISOString().split('T')[0]
    case 'HH:mm':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    case 'h:mm a':
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    case 'MMMM d, yyyy':
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    case 'EEE, MMM d':
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    default:
      // Fallback to basic format
      return d.toLocaleDateString('en-US')
  }
}

/**
 * Calculate difference in days between two dates
 * Replaces date-fns differenceInDays
 */
export function differenceInDays(laterDate: Date | string | number, earlierDate: Date | string | number): number {
  const later = new Date(laterDate)
  const earlier = new Date(earlierDate)

  // Reset time to start of day for accurate day calculation
  later.setHours(0, 0, 0, 0)
  earlier.setHours(0, 0, 0, 0)

  const diffTime = later.getTime() - earlier.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Format distance from now in relative terms
 * Replaces date-fns formatDistanceToNow
 */
export function formatDistanceToNow(date: Date | string | number): string {
  const then = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'less than a minute'
  if (diffMinutes === 1) return '1 minute'
  if (diffMinutes < 60) return `${diffMinutes} minutes`
  if (diffHours === 1) return '1 hour'
  if (diffHours < 24) return `${diffHours} hours`
  if (diffDays === 1) return '1 day'
  return `${diffDays} days`
}

/**
 * Add days to a date
 * Replaces date-fns addDays
 */
export function addDays(date: Date | string | number, amount: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

/**
 * Add months to a date
 * Replaces date-fns addMonths
 */
export function addMonths(date: Date | string | number, amount: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + amount)
  return result
}

/**
 * Check if date is today
 * Replaces date-fns isToday
 */
export function isToday(date: Date | string | number): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * Check if first date is after second date
 * Replaces date-fns isAfter
 */
export function isAfter(date: Date | string | number, dateToCompare: Date | string | number): boolean {
  return new Date(date).getTime() > new Date(dateToCompare).getTime()
}

/**
 * Check if first date is before second date
 * Replaces date-fns isBefore
 */
export function isBefore(date: Date | string | number, dateToCompare: Date | string | number): boolean {
  return new Date(date).getTime() < new Date(dateToCompare).getTime()
}

/**
 * Parse ISO string to Date
 * Replaces date-fns parseISO
 */
export function parseISO(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Get start of day
 * Replaces date-fns startOfDay
 */
export function startOfDay(date: Date | string | number): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 * Replaces date-fns getDay
 */
export function getDay(date: Date | string | number): number {
  return new Date(date).getDay()
}

/**
 * Check if date is same day as another date
 * Replaces date-fns isSameDay
 */
export function isSameDay(dateLeft: Date | string | number, dateRight: Date | string | number): boolean {
  const left = new Date(dateLeft)
  const right = new Date(dateRight)
  return left.toDateString() === right.toDateString()
}

/**
 * Format date for time display (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string | number): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format date for date display (e.g., "Dec 25")
 */
export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}