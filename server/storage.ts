import { 
  users, notes, tasks, userPreferences, chatMessages, emotionalMetadata, memoryUsage,
  type User, type InsertUser, type Note, type InsertNote, 
  type Task, type InsertTask, type UserPreferences, type InsertUserPreferences,
  type ChatMessage, type InsertChatMessage, type EmotionalMetadata, type InsertEmotionalMetadata,
  type MemoryUsage, type InsertMemoryUsage
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notes: Map<number, Note>;
  private tasks: Map<number, Task>;
  private userPreferences: Map<number, UserPreferences>;
  private chatMessages: Map<number, ChatMessage>;
  private memoryUsageData: MemoryUsage;
  private emotionalMetadataMap: Map<number, EmotionalMetadata>;
  private currentUserId: number;
  private currentNoteId: number;
  private currentTaskId: number;
  private currentPrefsId: number;
  private currentMessageId: number;
  private currentEmotionalId: number;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.tasks = new Map();
    this.userPreferences = new Map();
    this.chatMessages = new Map();
    this.emotionalMetadataMap = new Map();
    this.currentUserId = 1;
    this.currentNoteId = 1;
    this.currentTaskId = 1;
    this.currentPrefsId = 1;
    this.currentMessageId = 1;
    this.currentEmotionalId = 1;
    this.memoryUsageData = {
      id: 1,
      totalMemories: 0,
      monthlyRetrievals: 0,
      lastRetrievalReset: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create two dummy users for testing
    const user1: User = {
      id: 1,
      googleId: null,
      email: "user@example.com",
      password: null,
      name: "Demo User",
      picture: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      googleCalendarConnected: false,
      lastCalendarSync: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const user2: User = {
      id: 2,
      googleId: null,
      email: "bob@example.com",
      password: null,
      name: "Bob Smith",
      picture: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      googleCalendarConnected: false,
      lastCalendarSync: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(1, user1);
    this.users.set(2, user2);
    this.currentUserId = 3;
    
    // Add sample notes for Alice
    const note1: Note = {
      id: 1,
      userId: 1,
      title: "Project Planning Meeting",
      content: "Discussed Q2 roadmap and resource allocation. Need to follow up on budget approval.",
    };
    
    const note2: Note = {
      id: 2,
      userId: 1,
      title: "Weekend Trip Ideas",
      content: "Considering hiking in Yosemite or visiting San Francisco museums. Check weather forecast.",
    };
    
    // Add default empty note for quick entry
    const note3: Note = {
      id: 3,
      userId: 1,
      title: "",
      content: "",
    };
    
    this.notes.set(1, note1);
    this.notes.set(2, note2);
    this.notes.set(3, note3);
    this.currentNoteId = 4;
    
    // Add sample tasks for Alice
    const task1: Task = {
      id: 1,
      userId: 1,
      title: "Review design mockups",
      description: "Check the latest UI designs from the design team",
      priority: "high",
      completed: false,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };
    
    const task2: Task = {
      id: 2,
      userId: 1,
      title: "Book dentist appointment",
      description: "Schedule routine cleaning",
      priority: "medium",
      completed: false,
      dueDate: null,
      createdAt: new Date()
    };
    
    this.tasks.set(1, task1);
    this.tasks.set(2, task2);
    this.currentTaskId = 3;
    
    // Add user preferences for Alice
    const prefs1: UserPreferences = {
      id: 1,
      userId: 1,
      agentName: "t0by",
      userName: "User",
      initialized: true,
      paydayDate: new Date(2025, 0, 15), // January 15th
      paydayFrequency: "monthly",
      salary: 5000,
      expenses: 2000,
      location: "San Francisco, CA"
    };
    
    this.userPreferences.set(1, prefs1);
    this.currentPrefsId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.googleId === googleId) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      googleId: null,
      picture: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      googleCalendarConnected: false,
      lastCalendarSync: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
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
    const id = this.currentUserId++;
    const user: User = {
      id,
      password: null,
      googleId: userData.googleId,
      email: userData.email,
      name: userData.name,
      picture: userData.picture || null,
      accessToken: userData.accessToken || null,
      refreshToken: userData.refreshToken || null,
      tokenExpiry: userData.accessToken ? new Date(Date.now() + 3600 * 1000) : null,
      googleCalendarConnected: userData.accessToken ? true : false,
      lastCalendarSync: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTokens(id: number, accessToken: string, refreshToken?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser: User = {
      ...user,
      accessToken,
      refreshToken: refreshToken || user.refreshToken,
      tokenExpiry: new Date(Date.now() + 3600 * 1000)
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateGoogleCalendarConnection(id: number, connected: boolean, accessToken?: string, refreshToken?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser: User = {
      ...user,
      googleCalendarConnected: connected,
      accessToken: accessToken || user.accessToken,
      refreshToken: refreshToken || user.refreshToken,
      tokenExpiry: accessToken ? new Date(Date.now() + 3600 * 1000) : user.tokenExpiry,
      lastCalendarSync: connected ? new Date() : user.lastCalendarSync
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getNotesByUserId(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }

  async createNote(noteData: InsertNote & { userId: number }): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = { 
      ...noteData, 
      id
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: number, noteData: Partial<InsertNote>): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote) return undefined;
    
    const updatedNote = { ...existingNote, ...noteData };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  async createTask(taskData: InsertTask & { userId: number }): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { 
      id,
      userId: taskData.userId,
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority || "medium",
      completed: taskData.completed || false,
      dueDate: taskData.dueDate || null,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(prefs => prefs.userId === userId);
  }

  async createUserPreferences(prefsData: InsertUserPreferences & { userId: number }): Promise<UserPreferences> {
    const id = this.currentPrefsId++;
    const prefs: UserPreferences = { 
      id,
      userId: prefsData.userId,
      agentName: prefsData.agentName || "AI Assistant",
      userName: prefsData.userName || "User",
      initialized: prefsData.initialized || false,
      paydayDate: prefsData.paydayDate || null,
      paydayFrequency: prefsData.paydayFrequency || null,
      salary: prefsData.salary || null,
      expenses: prefsData.expenses || null,
      location: prefsData.location || null
    };
    this.userPreferences.set(id, prefs);
    return prefs;
  }

  async updateUserPreferences(userId: number, prefsData: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const existingPrefs = Array.from(this.userPreferences.values()).find(prefs => prefs.userId === userId);
    if (!existingPrefs) return undefined;
    
    const updatedPrefs = { ...existingPrefs, ...prefsData };
    this.userPreferences.set(existingPrefs.id, updatedPrefs);
    return updatedPrefs;
  }

  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(message => message.userId === userId);
  }

  async createChatMessage(messageData: InsertChatMessage & { userId: number }): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = { 
      ...messageData, 
      id, 
      createdAt: new Date(),
      sessionId: null
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async cleanupExpiredMessages(): Promise<void> {
    const now = new Date();
    for (const [id, message] of this.chatMessages) {
      if (message.expiresAt && message.expiresAt < now) {
        this.chatMessages.delete(id);
      }
    }
  }

  async getEmotionalMetadata(userId: number): Promise<EmotionalMetadata[]> {
    return Array.from(this.emotionalMetadataMap.values())
      .filter(metadata => metadata.userId === userId);
  }

  async createEmotionalMetadata(metadataData: InsertEmotionalMetadata & { userId: number }): Promise<EmotionalMetadata> {
    this.currentEmotionalId++;
    const metadata: EmotionalMetadata = {
      id: this.currentEmotionalId,
      createdAt: new Date(),
      sourceId: null,
      insights: null,
      suggestedActions: null,
      mem0MemoryId: null,
      ...metadataData
    };
    this.emotionalMetadataMap.set(this.currentEmotionalId, metadata);
    return metadata;
  }

  async getEmotionalMetadataByTimeRange(userId: number, startDate: Date, endDate: Date): Promise<EmotionalMetadata[]> {
    return Array.from(this.emotionalMetadataMap.values())
      .filter(metadata => 
        metadata.userId === userId &&
        metadata.createdAt >= startDate &&
        metadata.createdAt <= endDate
      );
  }

  async getMemoryUsage(): Promise<MemoryUsage | undefined> {
    return this.memoryUsageData;
  }

  async updateMemoryUsage(totalMemories: number, monthlyRetrievals?: number): Promise<MemoryUsage> {
    this.memoryUsageData = {
      ...this.memoryUsageData,
      totalMemories,
      monthlyRetrievals: monthlyRetrievals ?? this.memoryUsageData.monthlyRetrievals,
      updatedAt: new Date()
    };
    return this.memoryUsageData;
  }

  async incrementRetrievals(): Promise<MemoryUsage> {
    this.memoryUsageData = {
      ...this.memoryUsageData,
      monthlyRetrievals: this.memoryUsageData.monthlyRetrievals + 1,
      updatedAt: new Date()
    };
    return this.memoryUsageData;
  }
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
      .where(eq(emotionalMetadata.userId, userId))
      .where(eq(emotionalMetadata.createdAt, startDate))
      .where(eq(emotionalMetadata.createdAt, endDate));
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
        .set({ monthlyRetrievals: usage.monthlyRetrievals + 1 })
        .where(eq(memoryUsage.id, usage.id))
        .returning();
      return updated;
    }
    return this.updateMemoryUsage(0, 1);
  }
}

// Use database storage for production
export const storage = process.env.NODE_ENV === 'production' ? new DatabaseStorage() : new MemStorage();