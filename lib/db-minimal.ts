// Minimal database connection for API routes
// Only imports essential modules to reduce bundle size

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/shared/schema-tables'

// Use connection string from environment variable
const connectionString = process.env.DATABASE_URL

const isSupabaseHost = Boolean(
  connectionString && /supabase\.(co|com)/i.test(connectionString),
)

const clientOptions: postgres.Options<{}> = {
  max: 5,                 // Keep pool size modest so parallel new-tab requests don't saturate Supavisor
  idle_timeout: 20,       // Close idle connections before pooler drops them
  connect_timeout: 15,    // Allow time for cold pooler wakeup
  max_lifetime: 60 * 30,  // 30 minutes max connection lifetime
  ssl:
    process.env.NODE_ENV === 'production' || isSupabaseHost
      ? { rejectUnauthorized: false }
      : false,
  prepare: false,         // Required for Supabase transaction pooler (port 6543)
  transform: postgres.camel, // Transform to camelCase automatically
}

function createClient() {
  if (connectionString) {
    return postgres(connectionString, clientOptions)
  }

  const baseClient = postgres('postgresql://placeholder:placeholder@localhost:5432/placeholder', clientOptions)
  const throwMissingEnv = () => {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  return new Proxy(baseClient, {
    apply() {
      return throwMissingEnv()
    },
    get(target, prop, receiver) {
      if (prop === 'unsafe' || prop === 'begin' || prop === 'file') {
        return throwMissingEnv
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}

const globalForDb = globalThis as unknown as {
  __cleartabPgMinimal?: ReturnType<typeof createClient>
}

// Reuse a single pool across Next.js hot reloads and concurrent API route invocations
const client = globalForDb.__cleartabPgMinimal ?? createClient()
if (process.env.NODE_ENV !== 'production') {
  globalForDb.__cleartabPgMinimal = client
}

// Create drizzle database instance without full schema
export const dbMinimal = drizzle(client, { schema })

// Export postgres client for direct queries if needed
export const pgClient = client
