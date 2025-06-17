CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"role" text NOT NULL,
	"session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emotional_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_id" integer,
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
CREATE TABLE "memory_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_memories" integer DEFAULT 0,
	"monthly_retrievals" integer DEFAULT 0,
	"last_retrieval_reset" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"agent_name" text DEFAULT 'Alex' NOT NULL,
	"user_name" text DEFAULT 'User' NOT NULL,
	"initialized" boolean DEFAULT false NOT NULL,
	"payday_date" timestamp,
	"payday_frequency" text DEFAULT 'bi-weekly',
	"salary" integer DEFAULT 0,
	"expenses" integer DEFAULT 2000,
	"location" text DEFAULT 'San Francisco, CA',
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"name" text NOT NULL,
	"picture" text,
	"google_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"google_calendar_connected" boolean DEFAULT false,
	"last_calendar_sync" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
