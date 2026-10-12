// JSON helpers over apiFetch (web: session cookie; extension: bearer token)

import { apiFetch } from '@/lib/api-fetch'
import { IS_EXTENSION } from '@/lib/platform'

export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const start = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

  const response = await apiFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const end = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const duration = Math.round(end - start);

  if (typeof console !== "undefined") {
    const method = (options.method || 'GET').toUpperCase();
    console.info(`[api] ${method} ${url} → ${response.status} in ${duration}ms`);
  }

  // Web: signed out, so go to login and come back. The extension's auth provider handles
  // its own sign-out (apiFetch re-checks the token on a 401).
  if (response.status === 401 && typeof window !== 'undefined' && !IS_EXTENSION) {
    // Don't redirect if already on login page to prevent infinite loops
    if (window.location.pathname === '/login') {
      return response
    }

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
