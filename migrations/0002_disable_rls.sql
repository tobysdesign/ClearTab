-- Disable RLS on tables that use application-level security
-- We check userId in application code, so RLS is not needed and causes issues with Drizzle

ALTER TABLE "notes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "connected_accounts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "user_calendars" DISABLE ROW LEVEL SECURITY;

-- Drop the RLS policies since they're no longer needed
DROP POLICY IF EXISTS "user RLS policy" ON "user";
DROP POLICY IF EXISTS "account RLS policy" ON "account";
DROP POLICY IF EXISTS "session RLS policy" ON "session";
