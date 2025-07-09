CREATE TABLE "account" (
	"id" uuid PRIMARY KEY NOT NULL,
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
	CONSTRAINT "account_provider_providerAccountId_unique" UNIQUE("provider","providerAccountId")
);
--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_calendars" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"calendar_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"access_role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_calendars_account_id_calendar_id_unique" UNIQUE("account_id","calendar_id")
);
--> statement-breakpoint
ALTER TABLE "user_calendars" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_calendars" ADD CONSTRAINT "user_calendars_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_calendars" ADD CONSTRAINT "user_calendars_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "account RLS policy" ON "account" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "account"."userId") WITH CHECK (auth.uid() = "account"."userId");--> statement-breakpoint
CREATE POLICY "user_calendars RLS policy" ON "user_calendars" AS PERMISSIVE FOR ALL TO "authenticated" USING (auth.uid() = "user_calendars"."user_id") WITH CHECK (auth.uid() = "user_calendars"."user_id");