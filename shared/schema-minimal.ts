/**
 * Minimal schema exports for API routes
 * Re-exports only table definitions without Zod/Quill dependencies
 * Use this in API routes to avoid bundling 4000+ modules
 */

export {
  user,
  account,
  session,
  verificationTokens,
  connectedAccounts,
  userCalendars,
  notes,
  tasks,
  userPreferences,
  chatMessages,
  emotionalMetadata,
  memoryUsage,
  memories,
} from './schema';
