import { 
  users, notes, tasks, userPreferences, chatMessages,
  type User, type InsertUser, type Note, type InsertNote, 
  type Task, type InsertTask, type UserPreferences, type InsertUserPreferences,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
      username: "demo",
      password: "password"
    };
    this.users.set(1, defaultUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
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

export const storage = new MemStorage();