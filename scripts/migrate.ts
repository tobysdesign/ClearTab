import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../shared/schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const client = postgres(connectionString, { ssl: 'prefer' })

const db = drizzle(client, { schema })

async function main() {
  console.log("Running migrations")
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log("Migrations finished")
  process.exit(0)
}

main().catch((err) => {
  console.error("Migration failed", err)
  process.exit(1)
}) 