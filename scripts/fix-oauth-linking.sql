-- Fix OAuthAccountNotLinked error
-- This script cleans up old Supabase auth data and prepares for NextAuth

-- Step 1: Check what accounts exist
SELECT id, email, "googleId", "googleCalendarConnected" FROM "user";

-- Step 2: Delete old account records that might conflict
DELETE FROM account WHERE provider = 'google';

-- Step 3: Update user records to allow NextAuth to create new account links
-- (Optional: Only run if you want to preserve existing users)
-- UPDATE "user" SET "googleId" = NULL WHERE "googleId" IS NOT NULL;

-- Step 4: Verify cleanup
SELECT COUNT(*) as account_count FROM account;
SELECT COUNT(*) as user_count FROM "user";
