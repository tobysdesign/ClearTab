#!/usr/bin/env tsx
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    console.log('🔄 Adding layout and widgets columns to user_preferences...');
    await client`
      ALTER TABLE user_preferences 
      ADD COLUMN IF NOT EXISTS layout text DEFAULT 'even';
    `;
    await client`
      ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS widgets jsonb DEFAULT '{"notes":true,"tasks":true,"schedule":true,"weather":true,"recorder":true,"countdown":true}'::jsonb;
    `;
    await client`
      ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS custom_layout jsonb;
    `;
    console.log('✅ Columns added successfully!');

    const columns = await client`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_preferences'
      AND column_name IN ('layout', 'widgets', 'custom_layout');
    `;
    console.log('\n📋 Added columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.end();
  }
}

migrate();
