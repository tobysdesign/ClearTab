-- Chrome extension sign-ins (lib/auth/extension-tokens.ts). Only token hashes are stored.
CREATE TABLE IF NOT EXISTS "extension_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "extension_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "last_used_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "extension_tokens_user_id_idx" ON "extension_tokens" ("user_id");
-- Server-only: RLS with no policies keeps it out of Supabase's public API
ALTER TABLE "extension_tokens" ENABLE ROW LEVEL SECURITY;
