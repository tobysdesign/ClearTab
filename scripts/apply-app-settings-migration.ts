#!/usr/bin/env tsx
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    console.log('🔄 Reading migration file...');
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations/0005_skinny_radioactive_man.sql'),
      'utf-8'
    );

    console.log('🔄 Applying app_settings table migration...');

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log('  Executing:', statement.substring(0, 50) + '...');
      await client.unsafe(statement);
    }

    console.log('✅ Migration applied successfully!');

    // Verify
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'app_settings'
      );
    `;

    if (result[0].exists) {
      console.log('✅ Verified: app_settings table exists');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration();
