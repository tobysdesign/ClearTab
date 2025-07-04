ALTER TABLE "user_preferences" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_userId_unique";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id");