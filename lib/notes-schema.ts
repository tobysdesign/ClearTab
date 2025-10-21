// Minimal schema for notes API - only imports what's needed
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb
} from "drizzle-orm/pg-core";

// Simple UUID v4 generator for edge compatibility
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Minimal notes table definition for API routes
export const notes = pgTable("notes", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").$default(() => []),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;