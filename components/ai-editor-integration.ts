'use client';

/**
 * This file contains helper functions to integrate your AI assistant with the BlockNote editor
 */

// Define types for BlockNote content
type BlockContent = string | Array<{ text?: string; [key: string]: unknown }>;
type BlockItem = {
  content?: BlockContent;
  [key: string]: unknown;
};

/**
 * Send a prompt to the AI assistant and get a response
 * @param prompt The prompt to send to the AI
 * @returns A promise that resolves to the AI's response
 */
export async function getAiResponse(prompt: string): Promise<string> {
  try {
    // Here you would integrate with your actual AI service
    // For example, calling an API endpoint that connects to your AI agent
    
    // For demonstration, we'll simulate a response
    // Replace this with your actual AI integration
    console.log('Sending prompt to AI:', prompt);
    
    // Simulate API call
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    }).then(res => {
      if (!res.ok) throw new Error('AI service unavailable');
      return res.json();
    });
    
    return response.text;
  } catch (error) {
    console.error('Error getting AI assistance:', error);
    return `Sorry, I couldn't process that request. Please try again.`;
  }
}

/**
 * Helper function to extract text from BlockNote content
 * @param content BlockNote content object
 * @returns Plain text representation of the content
 */
export function extractTextFromBlocks(content: BlockItem[]): string {
  if (!content || !Array.isArray(content)) return '';

  return content.map(block => {
    if (typeof block.content === 'string') {
      return block.content;
    } else if (Array.isArray(block.content)) {
      return block.content.map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null && 'text' in item) {
          return item.text || '';
        }
        return '';
      }).join(' ');
    }
    return '';
  }).join('\n');
}

/**
 * AI commands that can be integrated with the editor
 */
export const aiCommands = {
  complete: {
    name: 'Complete',
    description: 'Continue writing from the current point',
    prompt: (text: string) => `Continue writing from here: ${text}`,
  },
  improve: {
    name: 'Improve',
    description: 'Improve the selected text',
    prompt: (text: string) => `Improve this text: ${text}`,
  },
  summarize: {
    name: 'Summarize',
    description: 'Create a summary of the selected text',
    prompt: (text: string) => `Summarize this text: ${text}`,
  },
  explain: {
    name: 'Explain',
    description: 'Explain the selected text in simpler terms',
    prompt: (text: string) => `Explain this in simpler terms: ${text}`,
  },
  askQuestion: {
    name: 'Ask',
    description: 'Ask the AI a question',
    prompt: (text: string) => text,
  },
}; 