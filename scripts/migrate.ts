import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables.')
}

const main = async () => {
  try {
    console.log('Preparing migration client...')
    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 })
    const db = drizzle(migrationClient)

    console.log('Running migrations...')
    await migrate(db, { migrationsFolder: 'migrations' })

    console.log('Migrations applied successfully!')
    await migrationClient.end()
    process.exit(0)
  } catch (error) {
    console.error('Error running migrations:', error)
    process.exit(1)
  }
}

main() 