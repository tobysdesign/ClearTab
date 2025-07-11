// @ts-nocheck
import { 
  notes, tasks, userPreferences, chatMessages, emotionalMetadata, memoryUsage,
  type User, type InsertUser, type Note, type InsertNote, 
  type Task, type InsertTask, type UserPreferences, type InsertUserPreferences,
  type ChatMessage, type InsertChatMessage, type EmotionalMetadata, type InsertEmotionalMetadata,
  type MemoryUsage, type InsertMemoryUsage, type Memory
} from "../shared/schema";
import { IStorage } from "./storage";
import { Note, Task } from '../shared/types';

interface MemoryStore {
  notes: Map<string, Note>;
  tasks: Map<string, Task>;
}

class MemoryStorage {
  private store: MemoryStore = {
    notes: new Map(),
    tasks: new Map()
  };

  // Notes
  async getNotes(): Promise<Note[]> {
    return Array.from(this.store.notes.values());
  }

  async getNote(id: string): Promise<Note | null> {
    return this.store.notes.get(id) || null;
  }

  async createNote(note: Note): Promise<Note> {
    this.store.notes.set(note.id, note);
    return note;
  }

  async updateNote(id: string, note: Partial<Note>): Promise<Note | null> {
    const existingNote = this.store.notes.get(id);
    if (!existingNote) return null;

    const updatedNote = { ...existingNote, ...note };
    this.store.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.store.notes.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.store.tasks.values());
  }

  async getTask(id: string): Promise<Task | null> {
    return this.store.tasks.get(id) || null;
  }

  async createTask(task: Task): Promise<Task> {
    this.store.tasks.set(task.id, task);
    return task;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task | null> {
    const existingTask = this.store.tasks.get(id);
    if (!existingTask) return null;

    const updatedTask = { ...existingTask, ...task };
    this.store.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.store.tasks.delete(id);
  }
}

export const memoryStorage = new MemoryStorage();

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notes: Map<number, Note>;
  private tasks: Map<number, Task>;
  private userPreferences: Map<number, UserPreferences>;
  private chatMessages: Map<number, ChatMessage>;
  private emotionalMetadata: Map<number, EmotionalMetadata>;
  private memoryUsage: MemoryUsage | null;
  private memories: Map<number, Memory>;
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
    this.emotionalMetadata = new Map();
    this.memoryUsage = null;
    this.memories = new Map();
    this.currentUserId = 1;
    this.currentNoteId = 1;
    this.currentTaskId = 1;
    this.currentPrefsId = 1;
    this.currentMessageId = 1;
    this.currentEmotionalId = 1;

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
      updatedAt: new Date(),
      emailVerified: null
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
      updatedAt: new Date(),
      emailVerified: null
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
      id,
      email: insertUser.email,
      name: insertUser.name,
      password: insertUser.password || null,
      googleId: null,
      picture: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      googleCalendarConnected: false,
      lastCalendarSync: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null
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
      password: null,
      accessToken: userData.accessToken || null,
      refreshToken: userData.refreshToken || null,
      tokenExpiry: null, // Should be set based on token expiry
      googleCalendarConnected: !!(userData.accessToken && userData.refreshToken),
      lastCalendarSync: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTokens(id: number, accessToken: string, refreshToken?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    user.accessToken = accessToken;
    if (refreshToken) user.refreshToken = refreshToken;
    user.updatedAt = new Date();
    return user;
  }

  async updateGoogleCalendarConnection(id: number, connected: boolean, accessToken?: string, refreshToken?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    user.googleCalendarConnected = connected;
    if (accessToken) user.accessToken = accessToken;
    if (refreshToken) user.refreshToken = refreshToken;
    if (!connected) {
      user.accessToken = null;
      user.refreshToken = null;
      user.lastCalendarSync = null;
    }
    user.updatedAt = new Date();
    return user;
  }

  async getNotesByUserId(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }

  async createNote(noteData: InsertNote & { userId: number }): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = { id, ...noteData };
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
    return this.userPreferences.get(userId);
  }

  async createUserPreferences(prefsData: InsertUserPreferences & { userId: number }): Promise<UserPreferences> {
    const id = this.currentPrefsId++;
    const prefs: UserPreferences = {
      id,
      userId: prefsData.userId,
      agentName: prefsData.agentName || "t0by",
      userName: prefsData.userName || "User",
      initialized: prefsData.initialized || false,
      paydayDate: prefsData.paydayDate || null,
      paydayFrequency: prefsData.paydayFrequency || "monthly",
      salary: prefsData.salary || 0,
      expenses: prefsData.expenses || 0,
      location: prefsData.location || "San Francisco, CA"
    };
    this.userPreferences.set(prefs.userId, prefs);
    return prefs;
  }

  async updateUserPreferences(userId: number, prefsData: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const existingPrefs = this.userPreferences.get(userId);
    if (!existingPrefs) return undefined;
    const updatedPrefs = { ...existingPrefs, ...prefsData };
    this.userPreferences.set(userId, updatedPrefs);
    return updatedPrefs;
  }

  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(msg => msg.userId === userId);
  }

  async createChatMessage(messageData: InsertChatMessage & { userId: number }): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = { id, ...messageData, createdAt: new Date() };
    this.chatMessages.set(id, message);
    return message;
  }

  async cleanupExpiredMessages(): Promise<void> {
    const now = Date.now();
    for (const [id, message] of this.chatMessages.entries()) {
      if (now - message.createdAt.getTime() > 24 * 60 * 60 * 1000) { // 24 hours
        this.chatMessages.delete(id);
      }
    }
  }

  async getEmotionalMetadata(userId: number): Promise<EmotionalMetadata[]> {
    return Array.from(this.emotionalMetadata.values()).filter(
      (metadata) => metadata.userId === userId,
    );
  }

  async createEmotionalMetadata(metadataData: InsertEmotionalMetadata & { userId: number }): Promise<EmotionalMetadata> {
    const id = this.currentEmotionalId++;
    const metadata: EmotionalMetadata = {
      id,
      ...metadataData,
      createdAt: new Date(),
    };
    this.emotionalMetadata.set(id, metadata);
    return metadata;
  }

  async getEmotionalMetadataByTimeRange(userId: number, startDate: Date, endDate: Date): Promise<EmotionalMetadata[]> {
    return Array.from(this.emotionalMetadata.values()).filter(
      (metadata) =>
        metadata.userId === userId &&
        metadata.createdAt >= startDate &&
        metadata.createdAt <= endDate,
    );
  }

  async getMemoryUsage(): Promise<MemoryUsage | undefined> {
    return this.memoryUsage;
  }

  async updateMemoryUsage(totalMemories: number, monthlyRetrievals?: number): Promise<MemoryUsage> {
    if (!this.memoryUsage) {
      throw new Error("Memory usage data not initialized");
    }
    this.memoryUsage.totalMemories = totalMemories;
    if (monthlyRetrievals) {
      this.memoryUsage.monthlyRetrievals = monthlyRetrievals;
    }
    this.memoryUsage.updatedAt = new Date();
    return this.memoryUsage;
  }

  async incrementRetrievals(): Promise<MemoryUsage> {
    if (!this.memoryUsage) {
      throw new Error("Memory usage data not initialized");
    }
    const now = new Date();
    if (now.getMonth() !== this.memoryUsage.lastRetrievalReset.getMonth()) {
      this.memoryUsage.monthlyRetrievals = 0;
      this.memoryUsage.lastRetrievalReset = now;
    }
    this.memoryUsage.monthlyRetrievals++;
    this.memoryUsage.updatedAt = new Date();
    return this.memoryUsage;
  }

  public async initUsers() {
    // Create two dummy users for testing
    const user1: User = {
      id: 1,
      email: 'user@example.com',
      name: "Demo User",
      password: null,
      googleId: null,
      picture: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      googleCalendarConnected: false,
      lastCalendarSync: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null
    };
    const user2: User = {
      id: 2,
      email: 'test@example.com',
      name: "Bob Smith",
      password: null,
      googleId: null,
      picture: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      googleCalendarConnected: false,
      lastCalendarSync: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null
    };
    this.users.set(1, user1);
    this.users.set(2, user2);
  }

  public async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  public async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  public async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.googleId === googleId) {
        return user;
      }
    }
    return undefined;
  }

  public async createUser(data: Partial<User>): Promise<User> {
    const id = this.users.size + 1;
    const user: User = {
      id,
      name: data.name || 'New User',
      email: data.email!,
      password: data.password || null,
      googleId: data.googleId || null,
      picture: data.picture || null,
      accessToken: data.accessToken || null,
      refreshToken: data.refreshToken || null,
      tokenExpiry: data.tokenExpiry || null,
      googleCalendarConnected: !!(data.accessToken && data.refreshToken),
      lastCalendarSync: data.lastCalendarSync || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null
    };
    this.users.set(id, user);
    return user;
  }

  public async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...data };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
} 