ALTER TABLE "notes" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "payday_frequency" SET DEFAULT 'fortnightly';--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "countdown_title" text DEFAULT 'Countdown';--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "countdown_mode" varchar DEFAULT 'date-range';--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "manual_count" integer DEFAULT 0;