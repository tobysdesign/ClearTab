import { MemoryClient } from 'mem0ai';

export class Mem0Service {
  private client: MemoryClient | null = null;

  constructor() {
    try {
      if (process.env.MEM0_API_KEY) {
        this.client = new MemoryClient({
          apiKey: process.env.MEM0_API_KEY,
        });
        console.log('Mem0 cloud service initialized');
      } else {
        console.warn('MEM0_API_KEY not found, memory features will be disabled');
      }
    } catch (error) {
      console.error('Failed to initialize Mem0 client:', error);
    }
  }

  private isEnabled(): boolean {
    return this.client !== null;
  }

  async addMemory(messages: any[], userId: string, metadata?: Record<string, any>) {
    if (!this.isEnabled()) {
      console.warn('Mem0 service not enabled, skipping memory addition');
      return null;
    }
    
    try {
      const result = await this.client!.add(messages, {
        user_id: userId,
        metadata: metadata || {}
      });
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