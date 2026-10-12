#!/usr/bin/env tsx
// Creates the extension_tokens table (migrations/0008_extension_tokens.sql). Safe to re-run.
// Run against each database before deploying the extension sign-in routes:
//   npx tsx scripts/add-extension-tokens-table.ts
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    console.log('🔄 Creating extension_tokens...');
    await client.unsafe(readFileSync(join(process.cwd(), 'migrations/0008_extension_tokens.sql'), 'utf8'));

    const columns = await client`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'extension_tokens'
      ORDER BY ordinal_position;
    `;
    const [{ relrowsecurity }] = await client`
      SELECT relrowsecurity FROM pg_class WHERE relname = 'extension_tokens';
    `;
    console.log('✅ extension_tokens ready (RLS ' + (relrowsecurity ? 'on' : 'OFF') + '):');
    columns.forEach((col) => console.log(`  - ${col.column_name}: ${col.data_type}`));
  } catch (error) {
    console.error('Migration error:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

migrate();
