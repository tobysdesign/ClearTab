import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Google auth will be replaced with Supabase auth
import { insertNoteSchema, insertTaskSchema, insertUserPreferencesSchema, insertChatMessageSchema } from "@shared/schema";
import OpenAI from "openai";
import { mem0Service } from "./mem0-service";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = 1; // Demo user

  // Simple auth endpoint for development
  app.get("/api/auth/user", (req, res) => {
    // Return demo user for development
    res.json({
      id: 1,
      name: "Demo User",
      email: "demo@example.com",
      picture: null
    });
  });

  // Weather API using Tomorrow.io
  app.get("/api/weather", async (req, res) => {
    try {
      const location = req.query.location as string || "San Francisco,CA";
      const apiKey = process.env.TOMORROW_IO_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: "Weather API key not configured",
          message: "Please provide a valid Tomorrow.io API key"
        });
      }
      
      // Use a default coordinate for San Francisco if no specific location provided
      const lat = 37.7749;
      const lon = -122.4194;
      
      const response = await fetch(
        `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Weather API error: ${response.status} - ${errorData}`);
      }
      
      const data = await response.json();
      const weather = data.data.values;
      
      res.json({
        temperature: Math.round(weather.temperature),
        description: getWeatherDescription(weather.weatherCode),
        high: Math.round(weather.temperatureMax || weather.temperature + 5),
        low: Math.round(weather.temperatureMin || weather.temperature - 5),
        humidity: Math.round(weather.humidity),
        rainChance: Math.round(weather.precipitationProbability || 0),
        location: "San Francisco, CA"
      });
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ 
        error: "Failed to fetch weather data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Multi-city weather API
  app.get("/api/weather/cities", async (req, res) => {
    try {
      const apiKey = process.env.TOMORROW_IO_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: "Weather API key not configured",
          message: "Please provide a valid Tomorrow.io API key"
        });
      }
      
      const cities = [
        { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
        { name: "New York", lat: 40.7128, lon: -74.0060 },
        { name: "London", lat: 51.5074, lon: -0.1278 }
      ];
      
      const weatherPromises = cities.map(async (city) => {
        try {
          // Get current weather and 12-hour forecast
          const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${city.lat},${city.lon}&apikey=${apiKey}&units=metric`),
            fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${city.lat},${city.lon}&apikey=${apiKey}&units=metric&timesteps=1h`)
          ]);
          
          if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error(`Weather API error for ${city.name}`);
          }
          
          const [currentData, forecastData] = await Promise.all([
            currentResponse.json(),
            forecastResponse.json()
          ]);
          
          const weather = currentData.data.values;
          const forecast = forecastData.data.timelines[0].intervals.slice(1, 13); // Next 12 hours
          
          return {
            city: city.name,
            temperature: Math.round(weather.temperature),
            description: getWeatherDescription(weather.weatherCode),
            rainChance: Math.round(weather.precipitationProbability || 0),
            high: Math.round(weather.temperatureMax || weather.temperature + 5),
            low: Math.round(weather.temperatureMin || weather.temperature - 5),
            forecast: forecast.map((interval: any) => ({
              time: new Date(interval.startTime).getHours(),
              temperature: Math.round(interval.values.temperature),
              rainChance: Math.round(interval.values.precipitationProbability || 0),
              weatherCode: interval.values.weatherCode
            }))
          };
        } catch (error) {
          console.error(`Weather API error for ${city.name}:`, error);
          return null;
        }
      });
      
      const weatherData = await Promise.all(weatherPromises);
      const validWeatherData = weatherData.filter(data => data !== null);
      
      res.json(validWeatherData);
    } catch (error) {
      console.error("Multi-city weather API error:", error);
      res.status(500).json({ 
        error: "Failed to fetch multi-city weather data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Helper function to convert Tomorrow.io weather codes to descriptions
  function getWeatherDescription(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: "Unknown",
      1000: "Clear, Sunny",
      1100: "Mostly Clear",
      1101: "Partly Cloudy",
      1102: "Mostly Cloudy",
      1001: "Cloudy",
      2000: "Fog",
      2100: "Light Fog",
      4000: "Drizzle",
      4001: "Rain",
      4200: "Light Rain",
      4201: "Heavy Rain",
      5000: "Snow",
      5001: "Flurries",
      5100: "Light Snow",
      5101: "Heavy Snow",
      6000: "Freezing Drizzle",
      6001: "Freezing Rain",
      6200: "Light Freezing Rain",
      6201: "Heavy Freezing Rain",
      7000: "Ice Pellets",
      7101: "Heavy Ice Pellets",
      7102: "Light Ice Pellets",
      8000: "Thunderstorm"
    };
    return weatherCodes[code] || "Unknown Weather";
  }

  // Notes endpoints
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotesByUserId(DEFAULT_USER_ID);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      console.log("Received note data:", req.body);
      const noteData = insertNoteSchema.parse(req.body);
      console.log("Parsed note data:", noteData);
      const note = await storage.createNote({ ...noteData, userId: DEFAULT_USER_ID });
      res.json(note);
    } catch (error) {
      console.error("Note creation error:", error);
      res.status(400).json({ error: "Invalid note data", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const noteData = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(id, noteData);
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNote(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Tasks endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasksByUserId(DEFAULT_USER_ID);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask({ ...taskData, userId: DEFAULT_USER_ID });
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, taskData);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // User preferences endpoints
  app.get("/api/preferences", async (req, res) => {
    try {
      const prefs = await storage.getUserPreferences(DEFAULT_USER_ID);
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.patch("/api/preferences", async (req, res) => {
    try {
      const updatedPrefs = await storage.updateUserPreferences(DEFAULT_USER_ID, req.body);
      if (!updatedPrefs) {
        return res.status(404).json({ error: "Preferences not found" });
      }
      res.json(updatedPrefs);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    try {
      const prefsData = insertUserPreferencesSchema.parse(req.body);
      const prefs = await storage.createUserPreferences({ ...prefsData, userId: DEFAULT_USER_ID });
      res.json(prefs);
    } catch (error) {
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  app.put("/api/preferences", async (req, res) => {
    try {
      const prefsData = insertUserPreferencesSchema.partial().parse(req.body);
      const prefs = await storage.updateUserPreferences(DEFAULT_USER_ID, prefsData);
      
      if (!prefs) {
        return res.status(404).json({ error: "Preferences not found" });
      }
      
      res.json(prefs);
    } catch (error) {
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  // AI Chat endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, useMemory = true } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Store user message
      await storage.createChatMessage({
        message,
        role: "user",
        userId: DEFAULT_USER_ID
      });

      // Get user preferences for context
      const prefs = await storage.getUserPreferences(DEFAULT_USER_ID);
      const agentName = prefs?.agentName || "Alex";
      const userName = prefs?.userName || "User";

      // Get recent chat history for context
      const recentMessages = await storage.getChatMessagesByUserId(DEFAULT_USER_ID);
      const contextMessages = recentMessages.slice(-10).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.message
      }));

      // Retrieve relevant memories if using memory
      let memoryContext = "";
      if (useMemory) {
        try {
          const userId = DEFAULT_USER_ID.toString();
          const relevantMemories = await mem0Service.searchMemories(message, userId);
          if (relevantMemories && relevantMemories.length > 0) {
            memoryContext = "\n\nRelevant memories:\n" + 
              relevantMemories.map((mem: any) => `- ${mem.memory}`).join("\n");
          }
        } catch (error) {
          console.error("Memory retrieval error:", error);
          // Continue without memory if service fails
        }
      }

      // Check for hashtag shortcuts anywhere in the message
      const hasNote = message.includes('#note');
      const hasTask = message.includes('#task');
      
      if (hasNote || hasTask) {
        const results = [];
        let responseMessage = "";
        
        if (hasNote) {
          const noteContent = message.replace('#note', '').replace('#task', '').trim();
          const note = await storage.createNote({
            title: noteContent.substring(0, 50) || "Untitled Note",
            content: noteContent,
            tags: [],
            userId: DEFAULT_USER_ID
          });
          results.push({ type: 'note', data: note });
          responseMessage += `Note created: "${note.title}"`;
        }
        
        if (hasTask) {
          const taskContent = message.replace('#task', '').replace('#note', '').trim();
          const task = await storage.createTask({
            title: taskContent || "Untitled Task",
            description: "",
            priority: "medium",
            userId: DEFAULT_USER_ID
          });
          results.push({ type: 'task', data: task });
          if (responseMessage) responseMessage += " and ";
          responseMessage += `Task created: "${task.title}"`;
        }
        
        await storage.createChatMessage({
          message: responseMessage,
          role: "assistant",
          userId: DEFAULT_USER_ID
        });
        
        const response: any = { message: responseMessage };
        results.forEach(result => {
          if (result.type === 'note') response.note = result.data;
          if (result.type === 'task') response.task = result.data;
        });
        
        return res.json(response);
      }

      // Regular AI chat with action detection
      const systemPrompt = `You are ${agentName}, a helpful AI assistant for ${userName}'s productivity dashboard. 
      You can help create notes and tasks, answer questions, and provide assistance with productivity.
      
      When the user asks you to create a task or note, you should immediately do it and confirm what you created.
      When the user asks to convert a note to a task or vice versa, create the new item with the same content and mention that you've converted it.
      
      Available actions:
      - create_task: Creates a new task
      - create_note: Creates a new note
      
      ${memoryContext}
      
      Respond in JSON format with:
      {
        "message": "your response text",
        "action": "create_task" | "create_note" | null,
        "actionData": { title: "title", description: "description", content: "content", priority: "medium" }
      }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...contextMessages,
          { role: "user", content: message }
        ],
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const aiResponse = completion.choices[0].message.content || '{"message": "I\'m sorry, I couldn\'t process that request.", "action": null}';
      
      let responseData;
      try {
        responseData = JSON.parse(aiResponse);
      } catch {
        responseData = { message: aiResponse, action: null };
      }

      // Handle actions
      if (responseData.action === "create_task" && responseData.actionData) {
        try {
          const task = await storage.createTask({
            title: responseData.actionData.title || "New Task",
            description: responseData.actionData.description || "",
            priority: responseData.actionData.priority || "medium",
            userId: DEFAULT_USER_ID
          });
          responseData.task = task;
          responseData.message = `I've created the task: "${task.title}"`;
        } catch (error) {
          responseData.message = "Sorry, I couldn't create that task. Please try again.";
        }
      }

      if (responseData.action === "create_note" && responseData.actionData) {
        try {
          const note = await storage.createNote({
            title: responseData.actionData.title || "New Note",
            content: responseData.actionData.content || "",
            tags: responseData.actionData.tags || [],
            userId: DEFAULT_USER_ID
          });
          responseData.note = note;
          responseData.message = `I've created the note: "${note.title}"`;
        } catch (error) {
          responseData.message = "Sorry, I couldn't create that note. Please try again.";
        }
      }

      // Store AI response
      await storage.createChatMessage({
        message: responseData.message,
        role: "assistant",
        userId: DEFAULT_USER_ID
      });

      // Store conversation in Mem0 for learning
      if (useMemory) {
        try {
          const userId = DEFAULT_USER_ID.toString();
          const conversationMessages = [
            { role: "user", content: message },
            { role: "assistant", content: responseData.message }
          ];
          await mem0Service.addMemory(conversationMessages, userId, {
            timestamp: new Date().toISOString(),
            hasActions: responseData.action ? true : false
          });
        } catch (error) {
          console.error("Memory storage error:", error);
          // Continue without memory storage if service fails
        }
      }

      res.json(responseData);
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ 
        error: "Failed to process chat message",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Chat messages endpoint
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesByUserId(DEFAULT_USER_ID);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Memory management endpoints
  app.get("/api/memories", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID.toString();
      const memories = await mem0Service.getMemories(userId);
      res.json(memories);
    } catch (error) {
      console.error("Get memories error:", error);
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.delete("/api/memories/:id", async (req, res) => {
    try {
      const memoryId = req.params.id;
      await mem0Service.deleteMemory(memoryId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete memory error:", error);
      res.status(500).json({ error: "Failed to delete memory" });
    }
  });

  app.post("/api/memories/search", async (req, res) => {
    try {
      const { query } = req.body;
      const userId = DEFAULT_USER_ID.toString();
      const memories = await mem0Service.searchMemories(query, userId);
      res.json(memories);
    } catch (error) {
      console.error("Search memories error:", error);
      res.status(500).json({ error: "Failed to search memories" });
    }
  });

  // Calendar events endpoint 
  app.get("/api/calendar", async (req, res) => {
    try {
      const today = new Date();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const events = [
        {
          id: 1,
          title: "Team Standup",
          date: today.toISOString().split('T')[0],
          time: "09:00"
        },
        {
          id: 2,
          title: "Product Review",
          date: today.toISOString().split('T')[0],
          time: "14:00"
        },
        {
          id: 3,
          title: "Client Call",
          date: tomorrow.toISOString().split('T')[0],
          time: "10:30"
        }
      ];
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
