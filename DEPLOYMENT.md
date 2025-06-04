# Vercel Deployment Guide

## Prerequisites
1. Vercel account (free tier works)
2. GitHub repository with this code
3. Environment variables for production

## Required Environment Variables
Set these in your Vercel dashboard under Settings > Environment Variables:

### Essential (Required)
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random string for session encryption
- `OPENAI_API_KEY` - OpenAI API key for AI features

### Optional (For enhanced features)
- `MEM0_API_KEY` - Mem0 service for AI memory
- `TOMORROW_IO_API_KEY` - Weather data
- `GOOGLE_CLIENT_ID` - Google OAuth (if using)
- `GOOGLE_CLIENT_SECRET` - Google OAuth (if using)

## Deployment Steps

### Option 1: Direct Deployment
1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration
6. Add your environment variables
7. Click "Deploy"

### Option 2: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Database Setup
Your PostgreSQL database should be accessible from Vercel. Recommended providers:
- Neon (free tier available)
- Supabase (free tier available)
- Railway
- PlanetScale

## Build Configuration
The project is configured with:
- Build Command: `npm run build`
- Output Directory: `dist/public`
- Node.js Functions: `server/index.ts`

## Post-Deployment
1. Test all API endpoints work
2. Verify database connections
3. Check AI chat functionality
4. Test weather widgets (if API key provided)

## Troubleshooting
- If build fails, check environment variables
- For database issues, verify connection string
- For AI features, confirm OpenAI API key is valid