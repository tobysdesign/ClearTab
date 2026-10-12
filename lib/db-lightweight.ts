import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Lightweight DB instance without heavy schema imports
const connectionString = process.env.DATABASE_URL

const clientOptions: postgres.Options<{}> = {
  max: 5,                 // Smaller pool for API routes
  idle_timeout: 10,       // Faster cleanup of idle connections
  connect_timeout: 5,     // Faster timeout for responsiveness
  ssl: process.env.NODE_ENV === 'production'
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

// Create postgres connection with optimized settings for API routes
const client = createClient()

// Lightweight DB instance - schema imported only when needed
export const dbLite = drizzle(client)

// Export client for direct queries if needed
export { client }