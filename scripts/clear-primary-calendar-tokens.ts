#!/usr/bin/env tsx
/**
 * Clear primary account calendar tokens to force re-authentication
 * Run with: npx tsx scripts/clear-primary-calendar-tokens.ts
 */

import { db } from '../lib/db';
import { user } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function clearPrimaryCalendarTokens() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx scripts/clear-primary-calendar-tokens.ts <email>');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking for user with email: ${email}`);

    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRecord) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${userRecord.id}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Calendar connected: ${userRecord.googleCalendarConnected}`);
    console.log(`   Has access token: ${!!userRecord.accessToken}`);
    console.log(`   Has refresh token: ${!!userRecord.refreshToken}`);

    console.log('\n🧹 Clearing calendar tokens...');

    await db
      .update(user)
      .set({
        googleCalendarConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
      } as any)
      .where(eq(user.id, userRecord.id));

    console.log('✅ Calendar tokens cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh your browser (http://localhost:3007)');
    console.log('   2. The automatic OAuth flow will trigger');
    console.log('   3. Click "Allow" when Google asks for calendar permissions');
    console.log('   4. Your primary calendar will appear!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

clearPrimaryCalendarTokens();
