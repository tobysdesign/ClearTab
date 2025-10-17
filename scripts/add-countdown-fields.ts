import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  console.log('Adding countdown fields to user_preferences table...');

  try {
    // Add new columns if they don't exist
    await sql`
      ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS countdown_title text DEFAULT 'Countdown',
      ADD COLUMN IF NOT EXISTS countdown_mode varchar DEFAULT 'date-range',
      ADD COLUMN IF NOT EXISTS start_date timestamp,
      ADD COLUMN IF NOT EXISTS end_date timestamp,
      ADD COLUMN IF NOT EXISTS manual_count integer DEFAULT 0
    `;

    // Update payday_frequency default
    await sql`
      ALTER TABLE user_preferences
      ALTER COLUMN payday_frequency SET DEFAULT 'fortnightly'
    `;

    console.log('✓ Successfully added countdown fields!');
  } catch (err) {
    console.error('Error:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
