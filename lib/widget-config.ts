import { type WidgetId } from '@/types/widgets'

export interface PanelConstraints {
  minWidth: string
  minHeight: string
  defaultSize: number // Panel default size in percentage
  minSize: number    // Panel minimum size in percentage
  responsiveLayouts?: {
    narrow?: {
      width: number  // Breakpoint width in pixels
      layout: 'stack' | 'compact' | 'full'
    }
    medium?: {
      width: number
      layout: 'stack' | 'compact' | 'full'
    }
    wide?: {
      width: number
      layout: 'stack' | 'compact' | 'full'
    }
  }
}

// Panel constraints for the bento grid layout
export const panelConstraints: Record<WidgetId, PanelConstraints> = {
  notes: {
    minWidth: '320px',
    minHeight: '400px',
    defaultSize: 60,
    minSize: 25,
    responsiveLayouts: {
      narrow: {
        width: 400,
        layout: 'stack'
      },
      medium: {
        width: 600,
        layout: 'compact'
      },
      wide: {
        width: 800,
        layout: 'full'
      }
    }
  },
  tasks: {
    minWidth: '300px',
    minHeight: '360px',
    defaultSize: 50,
    minSize: 25
  },
  schedule: {
    minWidth: '300px',
    minHeight: '320px',
    defaultSize: 50,
    minSize: 25
  },
  weather: {
    minWidth: '280px',
    minHeight: '240px',
    defaultSize: 33,
    minSize: 25
  },
  finance: {
    minWidth: '280px',
    minHeight: '280px',
    defaultSize: 33,
    minSize: 25
  },
  recorder: {
    minWidth: '280px',
    minHeight: '240px',
    defaultSize: 33,
    minSize: 25
  }
} 