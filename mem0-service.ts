import { MemoryClient } from 'mem0ai';

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
    }
  }

  private async initializeMemoryCount() {
    try {
      // Get current memory count from Mem0
      const memories = await this.client!.getAll({ limit: 1 });
      // Note: This is a rough estimate as we can't get exact count easily
      this.memoryCount = 0; // Start fresh tracking
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
      console.log('Memory limit reached, cleaning up old memories...');
      // Get oldest memories and delete some to make room
      const oldMemories = await this.client!.getAll({ limit: 50 });
      if (oldMemories && oldMemories.length > 0) {
        // Delete oldest 10% to make room
        const toDelete = Math.min(50, Math.floor(this.MAX_MEMORIES * 0.1));
        for (let i = 0; i < toDelete && i < oldMemories.length; i++) {
          await this.client!.delete(oldMemories[i].id);
          this.memoryCount--;
        }
        console.log(`Cleaned up ${toDelete} old memories`);
      }
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
    
    try {
      const result = await this.client!.getAll({
        user_id: userId,
        ...(query && { query })
      });
      return result;
    } catch (error) {
      console.error('Mem0 get memories error:', error);
      throw error;
    }
  }

  async searchMemories(query: string, userId: string) {
    if (!this.isEnabled()) {
      console.warn('Mem0 service not enabled, returning empty search results');
      return [];
    }
    
    try {
      const result = await this.client!.search(query, {
        user_id: userId
      });
      return result;
    } catch (error) {
      console.error('Mem0 search memories error:', error);
      throw error;
    }
  }

  async deleteMemory(memoryId: string) {
    if (!this.isEnabled()) {
      console.warn('Mem0 service not enabled, skipping memory deletion');
      return null;
    }
    
    try {
      const result = await this.client!.delete(memoryId);
      return result;
    } catch (error) {
      console.error('Mem0 delete memory error:', error);
      throw error;
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
      throw error;
    }
  }
}

export const mem0Service = new Mem0Service();