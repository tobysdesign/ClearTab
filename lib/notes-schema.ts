// Minimal schema for notes API - only imports what's needed
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb
} from "drizzle-orm/pg-core";

// Minimal notes table definition for API routes
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;