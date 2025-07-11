// @ts-nocheck
import { Express, Request, Response } from 'express'
import { createServer, Server } from 'http'
import { z } from 'zod'
import { storage } from './storage'
import { insertNoteSchema, insertTaskSchema, insertUserPreferencesSchema, insertChatMessageSchema, type YooptaContentValue } from '@/shared/schema'
import OpenAI from 'openai'
import { mem0Service } from './mem0-service'
import { googleCalendarService } from './google-calendar'
import type { CalendarSyncStatus } from '../shared/calendar-types'

// Utility to convert string to YooptaContentValue
function stringToYoopta(text: string): YooptaContentValue {
  const blocks = text.split('\n').map((line, index) => ({
    id: `block-${index}`,
    type: 'paragraph',
    children: [{ text: line }],
    props: { nodeType: 'block' },
  }))

  return {
    root: {
      id: 'root',
      type: 'paragraph',
      value: blocks,
      meta: { order: 0, depth: 0 },
    },
  }
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-key"
})

interface WeatherData {
  temperature: number
  description: string
  high: number
  low: number
  humidity: number
  rainChance: number
  location: string
}

interface WeatherForecast {
  time: number
  temperature: number
  rainChance: number
  weatherCode: number
}

interface CityWeatherData extends WeatherData {
  city: string
  forecast: WeatherForecast[]
}

interface Session {
  isAuthenticated?: boolean
  userId?: string // Changed to string for UUID
  destroy: (callback: (err: Error | null) => void) => void
}

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

interface CalendarInterval {
  startTime: string
  values: {
    temperature: number
    precipitationProbability: number
    weatherCode: number
  }
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: string[]
  htmlLink?: string
  source?: 'google' | 'local'
}

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000"; // Changed to a placeholder UUID

  // Authentication endpoints
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" })
      }

      // For demo purposes, use username as email for lookup
      const user = await storage.getUserByEmail(username)
      
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      // For demo purposes, simple password check (in production use bcrypt)
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      res.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email,
        message: "Login successful" 
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ error: "Login failed" })
    }
  })

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = req.body
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" })
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(username)
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" })
      }

      // Create new user (using username as both email and name for demo)
      const newUser = await storage.createUser({
        email: username,
        name: username,
        password: password
      })

      res.json({ 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email,
        message: "Registration successful" 
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ error: "Registration failed" })
    }
  })

  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated via session
      const session = req.session as Session
      
      if (!session?.isAuthenticated || !session?.userId) {
        return res.status(401).json({ error: "Not authenticated" })
      }
      
      // Get authenticated user from storage
      const user = await storage.getUser(session.userId)
      
      if (!user) {
        return res.status(401).json({ error: "User not found" })
      }
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.image // Corrected from user.picture to user.image
      })
    } catch (error) {
      console.error("Error fetching user:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  })

  // Weather API using Tomorrow.io
  app.get("/api/weather", async (req, res) => {
    try {
      const userPreferences = await storage.getUserPreferences(DEFAULT_USER_ID);
      const location = userPreferences?.location || "San Francisco, CA";

      const response = await fetch(
        `https://api.tomorrow.io/v4/weather/forecast?location=${encodeURIComponent(location)}&units=imperial&timesteps=1h&apikey=${process.env.TOMORROW_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching weather: ${response.statusText}`);
      }
      
      const data = await response.json();

      const weatherData: WeatherData = {
        temperature: data.timelines.hourly[0].values.temperature,
        description: getWeatherDescription(data.timelines.hourly[0].values.weatherCode),
        high: data.timelines.daily[0].values.temperatureMax,
        low: data.timelines.daily[0].values.temperatureMin,
        humidity: data.timelines.hourly[0].values.humidity,
        rainChance: data.timelines.hourly[0].values.precipitationProbability,
        location,
      };

      const forecast: WeatherForecast[] = data.timelines.hourly.slice(0, 24).map((hour: any) => ({
        time: new Date(hour.time).getTime(),
        temperature: hour.values.temperature,
        rainChance: hour.values.precipitationProbability,
        weatherCode: hour.values.weatherCode,
      }));
      
      res.json({ ...weatherData, forecast });

    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  app.post("/api/weather/multi-city", async (req, res) => {
    try {
      const { cities } = req.body;
      if (!Array.isArray(cities) || cities.length === 0) {
        return res.status(400).json({ error: "Cities array is required" });
      }

      const weatherPromises = cities.map(async (city: string) => {
        const response = await fetch(
          `https://api.tomorrow.io/v4/weather/forecast?location=${encodeURIComponent(city)}&units=imperial&timesteps=1h&apikey=${process.env.TOMORROW_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`Error fetching weather for ${city}: ${response.statusText}`);
        }
        
        const data = await response.json();

        const weatherData: CityWeatherData = {
          city,
          temperature: data.timelines.hourly[0].values.temperature,
          description: getWeatherDescription(data.timelines.hourly[0].values.weatherCode),
          high: data.timelines.daily[0].values.temperatureMax,
          low: data.timelines.daily[0].values.temperatureMin,
          humidity: data.timelines.hourly[0].values.humidity,
          rainChance: data.timelines.hourly[0].values.precipitationProbability,
          location: city,
          forecast: data.timelines.hourly.slice(0, 24).map((hour: any) => ({
            time: new Date(hour.time).getTime(),
            temperature: hour.values.temperature,
            rainChance: hour.values.precipitationProbability,
            weatherCode: hour.values.weatherCode,
          })),
        };
        return weatherData;
      });

      const allWeatherData = await Promise.all(weatherPromises);
      res.json(allWeatherData);

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
      const id = req.params.id; // Changed to string
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

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const id = req.params.id; // Changed to string
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
      const id = req.params.id; // Changed to string
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
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasksByUserId(DEFAULT_USER_ID);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask({ 
        ...taskData, 
        userId: DEFAULT_USER_ID,
        status: taskData.status || 'pending',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined
      });
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id; // Changed to string
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

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id; // Changed to string
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
      const id = req.params.id; // Changed to string
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
      console.error("Error fetching preferences:", error);
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

      // Store user message with 3-day expiration for privacy
      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      await storage.createChatMessage({
        message,
        role: "user",
        userId: DEFAULT_USER_ID,
        expiresAt,
        sessionId: `session_${Date.now()}_${DEFAULT_USER_ID}`
      });

      // Get user preferences for context
      const prefs = await storage.getUserPreferences(DEFAULT_USER_ID);
      const agentName = prefs?.agentName || "Alex";
      const userName = prefs?.userName || "User";

      // Fetch recent chat history for context
      const recentMessages = await storage.getChatMessagesByUserId(DEFAULT_USER_ID);
      const contextMessages = recentMessages.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.message }));

      // If it's a first-time user, guide through onboarding
      if (!prefs?.initialized) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: `You are a friendly AI assistant helping a new user set up their profile. Guide them through naming you, then asking their name, then explaining notes/tasks via hashtags, and finally offering setup modules. The response should be JSON in the format { "message": "Your message", "setupComplete": boolean, "userName"?: string, "agentName"?: string }. Keep messages concise.` },
            ...contextMessages,
            { role: "user", content: message }
          ],
          max_tokens: 200,
          response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) {
          throw new Error("No response from AI");
        }
        const setupResponse = JSON.parse(content);
        
        if (setupResponse.setupComplete) {
          // Complete the setup
          await storage.updateUserPreferences(DEFAULT_USER_ID, {
            userName: setupResponse.userName,
            agentName: setupResponse.agentName,
            initialized: true
          });
        }

        // Store AI response
        await storage.createChatMessage({
          message: setupResponse.message,
          role: "assistant",
          userId: DEFAULT_USER_ID,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });

        return res.json({ 
          message: setupResponse.message,
          setupComplete: setupResponse.setupComplete 
        });
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
            content: stringToYoopta(noteContent), // Ensure content is YooptaContentValue
            userId: DEFAULT_USER_ID
          });
          results.push({ type: 'note', data: note });
          responseMessage += `Got it! Added that to your notes ✓`;
        }
        
        if (hasTask) {
          const taskContent = message.replace('#task', '').replace('#note', '').trim();
          const task = await storage.createTask({
            title: taskContent || "Untitled Task",
            description: undefined,
            userId: DEFAULT_USER_ID
          });
          results.push({ type: 'task', data: task });
          if (responseMessage) responseMessage += " and ";
          responseMessage += `Perfect! Added that to your tasks ✓\n\nWould you like to set a due date for this task? Just let me know when it's due (e.g., "tomorrow", "next Friday", "December 15th").`;
        }
        
        await storage.createChatMessage({
          message: responseMessage,
          role: "assistant",
          userId: DEFAULT_USER_ID,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        });
        
        const response: any = { message: responseMessage };
        results.forEach(result => {
          if (result.type === 'note') response.note = result.data;
          if (result.type === 'task') response.task = result.data;
        });
        
        return res.json(response);
      }

      // Regular AI chat with action detection
      // In this demo environment we don’t yet stream long-term memories, so pass an empty context.
      const memoryContext = "";

      const systemPrompt = `You are ${agentName}, ${userName}'s personal AI assistant. You're friendly, conversational, and helpful.
      
      When creating tasks, ALWAYS ask for a due date as a follow-up question after confirming the task creation.
      When creating notes, just confirm creation without asking for additional details.
      
      Examples of good task responses:
      - "Perfect! Added that to your tasks ✓\n\nWhen would you like this completed? Just let me know the due date (e.g., 'tomorrow', 'next Friday', 'December 15th')."
      - "Got it! Created that task for you ✓\n\nWould you like to set a due date? You can say something like 'due next week' or 'by Friday'."
      
      Examples of good note responses:
      - "Done! Created a note about that for you ✓"
      - "All set! That's now in your notes ✓"
      
      Available actions:
      - create_task: Creates a new task (always follow up asking for due date)
      - create_note: Creates a new note
      - update_task_due_date: Updates a task's due date when user provides date information
      
      ${memoryContext}
      
      Respond in JSON format with:
      {
        "message": "your casual, friendly response (include due date question for tasks)",
        "action": "create_task" | "create_note" | "update_task_due_date" | null,
        "actionData": { title: "title", description: "description", content: "content", priority: "low", dueDate: "ISO date string if provided" }
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
            description: undefined,
            userId: DEFAULT_USER_ID
          });
          responseData.task = task;
          // Keep the AI's natural response instead of overriding it
        } catch (error) {
          responseData.message = "Sorry, I couldn't create that task. Please try again.";
        }
      }

      if (responseData.action === "create_note" && responseData.actionData) {
        try {
          const note = await storage.createNote({
            title: responseData.actionData.title || "New Note",
            content: stringToYoopta(responseData.actionData.content || ""), // Convert string to YooptaContentValue
            userId: DEFAULT_USER_ID
          });
          responseData.note = note;
          // Keep the AI's natural response instead of overriding it
        } catch (error) {
          responseData.message = "Sorry, I couldn't create that note. Please try again.";
        }
      }

      if (responseData.action === "update_task_due_date" && responseData.actionData) {
        try {
          // Get the most recent task for this user
          const tasks = await storage.getTasksByUserId(DEFAULT_USER_ID);
          const recentTask = tasks[tasks.length - 1]; // Most recently added task
          
          if (recentTask && responseData.actionData.dueDate) {
            const updatedTask = await storage.updateTask(recentTask.id, {
              dueDate: new Date(responseData.actionData.dueDate)
            });
            responseData.task = updatedTask;
          }
        } catch (error) {
          responseData.message = "Sorry, I couldn't update the due date. Please try again.";
        }
      }

      // Store AI response
      await storage.createChatMessage({
        message: responseData.message,
        role: "assistant",
        userId: DEFAULT_USER_ID,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
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
      console.error("AI chat endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
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

  // Reset initialization endpoint (for testing)
  app.post("/api/reset-init", async (req, res) => {
    try {
      await storage.updateUserPreferences(DEFAULT_USER_ID, { initialized: false });
      res.json({ success: true, message: "Initialization reset" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset initialization" });
    }
  });

  // Development login route (bypasses Google OAuth)
  app.get("/api/auth/dev-login", async (req, res) => {
    try {
      // Use the existing default user
      let user = await storage.getUser(DEFAULT_USER_ID);
      
      if (!user) {
        // Create a default admin user for development
        user = await storage.createUser({
          name: "Admin User",
          email: "admin@productivityai.com"
        });
      }
      
      res.redirect("/dashboard?dev=true");
    } catch (error) {
      console.error("Dev login error:", error);
      res.redirect("/?error=dev_login_failed");
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    const session = req.session as any;
    if (session) {
      session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });

  // Google Calendar authentication routes
  app.get("/api/auth/google", (req, res) => {
    const authUrl = googleCalendarService.getAuthUrl();
    res.redirect(authUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "No authorization code provided" });
      }

      // Exchange code for tokens
      const { accessToken, refreshToken } = await googleCalendarService.exchangeCodeForTokens(code);
      
      // Get user info from Google
      const googleUser = await googleCalendarService.getUserInfo(accessToken);
      
      // Check if user exists by Google ID or email
      let user = await storage.getUserByGoogleId(googleUser.id);
      if (!user) {
        user = await storage.getUserByEmail(googleUser.email);
      }
      
      if (!user) {
        // Create new Google user
        user = await storage.createGoogleUser({
          googleId: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          accessToken,
          refreshToken
        });
      } else {
        // Update existing user with Google Calendar connection and tokens
        user = await storage.updateGoogleCalendarConnection(user.id, true, accessToken, refreshToken);
      }
      
      // Set session to remember authenticated user
      (req.session as any).userId = user.id;
      (req.session as any).isAuthenticated = true;
      
      res.redirect("/dashboard?connected=true");
    } catch (error) {
      console.error("Google Calendar auth error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // Calendar sync status endpoint
  app.get("/api/calendar/status", async (req, res) => {
    try {
      // Return mock connection status in development mode
      if (process.env.NODE_ENV === 'development') {
        const status: CalendarSyncStatus = {
          connected: true,
          lastSync: new Date(),
          eventCount: 4
        };
        return res.json(status);
      }

      const user = await storage.getUser(DEFAULT_USER_ID);
      const status: CalendarSyncStatus = {
        connected: user?.googleCalendarConnected || false,
        lastSync: user?.lastCalendarSync || undefined,
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get calendar status" });
    }
  });

  // Disconnect Google Calendar
  app.post("/api/calendar/disconnect", async (req, res) => {
    try {
      const user = await storage.getUser(DEFAULT_USER_ID);
      if (user) {
        await storage.updateGoogleCalendarConnection(user.id, false, "", "");
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect calendar" });
    }
  });

  // Calendar events endpoint with Google Calendar integration
  app.get("/api/calendar", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(DEFAULT_USER_ID);
      let events: CalendarEvent[] = [];

      if (user?.googleCalendarConnected && user.accessToken) {
        try {
          // Fetch Google Calendar events
          const googleEvents = await googleCalendarService.getCalendarEvents(
            user.accessToken
          );
          events = googleEvents;
        } catch (error) {
          console.error("Google Calendar API error:", error);
          // Continue with mock data if Google Calendar fails
        }
      }

      // If no Google Calendar events or not connected, use mock data
      if (events.length === 0) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        events = [
          {
            id: "mock-1",
            title: "Team Meeting",
            description: "Weekly sync with the team",
            startTime: new Date(today.setHours(10, 0)),
            endTime: new Date(today.setHours(11, 0)),
            location: "Conference Room A",
            source: "local",
            htmlLink: "#"
          },
          {
            id: "mock-2",
            title: "Project Review",
            description: "Review project milestones",
            startTime: new Date(tomorrow.setHours(14, 0)),
            endTime: new Date(tomorrow.setHours(15, 0)),
            location: "Virtual",
            source: "local",
            htmlLink: "#"
          },
          {
            id: "mock-3",
            title: "Lunch with Client",
            description: "Discuss new requirements",
            startTime: new Date(nextWeek.setHours(12, 30)),
            endTime: new Date(nextWeek.setHours(13, 30)),
            location: "Restaurant",
            source: "local",
            htmlLink: "#"
          }
        ];
      }

      res.json(events);
    } catch (error) {
      console.error("Calendar API error:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  return createServer(app).listen(process.env.PORT || 3000);
}
