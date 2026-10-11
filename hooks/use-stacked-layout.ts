'use client'

import { useSyncExternalStore } from 'react'

// Below this width (same breakpoint as the classic dashboard) the dashboard stacks
// widgets in one scrollable column, and widgets switch to their narrow layouts
// (e.g. notes: list first, then a full-width editor)
export const STACK_BREAKPOINT = '(max-width: 767px)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(STACK_BREAKPOINT)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function useIsStacked() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(STACK_BREAKPOINT).matches,
    () => false,
  )
}
