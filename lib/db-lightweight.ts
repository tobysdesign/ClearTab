import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Lightweight DB instance without heavy schema imports
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create postgres connection with optimized settings for API routes
const client = postgres(connectionString, {
  max: 5,                 // Smaller pool for API routes
  idle_timeout: 10,       // Faster cleanup of idle connections
  connect_timeout: 5,     // Faster timeout for responsiveness
  ssl: process.env.NODE_ENV === 'production'
})

// Lightweight DB instance - schema imported only when needed
export const dbLite = drizzle(client)

// Export client for direct queries if needed
export { client }