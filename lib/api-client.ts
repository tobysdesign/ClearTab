// API client that automatically includes session ID in requests

const IS_EXTENSION = process.env.IS_EXTENSION === 'true';
const API_URL = IS_EXTENSION ? 'https://cleartab.app' : '';

export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = `${API_URL}${url}`;
  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  // Add session ID to Authorization header if available
  if (sessionId) {
    headers['Authorization'] = `Bearer ${sessionId}`
  }
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include' // Still include cookies as fallback
  })
  
  // If we get a 401, redirect to login
  if (response.status === 401 && typeof window !== 'undefined') {
    // Clear the invalid session
    localStorage.removeItem('session_id')
    
    // Redirect to login with callback URL
    const currentUrl = window.location.href
    window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
  }
  
  return response
}

// Convenience methods
export const api = {
  get: (url: string) => apiRequest(url, { method: 'GET' }),
  post: (url: string, body?: unknown) => apiRequest(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  }),
  put: (url: string, body?: unknown) => apiRequest(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  }),
  patch: (url: string, body?: unknown) => apiRequest(url, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined
  }),
  delete: (url: string) => apiRequest(url, { method: 'DELETE' })
}