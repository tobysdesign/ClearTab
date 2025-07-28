export type WidgetId = 'notes' | 'schedule' | 'weather' | 'finance' | 'tasks' | 'recorder'

export interface WidgetState {
  id: WidgetId
  isVisible: boolean
  dimensions?: {
    width?: number
    height?: number
  }
} 