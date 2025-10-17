import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  console.log('Running migrations...');

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'migrations')
  });

  console.log('Migrations completed!');

  await sql.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
