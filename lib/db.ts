import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/shared/schema'

// Use connection string from environment variable
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create postgres connection with proper pooling and timeouts
const client = postgres(connectionString, {
  max: 5,                 // Reduced connection pool size for Supabase
  idle_timeout: 20,       // Close idle connections after 20 seconds
  connect_timeout: 30,    // Increased connection timeout for Supabase
  ssl: 'require',         // Always require SSL for Supabase
  transform: {
    undefined: null       // Transform undefined to null for Postgres
  }
})

// Create drizzle database instance with schema
export const db = drizzle(client, { schema })

// Export the client for use in migrations
export const migrationClient = postgres(connectionString, { max: 1 })

// Run migrations (only used in development/deployment)
export async function runMigrations() {
  const { migrate } = await import('drizzle-orm/postgres-js/migrator')
  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migrations completed successfully')
  } catch (error) {
    console.error('Failed to run migrations:', error)
    throw error
  } finally {
    await migrationClient.end()
  }
}
