import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInDays } from './date-utils'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatShortDate(date: Date | string | number) {
  const then = new Date(date)
  const now = new Date()

  if (differenceInDays(now, then) < 7) {
    if (differenceInDays(now, then) >= 1) {
      const days = differenceInDays(now, then)
      if (days === 1) return 'Yesterday'
      return `${days} days`
    }

    let relativeTime = formatDistanceToNow(then)

    relativeTime = relativeTime
      .replace('about ', '')
      .replace('less than a minute', 'Just now')
      .replace(' minutes', 'mins')
      .replace(' minute', 'min')
      .replace(' hours', 'hrs')
      .replace(' hour', 'hr')

    return relativeTime
  }

  return format(then, "MMM dd")
} 