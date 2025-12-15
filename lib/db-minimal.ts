// Minimal database connection for API routes
// Only imports essential modules to reduce bundle size

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/shared/schema-tables'

// Use connection string from environment variable
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create postgres connection with optimized settings for API routes
const client = postgres(connectionString, {
  max: 10,                // Increase pool size
  idle_timeout: 20,       // Keep connections longer
  connect_timeout: 10,    // Longer timeout for stability
  max_lifetime: 60 * 30,  // 30 minutes max connection lifetime
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  prepare: false,         // Disable prepared statements for better performance
  transform: postgres.camel, // Transform to camelCase automatically
})

// Create drizzle database instance without full schema
export const dbMinimal = drizzle(client, { schema })

// Export postgres client for direct queries if needed
export const pgClient = client
