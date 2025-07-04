export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  validationErrors?: Record<string, string[]>
  helpUrl?: string
}

export interface ValidationError {
  field: string
  message: string
}

export interface ErrorResponse {
  success: false
  error: string
  message?: string
  validationErrors?: Record<string, string[]>
  helpUrl?: string
} 