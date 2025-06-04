#!/usr/bin/env node
import { createServer } from 'vite'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// API routes for dashboard functionality
app.get('/api/user', (req, res) => {
  res.json({ 
    id: 1, 
    username: 'demo_user', 
    name: 'Demo User',
    email: 'demo@example.com'
  })
})

app.get('/api/notes', (req, res) => {
  res.json([
    { 
      id: 1, 
      title: "AI Integration Ideas", 
      content: "Explore advanced emotional intelligence features for the productivity dashboard", 
      tags: ["ai", "development"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 2, 
      title: "Deployment Strategy", 
      content: "Focus on Vercel deployment with proper static site configuration", 
      tags: ["deployment", "vercel"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])
})

app.get('/api/tasks', (req, res) => {
  res.json([
    { 
      id: 1, 
      title: "Complete silk background integration", 
      description: "Ensure WebGL shaders work properly in production",
      completed: true, 
      priority: "high",
      dueDate: new Date().toISOString()
    },
    { 
      id: 2, 
      title: "Optimize bento grid layout", 
      description: "Improve responsive design and scrolling behavior",
      completed: false, 
      priority: "medium",
      dueDate: new Date().toISOString()
    },
    { 
      id: 3, 
      title: "Implement AI chat memory", 
      description: "Connect Mem0 service for emotional intelligence",
      completed: false, 
      priority: "high",
      dueDate: new Date().toISOString()
    }
  ])
})

app.get('/api/weather', (req, res) => {
  res.json({
    temperature: 22,
    condition: "Partly Cloudy",
    location: "San Francisco, CA",
    humidity: 65,
    windSpeed: 12
  })
})

app.post('/api/notes', (req, res) => {
  const newNote = {
    id: Date.now(),
    title: req.body.title,
    content: req.body.content,
    tags: req.body.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  res.status(201).json(newNote)
})

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: Date.now(),
    title: req.body.title,
    description: req.body.description || '',
    completed: false,
    priority: req.body.priority || 'medium',
    dueDate: req.body.dueDate || new Date().toISOString()
  }
  res.status(201).json(newTask)
})

// Create Vite server with proper configuration
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  resolve: {
    alias: {
      "@": resolve(__dirname, "client/src"),
      "@shared": resolve(__dirname, "shared"),
      "@assets": resolve(__dirname, "attached_assets"),
    },
  },
  root: resolve(__dirname, "client"),
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber']
  }
})

app.use(vite.middlewares)

app.use('*', async (req, res, next) => {
  try {
    const template = await vite.transformIndexHtml(req.originalUrl, `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Productivity Dashboard</title>
    <meta name="description" content="A beautiful, AI-powered workspace that adapts to your workflow and understands your emotional patterns.">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
    `)
    res.status(200).set({ 'Content-Type': 'text/html' }).end(template)
  } catch (e) {
    vite.ssrFixStacktrace(e)
    next(e)
  }
})

const port = process.env.PORT || 3000
app.listen(port, '0.0.0.0', () => {
  console.log(`✨ Productivity Dashboard running on http://localhost:${port}`)
  console.log(`🎨 Silk background with WebGL shaders`)
  console.log(`📝 Smart notes and adaptive tasks`)
  console.log(`🤖 AI chat with emotional intelligence`)
})