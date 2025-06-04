// Main API handler for Vercel
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';

// Import route handlers
import notesHandler from './notes.js';
import tasksHandler from './tasks.js';
import weatherHandler from './weather.js';
import preferencesHandler from './preferences.js';
import calendarHandler from './calendar.js';
import chatHandler from './chat.js';

const app = express();

app.use(cors());
app.use(express.json());

// Route handlers
app.use('/api/notes', notesHandler);
app.use('/api/tasks', tasksHandler);
app.use('/api/weather', weatherHandler);
app.use('/api/preferences', preferencesHandler);
app.use('/api/calendar', calendarHandler);
app.use('/api/chat', chatHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;