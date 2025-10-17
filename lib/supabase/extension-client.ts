import { createClient } from '@supabase/supabase-js'

// Get environment variables from either process.env or window.__EXTENSION_ENV__
const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined' && (window as any).__EXTENSION_ENV__) {
    return (window as any).__EXTENSION_ENV__[key] || ''
  }
  return process.env[key] || ''
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export function createExtensionClient() {
  console.log('Creating new Supabase extension client...')

  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.warn('Extension client called in server environment, returning null')
    return null
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not available in extension, using offline mode')
    // Return a minimal client that won't try to connect
    return null
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: window.localStorage,
        autoRefreshToken: false, // Disable auto refresh to avoid network calls
        detectSessionInUrl: false, // Disable session detection from URL
      },
      realtime: {
        // Completely disable realtime to prevent WebSocket connections
        disabled: true,
        params: {
          eventsPerSecond: 0,
        },
      },
      // Disable global settings that might cause network issues
      global: {
        headers: {},
        fetch: undefined, // Use browser's native fetch
      },
      // Disable connection pooling and keep-alive
      db: {
        schema: 'public',
      },
    })

    // Disable the realtime client completely
    if (client.realtime) {
      try {
        client.realtime.disconnect()
        // Override realtime methods to prevent any connection attempts
        client.realtime.connect = () => Promise.resolve()
        client.realtime.disconnect = () => Promise.resolve()
      } catch (error) {
        console.log('Realtime already disabled:', error)
      }
    }

    console.log('Supabase extension client created successfully (offline mode)')
    return client
  } catch (error) {
    console.error('Error creating Supabase client, falling back to null:', error)
    return null
  }
}