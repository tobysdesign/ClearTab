import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertNoteSchema, insertTaskSchema, insertUserPreferencesSchema, insertChatMessageSchema } from "@shared/schema";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  const DEFAULT_USER_ID = 1; // Demo user

  // Weather API
  app.get("/api/weather", async (req, res) => {
    try {
      const location = req.query.location as string || "San Francisco,CA";
      const apiKey = process.env.OPENWEATHERMAP_API_KEY;
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        high: Math.round(data.main.temp_max),
        low: Math.round(data.main.temp_min),
        humidity: data.main.humidity,
        location: data.name
      });
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ 
        error: "Failed to fetch weather data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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
      res.status(400).json({ error: "Invalid note data", details: error.message });
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
      const { message } = req.body;
      
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

      // Check for hashtag shortcuts anywhere in the message
      if (message.includes('#note')) {
        const noteContent = message.replace('#note', '').trim();
        const note = await storage.createNote({
          title: noteContent.substring(0, 50) || "Untitled Note",
          content: noteContent,
          tags: [],
          userId: DEFAULT_USER_ID
        });
        
        const response = `Note created: "${note.title}"`;
        await storage.createChatMessage({
          message: response,
          role: "assistant",
          userId: DEFAULT_USER_ID
        });
        
        return res.json({ message: response, note });
      }

      if (message.includes('#task')) {
        const taskContent = message.replace('#task', '').trim();
        const task = await storage.createTask({
          title: taskContent || "Untitled Task",
          description: "",
          priority: "medium",
          userId: DEFAULT_USER_ID
        });
        
        const response = `Task created: "${task.title}"`;
        await storage.createChatMessage({
          message: response,
          role: "assistant",
          userId: DEFAULT_USER_ID
        });
        
        return res.json({ message: response, task });
      }

      // Regular AI chat with action detection
      const systemPrompt = `You are ${agentName}, a helpful AI assistant for ${userName}'s productivity dashboard. 
      You can help create notes and tasks, answer questions, and provide assistance with productivity.
      
      When the user asks you to create a task or note, you should immediately do it and confirm what you created.
      When the user asks to convert a note to a task or vice versa, create the new item with the same content and mention that you've converted it.
      
      Available actions:
      - create_task: Creates a new task
      - create_note: Creates a new note
      
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

  // Calendar events endpoint (mock data)
  app.get("/api/calendar", async (req, res) => {
    try {
      const events = [
        {
          id: 1,
          title: "Team Standup",
          date: new Date(),
          time: "9:00 AM"
        },
        {
          id: 2,
          title: "Product Review",
          date: new Date(),
          time: "2:00 PM"
        },
        {
          id: 3,
          title: "Client Call",
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          time: "10:30 AM"
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
