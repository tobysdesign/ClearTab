import { 
  users, notes, tasks, userPreferences, chatMessages,
  type User, type InsertUser, type Note, type InsertNote, 
  type Task, type InsertTask, type UserPreferences, type InsertUserPreferences,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  
  // Chat messages methods
  getChatMessagesByUserId(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage & { userId: number }): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notes: Map<number, Note>;
  private tasks: Map<number, Task>;
  private userPreferences: Map<number, UserPreferences>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentNoteId: number;
  private currentTaskId: number;
  private currentPrefsId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.tasks = new Map();
    this.userPreferences = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentNoteId = 1;
    this.currentTaskId = 1;
    this.currentPrefsId = 1;
    this.currentMessageId = 1;

    // Create a default user for testing
    const defaultUser: User = {
      id: 1,
      googleId: null,
      email: "demo@example.com",
      name: "Demo User",
      picture: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      createdAt: new Date()
    };
    this.users.set(1, defaultUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
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
      createdAt: new Date()
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
      googleId: userData.googleId,
      email: userData.email,
      name: userData.name,
      picture: userData.picture || null,
      accessToken: userData.accessToken || null,
      refreshToken: userData.refreshToken || null,
      tokenExpiry: userData.accessToken ? new Date(Date.now() + 3600 * 1000) : null,
      createdAt: new Date()
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

  async getNotesByUserId(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }

  async createNote(noteData: InsertNote & { userId: number }): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = { 
      ...noteData, 
      id, 
      createdAt: new Date() 
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
      ...taskData, 
      id, 
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
      ...prefsData, 
      id,
      userId: prefsData.userId
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
      createdAt: new Date() 
    };
    this.chatMessages.set(id, message);
    return message;
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
}

// Use database storage for production
export const storage = process.env.NODE_ENV === 'production' ? new DatabaseStorage() : new MemStorage();