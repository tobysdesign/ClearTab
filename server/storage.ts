import {
  user, notes, tasks, userPreferences, chatMessages, emotionalMetadata, memoryUsage,
  type User, type InsertUser, type Note, type InsertNote,
  type Task, type InsertTask, type UserPreferences, type InsertUserPreferences,
  type ChatMessage, type InsertChatMessage, type EmotionalMetadata, type InsertEmotionalMetadata,
  type MemoryUsage, type InsertMemoryUsage
} from "../shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGoogleUser(userData: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<User>;
  updateUserTokens(id: string, accessToken: string, refreshToken?: string): Promise<User>;
  updateGoogleCalendarConnection(id: string, connected: boolean, accessToken?: string, refreshToken?: string): Promise<User>;
  
  // Notes methods
  getNotesByUserId(userId: string): Promise<Note[]>;
  createNote(note: InsertNote & { userId: string }): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
  
  // Tasks methods
  getTasksByUserId(userId: string): Promise<Task[]>;
  createTask(task: InsertTask & { userId: string }): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // User preferences methods
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences & { userId: string }): Promise<UserPreferences>;
  updateUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Chat messages methods (temporary storage)
  getChatMessagesByUserId(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage & { userId: string }): Promise<ChatMessage>;
  cleanupExpiredMessages(): Promise<void>;
  
  // Emotional metadata methods
  getEmotionalMetadata(userId: string): Promise<EmotionalMetadata[]>;
  createEmotionalMetadata(metadata: InsertEmotionalMetadata & { userId: string }): Promise<EmotionalMetadata>;
  getEmotionalMetadataByTimeRange(userId: string, startDate: Date, endDate: Date): Promise<EmotionalMetadata[]>;
  
  // Memory usage tracking methods
  getMemoryUsage(): Promise<MemoryUsage | undefined>;
  updateMemoryUsage(totalMemories: number, monthlyRetrievals?: number): Promise<MemoryUsage>;
  incrementRetrievals(): Promise<MemoryUsage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [foundUser] = await db.select().from(user).where(eq(user.id, id));
    return foundUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [foundUser] = await db.select().from(user).where(eq(user.email, username));
    return foundUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [foundUser] = await db.select().from(user).where(eq(user.email, email));
    return foundUser;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [foundUser] = await db.select().from(user).where(eq(user.googleId, googleId));
    return foundUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(user)
      .values(insertUser)
      .returning();
    return newUser;
  }

  async createGoogleUser(userData: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<User> {
    const [newUser] = await db
      .insert(user)
      .values({
        googleId: userData.googleId,
        email: userData.email,
        name: userData.name,
        image: userData.picture || null, // Changed from 'picture' to 'image'
        accessToken: userData.accessToken || null,
        refreshToken: userData.refreshToken || null,
        tokenExpiry: userData.accessToken ? new Date(Date.now() + 3600 * 1000) : null
      })
      .returning();
    return newUser;
  }

  async updateUserTokens(id: string, accessToken: string, refreshToken?: string): Promise<User> {
    const updateData: any = {
      accessToken,
      tokenExpiry: new Date(Date.now() + 3600 * 1000)
    };
    if (refreshToken) {
      updateData.refreshToken = refreshToken;
    }

    const [updatedUser] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();
    return updatedUser;
  }

  async updateGoogleCalendarConnection(id: string, connected: boolean, accessToken?: string, refreshToken?: string): Promise<User> {
    const updateData: any = {
      googleCalendarConnected: connected,
      lastCalendarSync: connected ? new Date() : null
    };
    
    if (accessToken) {
      updateData.accessToken = accessToken;
      updateData.tokenExpiry = new Date(Date.now() + 3600 * 1000);
    }
    
    if (refreshToken) {
      updateData.refreshToken = refreshToken;
    }

    const [updatedUser] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();
    return updatedUser;
  }

  // Notes operations
  async getNotesByUserId(userId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  }

  async createNote(noteData: InsertNote & { userId: string }): Promise<Note> {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  }

  async updateNote(id: string, noteData: Partial<InsertNote>): Promise<Note | undefined> {
    const [note] = await db
      .update(notes)
      .set(noteData)
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id)).returning();
    return result.length > 0;
  }

  // Tasks operations
  async getTasksByUserId(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(taskData: InsertTask & { userId: string }): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async createUserPreferences(prefsData: InsertUserPreferences & { userId: string }): Promise<UserPreferences> {
    const [prefs] = await db.insert(userPreferences).values(prefsData).returning();
    return prefs;
  }

  async updateUserPreferences(userId: string, prefsData: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .update(userPreferences)
      .set(prefsData)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return prefs;
  }

  // Chat messages operations
  async getChatMessagesByUserId(userId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId));
  }

  async createChatMessage(messageData: InsertChatMessage & { userId: string }): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }

  async cleanupExpiredMessages(): Promise<void> {
    const now = new Date();
    // Delete all messages whose expiration time is less than or equal to the current time
    await db.delete(chatMessages).where(lte(chatMessages.expiresAt, now));
  }

  async getEmotionalMetadata(userId: string): Promise<EmotionalMetadata[]> {
    return await db.select().from(emotionalMetadata).where(eq(emotionalMetadata.userId, userId));
  }

  async createEmotionalMetadata(metadataData: InsertEmotionalMetadata & { userId: string }): Promise<EmotionalMetadata> {
    const [metadata] = await db.insert(emotionalMetadata).values(metadataData).returning();
    return metadata;
  }

  async getEmotionalMetadataByTimeRange(userId: string, startDate: Date, endDate: Date): Promise<EmotionalMetadata[]> {
    return await db.select().from(emotionalMetadata)
      .where(
        and(
          eq(emotionalMetadata.userId, userId),
          gte(emotionalMetadata.createdAt, startDate),
          lte(emotionalMetadata.createdAt, endDate)
        )
      );
  }

  // Memory usage tracking methods
  async getMemoryUsage(): Promise<MemoryUsage | undefined> {
    const [usage] = await db.select().from(memoryUsage);
    return usage;
  }

  async updateMemoryUsage(totalMemories: number, monthlyRetrievals?: number): Promise<MemoryUsage> {
    const [usage] = await db.update(memoryUsage).set({ totalMemories, monthlyRetrievals, updatedAt: new Date() }).returning();
    return usage;
  }

  async incrementRetrievals(): Promise<MemoryUsage> {
    const [usage] = await db.update(memoryUsage).set({ monthlyRetrievals: sql`monthly_retrievals + 1`, updatedAt: new Date() }).returning();
    return usage;
  }
}

// Use database storage for all environments to ensure data persistence
export const storage = new DatabaseStorage();