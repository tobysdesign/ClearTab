import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb, index, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  picture: text("picture"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  completed: boolean("completed").default(false).notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  agentName: text("agent_name").notNull().default("Alex"),
  userName: text("user_name").notNull().default("User"),
  initialized: boolean("initialized").default(false).notNull(),
  paydayDate: timestamp("payday_date"),
  paydayFrequency: text("payday_frequency").default("bi-weekly"), // weekly, bi-weekly, monthly
  salary: integer("salary").default(0), // monthly salary before expenses
  expenses: integer("expenses").default(2000), // monthly expenses
  location: text("location").default("San Francisco, CA"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  role: text("role").notNull(), // user, assistant
  sessionId: text("session_id"), // for grouping conversations
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // auto-delete after few days
});

// Emotional metadata stored locally for querying/visualization
export const emotionalMetadata = pgTable("emotional_metadata", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sourceType: text("source_type").notNull(), // "note", "task", "chat"
  sourceId: integer("source_id"), // reference to note/task id if applicable
  emotion: text("emotion").notNull(), // joy, sadness, anger, fear, etc.
  tone: text("tone").notNull(), // positive, negative, neutral, excited, etc.
  intent: text("intent").notNull(), // goal-setting, venting, planning, etc.
  confidence: integer("confidence").notNull(), // 0-100 score
  insights: text("insights"), // AI-generated insights
  suggestedActions: text("suggested_actions").array(), // ["revisit", "journal", "save_insight"]
  mem0MemoryId: text("mem0_memory_id"), // reference to mem0 memory
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Global memory usage tracking table
export const memoryUsage = pgTable("memory_usage", {
  id: serial("id").primaryKey(),
  totalMemories: integer("total_memories").default(0),
  monthlyRetrievals: integer("monthly_retrievals").default(0),
  lastRetrievalReset: timestamp("last_retrieval_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  userId: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertEmotionalMetadataSchema = createInsertSchema(emotionalMetadata).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertEmotionalMetadata = z.infer<typeof insertEmotionalMetadataSchema>;
export type EmotionalMetadata = typeof emotionalMetadata.$inferSelect;
export type MemoryUsage = typeof memoryUsage.$inferSelect;
export type InsertMemoryUsage = typeof memoryUsage.$inferInsert;
