import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Notes data structure matching your current implementation
const mockNotes = [
  {
    id: 1,
    userId: 1,
    title: "Project Planning Meeting",
    content: "Discuss Q1 roadmap and resource allocation",
    tags: ["work", "planning"],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: 2,
    userId: 1,
    title: "Personal Goals",
    content: "Focus on health, learning, and work-life balance",
    tags: ["personal", "goals"],
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14')
  }
];

// Tasks data
const mockTasks = [
  {
    id: 1,
    userId: 1,
    title: "Review design mockups",
    description: "Review the new dashboard designs from the team",
    status: "in-progress" as const,
    priority: "high" as const,
    dueDate: new Date('2025-01-20'),
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: 2,
    userId: 1,
    title: "Update project documentation",
    description: "Update README and API documentation",
    status: "todo" as const,
    priority: "medium" as const,
    dueDate: new Date('2025-01-25'),
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14')
  }
];

// User preferences
const mockPreferences = {
  id: 1,
  userId: 1,
  agentName: "Aria",
  userName: "Demo User",
  theme: "dark" as const,
  language: "en",
  timezone: "America/New_York",
  notifications: true,
  paydayDate: new Date('2025-01-31'),
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15')
};

// Calendar events
const mockCalendarEvents = [
  {
    id: 1,
    title: "Team Standup",
    date: "2025-06-04",
    time: "09:00",
    type: "meeting" as const
  },
  {
    id: 2,
    title: "Project Review",
    date: "2025-06-04",
    time: "14:00",
    type: "meeting" as const
  },
  {
    id: 3,
    title: "Client Call",
    date: "2025-06-05",
    time: "11:00",
    type: "call" as const
  }
];

// Auth endpoint
app.get("/api/auth/user", (req, res) => {
  res.json({
    id: 1,
    name: "Demo User",
    email: "demo@example.com",
    picture: null
  });
});

// Notes endpoints
app.get("/api/notes", (req, res) => {
  res.json(mockNotes);
});

app.post("/api/notes", (req, res) => {
  const newNote = {
    id: Date.now(),
    userId: 1,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockNotes.push(newNote);
  res.status(201).json(newNote);
});

// Tasks endpoints
app.get("/api/tasks", (req, res) => {
  res.json(mockTasks);
});

app.post("/api/tasks", (req, res) => {
  const newTask = {
    id: Date.now(),
    userId: 1,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockTasks.push(newTask);
  res.status(201).json(newTask);
});

// Preferences endpoints
app.get("/api/preferences", (req, res) => {
  res.json(mockPreferences);
});

app.put("/api/preferences", (req, res) => {
  Object.assign(mockPreferences, req.body, { updatedAt: new Date() });
  res.json(mockPreferences);
});

// Calendar endpoint
app.get("/api/calendar", (req, res) => {
  res.json(mockCalendarEvents);
});

// Weather endpoint
app.get("/api/weather/cities", async (req, res) => {
  const apiKey = process.env.TOMORROW_IO_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: "Weather API key not configured",
      message: "Please provide a valid Tomorrow.io API key in environment variables"
    });
  }
  
  const cities = [
    { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "London", lat: 51.5074, lon: -0.1278 }
  ];
  
  try {
    const weatherPromises = cities.map(async (city) => {
      try {
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
        const forecast = forecastData.data?.timelines?.[0]?.intervals?.slice(1, 13) || [];
        
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

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: "OpenAI API key not configured",
      message: "Please provide a valid OpenAI API key in environment variables" 
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are Aria, a helpful AI assistant for a productivity dashboard. Be concise and helpful.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not process your request.';

    res.json({
      message: aiMessage,
      action: null,
      note: null,
      task: null
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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
  
  return weatherCodes[code] || "Unknown";
}

export default app;