import { 
  users, notes, tasks, userPreferences, chatMessages,
  type User, type UpsertUser, type Note, type InsertNote, 
  type Task, type InsertTask, type UserPreferences, type InsertUserPreferences,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Notes methods
  getNotesByUserId(userId: string): Promise<Note[]>;
  createNote(note: InsertNote & { userId: string }): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  
  // Tasks methods
  getTasksByUserId(userId: string): Promise<Task[]>;
  createTask(task: InsertTask & { userId: string }): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // User preferences methods
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences & { userId: string }): Promise<UserPreferences>;
  updateUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Chat messages methods
  getChatMessagesByUserId(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage & { userId: string }): Promise<ChatMessage>;
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
    
    // Create default user for demo
    this.createUser({ username: "demo", password: "demo" });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getNotesByUserId(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }

  async createNote(noteData: InsertNote & { userId: number }): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = { 
      ...noteData, 
      id, 
      tags: noteData.tags || null,
      createdAt: new Date()
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: number, noteData: Partial<InsertNote>): Promise<Note | undefined> {
    const existing = this.notes.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...noteData };
    this.notes.set(id, updated);
    return updated;
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
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...taskData };
    this.tasks.set(id, updated);
    return updated;
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
      agentName: prefsData.agentName || "Alex",
      userName: prefsData.userName || "User",
      initialized: prefsData.initialized || false,
      paydayDate: prefsData.paydayDate || null,
      paydayFrequency: prefsData.paydayFrequency || "bi-weekly",
      location: prefsData.location || null
    };
    this.userPreferences.set(id, prefs);
    return prefs;
  }

  async updateUserPreferences(userId: number, prefsData: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const existing = Array.from(this.userPreferences.values()).find(prefs => prefs.userId === userId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...prefsData };
    this.userPreferences.set(existing.id, updated);
    return updated;
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
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Notes operations
  async getNotesByUserId(userId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  }

  async createNote(noteData: InsertNote & { userId: string }): Promise<Note> {
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
    return result.rowCount > 0;
  }

  // Tasks operations
  async getTasksByUserId(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(taskData: InsertTask & { userId: string }): Promise<Task> {
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
    return result.rowCount > 0;
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
}

export const storage = new DatabaseStorage();
