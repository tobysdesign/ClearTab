#!/usr/bin/env node

// Create a development user with our mock UUID
const postgres = require('postgres');

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:CoEy50A44XM5zLMe@db.qclvzjiyglvxtctauyhb.supabase.co:5432/postgres";

async function createDevUser() {
  const sql = postgres(databaseUrl);

  try {
    console.log('🧑‍💻 Creating development user...');

    // Create the development user in the local user table
    const result = await sql`
      INSERT INTO "user" (
        id,
        email,
        name
      ) VALUES (
        '00000000-0000-4000-8000-000000000000',
        'dev@example.com',
        'Development User'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    console.log(`✅ Development user created/exists`);
    console.log('🎉 Ready for development with user ID: 00000000-0000-4000-8000-000000000000');
  } catch (error) {
    console.error('❌ Error creating development user:', error);
  } finally {
    await sql.end();
  }
}

createDevUser();