import React, { useState, useEffect } from 'react';
import { Router, Route, Switch, Link, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Calendar, CheckSquare, Plus, Settings, Sun, Moon, Bot } from 'lucide-react';
import SilkBackground from './components/silk-background';
import { Toaster } from './components/ui/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

// Mock data for demo
const mockNotes = [
  { id: 1, title: "Project Ideas", content: "Build a productivity dashboard with AI chat", tags: ["work", "ai"], createdAt: new Date() },
  { id: 2, title: "Weekend Plans", content: "Relax and work on personal projects", tags: ["personal"], createdAt: new Date() }
];

const mockTasks = [
  { id: 1, title: "Finish dashboard design", completed: false, priority: "high", dueDate: new Date() },
  { id: 2, title: "Deploy to Vercel", completed: false, priority: "medium", dueDate: new Date() },
  { id: 3, title: "Add authentication", completed: true, priority: "low", dueDate: new Date() }
];

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" onClick={toggleTheme}>
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
      {children}
    </div>
  );
}

function Dashboard() {
  const [notes, setNotes] = useState(mockNotes);
  const [tasks, setTasks] = useState(mockTasks);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [newTask, setNewTask] = useState('');

  const addNote = () => {
    if (newNote.title && newNote.content) {
      setNotes(prev => [...prev, {
        id: Date.now(),
        title: newNote.title,
        content: newNote.content,
        tags: [],
        createdAt: new Date()
      }]);
      setNewNote({ title: '', content: '' });
    }
  };

  const addTask = () => {
    if (newTask) {
      setTasks(prev => [...prev, {
        id: Date.now(),
        title: newTask,
        completed: false,
        priority: 'medium',
        dueDate: new Date()
      }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <SilkBackground className="min-h-screen p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Productivity Dashboard
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Bot className="h-4 w-4 mr-2" />
              AI Chat
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-max">
          {/* Notes Widget */}
          <Card className="lg:col-span-2 bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Smart Notes
              </CardTitle>
              <CardDescription>AI-enhanced note-taking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Write your note..."
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                />
                <Button onClick={addNote} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {notes.map(note => (
                  <div key={note.id} className="p-3 rounded-lg bg-white/10 dark:bg-black/10">
                    <h4 className="font-medium">{note.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                    <div className="flex gap-1 mt-2">
                      {note.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tasks Widget */}
          <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Tasks
              </CardTitle>
              <CardDescription>Adaptive task management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <Button onClick={addTask} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/10 dark:bg-black/10">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="rounded"
                    />
                    <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                    <Badge 
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                      className="ml-auto text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weather Widget */}
          <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle>Weather</CardTitle>
              <CardDescription>Current conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">22°C</div>
                <div className="text-sm text-muted-foreground">Partly Cloudy</div>
                <div className="text-xs text-muted-foreground">San Francisco, CA</div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Widget */}
          <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Upcoming events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">Team Meeting</div>
                  <div className="text-muted-foreground">2:00 PM - 3:00 PM</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Project Review</div>
                  <div className="text-muted-foreground">4:00 PM - 5:00 PM</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Widget */}
          <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle>Today's Stats</CardTitle>
              <CardDescription>Your productivity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Tasks Completed</span>
                  <span className="font-medium">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Notes Created</span>
                  <span className="font-medium">{notes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Focus Score</span>
                  <span className="font-medium">85%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SilkBackground>
  );
}

function LandingPage() {
  return (
    <SilkBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
            Productivity Reimagined
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            A beautiful, AI-powered workspace that adapts to your workflow and understands your emotional patterns.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/20 dark:border-white/10">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Smart Notes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">AI-enhanced note-taking with emotional intelligence</p>
          </div>
          <div className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/20 dark:border-white/10">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Adaptive Tasks</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Task management that learns your patterns</p>
          </div>
          <div className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/20 dark:border-white/10">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Privacy First</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Your data stays yours, always</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0">
              Try Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-slate-800 dark:text-slate-200 hover:bg-white/20">
            Learn More
          </Button>
        </div>
      </div>
    </SilkBackground>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/dashboard" component={Dashboard} />
            <Route>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                  <Link href="/">
                    <Button>Go Home</Button>
                  </Link>
                </div>
              </div>
            </Route>
          </Switch>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;