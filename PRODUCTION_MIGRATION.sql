CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"role" text NOT NULL,
	"session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "connected_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connected_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "emotional_metadata" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid,
	"emotion" text NOT NULL,
	"tone" text NOT NULL,
	"intent" text NOT NULL,
	"confidence" integer NOT NULL,
	"insights" text,
	"suggested_actions" text[],
	"mem0_memory_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emotional_metadata" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"memory_vector" text NOT NULL,
	"summary" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memory_usage" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"total_tokens" integer NOT NULL,
	"total_cost" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memory_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" jsonb DEFAULT '[{"id":"default-paragraph","type":"paragraph","content":[],"props":{}}]'::jsonb NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_high_priority" boolean DEFAULT false NOT NULL,
	"due_date" timestamp,
	"order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"password" text,
	"google_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"google_calendar_connected" boolean DEFAULT false,
	"last_calendar_sync" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_calendars" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"connected_account_id" uuid NOT NULL,
	"calendar_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"access_role" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_calendars" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"agent_name" text DEFAULT 'Alex' NOT NULL,
	"user_name" text DEFAULT 'User' NOT NULL,
	"initialized" boolean DEFAULT false NOT NULL,
	"payday_date" timestamp,
	"payday_frequency" varchar,
	"salary" integer DEFAULT 0,
	"expenses" integer DEFAULT 2000,
	"location" text DEFAULT 'San Francisco, CA',
	"openai_api_key" text,
	"theme" text DEFAULT 'dark',
	"currency" text DEFAULT 'USD',
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotional_metadata" ADD CONSTRAINT "emotional_metadata_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_usage" ADD CONSTRAINT "memory_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_calendars" ADD CONSTRAINT "user_calendars_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_calendars" ADD CONSTRAINT "user_calendars_connected_account_id_connected_accounts_id_fk" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "connected_accounts_provider_account_id_unique" ON "connected_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "connected_accounts_user_id_index" ON "connected_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_calendars_unique_calendar" ON "user_calendars" USING btree ("connected_account_id","calendar_id");--> statement-breakpoint
CREATE INDEX "user_calendars_user_id_index" ON "user_calendars" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "account RLS policy" ON "account" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "account"."userId") WITH CHECK (auth.uid() = "account"."userId");--> statement-breakpoint
CREATE POLICY "chat_messages RLS policy" ON "chat_messages" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "chat_messages"."user_id") WITH CHECK (auth.uid() = "chat_messages"."user_id");--> statement-breakpoint
CREATE POLICY "emotional_metadata RLS policy" ON "emotional_metadata" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "emotional_metadata"."user_id") WITH CHECK (auth.uid() = "emotional_metadata"."user_id");--> statement-breakpoint
CREATE POLICY "memories RLS policy" ON "memories" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "memories"."user_id") WITH CHECK (auth.uid() = "memories"."user_id");--> statement-breakpoint
CREATE POLICY "memory_usage RLS policy" ON "memory_usage" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "memory_usage"."user_id") WITH CHECK (auth.uid() = "memory_usage"."user_id");--> statement-breakpoint
CREATE POLICY "notes RLS policy" ON "notes" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "notes"."user_id") WITH CHECK (auth.uid() = "notes"."user_id");--> statement-breakpoint
CREATE POLICY "session RLS policy" ON "session" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "session"."userId") WITH CHECK (auth.uid() = "session"."userId");--> statement-breakpoint
CREATE POLICY "tasks RLS policy" ON "tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "tasks"."user_id") WITH CHECK (auth.uid() = "tasks"."user_id");--> statement-breakpoint
CREATE POLICY "user RLS policy" ON "user" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user"."id") WITH CHECK (auth.uid() = "user"."id");--> statement-breakpoint
CREATE POLICY "user_preferences RLS policy" ON "user_preferences" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_preferences"."user_id") WITH CHECK (auth.uid() = "user_preferences"."user_id");