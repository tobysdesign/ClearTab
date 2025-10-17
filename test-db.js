require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  connect_timeout: 10,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

    const result = await sql`SELECT NOW() as time, current_database() as db`;
    console.log('✅ Connection successful!');
    console.log('Database:', result[0].db);
    console.log('Server time:', result[0].time);

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

testConnection();
