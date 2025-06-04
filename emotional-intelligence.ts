import OpenAI from "openai";
import { mem0Service } from "./mem0-service";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface EmotionalAnalysis {
  emotion: string;
  tone: string;
  intent: string;
  confidence: number; // 0-100
  insights?: string;
  suggestedActions: string[];
  isSignificant: boolean;
}

export class EmotionalIntelligenceService {
  
  async analyzeContent(
    content: string, 
    sourceType: "note" | "task" | "chat",
    userId: string
  ): Promise<EmotionalAnalysis | null> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an emotional intelligence assistant for a privacy-respecting productivity app. 

Analyze the content for emotional metadata ONLY if it contains meaningful emotional, psychological, or personal insight. 

Return JSON with this structure:
{
  "emotion": "primary emotion (joy, sadness, anxiety, excitement, frustration, hope, etc.)",
  "tone": "overall tone (positive, negative, neutral, urgent, reflective, etc.)",
  "intent": "user's intent (goal-setting, venting, planning, celebrating, seeking-help, etc.)",
  "confidence": 85, // 0-100 confidence in analysis
  "insights": "brief insight about user's emotional state or pattern",
  "suggestedActions": ["revisit", "journal", "save_insight"], // max 2 actions, only if truly meaningful
  "isSignificant": true // only true if emotionally meaningful and worth storing
}

Be VERY selective. Only analyze content that shows clear emotional significance. 
Skip routine tasks, simple notes, or factual content.
Only suggest actions sparingly when genuinely beneficial.`
          },
          {
            role: "user",
            content: `Source: ${sourceType}\nContent: ${content}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      
      // Only return analysis if AI deems it significant
      if (!analysis.isSignificant || analysis.confidence < 60) {
        return null;
      }

      return {
        emotion: analysis.emotion,
        tone: analysis.tone,
        intent: analysis.intent,
        confidence: Math.min(100, Math.max(0, analysis.confidence)),
        insights: analysis.insights,
        suggestedActions: Array.isArray(analysis.suggestedActions) ? 
          analysis.suggestedActions.slice(0, 2) : [],
        isSignificant: analysis.isSignificant
      };

    } catch (error) {
      console.error("Emotional analysis failed:", error);
      return null;
    }
  }

  async storeEmotionalMemory(
    analysis: EmotionalAnalysis,
    content: string,
    sourceType: string,
    userId: string
  ): Promise<string | null> {
    try {
      // Store emotional context and insights in Mem0 for relationship building
      const memoryData = {
        content: `${sourceType}: ${analysis.emotion} - ${analysis.insights}`,
        metadata: {
          emotion: analysis.emotion,
          tone: analysis.tone,
          intent: analysis.intent,
          confidence: analysis.confidence,
          sourceType,
          timestamp: new Date().toISOString()
        }
      };

      const memoryResult = await mem0Service.addMemory(
        [{ role: "user", content: content }],
        userId,
        memoryData.metadata
      );

      return memoryResult ? "memory_stored" : null;
    } catch (error) {
      console.error("Failed to store emotional memory:", error);
      return null;
    }
  }

  async getEmotionalInsights(userId: string, query?: string): Promise<any[]> {
    try {
      if (query) {
        return await mem0Service.searchMemories(query, userId);
      } else {
        return await mem0Service.getMemories(userId);
      }
    } catch (error) {
      console.error("Failed to retrieve emotional insights:", error);
      return [];
    }
  }
}

export const emotionalIntelligence = new EmotionalIntelligenceService();