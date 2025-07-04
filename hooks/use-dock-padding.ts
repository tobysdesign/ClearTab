import { useMemo } from 'react'

type DockPosition = 'top' | 'left' | 'right' | 'bottom'

interface PaddingValues {
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
}

export function useDockPadding(dockPosition: DockPosition): PaddingValues {
  return useMemo(() => {
    const basePadding = 24 // 24px for sides without dock
    const dockPadding = 72 // 72px for side with dock

    switch (dockPosition) {
      case 'top':
        return {
          paddingTop: dockPadding,
          paddingRight: basePadding,
          paddingBottom: basePadding,
          paddingLeft: basePadding,
        }
      case 'right':
        return {
          paddingTop: basePadding,
          paddingRight: dockPadding,
          paddingBottom: basePadding,
          paddingLeft: basePadding,
        }
      case 'bottom':
        return {
          paddingTop: basePadding,
          paddingRight: basePadding,
          paddingBottom: dockPadding,
          paddingLeft: basePadding,
        }
      case 'left':
        return {
          paddingTop: basePadding,
          paddingRight: basePadding,
          paddingBottom: basePadding,
          paddingLeft: dockPadding,
        }
      default:
        return {
          paddingTop: basePadding,
          paddingRight: basePadding,
          paddingBottom: dockPadding,
          paddingLeft: basePadding,
        }
    }
  }, [dockPosition])
} 