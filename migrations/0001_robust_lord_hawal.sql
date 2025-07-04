ALTER TABLE "chat_messages" ALTER COLUMN "id" SET DATA TYPE BIGINT;--> statement-breakpoint
ALTER TABLE "emotional_metadata" ALTER COLUMN "id" SET DATA TYPE BIGINT;--> statement-breakpoint
ALTER TABLE "memories" ALTER COLUMN "id" SET DATA TYPE BIGINT;--> statement-breakpoint
ALTER TABLE "memory_usage" ALTER COLUMN "id" SET DATA TYPE BIGINT;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "id" SET DATA TYPE BIGINT;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "id" SET DATA TYPE BIGINT;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "id" SET DATA TYPE BIGINT;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;