DROP POLICY "connected_accounts_rls_policy" ON "connected_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "connected_accounts" CASCADE;--> statement-breakpoint
DROP POLICY "user_calendars RLS policy" ON "user_calendars" CASCADE;--> statement-breakpoint
DROP TABLE "user_calendars" CASCADE;--> statement-breakpoint
ALTER TABLE "memories" ALTER COLUMN "embedding" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "tags" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "memory_usage" ADD COLUMN "total_memories" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "memory_usage" ADD COLUMN "monthly_retrievals" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "memory_usage" ADD COLUMN "last_retrieval_reset" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "memory_usage" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "google_calendar_connected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_calendar_sync" timestamp;--> statement-breakpoint
ALTER TABLE "emotional_metadata" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "memories" DROP COLUMN "memory";--> statement-breakpoint
ALTER TABLE "memories" DROP COLUMN "source_id";--> statement-breakpoint
ALTER TABLE "memories" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "memory_usage" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "memory_usage" DROP COLUMN "tokens_used";--> statement-breakpoint
ALTER TABLE "memory_usage" DROP COLUMN "api_calls";--> statement-breakpoint
ALTER TABLE "memory_usage" DROP COLUMN "date";