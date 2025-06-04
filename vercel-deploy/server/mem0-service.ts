import { MemoryClient } from 'mem0ai';

export class Mem0Service {
  private client: MemoryClient | null = null;

  constructor() {
    if (process.env.MEM0_API_KEY) {
      this.client = new MemoryClient({
        apiKey: process.env.MEM0_API_KEY
      });
    }
  }

  private isEnabled(): boolean {
    return this.client !== null;
  }

  async addMemory(messages: any[], userId: string, metadata?: Record<string, any>) {
    if (!this.isEnabled()) {
      console.log('Mem0 service not available - skipping memory storage');
      return null;
    }

    try {
      const result = await this.client!.add(messages, {
        user_id: userId,
        metadata: metadata || {}
      });
      return result;
    } catch (error) {
      console.error('Failed to add memory:', error);
      return null;
    }
  }

  async getMemories(userId: string, query?: string) {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const memories = await this.client!.getAll({
        user_id: userId
      });
      return memories || [];
    } catch (error) {
      console.error('Failed to get memories:', error);
      return [];
    }
  }

  async searchMemories(query: string, userId: string) {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const results = await this.client!.search(query, {
        user_id: userId
      });
      return results || [];
    } catch (error) {
      console.error('Failed to search memories:', error);
      return [];
    }
  }
}

export const mem0Service = new Mem0Service();