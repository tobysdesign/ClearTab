// @ts-nocheck
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
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import type { AdapterAccount } from 'next-auth/adapters'
import { authenticatedRole } from 'drizzle-orm/supabase'
import crypto from 'crypto'

// Define a strict schema for Yoopta content
const yooptaTextNodeSchema = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  code: z.boolean().optional(),
  strike: z.boolean().optional(),
  highlight: z.any().optional(),
});

export const yooptaNodeSchema: z.ZodSchema<any> = z.lazy(() => z.union([
  yooptaTextNodeSchema,
  z.object({
    id: z.string(),
    type: z.string(),
    children: z.array(z.lazy(() => yooptaNodeSchema)),
    props: z.record(z.string(), z.any()).optional(),
  }).passthrough(),
]));

const yooptaBlockBaseMetaSchema = z.object({
  order: z.number(),
  depth: z.number(),
  align: z.union([z.literal('left'), z.literal('center'), z.literal('right')]).optional(),
});

export const yooptaBlockDataSchema = z.object({
  id: z.string(),
  value: z.array(yooptaNodeSchema),
  type: z.string(),
  meta: yooptaBlockBaseMetaSchema,
});

export type YooptaBlockData = z.infer<typeof yooptaBlockDataSchema>;

// Corrected YooptaContentValue to be a Record of block IDs to block data
export const yooptaContentSchema = z.record(z.string(), yooptaBlockDataSchema);

// Standard empty content structure aligned with Yoopta Editor expectations
export const EMPTY_CONTENT: YooptaContentValue = {
  'paragraph-1': {
    id: 'paragraph-1',
    type: 'paragraph',
    value: [{
      id: 'paragraph-1-element',
      type: 'paragraph',
      children: [{ text: '' }],
      props: {
        nodeType: 'block',
      },
    }],
    meta: {
      order: 0,
      depth: 0,
    },
  },
};

export type YooptaContentValue = z.infer<typeof yooptaContentSchema>;

export const user = pgTable(
  'user',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name'),
    email: text('email').notNull(),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
    password: text('password'),
    googleId: text('google_id').unique(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiry: timestamp('token_expiry', { mode: 'date' }),
    googleCalendarConnected: boolean('google_calendar_connected').default(false),
    lastCalendarSync: timestamp('last_calendar_sync', { mode: 'date' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    rls: pgPolicy('user RLS policy', {
      using: sql`auth.uid() = ${table.id}`,
      withCheck: sql`auth.uid() = ${table.id}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: jsonb('content').default(EMPTY_CONTENT).$type<YooptaContentValue>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    rls: pgPolicy('notes RLS policy', {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: jsonb('description').$type<YooptaContentValue>(),
    status: text('status', { enum: ["pending", "completed", "important"] }).default("pending").notNull(),
    dueDate: timestamp('due_date', { mode: 'date' }),
    order: integer('order'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    rls: pgPolicy('tasks RLS policy', {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
      .unique(),
    agentName: text('agent_name').notNull().default('Alex'),
    userName: text('user_name').notNull().default('User'),
    initialized: boolean('initialized').default(false).notNull(),
    paydayDate: timestamp('payday_date', { mode: 'date' }),
    paydayFrequency: varchar('payday_frequency', {
      enum: ['weekly', 'fortnightly', 'monthly'],
    }),
    salary: integer('salary').default(0), // monthly salary before expenses
    expenses: integer('expenses').default(2000), // monthly expenses
    location: text('location').default('San Francisco, CA'),
    openaiApiKey: text('openai_api_key'),
    theme: text('theme').default('dark'),
    currency: text('currency').default('USD'),
  },
  (table) => ({
    rls: pgPolicy('user_preferences RLS policy', {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    role: text('role').notNull(), // user, assistant
    sessionId: text('session_id'), // for grouping conversations
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(), // auto-delete after few days
  },
  (table) => ({
    rls: pgPolicy('chat_messages RLS policy', {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

// Emotional metadata stored locally for querying/visualization
export const emotionalMetadata = pgTable(
  'emotional_metadata',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sourceType: text('source_type').notNull(), // "note", "task", "chat"
    sourceId: uuid('source_id'), // reference to note/task id if applicable
    emotion: text('emotion').notNull(), // joy, sadness, anger, fear, etc.
    tone: text('tone').notNull(), // positive, negative, neutral, excited, etc.
    intent: text('intent').notNull(), // goal-setting, venting, planning, etc.
    confidence: integer('confidence').notNull(), // 0-100 score
    insights: text('insights'), // AI-generated insights
    suggestedActions: text('suggested_actions').array(), // ["revisit", "journal", "save_insight"]
    mem0MemoryId: text('mem0_memory_id'), // reference to mem0 memory
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    rls: pgPolicy('emotional_metadata RLS policy', {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

// Global memory usage tracking table
export const memoryUsage = pgTable(
  'memory_usage',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    totalMemories: integer('total_memories').default(0),
    monthlyRetrievals: integer('monthly_retrievals').default(0),
    lastRetrievalReset: timestamp('last_retrieval_reset').defaultNow(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
)

export const memories = pgTable(
  'memories',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    tags: text('tags').array().default([]),
    source: text('source'),
    embedding: jsonb('embedding'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    rls: pgPolicy('memories RLS policy', {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

// Schemas for validation
export const insertUserSchema = createInsertSchema(user);
export const insertNoteSchema = createInsertSchema(notes, {
  content: yooptaContentSchema,
});
export const insertTaskSchema = createInsertSchema(tasks, {
  description: yooptaContentSchema.optional(),
});
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertEmotionalMetadataSchema = createInsertSchema(emotionalMetadata);
export const insertMemorySchema = createInsertSchema(memories);

// Inferred types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof user.$inferSelect;
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
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;
// Adapter table types
export type Account = typeof account.$inferSelect;
export type Session = typeof session.$inferSelect;

// --- NextAuth tables -------------------------------------------------
export const account = pgTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    rls: pgPolicy('account RLS policy', {
      using: sql`auth.uid() = ${account.userId}`,
      withCheck: sql`auth.uid() = ${account.userId}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

export const session = pgTable(
  'session',
  {
    sessionToken: text('sessionToken').notNull().primaryKey(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => ({
    rls: pgPolicy('session RLS policy', {
      using: sql`auth.uid() = ${table.userId}`,
      withCheck: sql`auth.uid() = ${table.userId}`,
      to: authenticatedRole,
      for: 'all',
    }),
  })
).enableRLS()

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)
