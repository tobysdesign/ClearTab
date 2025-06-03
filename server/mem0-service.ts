interface Memory {
  id: string;
  content: string;
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class Mem0Service {
  private memories: Map<string, Memory> = new Map();
  private userMemories: Map<string, string[]> = new Map();

  constructor() {
    console.log('Memory service initialized with in-memory storage');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private isEnabled(): boolean {
    return true; // Always enabled for in-memory storage
  }

  async addMemory(messages: any[], userId: string, metadata?: Record<string, any>) {
    try {
      // Extract meaningful content from messages
      const content = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      
      const memory: Memory = {
        id: this.generateId(),
        content,
        userId,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
      };

      this.memories.set(memory.id, memory);
      
      // Update user memory index
      if (!this.userMemories.has(userId)) {
        this.userMemories.set(userId, []);
      }
      this.userMemories.get(userId)!.push(memory.id);

      return { id: memory.id, memory: content };
    } catch (error) {
      console.error('Memory add error:', error);
      return null;
    }
  }

  async getMemories(userId: string, query?: string) {
    try {
      const userMemoryIds = this.userMemories.get(userId) || [];
      const memories = userMemoryIds
        .map(id => this.memories.get(id))
        .filter((mem): mem is Memory => mem !== undefined);

      if (query) {
        // Simple text search
        return memories
          .filter(mem => mem.content.toLowerCase().includes(query.toLowerCase()))
          .map(mem => ({ id: mem.id, memory: mem.content, created_at: mem.timestamp }));
      }

      return memories.map(mem => ({ 
        id: mem.id, 
        memory: mem.content, 
        created_at: mem.timestamp 
      }));
    } catch (error) {
      console.error('Memory get error:', error);
      return [];
    }
  }

  async searchMemories(query: string, userId: string) {
    try {
      const userMemoryIds = this.userMemories.get(userId) || [];
      const memories = userMemoryIds
        .map(id => this.memories.get(id))
        .filter((mem): mem is Memory => mem !== undefined);

      // Simple relevance search based on keyword matching
      const searchTerms = query.toLowerCase().split(' ');
      const relevantMemories = memories
        .filter(mem => {
          const content = mem.content.toLowerCase();
          return searchTerms.some(term => content.includes(term));
        })
        .sort((a, b) => {
          // Sort by relevance (number of matching terms)
          const aMatches = searchTerms.filter(term => a.content.toLowerCase().includes(term)).length;
          const bMatches = searchTerms.filter(term => b.content.toLowerCase().includes(term)).length;
          return bMatches - aMatches;
        })
        .slice(0, 5); // Limit to top 5 results

      return relevantMemories.map(mem => ({ 
        id: mem.id, 
        memory: mem.content, 
        created_at: mem.timestamp 
      }));
    } catch (error) {
      console.error('Memory search error:', error);
      return [];
    }
  }

  async deleteMemory(memoryId: string) {
    try {
      const memory = this.memories.get(memoryId);
      if (!memory) return false;

      this.memories.delete(memoryId);
      
      // Remove from user index
      const userMemoryIds = this.userMemories.get(memory.userId);
      if (userMemoryIds) {
        const index = userMemoryIds.indexOf(memoryId);
        if (index > -1) {
          userMemoryIds.splice(index, 1);
        }
      }

      return true;
    } catch (error) {
      console.error('Memory delete error:', error);
      return false;
    }
  }

  async updateMemory(memoryId: string, data: string) {
    try {
      const memory = this.memories.get(memoryId);
      if (!memory) return null;

      memory.content = data;
      memory.timestamp = new Date().toISOString();
      this.memories.set(memoryId, memory);

      return { id: memory.id, memory: memory.content };
    } catch (error) {
      console.error('Memory update error:', error);
      return null;
    }
  }
}

export const mem0Service = new Mem0Service();