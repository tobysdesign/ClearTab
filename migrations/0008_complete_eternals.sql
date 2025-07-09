CREATE TABLE "connected_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expiry" timestamp,
	"last_sync" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connected_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_provider_providerAccountId_unique";--> statement-breakpoint
ALTER TABLE "user_calendars" DROP CONSTRAINT "user_calendars_account_id_calendar_id_unique";--> statement-breakpoint
ALTER TABLE "user_calendars" DROP CONSTRAINT "user_calendars_account_id_account_id_fk";
--> statement-breakpoint
ALTER TABLE "memories" ALTER COLUMN "embedding" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId");--> statement-breakpoint
ALTER TABLE "emotional_metadata" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "memory" text NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "memory_usage" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_usage" ADD COLUMN "tokens_used" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_usage" ADD COLUMN "api_calls" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_usage" ADD COLUMN "date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "user_calendars" ADD COLUMN "connected_account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_calendars" ADD CONSTRAINT "user_calendars_connected_account_id_connected_accounts_id_fk" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "memories" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "memories" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "memories" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "memory_usage" DROP COLUMN "total_memories";--> statement-breakpoint
ALTER TABLE "memory_usage" DROP COLUMN "monthly_retrievals";--> statement-breakpoint
ALTER TABLE "memory_usage" DROP COLUMN "last_retrieval_reset";--> statement-breakpoint
ALTER TABLE "memory_usage" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "access_token";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "refresh_token";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "token_expiry";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "google_calendar_connected";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "last_calendar_sync";--> statement-breakpoint
ALTER TABLE "user_calendars" DROP COLUMN "account_id";--> statement-breakpoint
ALTER TABLE "user_calendars" ADD CONSTRAINT "user_calendars_account_id_calendar_id_unique" UNIQUE("connected_account_id","calendar_id");--> statement-breakpoint
CREATE POLICY "connected_accounts_rls_policy" ON "connected_accounts" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "connected_accounts"."user_id") WITH CHECK (auth.uid() = "connected_accounts"."user_id");