#!/usr/bin/env tsx
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkTable() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'app_settings'
      );
    `;

    if (result[0].exists) {
      console.log('✅ app_settings table EXISTS');

      // Check structure
      const columns = await client`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'app_settings';
      `;

      console.log('\n📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ app_settings table DOES NOT exist');
      console.log('   Migration needs to be applied');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTable();
