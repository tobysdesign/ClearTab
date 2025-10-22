-- Enable RLS on all tables for proper security
-- This migration re-enables RLS that was previously disabled

-- Enable RLS on user tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connected_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_calendars" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emotional_metadata" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memory_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memories" ENABLE ROW LEVEL SECURITY;

-- Ensure the RLS policies exist (they should be created by drizzle-orm schema)
-- The policies are defined in the schema with auth.uid() checks
