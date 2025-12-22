import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(connectionString);

async function addTypeColumn() {
  try {
    console.log('Adding type column to account table...');

    await sql`
      ALTER TABLE account
      ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'oauth'
    `;

    console.log('✅ Successfully added type column to account table');

    await sql.end();
  } catch (error) {
    console.error('❌ Error adding column:', error);
    await sql.end();
    process.exit(1);
  }
}

addTypeColumn();
