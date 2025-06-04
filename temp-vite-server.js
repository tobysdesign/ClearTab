import { createServer } from 'vite'
import express from 'express'
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Basic API routes for demo
app.get('/api/user', (req, res) => {
  res.json({ id: 1, username: 'demo_user', name: 'Demo User' })
})

app.get('/api/notes', (req, res) => {
  res.json([
    { id: 1, title: "Project Ideas", content: "Build a productivity dashboard with AI chat", tags: ["work", "ai"] },
    { id: 2, title: "Weekend Plans", content: "Relax and work on personal projects", tags: ["personal"] }
  ])
})

app.get('/api/tasks', (req, res) => {
  res.json([
    { id: 1, title: "Finish dashboard design", completed: false, priority: "high" },
    { id: 2, title: "Deploy to Vercel", completed: false, priority: "medium" },
    { id: 3, title: "Add authentication", completed: true, priority: "low" }
  ])
})

// Create Vite server
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  resolve: {
    alias: {
      "@": "/client/src",
      "@shared": "/shared",
      "@assets": "/attached_assets",
    },
  },
  root: "./client"
})

app.use(vite.middlewares)

app.use('*', async (req, res, next) => {
  try {
    let template = await vite.transformIndexHtml(req.originalUrl, `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Productivity Dashboard</title>
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
  console.log(`Server running on port ${port}`)
})