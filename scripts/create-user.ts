import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dbMinimal } from '@/lib/db-minimal';
import { user as userTable } from '@/shared/schema-tables';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';

async function createUser(email: string) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    console.error('User not authenticated');
    return;
  }

  const [existingUser] = await dbMinimal
    .select()
    .from(userTable)
    .where(eq(userTable.id, authUser.id))
    .limit(1);

  if (existingUser) {
    console.log('User already exists in the database');
    return;
  }

  await dbMinimal.insert(userTable).values({
    id: authUser.id,
    email: email,
    googleCalendarConnected: false,
  });

  console.log(`User with email ${email} created successfully`);
}

const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

createUser(email);
