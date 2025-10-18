// Minimal database connection for API routes
// Only imports essential modules to reduce bundle size

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Use connection string from environment variable
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create postgres connection with optimized settings for API routes
const client = postgres(connectionString, {
  max: 5,                 // Smaller pool for API routes
  idle_timeout: 10,       // Close connections faster
  connect_timeout: 5,     // Shorter timeout
  ssl: process.env.NODE_ENV === 'production'
})

// Create drizzle database instance without full schema
export const dbMinimal = drizzle(client)

// Export postgres client for direct queries if needed
export const pgClient = client