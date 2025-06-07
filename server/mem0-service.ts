import { MemoryClient } from 'mem0ai';
import { webcrypto } from 'crypto';

export class Mem0Service {
  private client: MemoryClient | null = null;
  private memoryCount: number = 0;
  private monthlyRetrievals: number = 0;
  private lastRetrievalReset: Date = new Date();
  private readonly MAX_MEMORIES = 500;
  private readonly MAX_MONTHLY_RETRIEVALS = 1000;

  constructor() {
    try {
      if (process.env.MEM0_API_KEY) {
        // Handle browser-specific code in mem0ai v1.0.39
        if (typeof window === 'undefined') {
          global.window = {} as any;
          global.document = {} as any;
          // Add crypto polyfill for Node.js
          if (!global.window.crypto) {
            global.window.crypto = webcrypto as any;
          }
        }
        
        this.client = new MemoryClient({
          apiKey: process.env.MEM0_API_KEY,
        });
        console.log('Mem0 cloud service initialized (max 500 memories, 1000 retrievals/month)');
        this.initializeMemoryCount();
      } else {
        console.warn('MEM0_API_KEY not found, memory features will be disabled');
      }
    } catch (error) {
      console.error('Failed to initialize Mem0 client:', error);
      // Disable client if initialization fails
      this.client = null;
    }
  }

  private async initializeMemoryCount() {
    try {
      // In v1.0.39, we can't get all memories without a user_id filter
      // So we'll start with fresh tracking
      this.memoryCount = 0;
      console.log(`Memory tracking initialized: ${this.memoryCount}/${this.MAX_MEMORIES} memories`);
    } catch (error) {
      console.error('Failed to initialize memory count:', error);
    }
  }

  private isEnabled(): boolean {
    return this.client !== null;
  }

  private checkMemoryLimit(): boolean {
    return this.memoryCount < this.MAX_MEMORIES;
  }

  private checkRetrievalLimit(): boolean {
    // Reset monthly counter if needed
    const now = new Date();
    const monthsDiff = (now.getFullYear() - this.lastRetrievalReset.getFullYear()) * 12 + 
                      (now.getMonth() - this.lastRetrievalReset.getMonth());
    
    if (monthsDiff >= 1) {
      this.monthlyRetrievals = 0;
      this.lastRetrievalReset = now;
    }
    
    return this.monthlyRetrievals < this.MAX_MONTHLY_RETRIEVALS;
  }

  private async cleanupOldMemories() {
    if (!this.isEnabled()) return;
    
    try {
      console.log('Memory limit reached, but cleanup requires user_id in v1.0.39');
      // In v1.0.39, we can't cleanup without knowing specific user_id
      // For now, we'll just reduce our memory count tracking
      this.memoryCount = Math.max(0, this.memoryCount - Math.floor(this.MAX_MEMORIES * 0.1));
      console.log(`Adjusted memory count tracking to ${this.memoryCount}`);
    } catch (error) {
      console.error('Failed to cleanup old memories:', error);
    }
  }

  async addMemory(messages: any[], userId: string, metadata?: Record<string, any>) {
    if (!this.isEnabled()) {
      console.warn('Mem0 service not enabled, skipping memory addition');
      return null;
    }
    
    // Check memory limit before adding
    if (!this.checkMemoryLimit()) {
      console.warn(`Memory limit reached (${this.memoryCount}/${this.MAX_MEMORIES}), cleaning up old memories`);
      await this.cleanupOldMemories();
      
      // Check again after cleanup
      if (!this.checkMemoryLimit()) {
        console.warn('Still at memory limit after cleanup, skipping memory addition');
        return null;
      }
    }
    
    try {
      const result = await this.client!.add(messages, {
        user_id: userId,
        metadata: metadata || {}
      });
      
      if (result) {
        this.memoryCount++;
        console.log(`Memory added. Current count: ${this.memoryCount}/${this.MAX_MEMORIES}`);
      }
      
      return result;
    } catch (error) {
      console.error('Mem0 add memory error:', error);
      throw error;
    }
  }

  async getMemories(userId: string, query?: string) {
    if (!this.isEnabled()) {
      console.warn('Mem0 service not enabled, returning empty memories');
      return [];
    }
    
    if (!this.checkRetrievalLimit()) {
      console.warn('Monthly retrieval limit reached, returning empty memories');
      return [];
    }
    
    try {
      const result = await this.client!.getAll({
        user_id: userId,
        ...(query && { query })
      });
      this.monthlyRetrievals++;
      return result || [];
    } catch (error) {
      console.error('Mem0 get memories error:', error);
      return [];
    }
  }

  async searchMemories(query: string, userId: string) {
    if (!this.isEnabled()) {
      console.warn('Mem0 service not enabled, returning empty search results');
      return [];
    }
    
    if (!this.checkRetrievalLimit()) {
      console.warn('Monthly retrieval limit reached, returning empty search results');
      return [];
    }
    
    try {
      const result = await this.client!.search(query, {
        user_id: userId
      });
      this.monthlyRetrievals++;
      return result || [];
    } catch (error) {
      console.error('Mem0 search memories error:', error);
      return [];
    }
  }

  async deleteMemory(memoryId: string) {
    if (!this.isEnabled()) {
      console.warn('Mem0 service not enabled, skipping memory deletion');
      return null;
    }
    
    try {
      const result = await this.client!.delete(memoryId);
      if (result) {
        this.memoryCount = Math.max(0, this.memoryCount - 1);
        console.log(`Memory deleted. Current count: ${this.memoryCount}/${this.MAX_MEMORIES}`);
      }
      return result;
    } catch (error) {
      console.error('Mem0 delete memory error:', error);
      return null;
    }
  }

  async updateMemory(memoryId: string, data: string) {
    if (!this.isEnabled()) {
      console.warn('Mem0 service not enabled, skipping memory update');
      return null;
    }
    
    try {
      const result = await this.client!.update(memoryId, data);
      return result;
    } catch (error) {
      console.error('Mem0 update memory error:', error);
      return null;
    }
  }
}

export const mem0Service = new Mem0Service();