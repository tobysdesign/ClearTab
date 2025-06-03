import { MemoryClient } from 'mem0ai';

export class Mem0Service {
  private client: MemoryClient;

  constructor() {
    if (!process.env.MEM0_API_KEY) {
      throw new Error('MEM0_API_KEY environment variable is required');
    }
    
    this.client = new MemoryClient({
      apiKey: process.env.MEM0_API_KEY,
    });
  }

  async addMemory(messages: any[], userId: string, metadata?: Record<string, any>) {
    try {
      const result = await this.client.add(messages, {
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
    try {
      const result = await this.client.getAll({
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
    try {
      const result = await this.client.search(query, {
        user_id: userId
      });
      return result;
    } catch (error) {
      console.error('Mem0 search memories error:', error);
      throw error;
    }
  }

  async deleteMemory(memoryId: string) {
    try {
      const result = await this.client.delete(memoryId);
      return result;
    } catch (error) {
      console.error('Mem0 delete memory error:', error);
      throw error;
    }
  }

  async updateMemory(memoryId: string, data: string) {
    try {
      const result = await this.client.update(memoryId, data);
      return result;
    } catch (error) {
      console.error('Mem0 update memory error:', error);
      throw error;
    }
  }
}

export const mem0Service = new Mem0Service();