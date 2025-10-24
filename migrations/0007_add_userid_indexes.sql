-- Add indexes on userId columns for faster queries
-- These will dramatically speed up queries like:
-- SELECT * FROM notes WHERE user_id = '...'
-- SELECT * FROM tasks WHERE user_id = '...'

-- Notes table index
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- Tasks table index  
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- User preferences index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Chat messages index
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Emotional metadata index
CREATE INDEX IF NOT EXISTS idx_emotional_metadata_user_id ON emotional_metadata(user_id);

-- Memory usage index
CREATE INDEX IF NOT EXISTS idx_memory_usage_user_id ON memory_usage(user_id);

-- Memories index
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);

-- Connected accounts index
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);

-- User calendars index
CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);

-- Composite indexes for common query patterns
-- Notes: frequently filtered by userId and ordered by updatedAt
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC);

-- Tasks: frequently filtered by userId, isCompleted, and ordered by updatedAt
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_updated ON tasks(user_id, is_completed, updated_at DESC);
