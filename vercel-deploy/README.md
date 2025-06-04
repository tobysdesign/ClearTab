# Productivity Dashboard - Vercel Deployment

A modern productivity dashboard with AI chat functionality, built with React, Express, Supabase, and Mem0.

## Features

- **Dashboard Widgets**: Tasks, notes, calendar, weather, and financial tracking
- **AI Chat Assistant**: Powered by OpenAI with Mem0 memory integration
- **Real-time Data**: Connected to Supabase PostgreSQL database
- **Responsive Design**: Mobile-friendly interface with dark/light themes

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **AI Services**: OpenAI GPT-3.5, Mem0 memory service
- **Deployment**: Vercel serverless functions

## Environment Variables

Set these in your Vercel project settings:

```bash
DATABASE_URL=your_supabase_connection_string
OPENAI_API_KEY=your_openai_api_key
MEM0_API_KEY=your_mem0_api_key
```

## Database Setup

1. Create a Supabase project
2. Get your connection string from Project Settings > Database
3. Run database migrations:
   ```bash
   npm run db:push
   ```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env`:
   ```bash
   DATABASE_URL=your_supabase_connection_string
   OPENAI_API_KEY=your_openai_api_key
   MEM0_API_KEY=your_mem0_api_key
   ```

3. Push database schema:
   ```bash
   npm run db:push
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

## API Endpoints

- `GET /api/auth/user` - Get current user
- `GET /api/notes` - Get user notes
- `POST /api/notes` - Create new note
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `GET /api/preferences` - Get user preferences
- `POST /api/chat` - AI chat with memory
- `GET /api/weather/cities` - Weather data
- `GET /api/calendar` - Calendar events

## Architecture

- Serverless functions handle API requests
- Drizzle ORM manages database operations
- Mem0 provides AI memory persistence
- OpenAI powers conversational AI
- Real weather data from Open-Meteo API