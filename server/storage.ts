import { 
  users, notes, tasks, userPreferences, chatMessages, emotionalMetadata, memoryUsage,
  type User, type InsertUser, type Note, type InsertNote, 
  type Task, type InsertTask, type UserPreferences, type InsertUserPreferences,
  type ChatMessage, type InsertChatMessage, type EmotionalMetadata, type InsertEmotionalMetadata,
  type MemoryUsage, type InsertMemoryUsage
} from "../shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
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
  updateUserTokens(id: number, accessToken: string, refreshToken?: string): Promise<User>;
  updateGoogleCalendarConnection(id: number, connected: boolean, accessToken?: string, refreshToken?: string): Promise<User>;
  
  // Notes methods
  getNotesByUserId(userId: number): Promise<Note[]>;
  createNote(note: InsertNote & { userId: number }): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  
  // Tasks methods
  getTasksByUserId(userId: number): Promise<Task[]>;
  createTask(task: InsertTask & { userId: number }): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // User preferences methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences & { userId: number }): Promise<UserPreferences>;
  updateUserPreferences(userId: number, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Chat messages methods (temporary storage)
  getChatMessagesByUserId(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage & { userId: number }): Promise<ChatMessage>;
  cleanupExpiredMessages(): Promise<void>;
  
  // Emotional metadata methods
  getEmotionalMetadata(userId: number): Promise<EmotionalMetadata[]>;
  createEmotionalMetadata(metadata: InsertEmotionalMetadata & { userId: number }): Promise<EmotionalMetadata>;
  getEmotionalMetadataByTimeRange(userId: number, startDate: Date, endDate: Date): Promise<EmotionalMetadata[]>;
  
  // Memory usage tracking methods
  getMemoryUsage(): Promise<MemoryUsage | undefined>;
  updateMemoryUsage(totalMemories: number, monthlyRetrievals?: number): Promise<MemoryUsage>;
  incrementRetrievals(): Promise<MemoryUsage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createGoogleUser(userData: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        googleId: userData.googleId,
        email: userData.email,
        name: userData.name,
        picture: userData.picture || null,
        accessToken: userData.accessToken || null,
        refreshToken: userData.refreshToken || null,
        tokenExpiry: userData.accessToken ? new Date(Date.now() + 3600 * 1000) : null
      })
      .returning();
    return user;
  }

  async updateUserTokens(id: number, accessToken: string, refreshToken?: string): Promise<User> {
    const updateData: any = {
      accessToken,
      tokenExpiry: new Date(Date.now() + 3600 * 1000)
    };
    if (refreshToken) {
      updateData.refreshToken = refreshToken;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateGoogleCalendarConnection(id: number, connected: boolean, accessToken?: string, refreshToken?: string): Promise<User> {
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

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Notes operations
  async getNotesByUserId(userId: number): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  }

  async createNote(noteData: InsertNote & { userId: number }): Promise<Note> {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  }

  async updateNote(id: number, noteData: Partial<InsertNote>): Promise<Note | undefined> {
    const [note] = await db
      .update(notes)
      .set(noteData)
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tasks operations
  async getTasksByUserId(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(taskData: InsertTask & { userId: number }): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async createUserPreferences(prefsData: InsertUserPreferences & { userId: number }): Promise<UserPreferences> {
    const [prefs] = await db.insert(userPreferences).values(prefsData).returning();
    return prefs;
  }

  async updateUserPreferences(userId: number, prefsData: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .update(userPreferences)
      .set(prefsData)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return prefs;
  }

  // Chat messages operations
  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId));
  }

  async createChatMessage(messageData: InsertChatMessage & { userId: number }): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }

  async cleanupExpiredMessages(): Promise<void> {
    const now = new Date();
    await db.delete(chatMessages).where(eq(chatMessages.expiresAt, now));
  }

  async getEmotionalMetadata(userId: number): Promise<EmotionalMetadata[]> {
    return await db.select().from(emotionalMetadata).where(eq(emotionalMetadata.userId, userId));
  }

  async createEmotionalMetadata(metadataData: InsertEmotionalMetadata & { userId: number }): Promise<EmotionalMetadata> {
    const [metadata] = await db.insert(emotionalMetadata).values(metadataData).returning();
    return metadata;
  }

  async getEmotionalMetadataByTimeRange(userId: number, startDate: Date, endDate: Date): Promise<EmotionalMetadata[]> {
    return await db.select().from(emotionalMetadata)
      .where(eq(emotionalMetadata.userId, userId));
  }

  async getMemoryUsage(): Promise<MemoryUsage | undefined> {
    const [usage] = await db.select().from(memoryUsage);
    return usage;
  }

  async updateMemoryUsage(totalMemories: number, monthlyRetrievals?: number): Promise<MemoryUsage> {
    const [usage] = await db.insert(memoryUsage)
      .values({ totalMemories, monthlyRetrievals: monthlyRetrievals || 0 })
      .onConflictDoUpdate({ target: memoryUsage.id, set: { totalMemories, monthlyRetrievals: monthlyRetrievals || 0 } })
      .returning();
    return usage;
  }

  async incrementRetrievals(): Promise<MemoryUsage> {
    const [usage] = await db.select().from(memoryUsage);
    if (usage) {
      const [updated] = await db.update(memoryUsage)
        .set({ monthlyRetrievals: (usage.monthlyRetrievals || 0) + 1 })
        .where(eq(memoryUsage.id, usage.id))
        .returning();
      return updated;
    }
    return this.updateMemoryUsage(0, 1);
  }
}

// Use database storage for all environments to ensure data persistence
export const storage = new DatabaseStorage();