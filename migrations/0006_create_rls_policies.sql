-- Create RLS policies for all tables
-- These policies ensure users can only access their own data

-- User table policy
DROP POLICY IF EXISTS "user RLS policy" ON "user";
CREATE POLICY "user RLS policy" ON "user"
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Account table policy
DROP POLICY IF EXISTS "account RLS policy" ON "account";
CREATE POLICY "account RLS policy" ON "account"
  FOR ALL
  TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Session table policy
DROP POLICY IF EXISTS "session RLS policy" ON "session";
CREATE POLICY "session RLS policy" ON "session"
  FOR ALL
  TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Notes table policy
DROP POLICY IF EXISTS "notes RLS policy" ON "notes";
CREATE POLICY "notes RLS policy" ON "notes"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tasks table policy
DROP POLICY IF EXISTS "tasks RLS policy" ON "tasks";
CREATE POLICY "tasks RLS policy" ON "tasks"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Connected accounts policy
DROP POLICY IF EXISTS "connected_accounts RLS policy" ON "connected_accounts";
CREATE POLICY "connected_accounts RLS policy" ON "connected_accounts"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User calendars policy
DROP POLICY IF EXISTS "user_calendars RLS policy" ON "user_calendars";
CREATE POLICY "user_calendars RLS policy" ON "user_calendars"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User preferences policy
DROP POLICY IF EXISTS "user_preferences RLS policy" ON "user_preferences";
CREATE POLICY "user_preferences RLS policy" ON "user_preferences"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chat messages policy
DROP POLICY IF EXISTS "chat_messages RLS policy" ON "chat_messages";
CREATE POLICY "chat_messages RLS policy" ON "chat_messages"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Emotional metadata policy
DROP POLICY IF EXISTS "emotional_metadata RLS policy" ON "emotional_metadata";
CREATE POLICY "emotional_metadata RLS policy" ON "emotional_metadata"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Memory usage policy
DROP POLICY IF EXISTS "memory_usage RLS policy" ON "memory_usage";
CREATE POLICY "memory_usage RLS policy" ON "memory_usage"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Memories policy
DROP POLICY IF EXISTS "memories RLS policy" ON "memories";
CREATE POLICY "memories RLS policy" ON "memories"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verification tokens - no policy needed (system-managed)
-- This table doesn't need user-specific access
