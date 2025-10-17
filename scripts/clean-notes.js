#!/usr/bin/env node

// Clean notes table from invalid UUIDs and corrupted data
const postgres = require('postgres');

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:CoEy50A44XM5zLMe@db.qclvzjiyglvxtctauyhb.supabase.co:5432/postgres";

async function cleanNotes() {
  const sql = postgres(databaseUrl);

  try {
    console.log('🧹 Cleaning notes table...');

    // Delete all notes - fresh start
    const result = await sql`DELETE FROM notes`;

    console.log(`✅ Cleaned ${result.count} notes from the database`);
    console.log('🎉 Database is now clean and ready for new notes');
  } catch (error) {
    console.error('❌ Error cleaning notes:', error);
  } finally {
    await sql.end();
  }
}

cleanNotes();