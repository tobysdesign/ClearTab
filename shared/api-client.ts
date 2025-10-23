// Shared API client for both web app and Chrome extension
import { createClient } from '@supabase/supabase-js'

export interface ApiConfig {
  supabaseUrl: string
  supabaseKey: string
  isExtension?: boolean
}

export interface Note {
  id: string
  title: string
  content: any // Quill Delta format
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  allDay: boolean
  userId: string
}

export class SharedApiClient {
  private supabase
  private isExtension: boolean

  constructor(config: ApiConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.isExtension = config.isExtension || false
  }

  // Auth methods
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    return { user, error }
  }

  async signInWithGoogle() {
    if (this.isExtension) {
      // Use Chrome identity API for extension
      return this.extensionGoogleAuth()
    } else {
      // Regular OAuth flow for web
      return this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
    }
  }

  private async extensionGoogleAuth() {
    // Extension-specific Google auth using Chrome identity API
    if (typeof chrome !== 'undefined' && chrome.identity) {
      return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            // Exchange token with Supabase
            resolve({ data: { session: { access_token: token } }, error: null })
          }
        })
      })
    }
    throw new Error('Chrome identity API not available')
  }

  async signOut() {
    if (this.isExtension && typeof chrome !== 'undefined' && chrome.identity) {
      // Clear Chrome identity token
      chrome.identity.clearAllCachedAuthTokens(() => {})
    }
    return this.supabase.auth.signOut()
  }

  // Notes methods
  async getNotes(userId: string): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const { data, error } = await this.supabase
      .from('notes')
      .insert({
        title: note.title,
        content: note.content,
        user_id: note.userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
    const { data, error } = await this.supabase
      .from('notes')
      .update({
        title: updates.title,
        content: updates.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error
  }

  // Tasks methods
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        completed: task.completed,
        due_date: task.dueDate,
        priority: task.priority,
        user_id: task.userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        completed: updates.completed,
        due_date: updates.dueDate,
        priority: updates.priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
  }

  // Calendar methods
  async getCalendarEvents(userId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    let query = this.supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)

    if (startDate) {
      query = query.gte('start_time', startDate)
    }
    if (endDate) {
      query = query.lte('end_time', endDate)
    }

    const { data, error } = await query.order('start_time', { ascending: true })

    if (error) throw error
    return data || []
  }

  async createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .insert({
        title: event.title,
        description: event.description,
        start_time: event.startTime,
        end_time: event.endTime,
        all_day: event.allDay,
        user_id: event.userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Settings methods
  async getUserSettings(userId: string) {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // Ignore "not found" errors
    return data
  }

  async updateUserSettings(userId: string, settings: any) {
    const { data, error } = await this.supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Real-time subscriptions (for web app)
  subscribeToNotes(userId: string, callback: (payload: any) => void) {
    if (this.isExtension) {
      // Extensions can't use real-time subscriptions, use polling instead
      return null
    }

    return this.supabase
      .channel('notes-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notes',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }

  subscribeToTasks(userId: string, callback: (payload: any) => void) {
    if (this.isExtension) {
      return null
    }

    return this.supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }

  // Health check
  async ping() {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('count', { count: 'exact', head: true })
        .limit(1)
      
      return !error
    } catch {
      return false
    }
  }
}

// Factory function for creating API client
export function createApiClient(config: ApiConfig): SharedApiClient {
  return new SharedApiClient(config)
}

// Environment-specific clients
export function createWebApiClient(): SharedApiClient {
  return createApiClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    isExtension: false
  })
}

export function createExtensionApiClient(): SharedApiClient {
  // Extension will get these from manifest or environment
  return createApiClient({
    supabaseUrl: 'YOUR_SUPABASE_URL', // Will be replaced in extension build
    supabaseKey: 'YOUR_SUPABASE_KEY', // Will be replaced in extension build
    isExtension: true
  })
}