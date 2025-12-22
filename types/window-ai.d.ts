
// Type definitions for the Chrome Built-in AI API (Gemini Nano)
// Based on current experimental specs

interface Window {
  ai: {
    languageModel: {
      create(options?: {
        systemPrompt?: string;
        initialPrompts?: { role: "system" | "user" | "assistant"; content: string }[];
      }): Promise<AILanguageModel>;
      capabilities(): Promise<AILanguageModelCapabilities>;
    };
  };
}

interface AILanguageModel {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream<string>;
  destroy(): void;
  clone(): Promise<AILanguageModel>;
}

interface AILanguageModelCapabilities {
  available: "readily" | "after-download" | "no";
  defaultTemperature: number;
  defaultTopK: number;
  maxTopK: number;
}
