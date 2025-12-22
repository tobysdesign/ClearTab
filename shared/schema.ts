import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { authenticatedRole } from "drizzle-orm/supabase";
// Simple UUID v4 generator for edge compatibility
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
// Quill Delta Content Schemas
import { QuillDeltaSchema, EMPTY_QUILL_CONTENT, type QuillDelta } from "@/lib/quill-utils";

export const QuillContentSchema = QuillDeltaSchema;
export { EMPTY_QUILL_CONTENT };
export type { QuillDelta };

export const user = pgTable("user", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  googleId: text("google_id").unique(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry", { mode: "date" }),
  googleCalendarConnected: boolean("google_calendar_connected").default(
    false,
  ),
  lastCalendarSync: timestamp("last_calendar_sync", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Note: RLS removed - NextAuth doesn't use Supabase auth.uid()
// Security is handled by NextAuth session validation in API routes

export const account = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // Required by NextAuth
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);
// Note: RLS removed - security handled by NextAuth sessions

export const session = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});
// Note: RLS removed - security handled by NextAuth sessions

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const connectedAccounts = pgTable(
  "connected_accounts",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiry: timestamp("token_expiry", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    providerAccount: uniqueIndex(
      "connected_accounts_provider_account_id_unique",
    ).on(table.provider, table.providerAccountId), // Changed to uniqueIndex
    userIdIndex: index("connected_accounts_user_id_index").on(table.userId),
  }),
).enableRLS();

export const userCalendars = pgTable(
  "user_calendars",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    connectedAccountId: uuid("connected_account_id")
      .notNull()
      .references(() => connectedAccounts.id, { onDelete: "cascade" }),
    calendarId: text("calendar_id").notNull(),
    name: text("name").notNull(),
    color: text("color"),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    accessRole: text("access_role"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    calendarUnique: uniqueIndex("user_calendars_unique_calendar").on(
      table.connectedAccountId,
      table.calendarId,
    ), // Changed to uniqueIndex
    userIdIndex: index("user_calendars_user_id_index").on(table.userId),
  }),
).enableRLS();

export const notes = pgTable(
  "notes",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: jsonb("content").$default(() => []),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    rls: pgPolicy("notes RLS policy", {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: "all",
    }),
  }),
).enableRLS();

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: jsonb("content")
      .default(EMPTY_QUILL_CONTENT)
      .$type<typeof QuillContentSchema._type>()
      .notNull(), // Use Quill content schema
    isCompleted: boolean("is_completed").default(false).notNull(), // New field for completion status
    isHighPriority: boolean("is_high_priority").default(false).notNull(), // New field for high priority (boolean)
    dueDate: timestamp("due_date", { mode: "date" }),
    order: integer("order"), // Remove .nullable() - columns are nullable by default
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    rls: pgPolicy("tasks RLS policy", {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: "all",
    }),
  }),
).enableRLS();

// Explicitly define Task type to ensure correct content typing and new isHighPriority field
export type Task = Omit<typeof tasks.$inferSelect, "content" | "priority"> & {
  content: QuillDelta;
  isHighPriority: boolean;
};

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    agentName: text("agent_name").notNull().default("Alex"),
    userName: text("user_name").notNull().default("User"),
    initialized: boolean("initialized").default(false).notNull(),

    // Countdown widget settings
    countdownTitle: text("countdown_title").default("Countdown"),
    countdownMode: varchar("countdown_mode", {
      enum: ["date-range", "manual-count"],
    }).default("date-range"),
    paydayDate: timestamp("payday_date", { mode: "date" }), // Legacy field for backwards compatibility
    paydayFrequency: varchar("payday_frequency", {
      enum: ["weekly", "fortnightly", "monthly", "annual", "none"],
    }).default("fortnightly"),
    startDate: timestamp("start_date", { mode: "date" }),
    endDate: timestamp("end_date", { mode: "date" }),
    manualCount: integer("manual_count").default(0),

    // Finance settings
    salary: integer("salary").default(0), // monthly salary before expenses
    expenses: integer("expenses").default(2000), // monthly expenses

    // Other preferences
    location: text("location").default("San Francisco, CA"),
    openaiApiKey: text("openai_api_key"),
    theme: text("theme").default("dark"),
    currency: text("currency").default("USD"),
  },
  (table) => ({
    rls: pgPolicy("user_preferences RLS policy", {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: "all",
    }),
  }),
).enableRLS();

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    role: text("role").notNull(), // user, assistant
    sessionId: text("session_id"), // for grouping conversations
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(), // auto-delete after few days
  },
  (table) => ({
    rls: pgPolicy("chat_messages RLS policy", {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: "all",
    }),
  }),
).enableRLS();

// Emotional metadata stored locally for querying/visualization
export const emotionalMetadata = pgTable(
  "emotional_metadata",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(), // "note", "task", "chat"
    sourceId: uuid("source_id"), // reference to note/task id if applicable
    emotion: text("emotion").notNull(), // joy, sadness, anger, fear, etc.
    tone: text("tone").notNull(), // positive, negative, neutral, excited, etc.
    intent: text("intent").notNull(), // goal-setting, venting, planning, etc.
    confidence: integer("confidence").notNull(), // 0-100 score
    insights: text("insights"), // AI-generated insights
    suggestedActions: text("suggested_actions").array(), // ["revisit", "journal", "save_insight"]
    mem0MemoryId: text("mem0_memory_id"), // reference to mem0 memory
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    rls: pgPolicy("emotional_metadata RLS policy", {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: "all",
    }),
  }),
).enableRLS();

// Global memory usage tracking table
export const memoryUsage = pgTable(
  "memory_usage",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    totalTokens: integer("total_tokens").notNull(),
    totalCost: text("total_cost").notNull(),
  },
  (table) => ({
    rls: pgPolicy("memory_usage RLS policy", {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: "all",
    }),
  }),
).enableRLS();

export const memories = pgTable(
  "memories",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    memoryVector: text("memory_vector").notNull(),
    summary: text("summary").notNull(),
    type: text("type").notNull(), // e.g., 'episodic', 'semantic', 'declarative'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    rls: pgPolicy("memories RLS policy", {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: "all",
    }),
  }),
).enableRLS();

export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    config: jsonb("config").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    rls: pgPolicy("app_settings RLS policy", {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: "all",
    }),
  }),
).enableRLS();

export type User = typeof user.$inferSelect;

export interface Note {
  id: string;
  title: string;
  content: QuillDelta;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  queued?: boolean; // Add this for server-side debouncing responses
}

export type UserPreferences = typeof userPreferences.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type EmotionalMetadata = typeof emotionalMetadata.$inferSelect;
export type MemoryUsage = typeof memoryUsage.$inferSelect;
export type Memory = typeof memories.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Session = typeof session.$inferSelect;
export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type UserCalendar = typeof userCalendars.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
