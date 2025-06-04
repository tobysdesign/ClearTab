import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import { db } from './db.js';
import { mem0Service } from './mem0-service.js';
import { notes, tasks, userPreferences } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// For demo purposes, using userId 1. In production, implement proper authentication
const DEFAULT_USER_ID = 1;

// Auth endpoint - simplified for demo
app.get("/api/auth/user", (req, res) => {
  res.json({
    id: DEFAULT_USER_ID,
    name: "Demo User",
    email: "demo@example.com",
    picture: null
  });
});

// Notes endpoints
app.get("/api/notes", async (req, res) => {
  try {
    const userNotes = await db.select().from(notes).where(eq(notes.userId, DEFAULT_USER_ID));
    res.json(userNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const newNote = await db.insert(notes).values({
      userId: DEFAULT_USER_ID,
      title,
      content,
      tags
    }).returning();
    res.json(newNote[0]);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.patch("/api/notes/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const updates = req.body;
    const updatedNote = await db.update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notes.id, noteId))
      .returning();
    res.json(updatedNote[0]);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    await db.delete(notes).where(eq(notes.id, noteId));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Tasks endpoints
app.get("/api/tasks", async (req, res) => {
  try {
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, DEFAULT_USER_ID));
    res.json(userTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const newTask = await db.insert(tasks).values({
      userId: DEFAULT_USER_ID,
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null
    }).returning();
    res.json(newTask[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updates = req.body;
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }
    const updatedTask = await db.update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    await db.delete(tasks).where(eq(tasks.id, taskId));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// User preferences endpoints
app.get("/api/preferences", async (req, res) => {
  try {
    const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, DEFAULT_USER_ID));
    if (prefs.length === 0) {
      // Create default preferences if none exist
      const defaultPrefs = await db.insert(userPreferences).values({
        userId: DEFAULT_USER_ID,
        agentName: "Aria",
        userName: "Demo User",
        theme: "dark",
        language: "en",
        timezone: "America/New_York",
        notifications: true,
        paydayDate: new Date('2025-01-31')
      }).returning();
      res.json(defaultPrefs[0]);
    } else {
      res.json(prefs[0]);
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

app.patch("/api/preferences", async (req, res) => {
  try {
    const updates = req.body;
    if (updates.paydayDate) {
      updates.paydayDate = new Date(updates.paydayDate);
    }
    const updatedPrefs = await db.update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, DEFAULT_USER_ID))
      .returning();
    res.json(updatedPrefs[0]);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Calendar endpoints - simplified mock for now
app.get("/api/calendar", (req, res) => {
  const mockEvents = [
    {
      id: 1,
      title: "Team Standup",
      date: "2025-06-04",
      time: "09:00",
      type: "meeting"
    },
    {
      id: 2,
      title: "Project Review",
      date: "2025-06-04",
      time: "14:00",
      type: "meeting"
    },
    {
      id: 3,
      title: "Client Call",
      date: "2025-06-05",
      time: "11:00",
      type: "call"
    }
  ];
  res.json(mockEvents);
});

// Weather endpoints - using actual weather API
function getWeatherDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return weatherCodes[code] || "Unknown";
}

app.get("/api/weather/cities", async (req, res) => {
  try {
    const cities = [
      { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
      { name: "New York", lat: 40.7128, lon: -74.0060 },
      { name: "London", lat: 51.5074, lon: -0.1278 },
      { name: "Tokyo", lat: 35.6762, lon: 139.6503 }
    ];

    const weatherPromises = cities.map(async (city) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&temperature_unit=fahrenheit`
        );
        const data = await response.json();
        
        return {
          city: city.name,
          temperature: Math.round(data.current_weather.temperature),
          condition: getWeatherDescription(data.current_weather.weathercode),
          windSpeed: data.current_weather.windspeed
        };
      } catch (error) {
        console.error(`Error fetching weather for ${city.name}:`, error);
        return {
          city: city.name,
          temperature: 72,
          condition: "Clear",
          windSpeed: 5
        };
      }
    });

    const weatherData = await Promise.all(weatherPromises);
    res.json(weatherData);
  } catch (error) {
    console.error('Error in weather endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Chat endpoint with OpenAI and Mem0 integration
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get relevant memories from Mem0
    const memories = await mem0Service.searchMemories(message, DEFAULT_USER_ID.toString());
    const memoryContext = memories.length > 0 
      ? `\n\nRelevant memories: ${memories.map(m => m.memory).join(', ')}`
      : '';

    // Create messages array for OpenAI
    const messages = [
      {
        role: "system" as const,
        content: `You are Aria, a helpful AI assistant in a productivity dashboard. You help users manage their tasks, notes, and daily activities. Be friendly, concise, and helpful.${memoryContext}`
      },
      ...conversationHistory,
      {
        role: "user" as const,
        content: message
      }
    ];

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Store conversation in Mem0 for future context
    await mem0Service.addMemory([
      { role: "user", content: message },
      { role: "assistant", content: response }
    ], DEFAULT_USER_ID.toString());

    res.json({ 
      response,
      conversationId: `chat-${Date.now()}`
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      response: "I'm experiencing some technical difficulties. Please try again."
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// For Vercel serverless functions
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}